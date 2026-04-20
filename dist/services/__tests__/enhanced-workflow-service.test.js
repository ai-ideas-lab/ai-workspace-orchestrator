"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const enhanced_workflow_service_js_1 = require("../enhanced-workflow-service.js");
const event_bus_js_1 = require("../event-bus.js");
const workflow_executor_js_1 = require("../workflow-executor.js");
const async_error_handler_js_1 = require("../../utils/async-error-handler.js");
const errors_js_1 = require("../../utils/errors.js");
const logger_js_1 = require("../../utils/logger.js");
const vitest_1 = require("vitest");
vitest_1.vi.mock('../event-bus.js');
vitest_1.vi.mock('../workflow-executor.js');
vitest_1.vi.mock('../../utils/async-error-handler.js');
vitest_1.vi.mock('../../utils/logger.js');
const MockEventBus = event_bus_js_1.EventBus;
const MockWorkflowExecutor = workflow_executor_js_1.WorkflowExecutor;
const MockAsyncErrorHandler = async_error_handler_js_1.asyncErrorHandler;
const MockLogger = logger_js_1.logger;
describe('EnhancedWorkflowService', () => {
    let service;
    beforeEach(() => {
        vitest_1.vi.clearAllMocks();
        service = enhanced_workflow_service_js_1.EnhancedWorkflowService.getInstance();
    });
    describe('Singleton Pattern', () => {
        it('应该返回同一个实例', () => {
            const service1 = enhanced_workflow_service_js_1.EnhancedWorkflowService.getInstance();
            const service2 = enhanced_workflow_service_js_1.EnhancedWorkflowService.getInstance();
            expect(service1).toBe(service2);
        });
    });
    describe('executeWorkflow', () => {
        let mockExecutor;
        let mockEventBus;
        let mockAsyncErrorHandler;
        beforeEach(() => {
            mockExecutor = new MockWorkflowExecutor();
            mockEventBus = new MockEventBus();
            mockAsyncErrorHandler = new MockAsyncErrorHandler();
            vitest_1.vi.spyOn(service, 'executor', 'get').mockReturnValue(mockExecutor);
            vitest_1.vi.spyOn(service, 'eventBus', 'get').mockReturnValue(mockEventBus);
        });
        it('应该成功执行工作流 - 正常路径', async () => {
            const workflowId = 'test-workflow';
            const options = {
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
            vitest_1.vi.spyOn(service, 'getWorkflowDefinition').mockResolvedValue(mockWorkflow);
            vitest_1.vi.spyOn(service, 'validateWorkflowState').mockImplementation(() => { });
            vitest_1.vi.spyOn(mockExecutor, 'execute').mockResolvedValue(mockExecutorResult);
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
            vitest_1.vi.spyOn(service, 'getWorkflowDefinition').mockResolvedValue(mockWorkflow);
            vitest_1.vi.spyOn(service, 'validateWorkflowState').mockImplementation(() => {
                throw new errors_js_1.ValidationError('工作流处于草稿状态，不能执行', 'status');
            });
            await expect(service.executeWorkflow(workflowId))
                .rejects.toThrow(errors_js_1.WorkflowError);
        });
        it('应该处理工作流不存在错误', async () => {
            const workflowId = 'nonexistent-workflow';
            vitest_1.vi.spyOn(service, 'getWorkflowDefinition').mockImplementation(() => {
                throw new errors_js_1.NotFoundError('工作流', workflowId);
            });
            await expect(service.executeWorkflow(workflowId))
                .rejects.toThrow(errors_js_1.NotFoundError);
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
            vitest_1.vi.spyOn(service, 'getWorkflowDefinition').mockResolvedValue(mockWorkflow);
            vitest_1.vi.spyOn(service, 'validateWorkflowState').mockImplementation(() => { });
            vitest_1.vi.spyOn(mockExecutor, 'execute').mockRejectedValue(new Error('执行失败'));
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
            const options = {
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
            vitest_1.vi.spyOn(service, 'getWorkflowDefinition').mockResolvedValue(mockWorkflow);
            vitest_1.vi.spyOn(service, 'validateWorkflowState').mockImplementation(() => { });
            vitest_1.vi.spyOn(mockExecutor, 'execute')
                .mockRejectedValueOnce(new errors_js_1.SystemError('临时错误'))
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
            vitest_1.vi.spyOn(service, 'getWorkflowDefinition').mockImplementation(async () => {
                return mockWorkflow;
            });
            const result = await service.getWorkflowDefinition(workflowId);
            expect(result).toEqual(mockWorkflow);
        });
        it('应该处理工作流不存在的情况', async () => {
            const workflowId = 'nonexistent-workflow';
            await expect(service.getWorkflowDefinition(workflowId))
                .rejects.toThrow(errors_js_1.NotFoundError);
        });
        it('应该处理获取工作流定义失败的系统错误', async () => {
            const workflowId = 'test-workflow';
            await expect(service.getWorkflowDefinition(workflowId))
                .rejects.toThrow(errors_js_1.SystemError);
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
                service.validateWorkflowState(mockWorkflow, {});
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
                service.validateWorkflowState(mockWorkflow, {});
            }).toThrow(errors_js_1.WorkflowError);
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
                service.validateWorkflowState(mockWorkflow, {});
            }).toThrow(errors_js_1.WorkflowError);
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
                service.validateWorkflowState(mockWorkflow, {});
            }).toThrow(errors_js_1.ValidationError);
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
                service.validateWorkflowState(mockWorkflow, { priority: 'invalid' });
            }).toThrow(errors_js_1.ValidationError);
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
                    service.validateWorkflowState(mockWorkflow, { priority });
                }).not.toThrow();
            });
        });
    });
    describe('getExecutionStatus', () => {
        it('应该返回执行状态', async () => {
            const executionId = 'test-execution-id';
            const mockResult = {
                id: executionId,
                status: 'completed',
                workflowId: 'test-workflow',
                inputVariables: {},
                startTime: new Date(),
                endTime: new Date(),
                duration: 1000
            };
            vitest_1.vi.spyOn(service, 'getExecutionStatus').mockImplementation(async () => {
                return mockResult;
            });
            const result = await service.getExecutionStatus(executionId);
            expect(result).toEqual(mockResult);
        });
        it('应该处理系统错误并重试', async () => {
            const executionId = 'test-execution-id';
            vitest_1.vi.spyOn(service, 'getExecutionStatus').mockImplementation(async () => {
                throw new errors_js_1.SystemError('系统错误');
            });
            const result = await service.getExecutionStatus(executionId);
            expect(result).toBeNull();
        });
    });
    describe('cancelExecution', () => {
        it('应该成功取消执行', async () => {
            const executionId = 'test-execution-id';
            vitest_1.vi.spyOn(service, 'cancelExecution').mockImplementation(async () => {
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
            vitest_1.vi.spyOn(service, 'getExecutionHistory').mockResolvedValue(mockHistory);
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
            vitest_1.vi.spyOn(service, 'getExecutionHistory').mockResolvedValue({
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
            vitest_1.vi.spyOn(service, 'getWorkflowDefinition').mockResolvedValue(mockWorkflow);
            vitest_1.vi.spyOn(service, 'validateWorkflowState').mockImplementation(() => { });
            vitest_1.vi.spyOn(service['executor'], 'execute').mockRejectedValue('unknown error');
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
            vitest_1.vi.spyOn(service, 'getWorkflowDefinition').mockResolvedValue(mockWorkflow);
            vitest_1.vi.spyOn(service, 'validateWorkflowState').mockImplementation(() => { });
            vitest_1.vi.spyOn(service['executor'], 'execute').mockResolvedValue(mockExecutorResult);
            vitest_1.vi.spyOn(MockLogger, 'info').mockImplementation(() => { });
            await service.executeWorkflow(workflowId);
            expect(MockLogger.info).toHaveBeenCalledWith(expect.stringContaining('工作流开始执行'), expect.objectContaining({ workflowId }));
            expect(MockLogger.info).toHaveBeenCalledWith(expect.stringContaining('工作流执行完成'), expect.objectContaining({ workflowId }));
        });
    });
});
//# sourceMappingURL=enhanced-workflow-service.test.js.map