import { OpenAI } from 'openai';
import { Anthropic } from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
export class AIEngineService {
    engines = new Map();
    openaiClients = new Map();
    anthropicClients = new Map();
    googleClients = new Map();
    initializeEngines(configs) {
        console.log('🤖 Initializing AI Engines...');
        configs.forEach(config => {
            this.engines.set(config.provider, config);
            this.createClient(config);
            console.log(`✅ Initialized ${config.provider} engine with ${config.model}`);
        });
    }
    createClient(config) {
        try {
            switch (config.provider) {
                case 'openai':
                    this.openaiClients.set(config.provider, new OpenAI({
                        apiKey: config.apiKey,
                        baseURL: config.baseUrl,
                    }));
                    break;
                case 'anthropic':
                    this.anthropicClients.set(config.provider, new Anthropic({
                        apiKey: config.apiKey,
                    }));
                    break;
                case 'google':
                    this.googleClients.set(config.provider, new GoogleGenerativeAI(config.apiKey));
                    break;
                default:
                    console.warn(`⚠️  Unsupported provider: ${config.provider}`);
            }
        }
        catch (error) {
            console.error(`❌ Failed to create client for ${config.provider}:`, error);
        }
    }
    getAvailableEngines() {
        return Array.from(this.engines.keys());
    }
    getEngineConfig(provider) {
        return this.engines.get(provider) || null;
    }
    async testConnection(provider) {
        try {
            const config = this.engines.get(provider);
            if (!config) {
                console.error(`❌ Engine not found: ${provider}`);
                return false;
            }
            const startTime = Date.now();
            const testResult = await this.executeEngine(provider, {
                prompt: 'Hello! Please respond with "Connection test successful"',
                maxTokens: 50,
                temperature: 0.1,
            });
            const duration = Date.now() - startTime;
            if (testResult.success) {
                console.log(`✅ ${provider} connection test successful (${duration}ms)`);
                return true;
            }
            else {
                console.error(`❌ ${provider} connection test failed: ${testResult.error}`);
                return false;
            }
        }
        catch (error) {
            console.error(`❌ ${provider} connection test error:`, error);
            return false;
        }
    }
    async executeEngine(provider, options) {
        const startTime = Date.now();
        const config = this.engines.get(provider);
        if (!config) {
            return {
                success: false,
                content: '',
                model: 'unknown',
                duration: Date.now() - startTime,
                error: `Engine not configured: ${provider}`,
            };
        }
        try {
            const finalPrompt = options.context
                ? `${options.context.join('\n\n')}\n\n${options.prompt}`
                : options.prompt;
            switch (provider) {
                case 'openai':
                    return await this.executeOpenAI(config, finalPrompt, options);
                case 'anthropic':
                    return await this.executeAnthropic(config, finalPrompt, options);
                case 'google':
                    return await this.executeGoogle(config, finalPrompt, options);
                default:
                    throw new Error(`Unsupported provider: ${provider}`);
            }
        }
        catch (error) {
            const duration = Date.now() - startTime;
            return {
                success: false,
                content: '',
                model: config.model,
                duration,
                error: error.message || 'Unknown error',
            };
        }
    }
    async executeOpenAI(config, prompt, options) {
        const client = this.openaiClients.get('openai');
        if (!client) {
            throw new Error('OpenAI client not initialized');
        }
        const messages = [];
        if (options.systemPrompt) {
            messages.push({ role: 'system', content: options.systemPrompt });
        }
        messages.push({ role: 'user', content: prompt });
        const response = await client.chat.completions.create({
            model: config.model,
            messages,
            max_tokens: options.maxTokens || config.maxTokens || 1000,
            temperature: options.temperature ?? config.temperature ?? 0.7,
            response_format: options.jsonMode ? { type: 'json_object' } : undefined,
        });
        const content = response.choices[0]?.message?.content || '';
        const tokensUsed = response.usage?.total_tokens || 0;
        return {
            success: true,
            content,
            model: config.model,
            tokensUsed,
            duration: Date.now() - Date.now(),
        };
    }
    async executeAnthropic(config, prompt, options) {
        const client = this.anthropicClients.get('anthropic');
        if (!client) {
            throw new Error('Anthropic client not initialized');
        }
        const response = await client.messages.create({
            model: config.model,
            max_tokens: options.maxTokens || config.maxTokens || 1000,
            temperature: options.temperature ?? config.temperature ?? 0.7,
            system: options.systemPrompt,
            messages: [
                { role: 'user', content: prompt },
            ],
        });
        const content = response.content[0]?.text || '';
        const tokensUsed = response.usage?.input_tokens + response.usage?.output_tokens || 0;
        return {
            success: true,
            content,
            model: config.model,
            tokensUsed,
            duration: Date.now() - Date.now(),
        };
    }
    async executeGoogle(config, prompt, options) {
        const client = this.googleClients.get('google');
        if (!client) {
            throw new Error('Google client not initialized');
        }
        const model = config.model === 'gemini-pro' ? 'gemini-pro' : 'gemini-ultra';
        const generativeModel = client.getGenerativeModel({ model });
        const fullPrompt = options.systemPrompt
            ? `${options.systemPrompt}\n\n${prompt}`
            : prompt;
        const result = await generativeModel.generateContent(fullPrompt);
        const response = await result.response;
        const content = response.text();
        return {
            success: true,
            content,
            model: config.model,
            duration: Date.now() - Date.now(),
        };
    }
    async executeWithMultipleEngines(prompt, options = {}) {
        const providers = options.providers || this.getAvailableEngines();
        const results = {};
        const promises = providers.map(async (provider) => {
            const result = await this.executeEngine(provider, {
                prompt,
                systemPrompt: options.systemPrompt,
                maxTokens: options.maxTokens,
                temperature: options.temperature,
            });
            results[provider] = result;
        });
        await Promise.all(promises);
        return results;
    }
    async compareEngines(prompt, options = {}) {
        const results = await this.executeWithMultipleEngines(prompt, options);
        const scores = {};
        Object.entries(results).forEach(([provider, result]) => {
            let score = 0;
            if (result.success) {
                score += 100;
                const speed = 1000 - result.duration;
                score += Math.max(0, speed / 10);
                if (result.content.length > 100) {
                    score += result.content.length / 10;
                }
            }
            scores[provider] = score;
        });
        const bestProvider = Object.entries(scores).reduce((best, [provider, score]) => {
            return score > (scores[best] || 0) ? provider : best;
        }, '');
        const summary = Object.entries(results)
            .map(([provider, result]) => {
            const score = scores[provider];
            const status = result.success ? '✅' : '❌';
            return `${status} ${provider}: ${result.duration}ms, ${result.content.length} chars`;
        })
            .join('\n');
        return {
            comparison: results,
            summary,
            bestProvider: bestProvider || undefined,
        };
    }
    getEngineStatus() {
        const status = {
            openai: { configured: false },
            anthropic: { configured: false },
            google: { configured: false },
            local: { configured: false },
        };
        this.engines.forEach((config, provider) => {
            status[provider] = {
                configured: true,
                lastTest: new Date(),
            };
        });
        return status;
    }
    removeEngine(provider) {
        const removed = this.engines.delete(provider);
        this.openaiClients.delete(provider);
        this.anthropicClients.delete(provider);
        this.googleClients.delete(provider);
        if (removed) {
            console.log(`🗑️ Removed ${provider} engine`);
        }
        return removed;
    }
}
export const aiEngineService = new AIEngineService();
//# sourceMappingURL=aiEngineService.js.map