import { PrismaClient } from '@prisma/client';
export class PostgresDatabaseService {
    static instance;
    prisma;
    isInitialized = false;
    constructor() {
        this.prisma = new PrismaClient({
            log: ['query', 'info', 'warn', 'error'],
        });
    }
    static getInstance() {
        if (!PostgresDatabaseService.instance) {
            PostgresDatabaseService.instance = new PostgresDatabaseService();
        }
        return PostgresDatabaseService.instance;
    }
    async initialize() {
        if (this.isInitialized)
            return;
        try {
            await this.prisma.$connect();
            console.log('✅ Connected to PostgreSQL database successfully');
            await this.testConnection();
            this.isInitialized = true;
        }
        catch (error) {
            console.error('❌ Failed to initialize PostgreSQL database:', error);
            throw error;
        }
    }
    async testConnection() {
        try {
            await this.prisma.$queryRaw `SELECT 1`;
            console.log('✅ PostgreSQL connection test successful');
        }
        catch (error) {
            console.error('❌ PostgreSQL connection test failed:', error);
            throw error;
        }
    }
    async createWorkflowExecution(data) {
        try {
            const execution = await this.prisma.workflowExecution.create({
                data: {
                    workflow_id: data.workflowId,
                    user_id: data.userId,
                    trigger_data: data.triggerData ? JSON.stringify(data.triggerData) : null,
                    status: data.status,
                    started_at: new Date(),
                },
            });
            return {
                id: execution.id,
                workflowId: execution.workflow_id,
                userId: execution.user_id,
                status: execution.status,
                triggerData: execution.trigger_data ? JSON.parse(execution.trigger_data) : null,
                startedAt: execution.started_at,
                createdAt: execution.created_at,
            };
        }
        catch (error) {
            console.error('Error creating workflow execution:', error);
            throw new Error(`Failed to create workflow execution: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async updateWorkflowExecution(executionId, updateData) {
        try {
            const updatePayload = {
                status: updateData.status,
                completed_at: updateData.status !== 'running' ? new Date() : null,
                execution_time_ms: updateData.executionTimeMs,
                error_message: updateData.errorMessage,
            };
            if (updateData.result !== undefined) {
                updatePayload.result = JSON.stringify(updateData.result);
            }
            const execution = await this.prisma.workflowExecution.update({
                where: { id: executionId },
                data: updatePayload,
            });
            return {
                id: execution.id,
                workflowId: execution.workflow_id,
                userId: execution.user_id,
                status: execution.status,
                result: execution.result ? JSON.parse(execution.result) : null,
                errorMessage: execution.error_message,
                executionTimeMs: execution.execution_time_ms,
                startedAt: execution.started_at,
                completedAt: execution.completed_at,
                createdAt: execution.created_at,
            };
        }
        catch (error) {
            console.error('Error updating workflow execution:', error);
            throw new Error(`Failed to update workflow execution: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getWorkflowExecutionWithHistory(executionId) {
        try {
            const execution = await this.prisma.workflowExecution.findUnique({
                where: { id: executionId },
                include: {
                    workflow: true,
                    user: {
                        select: {
                            id: true,
                            username: true,
                            email: true,
                            role: true,
                        },
                    },
                    stepExecutionHistory: {
                        orderBy: { sequence_order: 'asc' },
                        include: {
                            step: {
                                include: {
                                    engine: true,
                                },
                            },
                        },
                    },
                },
            });
            if (!execution) {
                return null;
            }
            return {
                id: execution.id,
                workflowId: execution.workflow_id,
                userId: execution.user_id,
                workflowName: execution.workflow?.name,
                username: execution.user?.username,
                status: execution.status,
                triggerData: execution.trigger_data ? JSON.parse(execution.trigger_data) : null,
                result: execution.result ? JSON.parse(execution.result) : null,
                errorMessage: execution.error_message,
                executionTimeMs: execution.execution_time_ms,
                startedAt: execution.started_at,
                completedAt: execution.completed_at,
                createdAt: execution.created_at,
                steps: execution.stepExecutionHistory.map(step => ({
                    id: step.id,
                    stepId: step.step_id,
                    stepName: step.step?.name,
                    engineName: step.step?.engine?.name,
                    engineType: step.step?.engine?.type,
                    status: step.status,
                    inputData: step.input_data ? JSON.parse(step.input_data) : null,
                    outputData: step.output_data ? JSON.parse(step.output_data) : null,
                    errorMessage: step.error_message,
                    startTime: step.start_time,
                    endTime: step.end_time,
                    durationMs: step.duration_ms,
                })),
            };
        }
        catch (error) {
            console.error('Error getting workflow execution with history:', error);
            throw new Error(`Failed to get workflow execution: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getWorkflowExecutions(params) {
        try {
            const { userId, workflowId, status, limit = 50, offset = 0, sortBy = 'created_at', sortOrder = 'desc', } = params;
            const where = {};
            if (userId)
                where.user_id = userId;
            if (workflowId)
                where.workflow_id = workflowId;
            if (status)
                where.status = status;
            const [executions, totalCount] = await Promise.all([
                this.prisma.workflowExecution.findMany({
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
                this.prisma.workflowExecution.count({ where }),
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
                executions: formattedExecutions,
                total: totalCount,
                hasMore: offset + limit < totalCount,
                limit,
                offset,
            };
        }
        catch (error) {
            console.error('Error getting workflow executions:', error);
            throw new Error(`Failed to get workflow executions: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async createStepExecution(data) {
        try {
            const stepExecution = await this.prisma.stepExecutionHistory.create({
                data: {
                    execution_id: data.executionId,
                    step_id: data.stepId,
                    status: data.status,
                    input_data: data.inputData ? JSON.stringify(data.inputData) : null,
                    output_data: data.outputData ? JSON.stringify(data.outputData) : null,
                    error_message: data.errorMessage,
                    duration_ms: data.durationMs,
                    start_time: data.status !== 'running' ? new Date() : null,
                    end_time: data.status !== 'running' ? new Date() : null,
                },
            });
            return {
                id: stepExecution.id,
                executionId: stepExecution.execution_id,
                stepId: stepExecution.step_id,
                status: stepExecution.status,
                inputData: stepExecution.input_data ? JSON.parse(stepExecution.input_data) : null,
                outputData: stepExecution.output_data ? JSON.parse(stepExecution.output_data) : null,
                errorMessage: stepExecution.error_message,
                durationMs: stepExecution.duration_ms,
                startTime: stepExecution.start_time,
                endTime: stepExecution.end_time,
                createdAt: stepExecution.created_at,
            };
        }
        catch (error) {
            console.error('Error creating step execution:', error);
            throw new Error(`Failed to create step execution: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async healthCheck() {
        const startTime = Date.now();
        try {
            await this.prisma.$queryRaw `SELECT 1`;
            const latency = Date.now() - startTime;
            const versionResult = await this.prisma.$queryRaw `SELECT version()`;
            const version = versionResult[0]?.version || 'Unknown';
            return {
                status: 'healthy',
                connected: true,
                latency,
                database: 'PostgreSQL',
                version,
            };
        }
        catch (error) {
            const latency = Date.now() - startTime;
            return {
                status: 'unhealthy',
                connected: false,
                latency,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    async disconnect() {
        try {
            await this.prisma.$disconnect();
            console.log('✅ Disconnected from PostgreSQL database');
        }
        catch (error) {
            console.error('❌ Error disconnecting from database:', error);
            throw error;
        }
    }
    async seedInitialData() {
        try {
            const existingEngine = await this.prisma.aIEngine.findFirst({
                where: { name: 'Default GPT-4 Engine' }
            });
            if (!existingEngine) {
                await this.prisma.aIEngine.create({
                    data: {
                        name: 'Default GPT-4 Engine',
                        type: 'text-generation',
                        endpoint: 'https://api.openai.com/v1/chat/completions',
                        capabilities: JSON.stringify(['text-generation', 'code-analysis', 'translation']),
                        status: 'active',
                    },
                });
                console.log('✅ Default AI engine created');
            }
            const existingUser = await this.prisma.user.findFirst({
                where: { username: 'admin' }
            });
            if (!existingUser) {
                const bcrypt = require('bcryptjs');
                const hashedPassword = await bcrypt.hash('admin123', 12);
                await this.prisma.user.create({
                    data: {
                        username: 'admin',
                        email: 'admin@example.com',
                        password_hash: hashedPassword,
                        role: 'admin',
                    },
                });
                console.log('✅ Default admin user created');
            }
            console.log('✅ Database seeded successfully');
        }
        catch (error) {
            console.error('❌ Error seeding database:', error);
            throw error;
        }
    }
    async getUserByEmail(email) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { email }
            });
            if (!user) {
                return null;
            }
            return {
                id: user.id,
                username: user.username,
                email: user.email,
                password: user.password_hash,
                role: user.role,
                created_at: user.created_at.toISOString(),
                updated_at: user.updated_at.toISOString(),
            };
        }
        catch (error) {
            console.error('Error getting user by email:', error);
            throw new Error(`Failed to get user by email: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async createUser(userData) {
        try {
            const user = await this.prisma.user.create({
                data: {
                    username: userData.username,
                    email: userData.email,
                    password_hash: userData.password_hash,
                    role: userData.role || 'user',
                }
            });
            return {
                id: user.id,
                username: user.username,
                email: user.email,
                password_hash: user.password_hash,
                role: user.role,
                created_at: user.created_at.toISOString(),
                updated_at: user.updated_at.toISOString(),
            };
        }
        catch (error) {
            console.error('Error creating user:', error);
            throw new Error(`Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getUserById(id) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id }
            });
            if (!user) {
                return null;
            }
            return {
                id: user.id,
                username: user.username,
                email: user.email,
                password_hash: user.password_hash,
                role: user.role,
                created_at: user.created_at.toISOString(),
                updated_at: user.updated_at.toISOString(),
            };
        }
        catch (error) {
            console.error('Error getting user by id:', error);
            throw new Error(`Failed to get user by id: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    getPrisma() {
        return this.prisma;
    }
}
export const postgresDb = PostgresDatabaseService.getInstance();
//# sourceMappingURL=postgres-database-service.js.map