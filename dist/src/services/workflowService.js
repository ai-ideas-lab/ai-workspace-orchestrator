import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
const prisma = new PrismaClient();
export class WorkflowService {
    async createWorkflow(data) {
        try {
            const workflow = await prisma.workflow.create({
                data: {
                    id: uuidv4(),
                    name: data.name,
                    description: data.description,
                    config: data.config || {},
                    status: data.status || 'DRAFT',
                },
                include: {
                    steps: true,
                    executions: {
                        orderBy: { createdAt: 'desc' },
                        take: 5,
                    },
                },
            });
            console.log(`✅ Created workflow: ${workflow.name} (${workflow.id})`);
            return workflow;
        }
        catch (error) {
            console.error('❌ Error creating workflow:', error);
            throw new Error(`Failed to create workflow: ${error.message}`);
        }
    }
    async getWorkflows() {
        try {
            const workflows = await prisma.workflow.findMany({
                include: {
                    steps: {
                        orderBy: { order: 'asc' },
                    },
                    executions: {
                        orderBy: { createdAt: 'desc' },
                        take: 3,
                    },
                    _count: {
                        select: {
                            executions: true,
                            steps: true,
                        },
                    },
                },
                orderBy: { updatedAt: 'desc' },
            });
            console.log(`📋 Retrieved ${workflows.length} workflows`);
            return workflows;
        }
        catch (error) {
            console.error('❌ Error getting workflows:', error);
            throw new Error(`Failed to get workflows: ${error.message}`);
        }
    }
    async getWorkflow(id) {
        try {
            const workflow = await prisma.workflow.findUnique({
                where: { id },
                include: {
                    steps: {
                        orderBy: { order: 'asc' },
                    },
                    executions: {
                        orderBy: { createdAt: 'desc' },
                        take: 10,
                    },
                },
            });
            if (!workflow) {
                throw new Error(`Workflow not found: ${id}`);
            }
            console.log(`🔍 Retrieved workflow: ${workflow.name}`);
            return workflow;
        }
        catch (error) {
            console.error('❌ Error getting workflow:', error);
            throw new Error(`Failed to get workflow: ${error.message}`);
        }
    }
    async updateWorkflow(id, data) {
        try {
            const workflow = await prisma.workflow.update({
                where: { id },
                data: {
                    ...(data.name && { name: data.name }),
                    ...(data.description && { description: data.description }),
                    ...(data.config !== undefined && { config: data.config }),
                    ...(data.status && { status: data.status }),
                    updatedAt: new Date(),
                },
                include: {
                    steps: {
                        orderBy: { order: 'asc' },
                    },
                },
            });
            console.log(`📝 Updated workflow: ${workflow.name}`);
            return workflow;
        }
        catch (error) {
            console.error('❌ Error updating workflow:', error);
            throw new Error(`Failed to update workflow: ${error.message}`);
        }
    }
    async deleteWorkflow(id) {
        try {
            await prisma.workflow.delete({
                where: { id },
            });
            console.log(`🗑️ Deleted workflow: ${id}`);
            return { success: true, id };
        }
        catch (error) {
            console.error('❌ Error deleting workflow:', error);
            throw new Error(`Failed to delete workflow: ${error.message}`);
        }
    }
    async executeWorkflow(id, options = {}) {
        try {
            const workflow = await this.getWorkflow(id);
            const execution = await prisma.execution.create({
                data: {
                    id: uuidv4(),
                    workflowId: id,
                    status: 'PENDING',
                    startTime: new Date(),
                    metadata: options.metadata || {},
                    triggeredBy: options.triggeredBy || 'api',
                },
                include: {
                    workflow: {
                        include: {
                            steps: {
                                orderBy: { order: 'asc' },
                            },
                        },
                    },
                },
            });
            console.log(`🚀 Started execution: ${execution.id} for workflow: ${workflow.name}`);
            return {
                ...execution,
                message: 'Execution started. Check execution status for updates.',
            };
        }
        catch (error) {
            console.error('❌ Error executing workflow:', error);
            throw new Error(`Failed to execute workflow: ${error.message}`);
        }
    }
    async getExecution(id) {
        try {
            const execution = await prisma.execution.findUnique({
                where: { id },
                include: {
                    workflow: {
                        include: {
                            steps: {
                                orderBy: { order: 'asc' },
                            },
                        },
                    },
                    executionSteps: {
                        orderBy: { order: 'asc' },
                    },
                },
            });
            if (!execution) {
                throw new Error(`Execution not found: ${id}`);
            }
            console.log(`🔍 Retrieved execution: ${execution.id} (${execution.status})`);
            return execution;
        }
        catch (error) {
            console.error('❌ Error getting execution:', error);
            throw new Error(`Failed to get execution: ${error.message}`);
        }
    }
    async getExecutions(limit = 50, offset = 0) {
        try {
            const executions = await prisma.execution.findMany({
                include: {
                    workflow: {
                        select: {
                            id: true,
                            name: true,
                            description: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset,
            });
            console.log(`📋 Retrieved ${executions.length} executions`);
            return executions;
        }
        catch (error) {
            console.error('❌ Error getting executions:', error);
            throw new Error(`Failed to get executions: ${error.message}`);
        }
    }
    async updateExecutionStatus(id, status) {
        try {
            const execution = await prisma.execution.update({
                where: { id },
                data: {
                    status,
                    ...(status === 'RUNNING' && { startTime: new Date() }),
                    ...(status === 'COMPLETED' && { endTime: new Date() }),
                    updatedAt: new Date(),
                },
            });
            console.log(`📊 Updated execution ${id} status to: ${status}`);
            return execution;
        }
        catch (error) {
            console.error('❌ Error updating execution status:', error);
            throw new Error(`Failed to update execution status: ${error.message}`);
        }
    }
    async addStepToWorkflow(workflowId, stepData) {
        try {
            const step = await prisma.workflowStep.create({
                data: {
                    id: uuidv4(),
                    workflowId,
                    name: stepData.name,
                    type: stepData.type,
                    config: stepData.config || {},
                    order: stepData.order,
                    dependencies: stepData.dependencies || [],
                },
            });
            console.log(`➕ Added step to workflow: ${step.name}`);
            return step;
        }
        catch (error) {
            console.error('❌ Error adding step to workflow:', error);
            throw new Error(`Failed to add step to workflow: ${error.message}`);
        }
    }
    async getWorkflowStats() {
        try {
            const [totalWorkflows, totalExecutions, recentExecutions, successCount] = await Promise.all([
                prisma.workflow.count(),
                prisma.execution.count(),
                prisma.execution.count({
                    where: {
                        createdAt: {
                            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
                        },
                    },
                }),
                prisma.execution.count({
                    where: {
                        status: 'COMPLETED',
                    },
                }),
            ]);
            const successRate = totalExecutions > 0 ? (successCount / totalExecutions) * 100 : 0;
            return {
                totalWorkflows,
                totalExecutions,
                recentExecutions,
                successRate,
                successCount,
                failureCount: totalExecutions - successCount,
            };
        }
        catch (error) {
            console.error('❌ Error getting workflow stats:', error);
            throw new Error(`Failed to get workflow stats: ${error.message}`);
        }
    }
}
export const workflowService = new WorkflowService();
//# sourceMappingURL=workflowService.js.map