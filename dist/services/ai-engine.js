"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const openai_1 = require("openai");
const sdk_1 = require("@anthropic-ai/sdk");
const generative_ai_1 = require("@google/generative-ai");
class AIEngineService {
    constructor() {
        this.engines = new Map();
        this.openaiClients = new Map();
        this.anthropicClients = new Map();
        this.googleClients = new Map();
        this.initializeDefaultEngines();
    }
    initializeDefaultEngines() {
        this.registerEngine({
            id: 'openai-gpt-4',
            name: 'OpenAI GPT-4',
            type: 'openai',
            apiKey: process.env.OPENAI_API_KEY || '',
            capabilities: ['text-generation', 'code-generation', 'analysis', 'translation'],
            maxTokens: 4000,
            temperature: 0.7
        });
        this.registerEngine({
            id: 'anthropic-claude',
            name: 'Anthropic Claude',
            type: 'anthropic',
            apiKey: process.env.ANTHROPIC_API_KEY || '',
            capabilities: ['text-generation', 'analysis', 'reasoning']
        });
        this.registerEngine({
            id: 'google-gemini',
            name: 'Google Gemini',
            type: 'google',
            apiKey: process.env.GOOGLE_API_KEY || '',
            capabilities: ['text-generation', 'multimodal', 'analysis']
        });
    }
    registerEngine(config) {
        this.engines.set(config.id, config);
        switch (config.type) {
            case 'openai':
                this.openaiClients.set(config.id, new openai_1.OpenAI({
                    apiKey: config.apiKey,
                    baseURL: config.endpoint
                }));
                break;
            case 'anthropic':
                this.anthropicClients.set(config.id, new sdk_1.Anthropic({
                    apiKey: config.apiKey
                }));
                break;
            case 'google':
                this.googleClients.set(config.id, new generative_ai_1.GoogleGenerativeAI(config.apiKey));
                break;
        }
    }
    getEngine(engineId) {
        return this.engines.get(engineId);
    }
    getAllEngines() {
        return Array.from(this.engines.values());
    }
    async executeTask(engineId, task, options) {
        const startTime = Date.now();
        const engine = this.engines.get(engineId);
        if (!engine) {
            return {
                success: false,
                error: `Engine ${engineId} not found`,
                executionTime: Date.now() - startTime
            };
        }
        try {
            let response;
            switch (engine.type) {
                case 'openai':
                    response = await this.executeOpenAI(engine, task, options);
                    break;
                case 'anthropic':
                    response = await this.executeAnthropic(engine, task, options);
                    break;
                case 'google':
                    response = await this.executeGoogle(engine, task, options);
                    break;
                default:
                    throw new Error(`Unsupported engine type: ${engine.type}`);
            }
            return {
                success: true,
                data: response,
                executionTime: Date.now() - startTime
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                executionTime: Date.now() - startTime
            };
        }
    }
    async executeOpenAI(engine, task, options) {
        const client = this.openaiClients.get(engine.id);
        if (!client)
            throw new Error('OpenAI client not initialized');
        const completion = await client.chat.completions.create({
            model: options?.model || 'gpt-4',
            messages: [
                ...(options?.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : []),
                { role: 'user', content: task }
            ],
            max_tokens: options?.maxTokens || engine.maxTokens,
            temperature: options?.temperature || engine.temperature
        });
        return {
            content: completion.choices[0]?.message?.content,
            usage: completion.usage,
            model: completion.model
        };
    }
    async executeAnthropic(engine, task, options) {
        const client = this.anthropicClients.get(engine.id);
        if (!client)
            throw new Error('Anthropic client not initialized');
        const response = await client.messages.create({
            model: options?.model || 'claude-3-sonnet-20240229',
            max_tokens: options?.maxTokens || 4000,
            temperature: options?.temperature || 0.7,
            system: options?.systemPrompt,
            messages: [
                { role: 'user', content: task }
            ]
        });
        return {
            content: response.content[0]?.text,
            usage: response.usage,
            model: response.model
        };
    }
    async executeGoogle(engine, task, options) {
        const client = this.googleClients.get(engine.id);
        if (!client)
            throw new Error('Google client not initialized');
        const model = client.getGenerativeModel({
            model: options?.model || 'gemini-pro'
        });
        const result = await model.generateContent(task);
        return {
            content: result.response.text(),
            model: 'gemini-pro'
        };
    }
    async loadEnginesFromDatabase() {
        console.log('Loading engines from database - placeholder implementation');
    }
    async updateEngineLoad(engineId, load) {
        console.log(`Updating engine ${engineId} load to ${load}`);
    }
}
exports.default = AIEngineService;
//# sourceMappingURL=ai-engine.js.map