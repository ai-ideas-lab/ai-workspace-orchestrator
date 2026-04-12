"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiEngineManager = exports.AIEngineManager = void 0;
const openai_engine_1 = require("./openai-engine");
const claude_engine_1 = require("./claude-engine");
const database_manager_1 = require("./database-manager");
class AIEngineManager {
    constructor() {
        this.engines = new Map();
        this.activeEngines = new Set();
        this.engineStats = new Map();
    }
    async initialize() {
        console.log(`🚀 初始化AI引擎管理器`);
        try {
            await this.initializeDatabase();
            await this.loadEnginesFromDatabase();
            await this.initializeEngineStats();
            console.log(`✅ AI引擎管理器初始化完成，已注册 ${this.engines.size} 个引擎`);
        }
        catch (error) {
            console.error(`❌ AI引擎管理器初始化失败:`, error);
            throw error;
        }
    }
    async executeStep(step, executionId) {
        console.log(`[AIEngineManager] 执行工作流步骤: ${step.id}`);
        const engine = await this.selectBestEngine(step);
        if (!engine) {
            throw new Error('没有可用的AI引擎');
        }
        const startTime = Date.now();
        try {
            const result = await this.executeWithEngine(engine, step);
            const latency = Date.now() - startTime;
            this.updateEngineStats(engine.id, latency, true);
            return this.createSuccessResult(result, engine.id, latency);
        }
        catch (error) {
            const latency = Date.now() - startTime;
            this.updateEngineStats(engine.id, latency, false);
            return await this.handleStepFailure(step, engine, error, latency);
        }
    }
    async executeSteps(steps, executionId) {
        console.log(`[AIEngineManager] 批量执行步骤: ${steps.length} 个`);
        const results = [];
        const failedSteps = [];
        const engineUsage = {};
        const concurrencyLimit = this.calculateConcurrencyLimit();
        const batches = this.createStepBatches(steps, concurrencyLimit);
        for (const batch of batches) {
            const promises = batch.map(step => this.executeStep(step, executionId)
                .catch(error => ({
                status: 'failed',
                error: error.message,
                stepId: step.id,
                engineUsed: 'unknown'
            })));
            const batchResults = await Promise.all(promises);
            batchResults.forEach((result, index) => {
                const step = batch[index];
                results.push({
                    stepId: step.id,
                    ...result
                });
                if (result.engineUsed) {
                    engineUsage[result.engineUsed] = (engineUsage[result.engineUsed] || 0) + 1;
                }
                if (result.status === 'failed') {
                    failedSteps.push(step.id);
                }
            });
        }
        console.log(`📊 批量执行完成: 成功 ${results.length - failedSteps.length}, 失败 ${failedSteps.length}`);
        console.log(`📈 引擎使用统计:`, engineUsage);
        return {
            results,
            failedSteps,
            stats: {
                total: steps.length,
                success: results.length - failedSteps.length,
                failed: failedSteps.length,
                engineUsage,
                successRate: ((results.length - failedSteps.length) / steps.length) * 100
            }
        };
    }
    async getSystemStatus() {
        try {
            const dbStats = await database_manager_1.databaseManager.getWorkflowStats();
            const engines = Array.from(this.engines.values());
            const activeEngines = engines.filter(e => this.activeEngines.has(e.id));
            const totalRequests = Array.from(this.engineStats.values())
                .reduce((sum, stat) => sum + stat.totalRequests, 0);
            const averageLatency = this.calculateAverageLatency(activeEngines);
            return {
                totalEngines: engines.length,
                activeEngines: activeEngines.length,
                averageLoad: this.calculateAverageLoad(activeEngines),
                averageLatency,
                totalRequests,
                database: {
                    totalExecutions: dbStats.total,
                    successRate: dbStats.success_rate,
                    averageExecutionTime: dbStats.average_execution_time
                },
                status: activeEngines.length > 0 ? 'operational' : 'degraded'
            };
        }
        catch (error) {
            console.error('获取系统状态失败:', error);
            return {
                totalEngines: 0,
                activeEngines: 0,
                averageLoad: 0,
                averageLatency: 0,
                totalRequests: 0,
                database: { error: error.message },
                status: 'error'
            };
        }
    }
    getEngineDetails() {
        return Array.from(this.engines.values()).map(engine => ({
            id: engine.id,
            name: engine.name,
            type: engine.type,
            status: this.activeEngines.has(engine.id) ? 'active' : 'inactive',
            load: engine.load,
            stats: this.engineStats.get(engine.id),
            capabilities: engine.capabilities
        }));
    }
    updateEngineLoad(engineId, load) {
        const engine = this.engines.get(engineId);
        if (engine) {
            engine.load = this.normalizeLoad(load);
            this.updateEngineActivation(engineId, engine.load);
        }
    }
    async initializeDatabase() {
        console.log(`📊 初始化数据库连接`);
        await database_manager_1.databaseManager.initialize();
    }
    async loadEnginesFromDatabase() {
        console.log(`📥 从数据库加载引擎`);
        const dbEngines = await database_manager_1.databaseManager.loadEnginesFromDatabase();
        for (const engineData of dbEngines) {
            const engine = this.createEngineFromData(engineData);
            await this.registerEngine(engine);
        }
    }
    async initializeEngineStats() {
        console.log(`📈 初始化引擎统计信息`);
        for (const [engineId, engine] of this.engines) {
            this.engineStats.set(engineId, {
                totalRequests: 0,
                totalTokens: 0,
                successRate: 100,
                averageLatency: 0,
                lastUsed: new Date(),
            });
            await this.activateEngine(engine);
        }
    }
    async registerEngine(engine) {
        console.log(`[AIEngineManager] 注册引擎: ${engine.name} (${engine.id})`);
        this.validateEngine(engine);
        this.engines.set(engine.id, engine);
        const stats = {
            totalRequests: 0,
            totalTokens: 0,
            successRate: 100,
            averageLatency: 0,
            lastUsed: new Date(),
        };
        this.engineStats.set(engine.id, stats);
        try {
            await this.activateEngine(engine);
        }
        catch (error) {
            console.error(`❌ 引擎激活失败: ${engine.name}`, error);
            engine.status = 'error';
        }
    }
    async activateEngine(engine) {
        if (engine.status === 'active') {
            this.activeEngines.add(engine.id);
            console.log(`✅ 引擎激活成功: ${engine.name}`);
        }
        else {
            console.warn(`⚠️ 引擎状态异常: ${engine.name} - ${engine.status}`);
        }
    }
    async selectBestEngine(step) {
        console.log(`[AIEngineManager] 选择最佳引擎: step=${step.id}, engine=${step.engineId}`);
        const specifiedEngine = await this.getEngineById(step.engineId);
        if (specifiedEngine) {
            return specifiedEngine;
        }
        const suitableEngines = await this.getSuitableEngines(step);
        if (suitableEngines.length === 0) {
            console.warn(`没有找到合适的AI引擎`);
            return null;
        }
        return this.applyIntelligentSelection(suitableEngines, step);
    }
    async executeWithEngine(engine, step) {
        console.log(`🎯 使用引擎 ${engine.name} 执行步骤: ${step.id}`);
        const engineType = this.detectEngineType(engine);
        const operationParams = this.extractOperationParams(step);
        switch (engineType) {
            case 'openai':
                return this.executeOpenAIStep(engine, step);
            case 'claude':
                return this.executeClaudeStep(engine, step);
            default:
                throw new Error(`不支持的引擎类型: ${engine.id}`);
        }
    }
    async handleStepFailure(step, failedEngine, error, latency) {
        console.error(`❌ 步骤执行失败: ${step.id}`, error);
        const fallbackEngine = await this.selectFallbackEngine(failedEngine.id);
        if (fallbackEngine) {
            console.log(`🔄 尝试故障转移到引擎: ${fallbackEngine.name}`);
            try {
                const fallbackResult = await this.executeWithEngine(fallbackEngine, step);
                this.updateEngineStats(fallbackEngine.id, latency, true);
                return this.createSuccessResult(fallbackResult, fallbackEngine.id, latency);
            }
            catch (fallbackError) {
                console.error(`❌ 故障转移失败:`, fallbackError);
            }
        }
        return {
            output: null,
            status: 'failed',
            error: error.message,
            engineUsed: failedEngine.id,
            latency
        };
    }
    async selectFallbackEngine(failedEngineId) {
        console.log(`[AIEngineManager] 选择故障转移引擎 (排除: ${failedEngineId})`);
        const fallbackEngines = Array.from(this.engines.values()).filter(engine => {
            if (engine.id === failedEngineId)
                return false;
            const isActive = this.activeEngines.has(engine.id);
            const isNotOverloaded = engine.load <= 0.6;
            const isSameType = this.engines.get(failedEngineId)?.type === engine.type;
            return isActive && isNotOverloaded && isSameType;
        });
        return fallbackEngines.length > 0
            ? fallbackEngines.reduce((best, current) => current.load < best.load ? current : best)
            : null;
    }
    async executeOpenAIStep(engine, step) {
        const params = {
            prompt: step.input?.prompt || step.input?.content || JSON.stringify(step.input),
            temperature: step.parameters?.temperature || 0.7,
            maxTokens: step.parameters?.maxTokens || 2000,
            model: step.parameters?.model,
        };
        return await engine.generateText(params);
    }
    async executeClaudeStep(engine, step) {
        const params = {
            prompt: step.input?.prompt || step.input?.content || JSON.stringify(step.input),
            temperature: step.parameters?.temperature || 0.7,
            maxTokens: step.parameters?.maxTokens || 2000,
            model: step.parameters?.model,
        };
        return await engine.generateText(params);
    }
    detectEngineType(engine) {
        if (engine.id.includes('openai'))
            return 'openai';
        if (engine.id.includes('anthropic'))
            return 'claude';
        return 'unknown';
    }
    extractOperationParams(step) {
        return {
            prompt: step.input?.prompt || step.input?.content || JSON.stringify(step.input),
            temperature: step.parameters?.temperature || 0.7,
            maxTokens: step.parameters?.maxTokens || 2000,
            model: step.parameters?.model,
        };
    }
    async getEngineById(engineId) {
        const engine = this.engines.get(engineId);
        if (!engine || !this.activeEngines.has(engineId)) {
            return null;
        }
        return engine;
    }
    async getSuitableEngines(step) {
        return Array.from(this.engines.values()).filter(engine => {
            const isActive = this.activeEngines.has(engine.id);
            const isNotOverloaded = engine.load <= 0.8;
            const isSuitable = this.isEngineSuitable(engine, step);
            return isActive && isNotOverloaded && isSuitable;
        });
    }
    isEngineSuitable(engine, step) {
        const taskRequirements = {
            'text-generation': ['text-generation', 'document-processing'],
            'image-generation': ['image-generation'],
            'code-analysis': ['code-analysis', 'text-generation'],
            'document-processing': ['document-processing', 'text-generation']
        };
        const requiredTypes = taskRequirements[step.engineId] || ['text-generation'];
        return requiredTypes.includes(engine.type);
    }
    applyIntelligentSelection(engines, step) {
        const scoredEngines = engines.map(engine => ({
            engine,
            score: this.calculateEngineScore(engine)
        }));
        return scoredEngines.reduce((best, current) => current.score > best.score ? current : best).engine;
    }
    calculateEngineScore(engine) {
        const stats = this.engineStats.get(engine.id);
        let score = 100;
        score -= engine.load * 30;
        if (stats && stats.successRate < 100) {
            score -= (100 - stats.successRate) * 0.5;
        }
        if (stats && stats.averageLatency > 0) {
            score -= Math.min(stats.averageLatency / 10, 20);
        }
        if (stats) {
            const timeSinceLastUse = Date.now() - stats.lastUsed.getTime();
            if (timeSinceLastUse < 60000) {
                score -= 10;
            }
        }
        return score;
    }
    updateEngineActivation(engineId, load) {
        if (load > 0.9) {
            this.activeEngines.delete(engineId);
        }
        else if (load <= 0.7) {
            this.activeEngines.add(engineId);
        }
    }
    createSuccessResult(output, engineId, latency) {
        return {
            output,
            status: 'completed',
            engineUsed: engineId,
            latency
        };
    }
    recordEngineUsage(engineId) {
        const stats = this.engineStats.get(engineId);
        if (stats) {
            stats.totalRequests++;
            stats.lastUsed = new Date();
        }
    }
    updateEngineStats(engineId, latency, success) {
        const stats = this.engineStats.get(engineId);
        if (stats) {
            stats.totalRequests++;
            if (success) {
                stats.successRate = this.calculateNewSuccessRate(stats.successRate, stats.totalRequests);
                stats.averageLatency = this.calculateNewAverageLatency(stats.averageLatency, latency, stats.totalRequests);
            }
            else {
                stats.successRate = this.calculateNewSuccessRate(stats.successRate, stats.totalRequests, false);
            }
            stats.lastUsed = new Date();
        }
    }
    calculateNewSuccessRate(oldRate, totalRequests, success = true) {
        if (totalRequests === 1)
            return success ? 100 : 0;
        const previousSuccessCount = (oldRate * (totalRequests - 1)) / 100;
        const newSuccessCount = success ? previousSuccessCount + 1 : previousSuccessCount;
        return (newSuccessCount / totalRequests) * 100;
    }
    calculateNewAverageLatency(oldAvg, newLatency, totalRequests) {
        if (totalRequests === 1)
            return newLatency;
        return (oldAvg * (totalRequests - 1) + newLatency) / totalRequests;
    }
    calculateAverageLoad(engines) {
        if (engines.length === 0)
            return 0;
        return engines.reduce((sum, e) => sum + e.load, 0) / engines.length;
    }
    calculateAverageLatency(engines) {
        const validStats = Array.from(this.engineStats.values()).filter(stat => stat.averageLatency > 0);
        if (validStats.length === 0)
            return 0;
        const totalLatency = validStats.reduce((sum, stat) => sum + stat.averageLatency, 0);
        return totalLatency / validStats.length;
    }
    normalizeLoad(load) {
        return Math.max(0, Math.min(1, load));
    }
    calculateConcurrencyLimit() {
        const systemStatus = this.getSystemStatus();
        if (systemStatus.averageLoad > 0.8)
            return 2;
        if (systemStatus.averageLoad > 0.6)
            return 3;
        return 5;
    }
    createStepBatches(steps, concurrencyLimit) {
        const batches = [];
        for (let i = 0; i < steps.length; i += concurrencyLimit) {
            batches.push(steps.slice(i, i + concurrencyLimit));
        }
        return batches;
    }
    validateEngine(engine) {
        const requiredFields = ['id', 'name', 'type', 'endpoint'];
        for (const field of requiredFields) {
            if (!(field in engine)) {
                throw new Error(`AI引擎配置不完整: 缺少 ${field}`);
            }
        }
        const supportedTypes = ['text-generation', 'image-generation', 'code-analysis', 'document-processing'];
        if (!supportedTypes.includes(engine.type)) {
            throw new Error(`不支持的AI引擎类型: ${engine.type}`);
        }
    }
    createEngineFromData(engineData) {
        if (engineData.name.includes('OpenAI') || engineData.id.includes('openai')) {
            return new openai_engine_1.OpenAIEngine(undefined, engineData.endpoint);
        }
        else if (engineData.name.includes('Anthropic') || engineData.id.includes('anthropic')) {
            return new claude_engine_1.ClaudeEngine(undefined, engineData.endpoint);
        }
        else {
            return new openai_engine_1.OpenAIEngine(undefined, engineData.endpoint);
        }
    }
}
exports.AIEngineManager = AIEngineManager;
exports.aiEngineManager = new AIEngineManager();
//# sourceMappingURL=ai-engine-manager-refactored.js.map