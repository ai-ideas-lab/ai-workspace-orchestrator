"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiTaskExecutor = exports.AITaskExecutor = void 0;
const logger_js_1 = require("../utils/logger.js");
const events_1 = require("events");
class AITaskExecutor extends events_1.EventEmitter {
    constructor() {
        super(...arguments);
        this.providers = new Map();
        this.activeTasks = new Map();
        this.taskQueue = [];
        this.isProcessing = false;
    }
    registerProvider(config) {
        try {
            this.providers.set(config.id, config);
            logger_js_1.logger.info(`AI provider registered: ${config.provider} (${config.id})`);
            this.emit('providerRegistered', config);
        }
        catch (error) {
            logger_js_1.logger.error(`Failed to register AI provider ${config.id}:`, error);
            throw error;
        }
    }
    getProviders() {
        return Array.from(this.providers.values());
    }
    async executeTask(task) {
        try {
            this.validateTask(task);
            this.activeTasks.set(task.id, task);
            task.status = ai_providers_js_1.AITaskStatus.RUNNING;
            task.startTime = new Date().toISOString();
            this.emit('taskStarted', task);
            const result = await this.executeByProvider(task);
            task.result = result;
            task.status = ai_providers_js_1.AITaskStatus.COMPLETED;
            task.endTime = new Date().toISOString();
            task.duration = this.calculateDuration(task.startTime, task.endTime);
            logger_js_1.logger.info(`AI task completed successfully: ${task.id}`);
            this.activeTasks.delete(task.id);
            this.emit('taskCompleted', task);
            return task;
        }
        catch (error) {
            task.status = ai_providers_js_1.AITaskStatus.FAILED;
            task.error = error instanceof Error ? error.message : 'Unknown error';
            task.endTime = new Date().toISOString();
            task.duration = this.calculateDuration(task.startTime, task.endTime);
            logger_js_1.logger.error(`AI task failed: ${task.id}`, error);
            this.activeTasks.delete(task.id);
            this.emit('taskFailed', task);
            throw error;
        }
    }
    async executeTasks(tasks) {
        const results = [];
        const groupedTasks = this.groupTasksByProvider(tasks);
        for (const [providerId, providerTasks] of groupedTasks) {
            try {
                const provider = this.providers.get(providerId);
                if (!provider) {
                    logger_js_1.logger.warn(`Provider ${providerId} not found, skipping tasks`);
                    continue;
                }
                const taskPromises = providerTasks.map(task => this.executeTask(task).catch(error => {
                    logger_js_1.logger.error(`Task ${task.id} failed:`, error);
                    return task;
                }));
                const providerResults = await Promise.all(taskPromises);
                results.push(...providerResults);
            }
            catch (error) {
                logger_js_1.logger.error(`Failed to execute tasks for provider ${providerId}:`, error);
            }
        }
        return results;
    }
    cancelTask(taskId) {
        const task = this.activeTasks.get(taskId);
        if (!task) {
            logger_js_1.logger.warn(`Task ${taskId} not found or already completed`);
            return false;
        }
        task.status = ai_providers_js_1.AITaskStatus.CANCELLED;
        task.endTime = new Date().toISOString();
        task.duration = this.calculateDuration(task.startTime, task.endTime);
        this.activeTasks.delete(taskId);
        this.emit('taskCancelled', task);
        logger_js_1.logger.info(`Task cancelled: ${taskId}`);
        return true;
    }
    getTaskStatus(taskId) {
        return this.activeTasks.get(taskId) || null;
    }
    getActiveTasks() {
        return Array.from(this.activeTasks.values());
    }
    cleanupOldTasks(maxAge = 24 * 60 * 60 * 1000) {
        const cutoffTime = Date.now() - maxAge;
        let cleanedCount = 0;
        for (const [taskId, task] of this.activeTasks) {
            if (task.endTime && new Date(task.endTime).getTime() < cutoffTime) {
                this.activeTasks.delete(taskId);
                cleanedCount++;
            }
        }
        if (cleanedCount > 0) {
            logger_js_1.logger.info(`Cleaned up ${cleanedCount} old tasks`);
        }
        return cleanedCount;
    }
    validateTask(task) {
        if (!task.id) {
            throw new Error('Task ID is required');
        }
        if (!task.provider) {
            throw new Error('Task provider is required');
        }
        if (!task.input) {
            throw new Error('Task input is required');
        }
        const provider = this.providers.get(task.provider);
        if (!provider) {
            throw new Error(`Provider ${task.provider} not found`);
        }
    }
    async executeByProvider(task) {
        const provider = this.providers.get(task.provider);
        if (!provider) {
            throw new Error(`Provider ${task.provider} not found`);
        }
        logger_js_1.logger.info(`Executing task ${task.id} with provider ${task.provider}`);
        switch (provider.model) {
            case 'gpt-4':
            case 'gpt-4-turbo':
                return await this.executeOpenAITask(task, provider);
            case 'claude-3-sonnet':
            case 'claude-3-opus':
                return await this.executeAnthropicTask(task, provider);
            case 'gemini-pro':
                return await this.executeGoogleAITask(task, provider);
            default:
                throw new Error(`Unsupported model: ${provider.model}`);
        }
    }
    async executeOpenAITask(task, provider) {
        try {
            const { default: OpenAI } = await Promise.resolve().then(() => __importStar(require('openai')));
            const openai = new OpenAI({
                apiKey: provider.apiKey,
                baseURL: provider.baseUrl,
            });
            const response = await openai.chat.completions.create({
                model: provider.model,
                messages: [
                    {
                        role: 'user',
                        content: task.input,
                    },
                ],
                max_tokens: provider.maxTokens,
                temperature: provider.temperature,
                ...task.parameters,
            });
            return {
                content: response.choices[0]?.message?.content || '',
                usage: response.usage,
                model: response.model,
                finish_reason: response.choices[0]?.finish_reason,
            };
        }
        catch (error) {
            logger_js_1.logger.error('OpenAI task execution failed:', error);
            throw error;
        }
    }
    async executeAnthropicTask(task, provider) {
        try {
            const { default: Anthropic } = await Promise.resolve().then(() => __importStar(require('@anthropic-ai/sdk')));
            const anthropic = new Anthropic({
                apiKey: provider.apiKey,
            });
            const response = await anthropic.messages.create({
                model: provider.model,
                max_tokens: provider.maxTokens,
                temperature: provider.temperature,
                messages: [
                    {
                        role: 'user',
                        content: task.input,
                    },
                ],
                ...task.parameters,
            });
            return {
                content: response.content[0]?.text || '',
                usage: response.usage,
                model: response.model,
                id: response.id,
            };
        }
        catch (error) {
            logger_js_1.logger.error('Anthropic task execution failed:', error);
            throw error;
        }
    }
    async executeGoogleAITask(task, provider) {
        try {
            const { GoogleGenerativeAI } = await Promise.resolve().then(() => __importStar(require('@google/generative-ai')));
            const genAI = new GoogleGenerativeAI(provider.apiKey);
            const model = genAI.getGenerativeModel({ model: provider.model });
            const result = await model.generateContent(task.input);
            return {
                content: result.response.text(),
                model: provider.model,
                candidateCount: result.response.candidates.length,
            };
        }
        catch (error) {
            logger_js_1.logger.error('Google AI task execution failed:', error);
            throw error;
        }
    }
    groupTasksByProvider(tasks) {
        const grouped = new Map();
        for (const task of tasks) {
            if (!grouped.has(task.provider)) {
                grouped.set(task.provider, []);
            }
            grouped.get(task.provider).push(task);
        }
        return grouped;
    }
    calculateDuration(startTime, endTime) {
        if (!startTime || !endTime)
            return 0;
        const start = new Date(startTime).getTime();
        const end = new Date(endTime).getTime();
        return end - start;
    }
}
exports.AITaskExecutor = AITaskExecutor;
exports.aiTaskExecutor = new AITaskExecutor();
//# sourceMappingURL=ai-task-executor.js.map