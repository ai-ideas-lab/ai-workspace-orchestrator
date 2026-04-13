"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowService = exports.EnhancedWorkflowService = void 0;
const workflow_executor_js_1 = require("./workflow-executor.js");
const event_bus_js_1 = require("./event-bus.js");
const async_error_handler_js_1 = require("../utils/async-error-handler.js");
const errors_js_1 = require("../utils/errors.js");
const logger_js_1 = require("../utils/logger.js");
const uuid_1 = require("uuid");
class EnhancedWorkflowService {
    constructor() {
        this.executor = new workflow_executor_js_1.WorkflowExecutor();
        this.eventBus = event_bus_js_1.EventBus.getInstance();
    }
    static getInstance() {
        if (!EnhancedWorkflowService.instance) {
            EnhancedWorkflowService.instance = new EnhancedWorkflowService();
        }
        return EnhancedWorkflowService.instance;
    }
    async executeWorkflow(workflowId, options = {}) {
        const context = {
            operation: 'executeWorkflow',
            metadata: {
                workflowId,
                ...options.metadata
            }
        };
        return async_error_handler_js_1.asyncErrorHandler.executeWithRetry(async () => {
            return this.executeWorkflowInternal(workflowId, options);
        }, context, {
            maxRetries: options.retryCount || 2,
            retryCondition: (error) => {
                return (error instanceof errors_js_1.SystemError ||
                    error instanceof NetworkError ||
                    (error instanceof errors_js_1.WorkflowError && error.message.includes('temporary')));
            },
            onRetry: (error, attempt) => {
                logger_js_1.logger.warn(`工作流执行重试 [${attempt}]:`, {
                    workflowId,
                    error: error.message
                });
            }
        });
    }
    async executeWorkflowInternal(workflowId, options) {
        const startTime = new Date();
        const executionId = (0, uuid_1.v4)();
        try {
            const workflow = await this.getWorkflowDefinition(workflowId);
            this.validateWorkflowState(workflow, options);
            logger_js_1.logger.info(`工作流开始执行: ${workflowId} -> ${executionId}`, {
                workflowId,
                executionId,
                priority: options.priority || 'normal',
                startTime: startTime.toISOString(),
            });
            await this.eventBus.emit('workflow.execution.started', {
                executionId,
                workflowId,
                priority: options.priority || 'normal',
                inputVariables: options.metadata?.inputVariables || {},
            });
            const result = await this.executor.execute(workflow, {
                inputVariables: options.metadata?.inputVariables || {},
                priority: options.priority || 'normal',
                timeoutMs: options.timeoutMs || 300000,
            });
            const endTime = new Date();
            const duration = endTime.getTime() - startTime.getTime();
            const executionResult = {
                id: executionId,
                status: 'completed',
                workflowId,
                inputVariables: result.inputVariables || {},
                outputVariables: result.outputVariables,
                startTime,
                endTime,
                duration,
                metadata: {
                    ...options.metadata,
                    executionTime: duration,
                    engineUsed: result.engineUsed,
                }
            };
            logger_js_1.logger.info(`工作流执行完成: ${workflowId} -> ${executionId}`, {
                workflowId,
                executionId,
                status: 'completed',
                duration,
                outputVariables: result.outputVariables,
            });
            await this.eventBus.emit('workflow.execution.completed', executionResult);
            return executionResult;
        }
        catch (error) {
            const endTime = new Date();
            const duration = endTime.getTime() - startTime.getTime();
            const executionResult = {
                id: executionId,
                status: 'failed',
                workflowId,
                inputVariables: options.metadata?.inputVariables || {},
                error: error instanceof Error ? error.message : '未知错误',
                startTime,
                endTime,
                duration,
                metadata: {
                    ...options.metadata,
                    executionTime: duration,
                    errorType: error instanceof Error ? error.constructor.name : 'UnknownError',
                }
            };
            logger_js_1.logger.error(`工作流执行失败: ${workflowId} -> ${executionId}`, {
                workflowId,
                executionId,
                error: error instanceof Error ? error.message : '未知错误',
                stack: error instanceof Error ? error.stack : undefined,
                duration,
            });
            await this.eventBus.emit('workflow.execution.failed', executionResult);
            if (error instanceof errors_js_1.AppError) {
                throw error;
            }
            else if (error instanceof Error) {
                throw new errors_js_1.WorkflowError(`工作流执行失败: ${error.message}`, workflowId, undefined, { originalError: error.message });
            }
            else {
                throw new errors_js_1.WorkflowError('工作流执行失败: 未知错误', workflowId);
            }
        }
    }
    async getWorkflowDefinition(workflowId) {
        try {
            const workflow = {
                id: workflowId,
                name: '示例工作流',
                version: '1.0',
                steps: [],
                variables: {},
            };
            if (!workflow) {
                throw new errors_js_1.NotFoundError('工作流', workflowId);
            }
            return workflow;
        }
        catch (error) {
            if (error instanceof errors_js_1.NotFoundError) {
                throw error;
            }
            throw new errors_js_1.SystemError(`获取工作流定义失败: ${workflowId}`);
        }
    }
    validateWorkflowState(workflow, options) {
        if (workflow.status === 'DRAFT') {
            throw new errors_js_1.WorkflowError('工作流处于草稿状态，不能执行', workflow.id, undefined, { status: workflow.status });
        }
        if (workflow.status === 'ARCHIVED') {
            throw new errors_js_1.WorkflowError('工作流已归档，不能执行', workflow.id, undefined, { status: workflow.status });
        }
        if (!workflow.steps || workflow.steps.length === 0) {
            throw new errors_js_1.ValidationError('工作流没有定义执行步骤', 'steps', { workflowId: workflow.id });
        }
        if (options.priority && !['low', 'normal', 'high', 'urgent'].includes(options.priority)) {
            throw new errors_js_1.ValidationError('无效的优先级值', 'priority', { provided: options.priority, allowed: ['low', 'normal', 'high', 'urgent'] });
        }
    }
    async getExecutionStatus(executionId) {
        const context = {
            operation: 'getExecutionStatus',
            metadata: { executionId }
        };
        return async_error_handler_js_1.asyncErrorHandler.executeWithRetry(async () => {
            return null;
        }, context, {
            maxRetries: 1,
            retryCondition: (error) => error instanceof errors_js_1.SystemError
        });
    }
    async cancelExecution(executionId) {
        const context = {
            operation: 'cancelExecution',
            metadata: { executionId }
        };
        return async_error_handler_js_1.asyncErrorHandler.executeWithRetry(async () => {
            logger_js_1.logger.info(`工作流执行取消: ${executionId}`);
            return true;
        }, context, {
            maxRetries: 1,
            retryCondition: (error) => error instanceof errors_js_1.SystemError
        });
    }
    async getExecutionHistory(workflowId, options = {}) {
        const context = {
            operation: 'getExecutionHistory',
            metadata: { workflowId, ...options }
        };
        return async_error_handler_js_1.asyncErrorHandler.executeWithRetry(async () => {
            return {
                data: [],
                pagination: {
                    page: options.page || 1,
                    limit: options.limit || 10,
                    total: 0,
                    totalPages: 0,
                }
            };
        }, context, {
            maxRetries: 1,
            retryCondition: (error) => error instanceof errors_js_1.SystemError
        });
    }
}
exports.EnhancedWorkflowService = EnhancedWorkflowService;
exports.WorkflowService = EnhancedWorkflowService.getInstance();
//# sourceMappingURL=enhanced-workflow-service.js.map