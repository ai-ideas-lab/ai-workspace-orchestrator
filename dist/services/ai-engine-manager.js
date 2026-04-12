import { OpenAIEngineFactory } from './openai-engine';
import { ClaudeEngineFactory } from './claude-engine';
export class AIEngineManager {
    engines = new Map();
    activeEngines = new Set();
    engineStats = new Map();
    async initialize() {
        console.log(`🚀 初始化AI引擎管理器`);
        try {
            const openAIEngines = OpenAIEngineFactory.createMultiple();
            for (const engine of openAIEngines) {
                await this.registerEngine(engine);
            }
            const claudeEngines = ClaudeEngineFactory.createMultiple();
            for (const engine of claudeEngines) {
                await this.registerEngine(engine);
            }
            console.log(`✅ AI引擎管理器初始化完成，已注册 ${this.engines.size} 个引擎`);
        }
        catch (error) {
            console.error(`❌ AI引擎管理器初始化失败:`, error);
            throw error;
        }
    }
    async registerEngine(engine) {
        console.log(`[AIEngineManager] 注册引擎: ${engine.name} (${engine.id})`);
        this.validateEngine(engine);
        this.engines.set(engine.id, engine);
        this.engineStats.set(engine.id, {
            totalRequests: 0,
            totalTokens: 0,
            successRate: 100,
            averageLatency: 0,
            lastUsed: new Date(),
        });
        try {
            const status = await engine.getStatus();
            if (status.status === 'active') {
                this.activeEngines.add(engine.id);
                console.log(`✅ 引擎激活成功: ${engine.name}`);
            }
            else {
                console.warn(`⚠️ 引擎状态异常: ${engine.name} - ${status.status}`);
            }
        }
        catch (error) {
            console.error(`❌ 引擎激活失败: ${engine.name}`, error);
            engine.status = 'error';
        }
    }
    async executeStep(step) {
        console.log(`[AIEngineManager] 执行工作流步骤: ${step.id}`);
        const engine = this.selectBestEngine(step);
        if (!engine) {
            throw new Error('没有可用的AI引擎');
        }
        this.recordEngineUsage(engine.id);
        try {
            console.log(`🎯 使用引擎 ${engine.name} 执行步骤: ${step.id}`);
            let result;
            const startTime = Date.now();
            switch (step.engineId) {
                case 'openai-gpt-4':
                case 'openai-gpt-4-turbo':
                case 'openai-gpt-3.5':
                    result = await this.executeOpenAIStep(engine, step);
                    break;
                case 'anthropic-claude':
                case 'anthropic-claude-opus':
                case 'anthropic-claude-haiku':
                    result = await this.executeClaudeStep(engine, step);
                    break;
                default:
                    throw new Error(`不支持的引擎类型: ${step.engineId}`);
            }
            const endTime = Date.now();
            const latency = endTime - startTime;
            this.updateEngineStats(engine.id, latency, true);
            console.log(`✅ 步骤执行成功: ${step.id} (耗时: ${latency}ms)`);
            return {
                output: result,
                status: 'completed',
                engineUsed: engine.id
            };
        }
        catch (error) {
            this.updateEngineStats(engine.id, 0, false);
            console.error(`❌ 步骤执行失败: ${step.id}`, error);
            const fallbackEngine = this.selectFallbackEngine(engine.id);
            if (fallbackEngine) {
                console.log(`🔄 尝试故障转移到引擎: ${fallbackEngine.name}`);
                try {
                    const fallbackResult = await this.executeWithFallbackEngine(fallbackEngine, step);
                    this.updateEngineStats(fallbackEngine.id, 0, true);
                    return {
                        output: fallbackResult,
                        status: 'completed',
                        engineUsed: fallbackEngine.id
                    };
                }
                catch (fallbackError) {
                    console.error(`❌ 故障转移失败:`, fallbackError);
                }
            }
            return {
                output: null,
                status: 'failed',
                error: error.message,
                engineUsed: engine.id
            };
        }
    }
    async executeSteps(steps) {
        console.log(`[AIEngineManager] 批量执行步骤: ${steps.length} 个`);
        const results = [];
        const failedSteps = [];
        const engineUsage = {};
        const concurrencyLimit = this.calculateConcurrencyLimit();
        const batches = this.createStepBatches(steps, concurrencyLimit);
        for (const batch of batches) {
            const promises = batch.map(step => this.executeStep(step)
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
    selectBestEngine(step) {
        console.log(`[AIEngineManager] 选择最佳引擎: step=${step.id}, engine=${step.engineId}`);
        if (step.engineId) {
            const engine = this.engines.get(step.engineId);
            if (engine && this.activeEngines.has(step.engineId)) {
                return engine;
            }
            console.warn(`指定的引擎不可用: ${step.engineId}`);
        }
        const suitableEngines = Array.from(this.engines.values()).filter(engine => {
            if (!this.activeEngines.has(engine.id))
                return false;
            if (engine.load > 0.8)
                return false;
            return this.isEngineSuitable(engine, step);
        });
        if (suitableEngines.length === 0) {
            console.warn(`没有找到合适的AI引擎`);
            return null;
        }
        const bestEngine = this.applyIntelligentSelection(suitableEngines, step);
        console.log(`🎯 选择的引擎: ${bestEngine.name} (负载: ${bestEngine.load})`);
        return bestEngine;
    }
    selectFallbackEngine(failedEngineId) {
        console.log(`[AIEngineManager] 选择故障转移引擎 (排除: ${failedEngineId})`);
        const fallbackEngines = Array.from(this.engines.values()).filter(engine => {
            if (engine.id === failedEngineId)
                return false;
            if (!this.activeEngines.has(engine.id))
                return false;
            if (engine.load > 0.6)
                return false;
            const failedEngine = this.engines.get(failedEngineId);
            return engine.type === failedEngine?.type;
        });
        if (fallbackEngines.length === 0) {
            console.warn(`没有可用的故障转移引擎`);
            return null;
        }
        return fallbackEngines.reduce((best, current) => current.load < best.load ? current : best);
    }
    getSystemStatus() {
        const engines = Array.from(this.engines.values());
        const activeEngines = engines.filter(e => this.activeEngines.has(e.id));
        const totalRequests = Array.from(this.engineStats.values())
            .reduce((sum, stat) => sum + stat.totalRequests, 0);
        const averageLatency = activeEngines.length > 0
            ? Array.from(this.engineStats.values())
                .filter(stat => stat.averageLatency > 0)
                .reduce((sum, stat) => sum + stat.averageLatency, 0) /
                Array.from(this.engineStats.values()).filter(stat => stat.averageLatency > 0).length
            : 0;
        return {
            totalEngines: engines.length,
            activeEngines: activeEngines.length,
            averageLoad: activeEngines.reduce((sum, e) => sum + e.load, 0) / activeEngines.length || 0,
            averageLatency,
            totalRequests,
            status: activeEngines.length > 0 ? 'operational' : 'degraded'
        };
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
            engine.load = Math.max(0, Math.min(1, load));
            if (engine.load > 0.9) {
                this.activeEngines.delete(engineId);
            }
            else if (engine.load <= 0.7) {
                this.activeEngines.add(engineId);
            }
        }
    }
    validateEngine(engine) {
        if (!engine.id || !engine.name || !engine.type || !engine.endpoint) {
            throw new Error('AI引擎配置不完整');
        }
        const supportedTypes = ['text-generation', 'image-generation', 'code-analysis', 'document-processing'];
        if (!supportedTypes.includes(engine.type)) {
            throw new Error(`不支持的AI引擎类型: ${engine.type}`);
        }
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
        const scoredEngines = engines.map(engine => {
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
            return { engine, score };
        });
        return scoredEngines.reduce((best, current) => current.score > best.score ? current : best).engine;
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
                const previousSuccessRate = stats.successRate;
                stats.successRate = (previousSuccessRate * (stats.totalRequests - 1) + 100) / stats.totalRequests;
                if (stats.averageLatency > 0) {
                    stats.averageLatency = (stats.averageLatency * (stats.totalRequests - 1) + latency) / stats.totalRequests;
                }
                else {
                    stats.averageLatency = latency;
                }
            }
            else {
                stats.successRate = (stats.successRate * (stats.totalRequests - 1)) / stats.totalRequests;
            }
            stats.lastUsed = new Date();
        }
    }
    async executeWithFallbackEngine(engine, step) {
        console.log(`[AIEngineManager] 使用故障转移引擎执行: ${engine.name}`);
        this.recordEngineUsage(engine.id);
        try {
            if (engine.id.includes('openai')) {
                return await this.executeOpenAIStep(engine, step);
            }
            else if (engine.id.includes('anthropic')) {
                return await this.executeClaudeStep(engine, step);
            }
            else {
                throw new Error(`不支持的故障转移引擎: ${engine.id}`);
            }
        }
        catch (error) {
            this.updateEngineStats(engine.id, 0, false);
            throw error;
        }
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
    calculateConcurrencyLimit() {
        const systemStatus = this.getSystemStatus();
        if (systemStatus.averageLoad > 0.8) {
            return 2;
        }
        else if (systemStatus.averageLoad > 0.6) {
            return 3;
        }
        else {
            return 5;
        }
    }
    createStepBatches(steps, concurrencyLimit) {
        const batches = [];
        for (let i = 0; i < steps.length; i += concurrencyLimit) {
            const batch = steps.slice(i, i + concurrencyLimit);
            batches.push(batch);
        }
        return batches;
    }
}
export const aiEngineManager = new AIEngineManager();
//# sourceMappingURL=ai-engine-manager.js.map