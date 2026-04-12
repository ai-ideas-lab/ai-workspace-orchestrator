"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseManager = exports.DatabaseManager = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
class DatabaseManager {
    constructor() {
        this.isInitialized = false;
        this.prisma = new client_1.PrismaClient({
            log: ['query', 'info', 'warn', 'error'],
        });
    }
    static getInstance() {
        if (!DatabaseManager.instance) {
            DatabaseManager.instance = new DatabaseManager();
        }
        return DatabaseManager.instance;
    }
    async initialize() {
        if (this.isInitialized)
            return;
        try {
            console.log('🗃️ 正在初始化PostgreSQL数据库连接...');
            await this.prisma.$connect();
            const health = await this.healthCheck();
            if (!health.connected) {
                throw new Error(`数据库连接失败: ${health.error}`);
            }
            console.log('✅ PostgreSQL数据库连接成功');
            this.isInitialized = true;
            await this.seedInitialData();
        }
        catch (error) {
            console.error('❌ 数据库初始化失败:', error);
            throw error;
        }
    }
    async healthCheck() {
        const startTime = Date.now();
        try {
            const result = await this.prisma.$queryRaw `SELECT 1`;
            const latency = Date.now() - startTime;
            return {
                connected: true,
                latency,
                databaseType: 'postgresql',
            };
        }
        catch (error) {
            const latency = Date.now() - startTime;
            return {
                connected: false,
                latency,
                error: error instanceof Error ? error.message : 'Unknown error',
                databaseType: 'postgresql',
            };
        }
    }
    async loadEnginesFromDatabase() {
        try {
            const engines = await this.prisma.aIEngine.findMany({
                where: { status: 'active' },
                orderBy: { createdAt: 'desc' }
            });
            return engines.map(engine => ({
                id: engine.id,
                name: engine.name,
                type: engine.type,
                endpoint: engine.endpoint,
                capabilities: engine.capabilities,
                status: engine.status,
                load: engine.load || 0,
                config: engine.config,
                createdAt: engine.createdAt,
                updatedAt: engine.updatedAt
            }));
        }
        catch (error) {
            logger_1.logger.error('加载AI引擎配置失败:', error);
            return [];
        }
    }
    async recordWorkflowExecution(data) {
        try {
            const execution = await this.prisma.workflowExecution.create({
                data: {
                    workflowId: data.workflow_id,
                    userId: data.user_id,
                    status: 'RUNNING',
                    triggerData: data.trigger_data || {},
                    startTime: new Date(),
                }
            });
            logger_1.logger.info(`工作流执行记录创建成功: ${execution.id}`);
            return execution.id;
        }
        catch (error) {
            logger_1.logger.error('记录工作流执行失败:', error);
            throw error;
        }
    }
    async updateWorkflowExecution(executionId, status, result, errorMessage) {
        try {
            const updateData = {
                status: status.toUpperCase(),
                updatedAt: new Date(),
            };
            if (status === 'COMPLETED' || status === 'FAILED') {
                updateData.endTime = new Date();
                const execution = await this.prisma.workflowExecution.findUnique({
                    where: { id: executionId }
                });
                if (execution?.startTime) {
                    const duration = new Date().getTime() - execution.startTime.getTime();
                    updateData.executionTimeMs = duration;
                }
            }
            if (result) {
                updateData.result = result;
            }
            if (errorMessage) {
                updateData.errorMessage = errorMessage;
            }
            await this.prisma.workflowExecution.update({
                where: { id: executionId },
                data: updateData
            });
            logger_1.logger.info(`工作流执行状态更新成功: ${executionId} -> ${status}`);
        }
        catch (error) {
            logger_1.logger.error('更新工作流执行状态失败:', error);
            throw error;
        }
    }
    async recordStepExecution(data) {
        try {
            const history = await this.prisma.workflowExecutionHistory.create({
                data: {
                    workflowId: data.execution_id,
                    stepId: data.step_id,
                    status: data.status.toUpperCase(),
                    inputData: data.input_data || {},
                    startTime: new Date(),
                }
            });
            logger_1.logger.info(`步骤执行历史记录创建成功: ${history.id}`);
            return history.id;
        }
        catch (error) {
            logger_1.logger.error('记录步骤执行历史失败:', error);
            throw error;
        }
    }
    async updateStepExecution(historyId, status, output_data, errorMessage) {
        try {
            const updateData = {
                status: status.toUpperCase(),
                endTime: new Date(),
            };
            if (output_data) {
                updateData.outputData = output_data;
            }
            if (errorMessage) {
                updateData.errorMessage = errorMessage;
            }
            const history = await this.prisma.workflowExecutionHistory.findUnique({
                where: { id: historyId }
            });
            if (history?.startTime) {
                const duration = new Date().getTime() - history.startTime.getTime();
                updateData.durationMs = duration;
            }
            await this.prisma.workflowExecutionHistory.update({
                where: { id: historyId },
                data: updateData
            });
            logger_1.logger.info(`步骤执行历史更新成功: ${historyId} -> ${status}`);
        }
        catch (error) {
            logger_1.logger.error('更新步骤执行历史失败:', error);
            throw error;
        }
    }
    async getWorkflowStats() {
        try {
            const [total, success, failed, avgTime] = await Promise.all([
                this.prisma.workflowExecution.count(),
                this.prisma.workflowExecution.count({
                    where: { status: 'COMPLETED' }
                }),
                this.prisma.workflowExecution.count({
                    where: { status: 'FAILED' }
                }),
                this.prisma.workflowExecution.aggregate({
                    _avg: { executionTimeMs: true }
                })
            ]);
            const successRate = total > 0 ? (success / total) * 100 : 0;
            return {
                total,
                success,
                failed,
                success_rate: successRate,
                average_execution_time: avgTime._avg?.executionTimeMs || 0
            };
        }
        catch (error) {
            logger_1.logger.error('获取工作流统计失败:', error);
            return {
                total: 0,
                success: 0,
                failed: 0,
                success_rate: 0,
                average_execution_time: 0
            };
        }
    }
    async getRecentExecutions(limit = 10) {
        try {
            const executions = await this.prisma.workflowExecution.findMany({
                orderBy: { startTime: 'desc' },
                take: limit,
                include: {
                    workflow: {
                        select: {
                            id: true,
                            name: true,
                            description: true,
                        }
                    }
                }
            });
            return executions.map(execution => ({
                id: execution.id,
                workflowId: execution.workflowId,
                workflowName: execution.workflow?.name,
                status: execution.status,
                startTime: execution.startTime,
                endTime: execution.endTime,
                duration: execution.executionTimeMs,
                triggerData: execution.triggerData,
                result: execution.result
            }));
        }
        catch (error) {
            logger_1.logger.error('获取最近执行记录失败:', error);
            return [];
        }
    }
    async getSystemStats() {
        try {
            const [workflows, executions, recent, health] = await Promise.all([
                this.prisma.workflow.count(),
                this.prisma.workflowExecution.count(),
                this.prisma.workflowExecution.count({
                    where: {
                        startedAt: {
                            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
                        }
                    }
                }),
                this.healthCheck()
            ]);
            return {
                totalWorkflows: workflows,
                totalExecutions: executions,
                recentExecutions: recent,
                isConnected: health.connected,
                databaseType: health.databaseType || 'postgresql'
            };
        }
        catch (error) {
            logger_1.logger.error('获取系统统计失败:', error);
            return {
                totalWorkflows: 0,
                totalExecutions: 0,
                recentExecutions: 0,
                isConnected: false,
                databaseType: 'postgresql'
            };
        }
    }
    async createAIEngine(data) {
        try {
            const engine = await this.prisma.aIEngine.create({
                data: {
                    name: data.name,
                    type: data.type,
                    endpoint: data.endpoint,
                    capabilities: data.capabilities,
                    config: data.config,
                    status: 'active',
                    load: 0,
                }
            });
            logger_1.logger.info(`AI引擎创建成功: ${engine.id}`);
            return engine.id;
        }
        catch (error) {
            logger_1.logger.error('创建AI引擎失败:', error);
            throw error;
        }
    }
    async updateEngineLoad(engineId, load) {
        try {
            await this.prisma.aIEngine.update({
                where: { id: engineId },
                data: { load: Math.max(0, Math.min(1, load)) }
            });
            logger_1.logger.info(`AI引擎负载更新成功: ${engineId} -> ${load}`);
        }
        catch (error) {
            logger_1.logger.error('更新AI引擎负载失败:', error);
            throw error;
        }
    }
    async seedInitialData() {
        try {
            const engineCount = await this.prisma.aIEngine.count();
            if (engineCount === 0) {
                console.log('🌱 创建初始AI引擎配置...');
                const defaultEngines = [
                    {
                        name: 'OpenAI GPT-4',
                        type: 'text-generation',
                        endpoint: 'https://api.openai.com/v1/chat/completions',
                        capabilities: ['text-generation', 'code-analysis', 'document-processing'],
                        config: {
                            model: 'gpt-4-turbo',
                            maxTokens: 4000,
                            temperature: 0.7
                        }
                    },
                    {
                        name: 'Anthropic Claude',
                        type: 'text-generation',
                        endpoint: 'https://api.anthropic.com/v1/messages',
                        capabilities: ['text-generation', 'reasoning', 'analysis'],
                        config: {
                            model: 'claude-3-sonnet',
                            maxTokens: 4000,
                            temperature: 0.7
                        }
                    },
                    {
                        name: 'Google Gemini',
                        type: 'text-generation',
                        endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
                        capabilities: ['text-generation', 'multilingual', 'creative'],
                        config: {
                            model: 'gemini-pro',
                            maxTokens: 4000,
                            temperature: 0.7
                        }
                    }
                ];
                for (const engine of defaultEngines) {
                    await this.createAIEngine(engine);
                }
            }
            const workflowCount = await this.prisma.workflow.count();
            if (workflowCount === 0) {
                console.log('🌱 创建示例工作流...');
                await this.prisma.workflow.createMany({
                    data: [
                        {
                            name: '市场分析报告生成',
                            description: '使用AI分析市场数据并生成综合报告',
                            config: {
                                aiProvider: 'openai',
                                model: 'gpt-4',
                                analysisDepth: 'comprehensive'
                            },
                            status: 'PUBLISHED'
                        },
                        {
                            name: '代码审查与优化',
                            description: '自动审查代码质量并提供优化建议',
                            config: {
                                aiProvider: 'anthropic',
                                model: 'claude-3',
                                focusAreas: ['performance', 'security', 'readability']
                            },
                            status: 'PUBLISHED'
                        },
                        {
                            name: '客户反馈分析',
                            description: '分析客户反馈并提取关键洞察',
                            config: {
                                aiProvider: 'google',
                                model: 'gemini-pro',
                                analysisType: 'sentiment',
                                categories: ['product', 'service', 'pricing']
                            },
                            status: 'DRAFT'
                        }
                    ]
                });
            }
            console.log('✅ 初始数据创建完成');
        }
        catch (error) {
            console.error('创建初始数据失败:', error);
            throw error;
        }
    }
    async disconnect() {
        try {
            await this.prisma.$disconnect();
            console.log('✅ PostgreSQL数据库连接已关闭');
        }
        catch (error) {
            console.error('关闭数据库连接失败:', error);
            throw error;
        }
    }
    async $queryRaw(sql, ...params) {
        return this.prisma.$queryRaw({ sql, params });
    }
    getPrisma() {
        return this.prisma;
    }
}
exports.DatabaseManager = DatabaseManager;
exports.databaseManager = DatabaseManager.getInstance();
//# sourceMappingURL=database-manager.js.map