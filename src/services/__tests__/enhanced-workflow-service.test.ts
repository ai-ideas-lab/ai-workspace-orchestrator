/**
 * Enhanced Workflow Service Tests
 * 测试增强版工作流服务的核心功能
 */

import { EnhancedWorkflowService, WorkflowOptions, WorkflowResult } from '../enhanced-workflow-service.js';
import { EventBus } from '../event-bus.js';
import { WorkflowExecutor } from '../workflow-executor.js';
import { 
  asyncErrorHandler, 
  AsyncRetryOptions 
} from '../../utils/async-error-handler.js';
import { 
  AppError, 
  WorkflowError, 
  SystemError, 
  ValidationError,
  NotFoundError 
} from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';
import { vi } from 'vitest';

// Mock external dependencies
vi.mock('../event-bus.js');
vi.mock('../workflow-executor.js');
vi.mock('../../utils/async-error-handler.js');
vi.mock('../../utils/logger.js');

const MockEventBus = EventBus as any;
const MockWorkflowExecutor = WorkflowExecutor as any;
const MockAsyncErrorHandler = asyncErrorHandler as any;
const MockLogger = logger as any;

describe('EnhancedWorkflowService', () => {
  let service: EnhancedWorkflowService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = EnhancedWorkflowService.getInstance();
  });

  describe('Singleton Pattern', () => {
    it('应该返回同一个实例', () => {
      const service1 = EnhancedWorkflowService.getInstance();
      const service2 = EnhancedWorkflowService.getInstance();
      expect(service1).toBe(service2);
    });
  });

  describe('executeWorkflow', () => {
    let mockExecutor: any;
    let mockEventBus: any;
    let mockAsyncErrorHandler: any;

    beforeEach(() => {
      mockExecutor = new MockWorkflowExecutor();
      mockEventBus = new MockEventBus();
      mockAsyncErrorHandler = new MockAsyncErrorHandler();

      vi.spyOn(service, 'executor', 'get').mockReturnValue(mockExecutor);
      vi.spyOn(service, 'eventBus', 'get').mockReturnValue(mockEventBus);
    });

    it('应该成功执行工作流 - 正常路径', async () => {
      const workflowId = 'test-workflow';
      const options: WorkflowOptions = {
        priority: 'normal',
        timeoutMs: 300000,
        retryCount: 2,
        metadata: { inputVariables: { test: 'value' } }
      };

      const mockWorkflow = {
        id: workflowId,
        name: 'Test Workflow',
        version: '1.0',
        status: 'ACTIVE',
        steps: [{ name: 'step1', type: 'action' }],
        variables: {}
      };

      const mockExecutorResult = {
        inputVariables: { test: 'value' },
        outputVariables: { result: 'success' },
        engineUsed: 'test-engine'
      };

      vi.spyOn(service, 'getWorkflowDefinition').mockResolvedValue(mockWorkflow as any);
      vi.spyOn(service, 'validateWorkflowState').mockImplementation(() => {});
      vi.spyOn(mockExecutor, 'execute').mockResolvedValue(mockExecutorResult);

      const result = await service.executeWorkflow(workflowId, options);

      expect(result).toMatchObject({
        id: expect.any(String),
        status: 'completed',
        workflowId,
        inputVariables: { test: 'value' },
        outputVariables: { result: 'success' },
        startTime: expect.any(Date),
        endTime: expect.any(Date),
        duration: expect.any(Number)
      });

      expect(mockEventBus.emit).toHaveBeenCalledWith('workflow.execution.started', {
        executionId: expect.any(String),
        workflowId,
        priority: 'normal',
        inputVariables: { test: 'value' },
      });

      expect(mockEventBus.emit).toHaveBeenCalledWith('workflow.execution.completed', expect.any(Object));
    });

    it('应该处理工作流验证错误', async () => {
      const workflowId = 'test-workflow';
      const mockWorkflow = {
        id: workflowId,
        name: 'Test Workflow',
        version: '1.0',
        status: 'DRAFT',
        steps: [],
        variables: {}
      };

      vi.spyOn(service, 'getWorkflowDefinition').mockResolvedValue(mockWorkflow as any);
      vi.spyOn(service, 'validateWorkflowState').mockImplementation(() => {
        throw new ValidationError('工作流处于草稿状态，不能执行', 'status');
      });

      await expect(service.executeWorkflow(workflowId))
        .rejects.toThrow(WorkflowError);
    });

    it('应该处理工作流不存在错误', async () => {
      const workflowId = 'nonexistent-workflow';

      vi.spyOn(service, 'getWorkflowDefinition').mockImplementation(() => {
        throw new NotFoundError('工作流', workflowId);
      });

      await expect(service.executeWorkflow(workflowId))
        .rejects.toThrow(NotFoundError);
    });

    it('应该处理执行过程中的错误', async () => {
      const workflowId = 'test-workflow';
      const mockWorkflow = {
        id: workflowId,
        name: 'Test Workflow',
        version: '1.0',
        status: 'ACTIVE',
        steps: [{ name: 'step1', type: 'action' }],
        variables: {}
      };

      vi.spyOn(service, 'getWorkflowDefinition').mockResolvedValue(mockWorkflow as any);
      vi.spyOn(service, 'validateWorkflowState').mockImplementation(() => {});
      vi.spyOn(mockExecutor, 'execute').mockRejectedValue(new Error('执行失败'));

      const result = await service.executeWorkflow(workflowId);

      expect(result).toMatchObject({
        id: expect.any(String),
        status: 'failed',
        workflowId,
        inputVariables: {},
        error: expect.any(String),
        startTime: expect.any(Date),
        endTime: expect.any(Date)
      });

      expect(mockEventBus.emit).toHaveBeenCalledWith('workflow.execution.failed', expect.any(Object));
    });

    it('应该正确处理重试逻辑', async () => {
      const workflowId = 'test-workflow';
      const options: WorkflowOptions = {
        retryCount: 3,
        metadata: { inputVariables: { test: 'value' } }
      };

      const mockWorkflow = {
        id: workflowId,
        name: 'Test Workflow',
        version: '1.0',
        status: 'ACTIVE',
        steps: [{ name: 'step1', type: 'action' }],
        variables: {}
      };

      const mockExecutorResult = {
        inputVariables: { test: 'value' },
        outputVariables: { result: 'success' },
        engineUsed: 'test-engine'
      };

      vi.spyOn(service, 'getWorkflowDefinition').mockResolvedValue(mockWorkflow as any);
      vi.spyOn(service, 'validateWorkflowState').mockImplementation(() => {});
      vi.spyOn(mockExecutor, 'execute')
        .mockRejectedValueOnce(new SystemError('临时错误'))
        .mockResolvedValue(mockExecutorResult);

      await service.executeWorkflow(workflowId, options);

      expect(mockExecutor.execute).toHaveBeenCalledTimes(2);
    });
  });

  describe('getWorkflowDefinition', () => {
    it('应该成功获取工作流定义', async () => {
      const workflowId = 'test-workflow';
      const mockWorkflow = {
        id: workflowId,
        name: 'Test Workflow',
        version: '1.0',
        status: 'ACTIVE',
        steps: [{ name: 'step1', type: 'action' }],
        variables: {}
      };

      vi.spyOn(service, 'getWorkflowDefinition').mockImplementation(async () => {
        return mockWorkflow as any;
      });

      const result = await (service as any).getWorkflowDefinition(workflowId);

      expect(result).toEqual(mockWorkflow);
    });

    it('应该处理工作流不存在的情况', async () => {
      const workflowId = 'nonexistent-workflow';

      await expect((service as any).getWorkflowDefinition(workflowId))
        .rejects.toThrow(NotFoundError);
    });

    it('应该处理获取工作流定义失败的系统错误', async () => {
      const workflowId = 'test-workflow';

      await expect((service as any).getWorkflowDefinition(workflowId))
        .rejects.toThrow(SystemError);
    });
  });

  describe('validateWorkflowState', () => {
    it('应该验证有效的工作流状态', () => {
      const mockWorkflow = {
        id: 'test-workflow',
        name: 'Test Workflow',
        version: '1.0',
        status: 'ACTIVE',
        steps: [{ name: 'step1', type: 'action' }],
        variables: {}
      };

      expect(() => {
        (service as any).validateWorkflowState(mockWorkflow, {});
      }).not.toThrow();
    });

    it('应该拒绝处于DRAFT状态的工作流', () => {
      const mockWorkflow = {
        id: 'test-workflow',
        name: 'Test Workflow',
        version: '1.0',
        status: 'DRAFT',
        steps: [{ name: 'step1', type: 'action' }],
        variables: {}
      };

      expect(() => {
        (service as any).validateWorkflowState(mockWorkflow, {});
      }).toThrow(WorkflowError);
    });

    it('应该拒绝已归档的工作流', () => {
      const mockWorkflow = {
        id: 'test-workflow',
        name: 'Test Workflow',
        version: '1.0',
        status: 'ARCHIVED',
        steps: [{ name: 'step1', type: 'action' }],
        variables: {}
      };

      expect(() => {
        (service as any).validateWorkflowState(mockWorkflow, {});
      }).toThrow(WorkflowError);
    });

    it('应该验证必需的步骤配置', () => {
      const mockWorkflow = {
        id: 'test-workflow',
        name: 'Test Workflow',
        version: '1.0',
        status: 'ACTIVE',
        steps: [],
        variables: {}
      };

      expect(() => {
        (service as any).validateWorkflowState(mockWorkflow, {});
      }).toThrow(ValidationError);
    });

    it('应该验证优先级值', () => {
      const mockWorkflow = {
        id: 'test-workflow',
        name: 'Test Workflow',
        version: '1.0',
        status: 'ACTIVE',
        steps: [{ name: 'step1', type: 'action' }],
        variables: {}
      };

      expect(() => {
        (service as any).validateWorkflowState(mockWorkflow, { priority: 'invalid' });
      }).toThrow(ValidationError);
    });

    it('应该允许有效的优先级值', () => {
      const mockWorkflow = {
        id: 'test-workflow',
        name: 'Test Workflow',
        version: '1.0',
        status: 'ACTIVE',
        steps: [{ name: 'step1', type: 'action' }],
        variables: {}
      };

      const validPriorities = ['low', 'normal', 'high', 'urgent'];
      validPriorities.forEach(priority => {
        expect(() => {
          (service as any).validateWorkflowState(mockWorkflow, { priority });
        }).not.toThrow();
      });
    });
  });

  describe('getExecutionStatus', () => {
    it('应该返回执行状态', async () => {
      const executionId = 'test-execution-id';
      const mockResult: WorkflowResult = {
        id: executionId,
        status: 'completed',
        workflowId: 'test-workflow',
        inputVariables: {},
        startTime: new Date(),
        endTime: new Date(),
        duration: 1000
      };

      vi.spyOn(service, 'getExecutionStatus').mockImplementation(async () => {
        return mockResult;
      });

      const result = await service.getExecutionStatus(executionId);

      expect(result).toEqual(mockResult);
    });

    it('应该处理系统错误并重试', async () => {
      const executionId = 'test-execution-id';

      vi.spyOn(service, 'getExecutionStatus').mockImplementation(async () => {
        throw new SystemError('系统错误');
      });

      const result = await service.getExecutionStatus(executionId);

      expect(result).toBeNull();
    });
  });

  describe('cancelExecution', () => {
    it('应该成功取消执行', async () => {
      const executionId = 'test-execution-id';

      vi.spyOn(service, 'cancelExecution').mockImplementation(async () => {
        return true;
      });

      const result = await service.cancelExecution(executionId);

      expect(result).toBe(true);
    });
  });

  describe('getExecutionHistory', () => {
    it('应该返回执行历史', async () => {
      const workflowId = 'test-workflow';
      const mockHistory = {
        data: [
          {
            id: 'exec1',
            status: 'completed',
            workflowId,
            inputVariables: {},
            startTime: new Date(),
            endTime: new Date(),
            duration: 1000
          }
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1
        }
      };

      vi.spyOn(service, 'getExecutionHistory').mockResolvedValue(mockHistory);

      const result = await service.getExecutionHistory(workflowId);

      expect(result).toEqual(mockHistory);
    });

    it('应该处理分页参数', async () => {
      const workflowId = 'test-workflow';
      const options = {
        page: 2,
        limit: 20,
        status: 'completed'
      };

      vi.spyOn(service, 'getExecutionHistory').mockResolvedValue({
        data: [],
        pagination: {
          page: 2,
          limit: 20,
          total: 0,
          totalPages: 0
        }
      });

      await service.getExecutionHistory(workflowId, options);

      expect(service.getExecutionHistory).toHaveBeenCalledWith(workflowId, options);
    });
  });

  describe('错误处理边界情况', () => {
    it('应该正确处理未知错误类型', async () => {
      const workflowId = 'test-workflow';
      const mockWorkflow = {
        id: workflowId,
        name: 'Test Workflow',
        version: '1.0',
        status: 'ACTIVE',
        steps: [{ name: 'step1', type: 'action' }],
        variables: {}
      };

      vi.spyOn(service, 'getWorkflowDefinition').mockResolvedValue(mockWorkflow as any);
      vi.spyOn(service, 'validateWorkflowState').mockImplementation(() => {});
      vi.spyOn(service['executor'], 'execute').mockRejectedValue('unknown error');

      const result = await service.executeWorkflow(workflowId);

      expect(result.status).toBe('failed');
      expect(result.error).toContain('工作流执行失败');
    });

    it('应该记录执行开始和结束的日志', async () => {
      const workflowId = 'test-workflow';
      const mockWorkflow = {
        id: workflowId,
        name: 'Test Workflow',
        version: '1.0',
        status: 'ACTIVE',
        steps: [{ name: 'step1', type: 'action' }],
        variables: {}
      };

      const mockExecutorResult = {
        inputVariables: {},
        outputVariables: { result: 'success' }
      };

      vi.spyOn(service, 'getWorkflowDefinition').mockResolvedValue(mockWorkflow as any);
      vi.spyOn(service, 'validateWorkflowState').mockImplementation(() => {});
      vi.spyOn(service['executor'], 'execute').mockResolvedValue(mockExecutorResult);
      vi.spyOn(MockLogger, 'info').mockImplementation(() => {});

      await service.executeWorkflow(workflowId);

      expect(MockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('工作流开始执行'),
        expect.objectContaining({ workflowId })
      );
      expect(MockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('工作流执行完成'),
        expect.objectContaining({ workflowId })
      );
    });
  });
});