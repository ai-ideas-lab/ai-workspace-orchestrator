import { PrismaClient } from '@prisma/client';
import { AIEngineService } from './ai-engine';
import { v4 as uuidv4 } from 'uuid';
export class WorkflowService {
    prisma;
    aiEngine;
    constructor() {
        this.prisma = new PrismaClient();
        this.aiEngine = new AIEngineService();
    }
    async createWorkflow(data) {
        return this.prisma.workflow.create({
            data: {
                name: data.name,
                description: data.description,
                config: data.config,
                userId: data.userId,
                teamId: data.teamId,
                status: 'DRAFT',
            },
        });
    }
    async executeWorkflow(workflowId, input = {}) {
        const workflow = await this.prisma.workflow.findUnique({
            where: { id: workflowId },
            include: {
                steps: true,
            },
        });
        if (!workflow) {
            throw new Error(`Workflow ${workflowId} not found`);
        }
        const executionId = uuidv4();
        const execution = await this.prisma.execution.create({
            data: {
                id: executionId,
                workflowId,
                status: 'PENDING',
                input,
            },
        });
        const context = {
            workflowId,
            executionId,
            input,
            context: workflow.config.context || {},
            results: new Map(),
        };
        try {
            await this.executeWorkflowSteps(workflow.config.steps, context);
            await this.prisma.execution.update({
                where: { id: executionId },
                data: {
                    status: 'COMPLETED',
                    output: Object.fromEntries(context.results),
                    endTime: new Date(),
                    duration: Date.now() - context.createdAt,
                },
            });
            return {
                executionId,
                status: 'COMPLETED',
                results: Object.fromEntries(context.results),
            };
        }
        catch (error) {
            await this.prisma.execution.update({
                where: { id: executionId },
                data: {
                    status: 'FAILED',
                    error: error instanceof Error ? error.message : 'Unknown error',
                    endTime: new Date(),
                },
            });
            throw error;
        }
    }
    async executeWorkflowSteps(steps, context) {
        const stepExecutionPromises = steps.map(async (step, index) => {
            const stepStartTime = Date.now();
            try {
                const executionStep = await this.prisma.executionStep.create({
                    data: {
                        executionId: context.executionId,
                        agentId: step.id,
                        stepNumber: index + 1,
                        status: 'RUNNING',
                        input: step.config,
                    },
                });
                const aiResponse = await this.aiEngine.executeWorkflowStep(step.type, step.config, {
                    ...context.context,
                    input: context.input,
                    previousResults: Object.fromEntries(context.results),
                });
                await this.prisma.executionStep.update({
                    where: { id: executionStep.id },
                    data: {
                        status: 'COMPLETED',
                        output: aiResponse,
                        endTime: new Date(),
                        duration: Date.now() - stepStartTime,
                    },
                });
                context.results.set(step.id, aiResponse);
                if (step.nextSteps && step.nextSteps.length > 0) {
                    const nextSteps = steps.filter(s => step.nextSteps.includes(s.id));
                    await this.executeWorkflowSteps(nextSteps, context);
                }
            }
            catch (error) {
                await this.prisma.executionStep.update({
                    where: {
                        id: (await this.prisma.executionStep.findFirst({
                            where: { executionId: context.executionId, stepNumber: index + 1 }
                        }))?.id || ''
                    },
                    data: {
                        status: 'FAILED',
                        error: error instanceof Error ? error.message : 'Unknown error',
                        endTime: new Date(),
                    },
                });
                throw error;
            }
        });
        await Promise.all(stepExecutionPromises);
    }
    async getWorkflowHistory(workflowId, limit = 10) {
        return this.prisma.execution.findMany({
            where: { workflowId },
            include: {
                steps: {
                    orderBy: { stepNumber: 'asc' },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }
    async getExecutionDetails(executionId) {
        return this.prisma.execution.findUnique({
            where: { id: executionId },
            include: {
                steps: {
                    orderBy: { stepNumber: 'asc' },
                },
                workflow: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        config: true,
                    },
                },
            },
        });
    }
    async getAvailableEngines() {
        return this.aiEngine.getAvailableEngines();
    }
    async createWorkflowTemplate(data) {
        return this.prisma.workflowTemplate.create({
            data,
        });
    }
    async getWorkflowTemplates(category, isPublic = true) {
        const where = { isPublic };
        if (category) {
            where.category = category;
        }
        return this.prisma.workflowTemplate.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });
    }
}
//# sourceMappingURL=workflow.js.map