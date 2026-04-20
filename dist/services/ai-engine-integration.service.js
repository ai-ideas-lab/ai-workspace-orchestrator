"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiEngineIntegrationService = exports.AIEngineIntegrationService = void 0;
const postgres_database_service_1 = require("../services/postgres-database-service");
const openai_engine_1 = require("../services/openai-engine");
const claude_engine_1 = require("../services/claude-engine");
const database_integration_service_1 = require("./database-integration.service");
const logger_1 = require("../utils/logger");
class AIEngineIntegrationService {
    constructor() {
        this.initializedEngines = new Map();
        this.engineConfigs = new Map();
        this.isInitialized = false;
        this.postgresDb = postgres_database_service_1.PostgresDatabaseService.getInstance();
    }
    async initializeAIEngineIntegration() {
        if (this.isInitialized)
            return;
        try {
            logger_1.logger.info('🤖 初始化AI引擎集成...');
            await database_integration_service_1.databaseIntegrationService.initializePostgreSQLIntegration();
            await this.loadEngineConfigsFromDatabase();
            await this.initializeActiveEngines();
            this.startEngineHealthChecks();
            this.isInitialized = true;
            logger_1.logger.info('✅ AI引擎集成完成');
        }
        catch (error) {
            logger_1.logger.error('❌ AI引擎集成失败:', error);
            throw new Error(`AI引擎集成失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }
    async loadEngineConfigsFromDatabase() {
        try {
            const engines = await this.postgresDb.getPrisma().aIEngine.findMany({
                where: { status: 'active' }
            });
            for (const engine of engines) {
                const config = {
                    id: engine.id,
                    name: engine.name,
                    type: engine.type,
                    model: engine.config?.model || 'default',
                    apiKey: engine.config?.apiKey || '',
                    endpoint: engine.endpoint,
                    capabilities: engine.capabilities ? JSON.parse(engine.capabilities) : [],
                    status: engine.status
                };
                this.engineConfigs.set(engine.id, config);
                logger_1.logger.info(`📋 加载AI引擎配置: ${engine.name} (${engine.type})`);
            }
        }
        catch (error) {
            logger_1.logger.error('❌ 从数据库加载引擎配置失败:', error);
            throw error;
        }
    }
    async initializeActiveEngines() {
        for (const [engineId, config] of this.engineConfigs) {
            try {
                const engine = await this.createEngineInstance(config);
                this.initializedEngines.set(engineId, engine);
                logger_1.logger.info(`✅ AI引擎初始化成功: ${config.name}`);
            }
            catch (error) {
                logger_1.logger.error(`❌ AI引擎初始化失败: ${config.name}`, error);
                this.engineConfigs.get(engineId).status = 'error';
            }
        }
    }
    async createEngineInstance(config) {
        switch (config.type) {
            case 'openai':
                if (!config.apiKey) {
                    throw new Error('OpenAI引擎缺少API密钥');
                }
                return new openai_engine_1.OpenAIEngine({
                    apiKey: config.apiKey,
                    model: config.model,
                    endpoint: config.endpoint
                });
            case 'claude':
            case 'anthropic':
                if (!config.apiKey) {
                    throw new Error('Claude/Anthropic引擎缺少API密钥');
                }
                return new claude_engine_1.ClaudeEngine({
                    apiKey: config.apiKey,
                    model: config.model
                });
            default:
                throw new Error(`不支持的AI引擎类型: ${config.type}`);
        }
    }
    async executeAIEngineTask(engineId, task) {
        const startTime = Date.now();
        try {
            const engine = this.initializedEngines.get(engineId);
            if (!engine) {
                throw new Error(`AI引擎未初始化: ${engineId}`);
            }
            const config = this.engineConfigs.get(engineId);
            if (config?.status !== 'active') {
                throw new Error(`AI引擎状态异常: ${config?.status}`);
            }
            const result = await engine.generate(task.prompt, {
                temperature: task.temperature || 0.7,
                maxTokens: task.maxTokens || 1000,
                systemPrompt: task.systemPrompt
            });
            const executionTimeMs = Date.now() - startTime;
            await this.recordEngineExecution(engineId, {
                success: true,
                data: result,
                executionTimeMs,
                tokensUsed: result.tokensUsed
            });
            return {
                success: true,
                data: result,
                executionTimeMs
            };
        }
        catch (error) {
            const executionTimeMs = Date.now() - startTime;
            await this.recordEngineExecution(engineId, {
                success: false,
                error: error instanceof Error ? error.message : '未知错误',
                executionTimeMs
            });
            return {
                success: false,
                error: error instanceof Error ? error.message : '未知错误',
                executionTimeMs
            };
        }
    }
    async recordEngineExecution(engineId, result) {
        try {
            await this.postgresDb.getPrisma().aIEngineExecution.create({
                data: {
                    engine_id: engineId,
                    success: result.success,
                    input_data: JSON.stringify({ prompt: '执行记录' }),
                    output_data: result.success ? JSON.stringify(result.data) : null,
                    error_message: result.error || null,
                    execution_time_ms: result.executionTimeMs,
                    tokens_used: result.tokensUsed,
                    status: result.success ? 'completed' : 'failed'
                }
            });
        }
        catch (error) {
            logger_1.logger.error('❌ 记录AI引擎执行历史失败:', error);
        }
    }
    async getAvailableEngines() {
        const engines = [];
        for (const [engineId, config] of this.engineConfigs) {
            engines.push({
                id: engineId,
                name: config.name,
                type: config.type,
                status: config.status,
                capabilities: config.capabilities
            });
        }
        return engines;
    }
    async getEngineStats(engineId) {
        try {
            const whereClause = engineId ? { engine_id: engineId } : {};
            const executions = await this.postgresDb.getPrisma().aIEngineExecution.findMany({
                where: whereClause,
                orderBy: { created_at: 'desc' },
                take: 100
            });
            const totalExecutions = executions.length;
            const successfulExecutions = executions.filter(e => e.success).length;
            const failedExecutions = totalExecutions - successfulExecutions;
            const averageExecutionTime = executions.reduce((sum, e) => sum + (e.execution_time_ms || 0), 0) / totalExecutions || 0;
            const totalTokens = executions.reduce((sum, e) => sum + (e.tokens_used || 0), 0);
            return {
                totalExecutions,
                successfulExecutions,
                failedExecutions,
                successRate: totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0,
                averageExecutionTime,
                totalTokens,
                recentExecutions: executions.slice(0, 10)
            };
        }
        catch (error) {
            logger_1.logger.error('❌ 获取AI引擎统计失败:', error);
            return {
                totalExecutions: 0,
                successfulExecutions: 0,
                failedExecutions: 0,
                successRate: 0,
                averageExecutionTime: 0,
                totalTokens: 0,
                recentExecutions: []
            };
        }
    }
    startEngineHealthChecks() {
        setInterval(async () => {
            for (const [engineId, engine] of this.initializedEngines) {
                try {
                    await engine.generate('Health check', {
                        maxTokens: 1
                    });
                    const config = this.engineConfigs.get(engineId);
                    if (config && config.status === 'error') {
                        config.status = 'active';
                    }
                }
                catch (error) {
                    logger_1.logger.error(`❌ AI引擎健康检查失败: ${engineId}`, error);
                    const config = this.engineConfigs.get(engineId);
                    if (config) {
                        config.status = 'error';
                    }
                }
            }
        }, 30000);
    }
    async addEngine(config) {
        try {
            await this.postgresDb.getPrisma().aIEngine.create({
                data: {
                    name: config.name,
                    type: config.type,
                    endpoint: config.endpoint,
                    capabilities: JSON.stringify(config.capabilities),
                    config: JSON.stringify({
                        model: config.model,
                        apiKey: config.apiKey
                    }),
                    status: config.status
                }
            });
            const engine = await this.createEngineInstance(config);
            this.initializedEngines.set(config.id, engine);
            this.engineConfigs.set(config.id, config);
            logger_1.logger.info(`✅ 新AI引擎添加成功: ${config.name}`);
        }
        catch (error) {
            logger_1.logger.error('❌ 添加AI引擎失败:', error);
            throw error;
        }
    }
}
exports.AIEngineIntegrationService = AIEngineIntegrationService;
exports.aiEngineIntegrationService = new AIEngineIntegrationService();
//# sourceMappingURL=ai-engine-integration.service.js.map