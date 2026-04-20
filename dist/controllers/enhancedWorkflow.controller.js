"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnhancedWorkflowController = void 0;
const index_js_1 = require("../database/index.js");
const workflow_scheduler_js_1 = require("../services/workflow-scheduler.js");
const errorHandling_decorators_js_1 = require("../decorators/errorHandling.decorators.js");
const responseUtils_js_1 = require("../utils/responseUtils.js");
class EnhancedWorkflowController {
    constructor() {
        this.workflowService = workflow_scheduler_js_1.WorkflowService.getInstance();
    }
    async getWorkflows(req, res) {
        const { page = 1, limit = 10, status, userId, search } = req.query;
        const validation = this.validatePaginationQuery({ page, limit });
        if (!validation.isValid) {
            (0, responseUtils_js_1.validationErrorResponse)(res, '查询参数验证失败', validation.errors);
            return;
        }
        const result = await this.workflowService.getWorkflows({
            page: Number(page),
            limit: Number(limit),
            status: status,
            userId: userId,
            search: search,
        });
        (0, responseUtils_js_1.successResponse)(res, result.data, '获取工作流列表成功', 200, {
            pagination: result.pagination,
        });
    }
    async createWorkflow(req, res) {
        const { name, description, config, variables, userId } = req.body;
        const workflow = await this.workflowService.createWorkflow({
            name,
            description,
            config,
            variables: variables || {},
            userId: userId || req.user?.id,
        });
        logger.info(`工作流创建成功: ${workflow.id} (${name})`);
        (0, responseUtils_js_1.successResponse)(res, workflow, '工作流创建成功', 201);
    }
    async getWorkflow(req, res) {
        const { id } = req.params;
        if (!id) {
            (0, responseUtils_js_1.validationErrorResponse)(res, '工作流ID不能为空');
            return;
        }
        const workflow = await this.workflowService.getWorkflow(id);
        if (!workflow) {
            const notFoundError = new NotFoundError('工作流', id);
            (0, responseUtils_js_1.errorResponse)(res, notFoundError);
            return;
        }
        (0, responseUtils_js_1.successResponse)(res, workflow, '获取工作流详情成功');
    }
    async updateWorkflow(req, res) {
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
        logger.info(`工作流更新成功: ${id}`);
        (0, responseUtils_js_1.successResponse)(res, workflow, '工作流更新成功');
    }
    async deleteWorkflow(req, res) {
        const { id } = req.params;
        if (!id) {
            (0, responseUtils_js_1.validationErrorResponse)(res, '工作流ID不能为空');
            return;
        }
        const activeExecutions = await index_js_1.prisma.workflowExecution.count({
            where: {
                workflowId: id,
                status: {
                    in: ['PENDING', 'RUNNING']
                }
            }
        });
        if (activeExecutions > 0) {
            const businessError = new Error('无法删除包含活跃执行的工作流');
            (0, responseUtils_js_1.errorResponse)(res, businessError.message, undefined, 409);
            return;
        }
        await this.workflowService.deleteWorkflow(id);
        logger.info(`工作流删除成功: ${id}`);
        (0, responseUtils_js_1.successResponse)(res, null, '工作流删除成功');
    }
    async executeWorkflow(req, res) {
        const { id } = req.params;
        const { variables, priority, timeout } = req.body;
        if (!id) {
            (0, responseUtils_js_1.validationErrorResponse)(res, '工作流ID不能为空');
            return;
        }
        const result = await this.workflowService.executeWorkflow(id, {
            variables,
            priority,
            timeout,
        });
        logger.info(`工作流执行启动: ${id}`);
        res.status(202).json({
            success: true,
            message: '工作流执行已启动',
            executionId: result.id,
            status: result.status,
            estimatedDuration: result.estimatedDuration,
        });
    }
    async getExecutionHistory(req, res) {
        const { id } = req.params;
        const { page = 1, limit = 20, status, startDate, endDate } = req.query;
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
    async validateWorkflow(req, res) {
        const { config } = req.body;
        const validation = await this.workflowService.validateWorkflow(config);
        if (!validation.isValid) {
            (0, responseUtils_js_1.validationErrorResponse)(res, '工作流配置验证失败', validation.errors);
            return;
        }
        (0, responseUtils_js_1.successResponse)(res, {
            isValid: true,
            warnings: validation.warnings || [],
            suggestions: validation.suggestions || [],
        }, '工作流配置验证通过');
    }
    async getExecutionPath(req, res) {
        const { config, input } = req.body;
        const path = await this.workflowService.getExecutionPath(config, input);
        (0, responseUtils_js_1.successResponse)(res, path, '执行路径分析成功');
    }
    async cloneWorkflow(req, res) {
        const { id } = req.params;
        const { name } = req.body || {};
        const original = await index_js_1.prisma.workflow.findUnique({
            where: { id },
            include: { executions: { take: 0 } },
        });
        if (!original) {
            const notFoundError = new NotFoundError('工作流', id);
            (0, responseUtils_js_1.errorResponse)(res, notFoundError);
            return;
        }
        if (original.userId !== req.user?.id && !req.user?.isAdmin) {
            const authError = new Error('没有权限克隆此工作流');
            (0, responseUtils_js_1.errorResponse)(res, authError.message, undefined, 403);
            return;
        }
        const cloned = await index_js_1.prisma.workflow.create({
            data: {
                name: name || `${original.name} (副本)`,
                description: original.description,
                config: original.config,
                status: 'DRAFT',
                variables: original.variables,
                userId: original.userId,
            },
        });
        logger.info(`Workflow cloned: ${original.id} → ${cloned.id}`);
        (0, responseUtils_js_1.successResponse)(res, {
            id: cloned.id,
            name: cloned.name,
            description: cloned.description,
            status: cloned.status,
            sourceWorkflowId: original.id,
            sourceWorkflowName: original.name,
            createdAt: cloned.createdAt,
        }, '工作流克隆成功', 201);
    }
    validatePaginationQuery(query) {
        const errors = [];
        const { page, limit } = query;
        if (page && (!Number.isInteger(Number(page)) || Number(page) < 1)) {
            errors.push('页码必须是正整数');
        }
        if (limit && (!Number.isInteger(Number(limit)) || Number(limit) < 1 || Number(limit) > 100)) {
            errors.push('每页数量必须是1-100之间的整数');
        }
        return {
            isValid: errors.length === 0,
            errors: errors.length > 0 ? errors : undefined,
        };
    }
    validateCreateWorkflow(req) {
        const { name, config } = req.body;
        const errors = [];
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            errors.push('工作流名称不能为空');
        }
        if (!config || typeof config !== 'object') {
            errors.push('工作流配置必须是对象');
        }
        if (name && name.length > 200) {
            errors.push('工作流名称不能超过200个字符');
        }
        return {
            isValid: errors.length === 0,
            errors: errors.length > 0 ? errors : undefined,
        };
    }
    validateUpdateWorkflow(req) {
        const { name, description, config, status } = req.body;
        const errors = [];
        if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
            errors.push('工作流名称不能为空');
        }
        if (name !== undefined && name.length > 200) {
            errors.push('工作流名称不能超过200个字符');
        }
        if (description !== undefined && typeof description !== 'string') {
            errors.push('工作流描述必须是字符串');
        }
        if (config !== undefined && typeof config !== 'object') {
            errors.push('工作流配置必须是对象');
        }
        if (status !== undefined && !['DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED'].includes(status)) {
            errors.push('工作流状态必须是 DRAFT, ACTIVE, PAUSED 或 ARCHIVED');
        }
        return {
            isValid: errors.length === 0,
            errors: errors.length > 0 ? errors : undefined,
        };
    }
    validateExecuteWorkflow(req) {
        const { variables, priority, timeout } = req.body;
        const errors = [];
        if (variables !== undefined && typeof variables !== 'object') {
            errors.push('变量必须是对象');
        }
        if (priority !== undefined && !['LOW', 'NORMAL', 'HIGH', 'URGENT'].includes(priority)) {
            errors.push('优先级必须是 LOW, NORMAL, HIGH 或 URGENT');
        }
        if (timeout !== undefined && (!Number.isInteger(Number(timeout)) || Number(timeout) < 1 || Number(timeout) > 3600)) {
            errors.push('超时时间必须是1-3600秒之间的整数');
        }
        return {
            isValid: errors.length === 0,
            errors: errors.length > 0 ? errors : undefined,
        };
    }
    validateExecutionHistoryQuery(req) {
        const { page, limit, status, startDate, endDate } = req.query;
        const errors = [];
        if (page && (!Number.isInteger(Number(page)) || Number(page) < 1)) {
            errors.push('页码必须是正整数');
        }
        if (limit && (!Number.isInteger(Number(limit)) || Number(limit) < 1 || Number(limit) > 100)) {
            errors.push('每页数量必须是1-100之间的整数');
        }
        if (status && !['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'].includes(status)) {
            errors.push('状态必须是 PENDING, RUNNING, COMPLETED, FAILED 或 CANCELLED');
        }
        if (startDate && isNaN(Date.parse(startDate))) {
            errors.push('开始日期格式无效');
        }
        if (endDate && isNaN(Date.parse(endDate))) {
            errors.push('结束日期格式无效');
        }
        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
            errors.push('开始日期不能晚于结束日期');
        }
        return {
            isValid: errors.length === 0,
            errors: errors.length > 0 ? errors : undefined,
        };
    }
    validateWorkflowConfig(req) {
        const { config } = req.body;
        const errors = [];
        if (!config || typeof config !== 'object') {
            errors.push('工作流配置必须是对象');
            return { isValid: false, errors };
        }
        if (!config.steps || !Array.isArray(config.steps)) {
            errors.push('工作流配置必须包含步骤数组');
        }
        if (config.steps) {
            config.steps.forEach((step, index) => {
                if (!step.id || typeof step.id !== 'string') {
                    errors.push(`步骤 ${index + 1}: ID不能为空且必须是字符串`);
                }
                if (!step.type || !['api', 'script', 'condition', 'loop'].includes(step.type)) {
                    errors.push(`步骤 ${index + 1}: 类型必须是 api, script, condition 或 loop`);
                }
                if (step.type === 'api' && (!step.config || typeof step.config !== 'object')) {
                    errors.push(`步骤 ${index + 1}: API步骤必须包含配置对象`);
                }
            });
        }
        return {
            isValid: errors.length === 0,
            errors: errors.length > 0 ? errors : undefined,
        };
    }
    validateExecutionPath(req) {
        const { config, input } = req.body;
        const errors = [];
        if (!config || typeof config !== 'object') {
            errors.push('配置必须是对象');
        }
        if (input !== undefined && typeof input !== 'object') {
            errors.push('输入必须是对象');
        }
        return {
            isValid: errors.length === 0,
            errors: errors.length > 0 ? errors : undefined,
        };
    }
}
exports.EnhancedWorkflowController = EnhancedWorkflowController;
__decorate([
    (0, errorHandling_decorators_js_1.withErrorHandling)({
        logErrors: true,
        sanitizeUserError: true,
        defaultErrorCode: 'WORKFLOW_LIST_ERROR',
        defaultStatusCode: 500,
    }),
    (0, errorHandling_decorators_js_1.withRetry)({
        maxRetries: 2,
        delayMs: 100,
        retryCondition: (error) => error.message.includes('network') ||
            error.message.includes('timeout') ||
            error.message.includes('connection')
    }),
    (0, errorHandling_decorators_js_1.withPerformanceMonitoring)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], EnhancedWorkflowController.prototype, "getWorkflows", null);
