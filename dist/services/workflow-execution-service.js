"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.workflowExecutionService = exports.WorkflowExecutionService = void 0;
const database_js_1 = require("../config/database.js");
class WorkflowExecutionService {
    constructor() {
        this.postgresDb = database_js_1.dbConfig.getPostgresDb();
    }
    async createExecution(data) {
        try {
            const execution = await this.postgresDb.createWorkflowExecution({
                workflowId: data.workflowId,
                userId: 'default-user',
                triggerData: data.triggerData,
                status: data.status,
            });
            return {
                success: true,
                data: execution,
            };
        }
        catch (error) {
            await this.logError('createExecution', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    async updateExecution(executionId, data) {
        try {
            const updateData = {
                status: data.status,
            };
            if (data.result !== undefined) {
                updateData.result = data.result;
            }
            if (data.errorMessage !== undefined) {
                updateData.errorMessage = data.errorMessage;
            }
            if (data.executionTimeMs !== undefined) {
                updateData.executionTimeMs = data.executionTimeMs;
            }
            const execution = await this.postgresDb.updateWorkflowExecution(executionId, updateData);
            return {
                success: true,
                data: execution,
            };
        }
        catch (error) {
            await this.logError('updateExecution', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    async getExecution(executionId) {
        try {
            const execution = await this.postgresDb.getWorkflowExecutionWithHistory(executionId);
            if (!execution) {
                return {
                    success: false,
                    error: 'Execution not found',
                };
            }
            return {
                success: true,
                data: execution,
            };
        }
        catch (error) {
            await this.logError('getExecution', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    async getExecutions(params) {
        try {
            const { workflowId, status, page = 1, limit = 10, startDate, endDate, userId, sortBy = 'created_at', sortOrder = 'desc', } = params;
            const offset = (page - 1) * limit;
            const where = {};
            if (workflowId)
                where.workflow_id = workflowId;
            if (status)
                where.status = status;
            if (userId)
                where.user_id = userId;
            if (startDate || endDate) {
                where.created_at = {};
                if (startDate)
                    where.created_at.gte = new Date(startDate);
                if (endDate)
                    where.created_at.lte = new Date(endDate);
            }
            const [executions, totalCount] = await Promise.all([
                this.postgresDb.prisma.workflowExecution.findMany({
                    where,
                    include: {
                        workflow: {
                            select: {
                                id: true,
                                name: true,
                                status: true,
                            },
                        },
                        user: {
                            select: {
                                id: true,
                                username: true,
                                email: true,
                            },
                        },
                        stepExecutionHistory: {
                            take: 5,
                            orderBy: { sequence_order: 'asc' },
                        },
                    },
                    orderBy: {
                        [sortBy]: sortOrder,
                    },
                    skip: offset,
                    take: limit,
                }),
                this.postgresDb.prisma.workflowExecution.count({ where }),
            ]);
            const formattedExecutions = executions.map(execution => ({
                id: execution.id,
                workflowId: execution.workflow_id,
                workflowName: execution.workflow?.name,
                userId: execution.user_id,
                username: execution.user?.username,
                status: execution.status,
                triggerData: execution.trigger_data ? JSON.parse(execution.trigger_data) : null,
                result: execution.result ? JSON.parse(execution.result) : null,
                errorMessage: execution.error_message,
                executionTimeMs: execution.execution_time_ms,
                startedAt: execution.started_at,
                completedAt: execution.completed_at,
                createdAt: execution.created_at,
                stepCount: execution.stepExecutionHistory.length,
            }));
            return {
                success: true,
                data: {
                    executions: formattedExecutions,
                    total: totalCount,
                    hasMore: offset + limit < totalCount,
                    page,
                    limit,
                },
            };
        }
        catch (error) {
            await this.logError('getExecutions', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    async deleteExecution(executionId) {
        try {
            await this.postgresDb.prisma.workflowExecution.delete({
                where: { id: executionId },
            });
            return {
                success: true,
                data: { message: 'Execution deleted successfully' },
            };
        }
        catch (error) {
            await this.logError('deleteExecution', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    async getExecutionStats() {
        try {
            const [totalExecutions, successfulExecutions, failedExecutions, runningExecutions, avgExecutionTime, executionsByStatus, executionsByDay,] = await Promise.all([
                this.postgresDb.prisma.workflowExecution.count(),
                this.postgresDb.prisma.workflowExecution.count({
                    where: { status: 'completed' },
                }),
                this.postgresDb.prisma.workflowExecution.count({
                    where: { status: 'failed' },
                }),
                this.postgresDb.prisma.workflowExecution.count({
                    where: { status: 'running' },
                }),
                this.postgresDb.prisma.workflowExecution.aggregate({
                    _avg: { execution_time_ms: true },
                }),
                this.postgresDb.prisma.workflowExecution.groupBy({
                    by: ['status'],
                    _count: { status: true },
                }),
                this.getExecutionsByDay(),
            ]);
            const stats = {
                totalExecutions,
                successfulExecutions,
                failedExecutions,
                runningExecutions,
                averageExecutionTime: avgExecutionTime._avg.execution_time_ms || 0,
                executionsByStatus: executionsByStatus.reduce((acc, item) => {
                    acc[item.status] = item._count.status;
                    return acc;
                }, {}),
                executionsByDay,
            };
            return {
                success: true,
                data: stats,
            };
        }
        catch (error) {
            await this.logError('getExecutionStats', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    async getExecutionsByDay() {
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const executions = await this.postgresDb.prisma.workflowExecution.findMany({
                where: {
                    created_at: {
                        gte: thirtyDaysAgo,
                    },
                },
                select: {
                    created_at: true,
                },
            });
            const executionsByDay = {};
            executions.forEach(execution => {
                const date = new Date(execution.created_at).toISOString().split('T')[0];
                executionsByDay[date] = (executionsByDay[date] || 0) + 1;
            });
            return executionsByDay;
        }
        catch (error) {
            await this.logError('getExecutionsByDay', error);
            return {};
        }
    }
    async createStepExecution(data) {
        try {
            const stepExecution = await this.postgresDb.createStepExecution(data);
            return {
                success: true,
                data: stepExecution,
            };
        }
        catch (error) {
            await this.logError('createStepExecution', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    async logError(operation, error) {
        try {
            await this.postgresDb.prisma.systemLog.create({
                data: {
                    level: 'error',
                    message: `${operation} failed`,
                    metadata: JSON.stringify({
                        operation,
                        error: error instanceof Error ? error.message : error,
                        timestamp: new Date().toISOString(),
                    }),
                },
            });
        }
        catch (logError) {
            console.error('Failed to log error:', logError);
        }
    }
}
exports.WorkflowExecutionService = WorkflowExecutionService;
exports.workflowExecutionService = new WorkflowExecutionService();
//# sourceMappingURL=workflow-execution-service.js.map