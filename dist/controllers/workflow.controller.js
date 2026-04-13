"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowController = void 0;
const workflow_scheduler_js_1 = require("../services/workflow-scheduler.js");
const logger_js_1 = require("../utils/logger.js");
const errors_js_1 = require("../utils/errors.js");
const responseUtils_js_1 = require("../utils/responseUtils.js");
const async_error_handler_ts_1 = require("../utils/async-error-handler.ts");
class WorkflowController {
    constructor() {
        this.workflowService = workflow_scheduler_js_1.WorkflowService.getInstance();
    }
    async getWorkflows(req, res) {
        const asyncContext = {
            operation: 'get_workflows',
            userId: req.user?.id,
            sessionId: req.session?.id,
            correlationId: req.requestId,
            metadata: {
                page: req.query.page,
                limit: req.query.limit,
                status: req.query.status,
                search: req.query.search,
            }
        };
        const asyncHandler = async_error_handler_ts_1.AsyncErrorHandler.getInstance();
        try {
            const { page = 1, limit = 10, status, userId, search } = req.query;
            const result = await asyncHandler.executeWithRetry(() => this.workflowService.getWorkflows({
                page: Number(page),
                limit: Number(limit),
                status: status,
                userId: userId,
                search: search,
            }), asyncContext, { maxRetries: 2, baseDelayMs: 500 });
            (0, responseUtils_js_1.successResponse)(res, result.data, '获取工作流列表成功', 200, {
                pagination: result.pagination,
            });
        }
        catch (error) {
            logger_js_1.logger.error('获取工作流列表失败:', error);
            if (error instanceof errors_js_1.AppError) {
                (0, responseUtils_js_1.errorResponse)(res, error);
            }
            else {
                (0, responseUtils_js_1.errorResponse)(res, '获取工作流列表失败');
            }
        }
    }
    async createWorkflow(req, res) {
        try {
            const { name, description, config, variables, userId } = req.body;
            if (!name || !config) {
                (0, responseUtils_js_1.validationErrorResponse)(res, '工作流名称和配置不能为空');
                return;
            }
            const workflow = await this.workflowService.createWorkflow({
                name,
                description,
                config,
                variables: variables || {},
                userId: userId || req.user?.id,
            });
            logger_js_1.logger.info(`工作流创建成功: ${workflow.id} (${name})`);
            (0, responseUtils_js_1.successResponse)(res, workflow, '工作流创建成功', 201);
        }
        catch (error) {
            logger_js_1.logger.error('创建工作流失败:', error);
            if (error instanceof errors_js_1.AppError) {
                (0, responseUtils_js_1.errorResponse)(res, error);
            }
            else if (error.message.includes('唯一约束')) {
                (0, responseUtils_js_1.errorResponse)(res, '工作流名称已存在', undefined, 409);
            }
            else {
                (0, responseUtils_js_1.errorResponse)(res, '创建工作流失败');
            }
        }
    }
    async getWorkflow(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                (0, responseUtils_js_1.validationErrorResponse)(res, '工作流ID不能为空');
                return;
            }
            const workflow = await this.workflowService.getWorkflow(id);
            if (!workflow) {
                notFoundResponse(res, '工作流', id);
                return;
            }
            (0, responseUtils_js_1.successResponse)(res, workflow, '获取工作流详情成功');
        }
        catch (error) {
            logger_js_1.logger.error('获取工作流详情失败:', error);
            if (error instanceof errors_js_1.AppError) {
                (0, responseUtils_js_1.errorResponse)(res, error);
            }
            else {
                (0, responseUtils_js_1.errorResponse)(res, '获取工作流详情失败');
            }
        }
    }
    async updateWorkflow(req, res) {
        try {
            const { id } = req.params;
            const { name, description, config, variables, status } = req.body;
            if (!id) {
                (0, responseUtils_js_1.validationErrorResponse)(res, '工作流ID不能为空');
                return;
            }
            const workflow = await this.workflowService.updateWorkflow(id, {
                name,
                description,
                config,
                variables,
                status,
            });
            logger_js_1.logger.info(`工作流更新成功: ${id}`);
            (0, responseUtils_js_1.successResponse)(res, workflow, '工作流更新成功');
        }
        catch (error) {
            logger_js_1.logger.error('更新工作流失败:', error);
            if (error instanceof errors_js_1.AppError) {
                (0, responseUtils_js_1.errorResponse)(res, error);
            }
            else {
                (0, responseUtils_js_1.errorResponse)(res, '更新工作流失败');
            }
        }
    }
    async deleteWorkflow(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                (0, responseUtils_js_1.validationErrorResponse)(res, '工作流ID不能为空');
                return;
            }
            await this.workflowService.deleteWorkflow(id);
            logger_js_1.logger.info(`工作流删除成功: ${id}`);
            (0, responseUtils_js_1.successResponse)(res, null, '工作流删除成功');
        }
        catch (error) {
            logger_js_1.logger.error('删除工作流失败:', error);
            if (error instanceof errors_js_1.AppError) {
                (0, responseUtils_js_1.errorResponse)(res, error);
            }
            else {
                (0, responseUtils_js_1.errorResponse)(res, '删除工作流失败');
            }
        }
    }
    async executeWorkflow(req, res) {
        const asyncContext = {
            operation: 'execute_workflow',
            userId: req.user?.id,
            sessionId: req.session?.id,
            correlationId: req.requestId,
            metadata: {
                workflowId: req.params.id,
                inputVariables: req.body.inputVariables,
                priority: req.body.priority,
            }
        };
        const asyncHandler = async_error_handler_ts_1.AsyncErrorHandler.getInstance();
        try {
            const { id } = req.params;
            const { inputVariables, priority } = req.body;
            if (!id) {
                (0, responseUtils_js_1.validationErrorResponse)(res, '工作流ID不能为空');
                return;
            }
            const execution = await asyncHandler.executeWithTimeout(() => this.workflowService.executeWorkflow(id, {
                inputVariables: inputVariables || {},
                priority,
            }), 30000, asyncContext);
            logger_js_1.logger.info(`工作流执行启动: ${id} -> ${execution.id}`);
            (0, responseUtils_js_1.successResponse)(res, execution, '工作流执行启动成功', 202);
        }
        catch (error) {
            logger_js_1.logger.error('执行工作流失败:', error);
            if (error instanceof errors_js_1.AppError) {
                (0, responseUtils_js_1.errorResponse)(res, error);
            }
            else {
                (0, responseUtils_js_1.errorResponse)(res, '执行工作流失败');
            }
        }
    }
    async getExecutionHistory(req, res) {
        try {
            const { id } = req.params;
            const { page = 1, limit = 10, status, startDate, endDate } = req.query;
            if (!id) {
                (0, responseUtils_js_1.validationErrorResponse)(res, '工作流ID不能为空');
                return;
            }
            const result = await this.workflowService.getExecutionHistory(id, {
                page: Number(page),
                limit: Number(limit),
                status: status,
                startDate: startDate,
                endDate: endDate,
            });
            (0, responseUtils_js_1.successResponse)(res, result.data, '获取执行历史成功', 200, {
                pagination: result.pagination,
            });
        }
        catch (error) {
            logger_js_1.logger.error('获取执行历史失败:', error);
            if (error instanceof errors_js_1.AppError) {
                (0, responseUtils_js_1.errorResponse)(res, error);
            }
            else {
                (0, responseUtils_js_1.errorResponse)(res, '获取执行历史失败');
            }
        }
    }
    async validateWorkflow(req, res) {
        try {
            const { config } = req.body;
            if (!config) {
                (0, responseUtils_js_1.validationErrorResponse)(res, '工作流配置不能为空');
                return;
            }
            const validation = await this.workflowService.validateWorkflow(config);
            if (!validation.valid) {
                (0, responseUtils_js_1.validationErrorResponse)(res, '工作流配置验证失败', undefined, 400, {
                    errors: validation.errors,
                });
                return;
            }
            (0, responseUtils_js_1.successResponse)(res, validation, '工作流配置验证成功');
        }
        catch (error) {
            logger_js_1.logger.error('验证工作流配置失败:', error);
            if (error instanceof errors_js_1.AppError) {
                (0, responseUtils_js_1.errorResponse)(res, error);
            }
            else {
                (0, responseUtils_js_1.errorResponse)(res, '验证工作流配置失败');
            }
        }
    }
    async getExecutionPath(req, res) {
        try {
            const { config } = req.body;
            if (!config) {
                (0, responseUtils_js_1.validationErrorResponse)(res, '工作流配置不能为空');
                return;
            }
            const executionPath = await this.workflowService.getExecutionPath(config);
            (0, responseUtils_js_1.successResponse)(res, executionPath, '获取执行路径成功');
        }
        catch (error) {
            logger_js_1.logger.error('获取执行路径失败:', error);
            if (error instanceof errors_js_1.AppError) {
                (0, responseUtils_js_1.errorResponse)(res, error);
            }
            else {
                (0, responseUtils_js_1.errorResponse)(res, '获取执行路径失败');
            }
        }
    }
}
exports.WorkflowController = WorkflowController;
function notFoundResponse(res, resource, id, requestId) {
    const error = new Error(`${resource} ${id ? `"${id}"` : ''} 不存在`);
    (0, responseUtils_js_1.errorResponse)(res, error, { resource, id }, 404, requestId);
}
//# sourceMappingURL=workflow.controller.js.map