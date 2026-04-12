"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiEngineService = exports.AIEngineService = void 0;
const openai_1 = require("openai");
const sdk_1 = require("@anthropic-ai/sdk");
const generative_ai_1 = require("@google/generative-ai");
const logger_js_1 = require("../utils/logger.js");
class AIEngineService {
    constructor() {
        this.engines = new Map();
        this.engineStatus = new Map();
    }
    initializeEngines(configs) {
        for (const config of configs) {
            try {
                this.createEngine(config);
                this.engineStatus.set(config.provider, true);
                logger_js_1.logger.info(`✅ AI engine initialized: ${config.provider}`);
            }
            catch (error) {
                this.engineStatus.set(config.provider, false);
                logger_js_1.logger.error(`❌ Failed to initialize ${config.provider} engine:`, error);
            }
        }
    }
    createEngine(config) {
        switch (config.provider) {
            case 'openai':
                this.engines.set(config.provider, {
                    client: new openai_1.OpenAI({
                        apiKey: config.model,
                        baseURL: config.baseUrl || 'https://api.openai.com/v1',
                    }),
                    config,
                });
                break;
            case 'anthropic':
                this.engines.set(config.provider, {
                    client: new sdk_1.Anthropic({
                        apiKey: config.model,
                    }),
                    config,
                });
                break;
            case 'google':
                this.engines.set(config.provider, {
                    client: new generative_ai_1.GoogleGenerativeAI(config.model),
                    config,
                });
                break;
            default:
                throw new Error(`Unsupported AI provider: ${config.provider}`);
        }
    }
    getEngineStatus() {
        const status = {
            openai: false,
            anthropic: false,
            google: false,
        };
        for (const [provider, isAvailable] of this.engineStatus.entries()) {
            status[provider] = isAvailable;
        }
        return status;
    }
    getAvailableEngines() {
        return Array.from(this.engineStatus.entries())
            .filter(([, isAvailable]) => isAvailable)
            .map(([provider]) => provider);
    }
    async testConnection(provider) {
        try {
            const engine = this.engines.get(provider);
            if (!engine) {
                return false;
            }
            const testPrompt = 'Hello! Please respond with "Test successful" to verify connection.';
            switch (provider) {
                case 'openai':
                    await engine.client.chat.completions.create({
                        model: engine.config.model,
                        messages: [{ role: 'user', content: testPrompt }],
                        max_tokens: 10,
                    });
                    break;
                case 'anthropic':
                    await engine.client.messages.create({
                        model: engine.config.model,
                        max_tokens: 10,
                        messages: [{ role: 'user', content: testPrompt }],
                    });
                    break;
                case 'google':
                    const model = engine.client.getGenerativeModel({ model: engine.config.model });
                    await model.generateContent(testPrompt);
                    break;
            }
            this.engineStatus.set(provider, true);
            return true;
        }
        catch (error) {
            logger_js_1.logger.error(`Connection test failed for ${provider}:`, error);
            this.engineStatus.set(provider, false);
            return false;
        }
    }
    async executeEngine(provider, request) {
        const startTime = Date.now();
        try {
            const engine = this.engines.get(provider);
            if (!engine) {
                throw new Error(`AI engine not found: ${provider}`);
            }
            const { client, config } = engine;
            const result = await this.executeWithProvider(client, provider, config, request);
            const duration = Date.now() - startTime;
            return {
                success: true,
                data: result.content,
                provider,
                model: config.model,
                duration,
                tokenUsage: result.tokenUsage,
            };
        }
        catch (error) {
            const duration = Date.now() - startTime;
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                provider,
                model: this.engines.get(provider)?.config.model || 'unknown',
                duration,
            };
        }
    }
    async executeWithProvider(client, provider, config, request) {
        const { prompt, systemPrompt, maxTokens, temperature, jsonMode } = request;
        switch (provider) {
            case 'openai':
                return await this.executeOpenAI(client, config, prompt, systemPrompt, maxTokens, temperature, jsonMode);
            case 'anthropic':
                return await this.executeAnthropic(client, config, prompt, systemPrompt, maxTokens, temperature);
            case 'google':
                return await this.executeGoogle(client, config, prompt, systemPrompt, maxTokens);
            default:
                throw new Error(`Unsupported provider: ${provider}`);
        }
    }
    async executeOpenAI(client, config, prompt, systemPrompt, maxTokens, temperature, jsonMode) {
        const messages = [];
        if (systemPrompt) {
            messages.push({ role: 'system', content: systemPrompt });
        }
        messages.push({ role: 'user', content: prompt });
        const response = await client.chat.completions.create({
            model: config.model,
            messages,
            max_tokens: maxTokens || config.maxTokens,
            temperature: temperature ?? config.temperature,
            response_format: jsonMode ? { type: 'json_object' } : undefined,
        });
        const content = response.choices[0]?.message?.content || '';
        const usage = response.usage;
        return {
            content,
            tokenUsage: usage ? {
                input: usage.prompt_tokens || 0,
                output: usage.completion_tokens || 0,
                total: usage.total_tokens || 0,
            } : undefined,
        };
    }
    async executeAnthropic(client, config, prompt, systemPrompt, maxTokens, temperature) {
        const response = await client.messages.create({
            model: config.model,
            max_tokens: maxTokens || config.maxTokens,
            temperature: temperature ?? config.temperature,
            system: systemPrompt,
            messages: [{ role: 'user', content: prompt }],
        });
        const content = response.content[0]?.text || '';
        const usage = response.usage;
        return {
            content,
            tokenUsage: usage ? {
                input: usage.input_tokens || 0,
                output: usage.output_tokens || 0,
                total: usage.input_tokens + (usage.output_tokens || 0),
            } : undefined,
        };
    }
    async executeGoogle(client, config, prompt, systemPrompt, maxTokens) {
        const model = client.getGenerativeModel({
            model: config.model,
            generationConfig: {
                maxOutputTokens: maxTokens || config.maxTokens,
                temperature: config.temperature,
            },
        });
        const result = await model.generateContent(systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt);
        const content = result.response.text();
        return { content };
    }
    async executeWithMultipleProviders(providers, request) {
        const results = {};
        const promises = providers.map(async (provider) => {
            results[provider] = await this.executeEngine(provider, request);
        });
        await Promise.all(promises);
        return results;
    }
    getEngineConfig(provider) {
        const engine = this.engines.get(provider);
        return engine ? engine.config : null;
    }
    updateEngineConfig(provider, config) {
        const engine = this.engines.get(provider);
        if (!engine) {
            return false;
        }
        engine.config = { ...engine.config, ...config };
        this.engineStatus.set(provider, false);
        this.createEngine(engine.config);
        return true;
    }
    shutdown() {
        this.engines.clear();
        this.engineStatus.clear();
        logger_js_1.logger.info('All AI engines shutdown');
    }
}
exports.AIEngineService = AIEngineService;
exports.aiEngineService = new AIEngineService();
//# sourceMappingURL=aiEngineService.js.map