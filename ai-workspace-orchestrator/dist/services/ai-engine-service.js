"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIEngineService = void 0;
class AIEngineService {
    constructor() {
        this.engines = new Map();
        this.initializeDefaultEngines();
    }
    initializeDefaultEngines() {
        const chatgptConfig = {
            name: 'ChatGPT',
            type: 'chatgpt',
            endpoint: 'https://api.openai.com/v1/chat/completions',
            apiKey: process.env.OPENAI_API_KEY || '',
            maxTokens: 1000,
            temperature: 0.7,
            enabled: true,
        };
        const claudeConfig = {
            name: 'Claude',
            type: 'claude',
            endpoint: 'https://api.anthropic.com/v1/messages',
            apiKey: process.env.ANTHROPIC_API_KEY || '',
            maxTokens: 2000,
            temperature: 0.5,
            enabled: true,
        };
        this.engines.set('chatgpt', chatgptConfig);
        this.engines.set('claude', claudeConfig);
    }
    selectEngine(task) {
        const availableEngines = Array.from(this.engines.values()).filter(engine => engine.enabled);
        if (availableEngines.length === 0) {
            throw new Error('No available AI engines');
        }
        // First check if a specific engine is requested
        if (task.engine) {
            const requestedEngine = this.engines.get(task.engine);
            if (requestedEngine && requestedEngine.enabled) {
                return requestedEngine;
            }
            throw new Error(`Engine ${task.engine} not found or not enabled`);
        }
        // Simple engine selection logic based on task type
        switch (task.type) {
            case 'text-generation':
                return availableEngines.find(engine => engine.type === 'chatgpt') || availableEngines[0];
            case 'code-generation':
                return availableEngines.find(engine => engine.type === 'claude') || availableEngines[0];
            default:
                return availableEngines[0];
        }
    }
    getEngineConfig(engineName) {
        const engine = this.engines.get(engineName);
        if (!engine) {
            throw new Error(`Engine ${engineName} not found`);
        }
        return engine;
    }
    async executeTask(task) {
        const startTime = Date.now();
        try {
            const engine = this.selectEngine(task);
            const result = await this.callEngine(engine, task);
            return {
                success: true,
                data: result,
                executionTime: Date.now() - startTime,
                cost: this.estimateCost(task, engine),
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                executionTime: Date.now() - startTime,
            };
        }
    }
    async callEngine(engine, task) {
        // Simulate API call
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    response: `Generated response for task: ${task.content.substring(0, 50)}...`,
                    engine: engine.name,
                    timestamp: new Date().toISOString(),
                });
            }, 100 + Math.random() * 200);
        });
    }
    estimateCost(task, engine) {
        // Simple cost estimation (simulated)
        const baseCost = 0.001; // $0.001 per 1000 tokens
        const tokenCount = task.content.length / 4; // Rough estimate
        return (tokenCount / 1000) * baseCost;
    }
    addEngine(config) {
        this.engines.set(config.name.toLowerCase(), config);
    }
    removeEngine(engineName) {
        this.engines.delete(engineName.toLowerCase());
    }
    listEngines() {
        return Array.from(this.engines.values());
    }
}
exports.AIEngineService = AIEngineService;
//# sourceMappingURL=ai-engine-service.js.map