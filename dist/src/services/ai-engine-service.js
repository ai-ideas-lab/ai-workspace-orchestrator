import { OpenAI } from 'openai';
import { Anthropic } from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
export class AIEngineService {
    openai;
    anthropic;
    genAI;
    engines = new Map();
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
        this.anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY,
        });
        this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');
        this.initializeEngines();
    }
    initializeEngines() {
        this.engines.set('ChatGPT-4', {
            name: 'ChatGPT-4',
            model: 'gpt-4',
            type: 'text-generation',
            capabilities: ['text-generation', 'code-completion', 'analysis', 'reasoning'],
            maxTokens: 4000,
            temperature: 0.7,
            costPerToken: 0.00006,
            latency: 'medium',
        });
        this.engines.set('Claude-3', {
            name: 'Claude-3',
            model: 'claude-3-sonnet-20240229',
            type: 'text-generation',
            capabilities: ['text-analysis', 'reasoning', 'writing', 'coding'],
            maxTokens: 4096,
            temperature: 0.3,
            costPerToken: 0.000015,
            latency: 'medium',
        });
        this.engines.set('Gemini-Pro', {
            name: 'Gemini-Pro',
            model: 'gemini-pro',
            type: 'text-generation',
            capabilities: ['text-generation', 'image-understanding', 'code', 'multilingual'],
            maxTokens: 30720,
            temperature: 0.5,
            costPerToken: 0.000000125,
            latency: 'low',
        });
    }
    async selectBestEngine(taskType, requirements = {}) {
        const taskTypeLower = taskType.toLowerCase();
        if (taskTypeLower.includes('code') || taskTypeLower.includes('programming')) {
            return 'Claude-3';
        }
        if (taskTypeLower.includes('analysis') || taskTypeLower.includes('reasoning')) {
            return 'Claude-3';
        }
        if (taskTypeLower.includes('creative') || taskTypeLower.includes('writing')) {
            return 'ChatGPT-4';
        }
        if (taskTypeLower.includes('multilingual') || taskTypeLower.includes('translate')) {
            return 'Gemini-Pro';
        }
        if (taskTypeLower.includes('image') || taskTypeLower.includes('visual')) {
            return 'Gemini-Pro';
        }
        return 'ChatGPT-4';
    }
    async executeAITask(engineName, task) {
        const engine = this.engines.get(engineName);
        if (!engine) {
            throw new Error(`AI engine ${engineName} not found`);
        }
        try {
            switch (engineName) {
                case 'ChatGPT-4':
                    return await this.executeWithChatGPT(task);
                case 'Claude-3':
                    return await this.executeWithClaude(task);
                case 'Gemini-Pro':
                    return await this.executeWithGemini(task);
                default:
                    throw new Error(`Unsupported engine: ${engineName}`);
            }
        }
        catch (error) {
            console.error(`Error executing task with ${engineName}:`, error);
            throw new Error(`AI task execution failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async executeWithChatGPT(task) {
        const response = await this.openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
                {
                    role: 'system',
                    content: this.getSystemPrompt(task.type, task.requirements),
                },
                {
                    role: 'user',
                    content: task.prompt,
                },
            ],
            max_tokens: 4000,
            temperature: 0.7,
        });
        const tokensUsed = response.usage?.total_tokens || 0;
        const cost = tokensUsed * this.engines.get('ChatGPT-4').costPerToken;
        return {
            result: response.choices[0].message.content || '',
            tokensUsed,
            confidence: response.choices[0].finish_reason === 'stop' ? 0.95 : 0.7,
            engine: 'ChatGPT-4',
            timestamp: new Date().toISOString(),
            cost,
        };
    }
    async executeWithClaude(task) {
        const response = await this.anthropic.messages.create({
            model: 'claude-3-sonnet-20240229',
            max_tokens: 4096,
            temperature: 0.3,
            messages: [
                {
                    role: 'user',
                    content: this.getSystemPrompt(task.type, task.requirements) + '\n\n' + task.prompt,
                },
            ],
        });
        const tokensUsed = response.usage.input_tokens + response.usage.output_tokens;
        const cost = tokensUsed * this.engines.get('Claude-3').costPerToken;
        return {
            result: response.content[0].text,
            tokensUsed,
            confidence: 0.9,
            engine: 'Claude-3',
            timestamp: new Date().toISOString(),
            cost,
        };
    }
    async executeWithGemini(task) {
        try {
            const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
            const fullPrompt = this.getSystemPrompt(task.type, task.requirements) + '\n\n' + task.prompt;
            const result = await model.generateContent(fullPrompt);
            const response = result.response;
            const text = response.text();
            const tokensUsed = Math.floor(text.length / 4);
            const cost = tokensUsed * this.engines.get('Gemini-Pro').costPerToken;
            return {
                result: text,
                tokensUsed,
                confidence: 0.85,
                engine: 'Gemini-Pro',
                timestamp: new Date().toISOString(),
                cost,
            };
        }
        catch (error) {
            console.error('Gemini API error:', error);
            return {
                result: `处理过程中出现错误: ${error instanceof Error ? error.message : String(error)}`,
                tokensUsed: 0,
                confidence: 0.1,
                engine: 'Gemini-Pro',
                timestamp: new Date().toISOString(),
                cost: 0,
            };
        }
    }
    getSystemPrompt(taskType, requirements) {
        const prompts = {
            'analysis': '你是一个专业的分析助手。请提供深入、结构化的分析，并给出具体可行的建议。',
            'writing': '你是一个专业的写作助手。请创作高质量、有创意的内容，注意语法准确性和逻辑性。',
            'coding': '你是一个专业的编程助手。请提供准确、高效的代码，并添加必要的注释。',
            'general': '你是一个通用AI助手。请根据用户需求提供准确、有用的回答。',
        };
        let prompt = prompts[taskType] || prompts['general'];
        if (requirements) {
            prompt += '\n\n特殊要求:\n';
            Object.entries(requirements).forEach(([key, value]) => {
                prompt += `- ${key}: ${value}\n`;
            });
        }
        return prompt;
    }
    getAvailableEngines() {
        return Array.from(this.engines.values()).map(engine => ({
            ...engine,
            status: 'active',
        }));
    }
    async estimateTaskCost(engineName, prompt, estimatedTokens) {
        const engine = this.engines.get(engineName);
        if (!engine) {
            throw new Error(`AI engine ${engineName} not found`);
        }
        const tokens = estimatedTokens || Math.floor(prompt.length / 4);
        const estimatedCost = tokens * engine.costPerToken;
        return {
            estimatedCost,
            currency: 'USD',
        };
    }
    validateTask(task) {
        const errors = [];
        if (!task || !task.prompt) {
            errors.push('任务内容不能为空');
        }
        if (!task.type || !['analysis', 'writing', 'coding', 'general'].includes(task.type)) {
            errors.push('任务类型必须是: analysis, writing, coding, general 之一');
        }
        if (task.prompt.length > 50000) {
            errors.push('任务内容过长，最大支持50,000字符');
        }
        return {
            isValid: errors.length === 0,
            errors,
        };
    }
    async executeTasksBatch(tasks) {
        const results = [];
        const promises = tasks.map(async (taskItem) => {
            try {
                const result = await this.executeAITask(taskItem.engine, taskItem.task);
                return {
                    taskId: taskItem.id,
                    success: true,
                    result,
                    timestamp: new Date().toISOString(),
                };
            }
            catch (error) {
                return {
                    taskId: taskItem.id,
                    success: false,
                    error: error instanceof Error ? error.message : String(error),
                    timestamp: new Date().toISOString(),
                };
            }
        });
        const batchResults = await Promise.all(promises);
        results.push(...batchResults);
        return results;
    }
}
export const aiEngineService = new AIEngineService();
//# sourceMappingURL=ai-engine-service.js.map