__decorate([
    (0, errorHandling_decorators_js_1.withErrorHandling)({
        logErrors: true,
        sanitizeUserError: true,
        defaultErrorCode: 'WORKFLOW_CREATE_ERROR',
        defaultStatusCode: 500,
    }),
    (0, errorHandling_decorators_js_1.withInputValidation)((req) => this.validateCreateWorkflow(req)),
    (0, errorHandling_decorators_js_1.withTransactionErrorHandler)('createWorkflow'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], EnhancedWorkflowController.prototype, "createWorkflow", null);
__decorate([
    (0, errorHandling_decorators_js_1.withErrorHandling)({
        logErrors: true,
        sanitizeUserError: true,
        defaultErrorCode: 'WORKFLOW_FETCH_ERROR',
        defaultStatusCode: 404,
    }),
    (0, errorHandling_decorators_js_1.withRetry)({
        maxRetries: 1,
        retryCondition: (error) => error.message.includes('not found')
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], EnhancedWorkflowController.prototype, "getWorkflow", null);
__decorate([
    (0, errorHandling_decorators_js_1.withErrorHandling)({
        logErrors: true,
        sanitizeUserError: true,
        defaultErrorCode: 'WORKFLOW_UPDATE_ERROR',
        defaultStatusCode: 500,
    }),
    (0, errorHandling_decorators_js_1.withInputValidation)((req) => this.validateUpdateWorkflow(req)),
    (0, errorHandling_decorators_js_1.withTransactionErrorHandler)('updateWorkflow'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], EnhancedWorkflowController.prototype, "updateWorkflow", null);
__decorate([
    (0, errorHandling_decorators_js_1.withErrorHandling)({
        logErrors: true,
        sanitizeUserError: true,
        defaultErrorCode: 'WORKFLOW_DELETE_ERROR',
        defaultStatusCode: 500,
    }),
    (0, errorHandling_decorators_js_1.withRetry)({
        maxRetries: 1,
        retryCondition: (error) => error.message.includes('constraint') ||
            error.message.includes('foreign key')
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], EnhancedWorkflowController.prototype, "deleteWorkflow", null);
__decorate([
    (0, errorHandling_decorators_js_1.withErrorHandling)({
        logErrors: true,
        sanitizeUserError: true,
        defaultErrorCode: 'WORKFLOW_EXECUTE_ERROR',
        defaultStatusCode: 500,
    }),
    (0, errorHandling_decorators_js_1.withInputValidation)((req) => this.validateExecuteWorkflow(req)),
    (0, errorHandling_decorators_js_1.withRetry)({
        maxRetries: 1,
        retryCondition: (error) => error.message.includes('timeout') ||
            error.message.includes('service unavailable')
    }),
    (0, errorHandling_decorators_js_1.withPerformanceMonitoring)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], EnhancedWorkflowController.prototype, "executeWorkflow", null);
__decorate([
    (0, errorHandling_decorators_js_1.withErrorHandling)({
        logErrors: true,
        sanitizeUserError: true,
        defaultErrorCode: 'EXECUTION_HISTORY_ERROR',
        defaultStatusCode: 500,
    }),
    (0, errorHandling_decorators_js_1.withInputValidation)((req) => this.validateExecutionHistoryQuery(req)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], EnhancedWorkflowController.prototype, "getExecutionHistory", null);
__decorate([
    (0, errorHandling_decorators_js_1.withErrorHandling)({
        logErrors: true,
        sanitizeUserError: true,
        defaultErrorCode: 'WORKFLOW_VALIDATE_ERROR',
        defaultStatusCode: 400,
    }),
    (0, errorHandling_decorators_js_1.withInputValidation)((req) => this.validateWorkflowConfig(req)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], EnhancedWorkflowController.prototype, "validateWorkflow", null);
__decorate([
    (0, errorHandling_decorators_js_1.withErrorHandling)({
        logErrors: true,
        sanitizeUserError: true,
        defaultErrorCode: 'EXECUTION_PATH_ERROR',
        defaultStatusCode: 500,
    }),
    (0, errorHandling_decorators_js_1.withInputValidation)((req) => this.validateExecutionPath(req)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], EnhancedWorkflowController.prototype, "getExecutionPath", null);
__decorate([
    (0, errorHandling_decorators_js_1.withErrorHandling)({
        logErrors: true,
        sanitizeUserError: true,
        defaultErrorCode: 'WORKFLOW_CLONE_ERROR',
        defaultStatusCode: 500,
    }),
    (0, errorHandling_decorators_js_1.withRetry)({
        maxRetries: 2,
        delayMs: 50,
        retryCondition: (error) => error.message.includes('unique constraint')
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], EnhancedWorkflowController.prototype, "cloneWorkflow", null);
//# sourceMappingURL=enhancedWorkflow.controller.js.map