"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowController = void 0;
const workflow_validator_service_js_1 = require("../services/workflow-validator.service.js");
const ai_workflow_service_js_1 = require("../services/ai-workflow-service.js");
const logger_js_1 = require("../utils/logger.js");
class WorkflowController {
    constructor() {
        this.workflowService = new ai_workflow_service_js_1.WorkflowService();
    }
    async getWorkflows(req, res) {
        try {
            const { page = 1, limit = 10, status } = req.query;
            const workflows = await this.workflowService.getWorkflows({
                page: Number(page),
                limit: Number(limit),
                status: status
            });
            res.json({
                success: true,
                data: workflows.data,
                pagination: workflows.pagination
            });
        }
        catch (error) {
            logger_js_1.logger.error('获取工作流列表失败:', error);
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : '获取工作流列表失败'
            });
        }
    }
    async createWorkflow(req, res) {
        try {
            const workflowData = req.body;
            const validation = workflow_validator_service_js_1.WorkflowValidator.validateWorkflow(workflowData);
            if (!validation.valid) {
                res.status(400).json({
                    success: false,
                    error: '工作流验证失败',
                    details: validation.errors
                });
                return;
            }
            const workflow = await this.workflowService.createWorkflow(workflowData);
            res.status(201).json({
                success: true,
                data: workflow
            });
        }
        catch (error) {
            logger_js_1.logger.error('创建工作流失败:', error);
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : '创建工作流失败'
            });
        }
    }
    async getWorkflow(req, res) {
        try {
            const { id } = req.params;
            const workflow = await this.workflowService.getWorkflowById(id);
            if (!workflow) {
                res.status(404).json({
                    success: false,
                    error: '工作流不存在'
                });
                return;
            }
            res.json({
                success: true,
                data: workflow
            });
        }
        catch (error) {
            logger_js_1.logger.error('获取工作流详情失败:', error);
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : '获取工作流详情失败'
            });
        }
    }
    async updateWorkflow(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            if (updateData.steps) {
                const validation = workflow_validator_service_js_1.WorkflowValidator.validateWorkflow({
                    ...updateData,
                    id
                });
                if (!validation.valid) {
                    res.status(400).json({
                        success: false,
                        error: '工作流验证失败',
                        details: validation.errors
                    });
                    return;
                }
            }
            const workflow = await this.workflowService.updateWorkflow(id, updateData);
            res.json({
                success: true,
                data: workflow
            });
        }
        catch (error) {
            logger_js_1.logger.error('更新工作流失败:', error);
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : '更新工作流失败'
            });
        }
    }
    async deleteWorkflow(req, res) {
        try {
            const { id } = req.params;
            await this.workflowService.deleteWorkflow(id);
            res.json({
                success: true,
                message: '工作流删除成功'
            });
        }
        catch (error) {
            logger_js_1.logger.error('删除工作流失败:', error);
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : '删除工作流失败'
            });
        }
    }
    async executeWorkflow(req, res) {
        try {
            const { id } = req.params;
            const { inputData, userId } = req.body;
            const workflow = await this.workflowService.getWorkflowById(id);
            if (!workflow) {
                res.status(404).json({
                    success: false,
                    error: '工作流不存在'
                });
                return;
            }
            const validation = workflow_validator_service_js_1.WorkflowValidator.validateExecutionInput(workflow, inputData);
            if (!validation.valid) {
                res.status(400).json({
                    success: false,
                    error: '执行输入验证失败',
                    details: validation.errors
                });
                return;
            }
            const execution = await this.workflowService.executeWorkflow(id, {
                inputData,
                userId,
                metadata: {
                    userAgent: req.get('User-Agent'),
                    ipAddress: req.ip,
                    timestamp: new Date().toISOString()
                }
            });
            res.status(202).json({
                success: true,
                data: execution
            });
        }
        catch (error) {
            logger_js_1.logger.error('执行工作流失败:', error);
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : '执行工作流失败'
            });
        }
    }
    async getExecutionHistory(req, res) {
        try {
            const { id } = req.params;
            const { page = 1, limit = 20, status } = req.query;
            const executions = await this.workflowService.getExecutionHistory(id, {
                page: Number(page),
                limit: Number(limit),
                status: status
            });
            res.json({
                success: true,
                data: executions.data,
                pagination: executions.pagination
            });
        }
        catch (error) {
            logger_js_1.logger.error('获取执行历史失败:', error);
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : '获取执行历史失败'
            });
        }
    }
    async validateWorkflow(req, res) {
        try {
            const workflowData = req.body;
            const validation = workflow_validator_service_js_1.WorkflowValidator.validateWorkflow(workflowData);
            const executionValidation = workflow_validator_service_js_1.WorkflowValidator.validateExecutionInput(workflowData, req.body.inputData || {});
            res.json({
                success: true,
                validation: {
                    workflow: validation,
                    execution: executionValidation,
                    canExecute: validation.valid && executionValidation.valid
                }
            });
        }
        catch (error) {
            logger_js_1.logger.error('验证工作流失败:', error);
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : '验证工作流失败'
            });
        }
    }
    async getExecutionPath(req, res) {
        try {
            const workflowData = req.body;
            const validation = workflow_validator_service_js_1.WorkflowValidator.validateWorkflow(workflowData);
            if (!validation.valid) {
                res.status(400).json({
                    success: false,
                    error: '工作流验证失败',
                    details: validation.errors
                });
                return;
            }
            const executionOrder = workflow_validator_service_js_1.WorkflowValidator.getExecutionOrder(workflowData.steps);
            res.json({
                success: true,
                data: {
                    steps: executionOrder,
                    totalSteps: executionOrder.length,
                    estimatedDuration: executionOrder.length * 30
                }
            });
        }
        catch (error) {
            logger_js_1.logger.error('获取执行路径失败:', error);
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : '获取执行路径失败'
            });
        }
    }
}
exports.WorkflowController = WorkflowController;
//# sourceMappingURL=workflow.controller.js.map