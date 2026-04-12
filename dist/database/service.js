"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
const index_js_1 = require("./index.js");
const logger_js_1 = require("../utils/logger.js");
class DatabaseService {
    static async createWorkflow(data) {
        try {
            const workflow = await index_js_1.prisma.workflow.create({
                data: {
                    title: data.title,
                    description: data.description,
                    config: data.config,
                    tags: data.tags ? JSON.stringify(data.tags) : null,
                    isPublic: data.isPublic || false,
                    userId: data.userId,
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            name: true,
                        },
                    },
                },
            });
            logger_js_1.logger.info(`Created workflow: ${workflow.id} - ${workflow.title}`);
            return workflow;
        }
        catch (error) {
            logger_js_1.logger.error('Failed to create workflow:', error);
            throw error;
        }
    }
    static async getWorkflows(filters) {
        try {
            const where = {};
            if (filters?.userId) {
                where.userId = filters.userId;
            }
            if (filters?.status) {
                where.status = filters.status;
            }
            if (filters?.isPublic !== undefined) {
                where.isPublic = filters.isPublic;
            }
            if (filters?.search) {
                where.OR = [
                    { title: { contains: filters.search, mode: 'insensitive' } },
                    { description: { contains: filters.search, mode: 'insensitive' } },
                ];
            }
            const workflows = await index_js_1.prisma.workflow.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            name: true,
                        },
                    },
                    _count: {
                        select: {
                            executions: true,
                            comments: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });
            return workflows;
        }
        catch (error) {
            logger_js_1.logger.error('Failed to get workflows:', error);
            throw error;
        }
    }
    static async getWorkflowById(id) {
        try {
            const workflow = await index_js_1.prisma.workflow.findUnique({
                where: { id },
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            name: true,
                        },
                    },
                    executions: {
                        orderBy: { createdAt: 'desc' },
                        include: {
                            agents: {
                                include: {
                                    agent: true,
                                },
                            },
                        },
                    },
                },
            });
            if (!workflow) {
                throw new Error(`Workflow not found: ${id}`);
            }
            return workflow;
        }
        catch (error) {
            logger_js_1.logger.error('Failed to get workflow:', error);
            throw error;
        }
    }
    static async updateWorkflow(id, data) {
        try {
            const existingWorkflow = await index_js_1.prisma.workflow.findUnique({
                where: { id },
            });
            if (!existingWorkflow) {
                throw new Error(`Workflow not found: ${id}`);
            }
            const updateData = {
                ...data,
                updatedAt: new Date(),
            };
            if (data.tags !== undefined) {
                updateData.tags = data.tags ? JSON.stringify(data.tags) : null;
            }
            const workflow = await index_js_1.prisma.workflow.update({
                where: { id },
                data: updateData,
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            name: true,
                        },
                    },
                },
            });
            logger_js_1.logger.info(`Updated workflow: ${id}`);
            return workflow;
        }
        catch (error) {
            logger_js_1.logger.error('Failed to update workflow:', error);
            throw error;
        }
    }
    static async deleteWorkflow(id) {
        try {
            const workflow = await index_js_1.prisma.workflow.delete({
                where: { id },
            });
            logger_js_1.logger.info(`Deleted workflow: ${id}`);
            return workflow;
        }
        catch (error) {
            logger_js_1.logger.error('Failed to delete workflow:', error);
            throw error;
        }
    }
    static async createExecution(data) {
        try {
            const execution = await index_js_1.prisma.workflowExecution.create({
                data: {
                    workflowId: data.workflowId,
                    userId: data.userId,
                    input: data.input || {},
                    status: data.status || 'PENDING',
                    startedAt: new Date(),
                },
                include: {
                    workflow: {
                        select: {
                            id: true,
                            title: true,
                        },
                    },
                    user: {
                        select: {
                            id: true,
                            username: true,
                        },
                    },
                },
            });
            logger_js_1.logger.info(`Created execution: ${execution.id} for workflow: ${data.workflowId}`);
            return execution;
        }
        catch (error) {
            logger_js_1.logger.error('Failed to create execution:', error);
            throw error;
        }
    }
    static async getExecutions(filters) {
        try {
            const where = {};
            if (filters?.workflowId) {
                where.workflowId = filters.workflowId;
            }
            if (filters?.userId) {
                where.userId = filters.userId;
            }
            if (filters?.status) {
                where.status = filters.status;
            }
            const executions = await index_js_1.prisma.workflowExecution.findMany({
                where,
                include: {
                    workflow: {
                        select: {
                            id: true,
                            title: true,
                        },
                    },
                    user: {
                        select: {
                            id: true,
                            username: true,
                        },
                    },
                    agents: {
                        include: {
                            agent: {
                                select: {
                                    id: true,
                                    name: true,
                                    type: true,
                                },
                            },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: filters?.limit || 50,
                skip: filters?.offset || 0,
            });
            return executions;
        }
        catch (error) {
            logger_js_1.logger.error('Failed to get executions:', error);
            throw error;
        }
    }
    static async updateExecution(id, data) {
        try {
            const updateData = {
                ...data,
                updatedAt: new Date(),
            };
            if (data.status && ['COMPLETED', 'FAILED'].includes(data.status) && !data.completedAt) {
                updateData.completedAt = new Date();
            }
            const execution = await index_js_1.prisma.workflowExecution.update({
                where: { id },
                data: updateData,
                include: {
                    workflow: {
                        select: {
                            id: true,
                            title: true,
                        },
                    },
                    user: {
                        select: {
                            id: true,
                            username: true,
                        },
                    },
                },
            });
            logger_js_1.logger.info(`Updated execution: ${id} to status: ${data.status}`);
            return execution;
        }
        catch (error) {
            logger_js_1.logger.error('Failed to update execution:', error);
            throw error;
        }
    }
    static async getAgents(filters) {
        try {
            const where = {};
            if (filters?.userId) {
                where.userId = filters.userId;
            }
            if (filters?.type) {
                where.type = filters.type;
            }
            if (filters?.isActive !== undefined) {
                where.isAvailable = filters.isActive;
            }
            const agents = await index_js_1.prisma.agent.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                        },
                    },
                    _count: {
                        select: {
                            executions: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });
            return agents;
        }
        catch (error) {
            logger_js_1.logger.error('Failed to get agents:', error);
            throw error;
        }
    }
    static async updateAgent(id, data) {
        try {
            const agent = await index_js_1.prisma.agent.update({
                where: { id },
                data: {
                    ...data,
                    updatedAt: new Date(),
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                        },
                    },
                },
            });
            logger_js_1.logger.info(`Updated agent: ${id}`);
            return agent;
        }
        catch (error) {
            logger_js_1.logger.error('Failed to update agent:', error);
            throw error;
        }
    }
    static async search(query, filters) {
        try {
            const results = [];
            const limit = filters?.limit || 20;
            if (filters?.type !== 'execution') {
                const workflows = await index_js_1.prisma.workflow.findMany({
                    where: {
                        OR: [
                            { title: { contains: query, mode: 'insensitive' } },
                            { description: { contains: query, mode: 'insensitive' } },
                        ],
                        ...(filters?.userId && { userId: filters.userId }),
                    },
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                            },
                        },
                    },
                    take: limit / 2,
                });
                results.push(...workflows.map(w => ({ ...w, type: 'workflow' })));
            }
            if (filters?.type !== 'workflow') {
                const executions = await index_js_1.prisma.workflowExecution.findMany({
                    where: {
                        OR: [
                            { workflow: { title: { contains: query, mode: 'insensitive' } } },
                            { input: { path: ['$[*]', { contains: query, mode: 'insensitive' }] } },
                        ],
                        ...(filters?.userId && { userId: filters.userId }),
                    },
                    include: {
                        workflow: {
                            select: {
                                id: true,
                                title: true,
                            },
                        },
                        user: {
                            select: {
                                id: true,
                                username: true,
                            },
                        },
                    },
                    take: limit / 2,
                });
                results.push(...executions.map(e => ({ ...e, type: 'execution' })));
            }
            return results.slice(0, limit);
        }
        catch (error) {
            logger_js_1.logger.error('Failed to search:', error);
            throw error;
        }
    }
    static async getStatistics(userId) {
        try {
            const where = {};
            if (userId) {
                where.userId = userId;
            }
            const [totalWorkflows, totalExecutions, completedExecutions, failedExecutions, activeAgents,] = await Promise.all([
                index_js_1.prisma.workflow.count({ where }),
                index_js_1.prisma.workflowExecution.count({ where }),
                index_js_1.prisma.workflowExecution.count({
                    where: {
                        ...where,
                        status: 'COMPLETED'
                    }
                }),
                index_js_1.prisma.workflowExecution.count({
                    where: {
                        ...where,
                        status: 'FAILED'
                    }
                }),
                index_js_1.prisma.agent.count({
                    where: {
                        ...where,
                        isAvailable: true
                    }
                }),
            ]);
            const successRate = totalExecutions > 0
                ? (completedExecutions / totalExecutions) * 100
                : 0;
            return {
                totalWorkflows,
                totalExecutions,
                completedExecutions,
                failedExecutions,
                successRate: Math.round(successRate * 100) / 100,
                activeAgents,
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            logger_js_1.logger.error('Failed to get statistics:', error);
            throw error;
        }
    }
}
exports.DatabaseService = DatabaseService;
//# sourceMappingURL=service.js.map