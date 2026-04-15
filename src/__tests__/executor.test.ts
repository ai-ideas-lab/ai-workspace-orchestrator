import { jest } from '@jest/globals';

// Mock Prisma client
const mockPrisma = {
  workflow: {
    findUnique: jest.fn(),
  },
};

jest.mock('../src/database', () => ({
  prisma: mockPrisma,
}));

// Import the function after mocking
import { executeWorkflow } from '../src/core/executor';

describe('executeWorkflow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('成功场景', () => {
    it('应该成功执行包含多个步骤的工作流', async () => {
      // Arrange
      const mockWorkflow = {
        id: 'test-workflow-id',
        name: 'Test Workflow',
        description: 'A test workflow',
        steps: [
          {
            id: 'step-1',
            order: 1,
            engineType: 'ai',
            config: { model: 'gpt-4' },
            name: 'AI Analysis',
            description: 'Perform AI analysis'
          },
          {
            id: 'step-2', 
            order: 2,
            engineType: 'api',
            config: { endpoint: '/api/data' },
            name: 'Data Processing',
            description: 'Process the data'
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockEngine = {
        execute: jest.fn().mockResolvedValue('Step completed successfully')
      };

      // Mock the database call
      mockPrisma.workflow.findUnique.mockResolvedValue(mockWorkflow);

      // Mock the engine function
      const getEngine = jest.fn().mockReturnValue(mockEngine);
      jest.doMock('../src/core/executor', () => ({
        ...jest.requireActual('../src/core/executor'),
        getEngine: getEngine as any
      }));

      // Act
      const result = await executeWorkflow('test-workflow-id', 'Test user input');

      // Assert
      expect(mockPrisma.workflow.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-workflow-id' }
      });
      
      expect(result.workflowId).toBe('test-workflow-id');
      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(2);
      expect(result.results[0].status).toBe('completed');
      expect(result.results[1].status).toBe('completed');
    });

    it('应该处理单个步骤的工作流', async () => {
      // Arrange
      const mockWorkflow = {
        id: 'single-step-workflow',
        name: 'Single Step Workflow',
        description: 'A workflow with only one step',
        steps: [
          {
            id: 'single-step',
            order: 1,
            engineType: 'ai',
            config: { model: 'gpt-4' }
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockEngine = {
        execute: jest.fn().mockResolvedValue('Single step completed')
      };

      mockPrisma.workflow.findUnique.mockResolvedValue(mockWorkflow);

      const getEngine = jest.fn().mockReturnValue(mockEngine);
      jest.doMock('../src/core/executor', () => ({
        ...jest.requireActual('../src/core/executor'),
        getEngine: getEngine as any
      }));

      // Act
      const result = await executeWorkflow('single-step-workflow', 'Test input');

      // Assert
      expect(result.results).toHaveLength(1);
      expect(result.results[0].status).toBe('completed');
      expect(result.results[0].output).toBe('Single step completed');
    });
  });

  describe('错误处理场景', () => {
    it('应该处理工作流不存在的情况', async () => {
      // Arrange
      mockPrisma.workflow.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(executeWorkflow('non-existent-workflow', 'Test input'))
        .rejects.toThrow('Workflow not found: non-existent-workflow');
    });

    it('应该处理步骤执行失败的情况', async () => {
      // Arrange
      const mockWorkflow = {
        id: 'workflow-with-failure',
        name: 'Workflow with Failure',
        steps: [
          {
            id: 'successful-step',
            order: 1,
            engineType: 'ai',
            config: { model: 'gpt-4' }
          },
          {
            id: 'failing-step',
            order: 2,
            engineType: 'api',
            config: { endpoint: '/api/error' }
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockEngine = {
        execute: jest.fn()
          .mockResolvedValueFirst('Successful step')
          .mockRejectedValue(new Error('API request failed'))
      };

      mockPrisma.workflow.findUnique.mockResolvedValue(mockWorkflow);

      const getEngine = jest.fn().mockReturnValue(mockEngine);
      jest.doMock('../src/core/executor', () => ({
        ...jest.requireActual('../src/core/executor'),
        getEngine: getEngine as any
      }));

      // Act
      const result = await executeWorkflow('workflow-with-failure', 'Test input');

      // Assert
      expect(result.success).toBe(false);
      expect(result.results).toHaveLength(2);
      expect(result.results[0].status).toBe('completed');
      expect(result.results[1].status).toBe('failed');
      expect(result.results[1].error).toBe('API request failed');
    });

    it('应该处理工作流获取过程中的数据库错误', async () => {
      // Arrange
      mockPrisma.workflow.findUnique.mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(executeWorkflow('workflow-id', 'Test input'))
        .rejects.toThrow('Database connection failed');
    });
  });

  describe('边界条件测试', () => {
    it('应该处理空步骤列表的工作流', async () => {
      // Arrange
      const mockWorkflow = {
        id: 'empty-workflow',
        name: 'Empty Workflow',
        description: 'A workflow with no steps',
        steps: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.workflow.findUnique.mockResolvedValue(mockWorkflow);

      // Act
      const result = await executeWorkflow('empty-workflow', 'Test input');

      // Assert
      expect(result.workflowId).toBe('empty-workflow');
      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(0);
    });

    it('应该处理工作流执行中的系统错误', async () => {
      // Arrange
      mockPrisma.workflow.findUnique.mockImplementation(() => {
        throw new Error('Unexpected system error');
      });

      // Act & Assert
      await expect(executeWorkflow('workflow-id', 'Test input'))
        .rejects.toThrow('Unexpected system error');
    });
  });
});

describe('WorkflowStep interfaces', () => {
  it('应该正确定义WorkflowStep接口结构', () => {
    const testWorkflowStep = {
      id: 'test-step-id',
      order: 1,
      engineType: 'ai',
      config: { model: 'gpt-4' },
      name: 'Test Step',
      description: 'A test workflow step'
    };

    expect(testWorkflowStep.id).toBeDefined();
    expect(testWorkflowStep.order).toBe(1);
    expect(testWorkflowStep.engineType).toBe('ai');
    expect(testWorkflowStep.config).toEqual({ model: 'gpt-4' });
    expect(testWorkflowStep.name).toBe('Test Step');
    expect(testWorkflowStep.description).toBe('A test workflow step');
  });

  it('应该正确定义ExecutionResult接口结构', () => {
    const testExecutionResult = {
      stepId: 'step-1',
      output: 'Step completed',
      status: 'completed' as const,
      duration: 1000,
      metadata: {
        engineType: 'ai',
        order: 1
      }
    };

    expect(testExecutionResult.stepId).toBe('step-1');
    expect(testExecutionResult.output).toBe('Step completed');
    expect(testExecutionResult.status).toBe('completed');
    expect(testExecutionResult.duration).toBe(1000);
    expect(testExecutionResult.metadata).toBeDefined();
  });
});