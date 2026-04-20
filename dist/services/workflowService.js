"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.workflowService = exports.WorkflowService = void 0;
const index_ts_1 = require("../database/index.ts");
const aiEngineService_ts_1 = require("./aiEngineService.ts");
const logger_ts_1 = require("../utils/logger.ts");
class WorkflowService {
    async createWorkflow(data) {
        try {
            const workflow = await index_ts_1.prisma.workflow.create({
                data: {
                    name: data.name,
                    description: data.description,
                    config: data.config || {},
                    status: 'DRAFT',
                },
            });
            logger_ts_1.logger.info(`Workflow created: ${workflow.id}`);
            return workflow;
        }
        catch (error) {
            logger_ts_1.logger.error('Failed to create workflow:', error);
            throw error;
        }
    }
    async getWorkflows() {
        try {
            return await index_ts_1.prisma.workflow.findMany({
                orderBy: { updatedAt: 'desc' },
                include: {
                    executions: {
                        orderBy: { startTime: 'desc' },
                        take: 1,
                    },
                },
            });
        }
        catch (error) {
            logger_ts_1.logger.error('Failed to get workflows:', error);
            throw error;
        }
    }
    async getWorkflow(id) {
        try {
            return await index_ts_1.prisma.workflow.findUnique({
                where: { id },
                include: {
                    executions: {
                        orderBy: { startTime: 'desc' },
                    },
                    steps: {
                        orderBy: { order: 'asc' },
                    },
                },
            });
        }
        catch (error) {
            logger_ts_1.logger.error('Failed to get workflow:', error);
            throw error;
        }
    }
    async executeWorkflow(workflowId, request) {
        const startTime = new Date();
        try {
            const execution = await index_ts_1.prisma.execution.create({
                data: {
                    workflowId,
                    status: 'RUNNING',
                    startTime,
                    metadata: request.metadata || {},
                    triggeredBy: request.triggeredBy || 'system',
                },
            });
            const workflow = await this.getWorkflow(workflowId);
            if (!workflow) {
                throw new Error(`Workflow not found: ${workflowId}`);
            }
            logger_ts_1.logger.info(`Executing workflow: ${workflowId} (Execution ID: ${execution.id})`);
            const steps = await this.executeWorkflowSteps(workflow, execution.id);
            const endTime = new Date();
            const overallStatus = steps.every(step => step.status === 'completed') ? 'COMPLETED' : 'FAILED';
            await index_ts_1.prisma.execution.update({
                where: { id: execution.id },
                data: {
                    status: overallStatus,
                    endTime,
                    result: {
                        steps,
                        summary: {
                            totalSteps: steps.length,
                            completedSteps: steps.filter(s => s.status === 'completed').length,
                            failedSteps: steps.filter(s => s.status === 'failed').length,
                            duration: endTime.getTime() - startTime.getTime(),
                        },
                    },
                },
            });
            logger_ts_1.logger.info(`Workflow execution ${execution.id} completed with status: ${overallStatus}`);
            return {
                executionId: execution.id,
                workflowId,
                status: overallStatus,
                steps,
                startTime,
                endTime,
                result: {
                    steps,
                    summary: {
                        totalSteps: steps.length,
                        completedSteps: steps.filter(s => s.status === 'completed').length,
                        failedSteps: steps.filter(s => s.status === 'failed').length,
                        duration: endTime.getTime() - startTime.getTime(),
                    },
                },
            };
        }
        catch (error) {
            logger_ts_1.logger.error(`Workflow execution failed: ${error}`);
            throw error;
        }
    }
    async executeWorkflowSteps(workflow, executionId) {
        const steps = [];
        if (!workflow.steps || workflow.steps.length === 0) {
            return [];
        }
        for (const step of workflow.steps) {
            const stepStartTime = Date.now();
            try {
                const result = await this.executeWorkflowStep(step, workflow.config);
                const stepEndTime = Date.now();
                steps.push({
                    stepId: step.id,
                    status: 'completed',
                    result,
                    duration: stepEndTime - stepStartTime,
                });
                logger_ts_1.logger.info(`Step ${step.id} completed successfully`);
            }
            catch (error) {
                const stepEndTime = Date.now();
                steps.push({
                    stepId: step.id,
                    status: 'failed',
                    error: error instanceof Error ? error.message : 'Unknown error',
                    duration: stepEndTime - stepStartTime,
                });
                logger_ts_1.logger.error(`Step ${step.id} failed:`, error);
                if (!step.config?.continueOnError) {
                    break;
                }
            }
        }
        return steps;
    }
    async executeWorkflowStep(step, workflowConfig) {
        const stepConfig = step.config || {};
        switch (step.type) {
            case 'ai-task':
                return await this.executeAIStep(step, stepConfig);
            case 'condition':
                return await this.executeConditionStep(step, stepConfig);
            case 'parallel':
                return await this.executeParallelStep(step, stepConfig);
            case 'sequential':
                return await this.executeSequentialStep(step, stepConfig);
            default:
                throw new Error(`Unsupported step type: ${step.type}`);
        }
    }
    async executeAIStep(step, config) {
        const { provider, prompt, systemPrompt, maxTokens, temperature, jsonMode } = config;
        if (!provider || !prompt) {
            throw new Error('AI step requires provider and prompt');
        }
        const result = await aiEngineService_ts_1.aiEngineService.executeEngine(provider, {
            prompt,
            systemPrompt,
            maxTokens,
            temperature,
            jsonMode: jsonMode || false,
        });
        if (!result.success) {
            throw new Error(`AI execution failed: ${result.error}`);
        }
        return {
            type: 'ai-result',
            content: result.data,
            provider,
            duration: result.duration,
            tokenUsage: result.tokenUsage,
        };
    }
    async executeConditionStep(step, config) {
        const { condition, trueBranch, falseBranch } = config;
        const conditionResult = this.evaluateCondition(condition);
        if (conditionResult) {
            return {
                type: 'condition-result',
                result: true,
                branch: trueBranch,
            };
        }
        else {
            return {
                type: 'condition-result',
                result: false,
                branch: falseBranch,
            };
        }
    }
    async executeParallelStep(step, config) {
        const { steps: parallelSteps } = config;
        if (!parallelSteps || !Array.isArray(parallelSteps)) {
            throw new Error('Parallel step requires an array of sub-steps');
        }
        const results = await Promise.all(parallelSteps.map((subStep) => this.executeWorkflowStep(subStep, step.config)));
        return {
            type: 'parallel-result',
            results,
            completed: results.length,
        };
    }
    async executeSequentialStep(step, config) {
        const { steps: sequentialSteps } = config;
        if (!sequentialSteps || !Array.isArray(sequentialSteps)) {
            throw new Error('Sequential step requires an array of sub-steps');
        }
        const results = [];
        for (const subStep of sequentialSteps) {
            const result = await this.executeWorkflowStep(subStep, step.config);
            results.push(result);
        }
        return {
            type: 'sequential-result',
            results,
            completed: results.length,
        };
    }
    evaluateCondition(condition) {
        if (typeof condition === 'string') {
            return condition.includes('true') || condition.includes('yes');
        }
        else if (typeof condition === 'boolean') {
            return condition;
        }
        else if (typeof condition === 'number') {
            return condition > 0;
        }
        return false;
    }
    async getExecution(executionId) {
        try {
            return await index_ts_1.prisma.execution.findUnique({
                where: { id: executionId },
                include: {
                    workflow: {
                        select: {
                            id: true,
                            name: true,
                            description: true,
                        },
                    },
                },
            });
        }
        catch (error) {
            logger_ts_1.logger.error('Failed to get execution:', error);
            throw error;
        }
    }
    async getExecutions(limit = 50) {
        try {
            return await index_ts_1.prisma.execution.findMany({
                orderBy: { startTime: 'desc' },
                take: limit,
                include: {
                    workflow: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            });
        }
        catch (error) {
            logger_ts_1.logger.error('Failed to get executions:', error);
            throw error;
        }
    }
    async getWorkflowStats(workflowId) {
        try {
            const [totalExecutions, successfulExecutions, failedExecutions, averageDuration,] = await Promise.all([
                index_ts_1.prisma.execution.count({ where: { workflowId } }),
                index_ts_1.prisma.execution.count({
                    where: {
                        workflowId,
                        status: 'COMPLETED'
                    }
                }),
                index_ts_1.prisma.execution.count({
                    where: {
                        workflowId,
                        status: 'FAILED'
                    }
                }),
                index_ts_1.prisma.execution.aggregate({
                    where: { workflowId },
                    _avg: {
                        endTime: {
                            difference: index_ts_1.prisma.execution.endTime.minus(index_ts_1.prisma.execution.startTime),
                        },
                    },
                }),
            ]);
            return {
                totalExecutions,
                successfulExecutions,
                failedExecutions,
                successRate: totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0,
                averageDuration: averageDuration._avg?.endTime || 0,
            };
        }
        catch (error) {
            logger_ts_1.logger.error('Failed to get workflow stats:', error);
            throw error;
        }
    }
}
exports.WorkflowService = WorkflowService;
exports.workflowService = new WorkflowService();
//# sourceMappingURL=workflowService.js.map