"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecutionController = void 0;
const database_1 = require("../database");
const logger_1 = require("../utils/logger");
class ExecutionController {
    async getExecutions(req, res) {
        try {
            const { page = 1, limit = 10, status, workflowId } = req.query;
            const skip = (Number(page) - 1) * Number(limit);
            const where = {};
            if (status)
                where.status = status;
            if (workflowId)
                where.workflowId = workflowId;
            const [executions, total] = await Promise.all([
                database_1.db.execution.findMany({
                    where,
                    include: {
                        workflow: {
                            select: { id: true, name: true }
                        },
                        user: {
                            select: { id: true, name: true, email: true }
                        },
                        steps: {
                            orderBy: { order: 'asc' }
                        }
                    },
                    skip,
                    take: Number(limit),
                    orderBy: { createdAt: 'desc' }
                }),
                database_1.db.execution.count({ where })
            ]);
            res.json({
                success: true,
                data: {
                    executions,
                    pagination: {
                        page: Number(page),
                        limit: Number(limit),
                        total,
                        pages: Math.ceil(total / Number(limit))
                    }
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get executions:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch executions'
            });
        }
    }
    async getExecution(req, res) {
        try {
            const { id } = req.params;
            const execution = await database_1.db.execution.findUnique({
                where: { id },
                include: {
                    workflow: {
                        select: { id: true, name: true, description: true }
                    },
                    user: {
                        select: { id: true, name: true, email: true }
                    },
                    steps: {
                        orderBy: { order: 'asc' }
                    }
                }
            });
            if (!execution) {
                res.status(404).json({
                    success: false,
                    error: 'Execution not found'
                });
                return;
            }
            res.json({
                success: true,
                data: execution
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get execution:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch execution'
            });
        }
    }
    async cancelExecution(req, res) {
        try {
            const { id } = req.params;
            const execution = await database_1.db.execution.update({
                where: { id },
                data: {
                    status: 'CANCELLED',
                    endTime: new Date()
                }
            });
            logger_1.logger.info(`Execution cancelled: ${id}`);
            res.json({
                success: true,
                data: execution
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to cancel execution:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to cancel execution'
            });
        }
    }
    async getExecutionStats(req, res) {
        try {
            const { workflowId } = req.query;
            const where = {};
            if (workflowId)
                where.workflowId = workflowId;
            const stats = await database_1.db.execution.groupBy({
                by: ['status'],
                where,
                _count: {
                    status: true
                },
                orderBy: {
                    status: 'asc'
                }
            });
            const timeStats = await database_1.db.execution.aggregate({
                where: {
                    ...where,
                    startTime: { not: null },
                    endTime: { not: null }
                },
                _avg: {
                    duration: true
                },
                _sum: {
                    duration: true
                },
                _count: {
                    id: true
                }
            });
            res.json({
                success: true,
                data: {
                    statusCounts: stats,
                    timeStats: {
                        averageDuration: timeStats._avg.duration || 0,
                        totalDuration: timeStats._sum.duration || 0,
                        completedExecutions: timeStats._count.id
                    }
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get execution stats:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch execution stats'
            });
        }
    }
}
exports.ExecutionController = ExecutionController;
//# sourceMappingURL=execution.controller.js.map