import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
export class AIEngine {
    providers = new Map();
    activeTasks = new Map();
    taskQueue = [];
    isProcessing = false;
    constructor() {
        this.initializeProviders();
    }
    initializeProviders() {
    }
    addProvider(provider) {
        this.providers.set(provider.id, provider);
        this.log('info', `AI提供商已添加: ${provider.provider} - ${provider.model}`, {
            providerId: provider.id,
            model: provider.model
        });
    }
    removeProvider(providerId) {
        const removed = this.providers.delete(providerId);
        if (removed) {
            this.log('info', `AI提供商已移除: ${providerId}`);
        }
        return removed;
    }
    async executeTask(task) {
        const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const fullTask = {
            ...task,
            id: taskId,
            status: 'pending',
            startTime: new Date().toISOString(),
            endTime: undefined,
            duration: undefined
        };
        this.activeTasks.set(taskId, fullTask);
        this.taskQueue.push(fullTask);
        this.log('info', `AI任务已创建: ${task.type}`, {
            taskId,
            provider: task.provider.provider,
            model: task.provider.model
        });
        if (!this.isProcessing) {
            this.processQueue();
        }
        return fullTask;
    }
    async processQueue() {
        if (this.isProcessing || this.taskQueue.length === 0)
            return;
        this.isProcessing = true;
        while (this.taskQueue.length > 0) {
            const task = this.taskQueue.shift();
            await this.executeTaskInternal(task);
        }
        this.isProcessing = false;
    }
    async executeTaskInternal(task) {
        const taskStartTime = Date.now();
        try {
            this.updateTaskStatus(task.id, 'running');
            this.log('info', `开始执行AI任务: ${task.type}`, {
                taskId: task.id,
                provider: task.provider.provider,
                model: task.provider.model
            });
            const result = await this.callAIProvider(task);
            this.updateTaskStatus(task.id, 'completed');
            const duration = Date.now() - taskStartTime;
            const completedTask = {
                ...task,
                result,
                status: 'completed',
                endTime: new Date().toISOString(),
                duration
            };
            this.activeTasks.set(task.id, completedTask);
            this.log('info', `AI任务完成: ${task.type}`, {
                taskId: task.id,
                duration,
                resultLength: result?.length || 0
            });
        }
        catch (error) {
            const duration = Date.now() - taskStartTime;
            const errorMessage = error instanceof Error ? error.message : '未知错误';
            this.updateTaskStatus(task.id, 'failed');
            const failedTask = {
                ...task,
                error: errorMessage,
                status: 'failed',
                endTime: new Date().toISOString(),
                duration
            };
            this.activeTasks.set(task.id, failedTask);
            this.log('error', `AI任务失败: ${task.type}`, {
                taskId: task.id,
                error: errorMessage,
                duration
            });
        }
    }
    async callAIProvider(task) {
        const { provider, type, input, parameters } = task;
        switch (provider.provider) {
            case 'openai':
                return await this.callOpenAI(provider, type, input, parameters);
            case 'anthropic':
                return await this.callAnthropic(provider, type, input, parameters);
            case 'google':
                return await this.callGoogle(provider, type, input, parameters);
            default:
                throw new Error(`不支持的AI提供商: ${provider.provider}`);
        }
    }
    async callOpenAI(provider, type, input, parameters) {
        const openai = new OpenAI({
            apiKey: provider.apiKey,
            baseURL: provider.baseUrl
        });
        const chatCompletion = await openai.chat.completions.create({
            model: provider.model,
            messages: [
                {
                    role: 'system',
                    content: this.getSystemPrompt(type)
                },
                {
                    role: 'user',
                    content: input
                }
            ],
            max_tokens: provider.maxTokens,
            temperature: provider.temperature,
            ...parameters
        });
        return chatCompletion.choices[0]?.message?.content || '无响应内容';
    }
    async callAnthropic(provider, type, input, parameters) {
        const anthropic = new Anthropic({
            apiKey: provider.apiKey,
            baseURL: provider.baseUrl
        });
        const response = await anthropic.messages.create({
            model: provider.model,
            max_tokens: provider.maxTokens,
            temperature: provider.temperature,
            system: this.getSystemPrompt(type),
            messages: [
                {
                    role: 'user',
                    content: input
                }
            ],
            ...parameters
        });
        return response.content[0]?.text || '无响应内容';
    }
    async callGoogle(provider, type, input, parameters) {
        const genAI = new GoogleGenerativeAI(provider.apiKey);
        let model;
        if (provider.model.includes('vision')) {
            model = genAI.getGenerativeModel({ model: provider.model });
        }
        else {
            model = genAI.getGenerativeModel({
                model: provider.model,
                generationConfig: {
                    maxOutputTokens: provider.maxTokens,
                    temperature: provider.temperature,
                    ...parameters
                }
            });
        }
        const result = await model.generateContent(input);
        return result.response.text();
    }
    getSystemPrompt(type) {
        const prompts = {
            'text-generation': '你是一个专业的文本生成助手，请根据用户输入生成高质量的内容。',
            'code-analysis': '你是一个专业的代码分析助手，请仔细分析用户提供的代码并提供改进建议。',
            'image-generation': '你是一个专业的图像生成助手，请根据用户描述生成图像描述。',
            'document-processing': '你是一个专业的文档处理助手，请帮助用户处理和理解文档内容。'
        };
        return prompts[type] || '你是一个专业的AI助手，请帮助用户完成他们的任务。';
    }
    updateTaskStatus(taskId, status) {
        const task = this.activeTasks.get(taskId);
        if (task) {
            task.status = status;
            this.activeTasks.set(taskId, task);
        }
    }
    getTaskStatus(taskId) {
        return this.activeTasks.get(taskId);
    }
    getActiveTasks() {
        return Array.from(this.activeTasks.values());
    }
    getQueueStatus() {
        return {
            length: this.taskQueue.length,
            isProcessing: this.isProcessing
        };
    }
    cancelTask(taskId) {
        const taskIndex = this.taskQueue.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
            this.taskQueue.splice(taskIndex, 1);
            const task = this.activeTasks.get(taskId);
            if (task && task.status === 'running') {
                this.updateTaskStatus(taskId, 'failed');
                const cancelledTask = {
                    ...task,
                    error: '任务已取消',
                    status: 'failed',
                    endTime: new Date().toISOString(),
                    duration: task.startTime ? Date.now() - new Date(task.startTime).getTime() : 0
                };
                this.activeTasks.set(taskId, cancelledTask);
            }
            this.log('info', `任务已取消: ${taskId}`);
            return true;
        }
        return false;
    }
    log(level, message, data) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            data
        };
        console.log(`[${logEntry.timestamp}] [${logEntry.level.toUpperCase()}] ${logEntry.message}`, data ? JSON.stringify(data, null, 2) : '');
    }
    cleanupCompletedTasks(maxAge = 3600000) {
        const now = Date.now();
        let cleanedCount = 0;
        for (const [taskId, task] of this.activeTasks) {
            if (task.status === 'completed' && task.endTime) {
                const endTime = new Date(task.endTime).getTime();
                if (now - endTime > maxAge) {
                    this.activeTasks.delete(taskId);
                    cleanedCount++;
                }
            }
        }
        if (cleanedCount > 0) {
            this.log('info', `已清理 ${cleanedCount} 个完成的任务`);
        }
    }
}
export const aiEngine = new AIEngine();
//# sourceMappingURL=ai-engine.js.map