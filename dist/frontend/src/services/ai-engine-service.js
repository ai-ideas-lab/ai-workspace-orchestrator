import axios from 'axios';
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
class AIEngineService {
    api = axios.create({
        baseURL: API_BASE_URL,
        timeout: 30000,
        headers: {
            'Content-Type': 'application/json',
        },
    });
    constructor() {
        this.api.interceptors.request.use((config) => {
            const token = localStorage.getItem('authToken');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        }, (error) => {
            return Promise.reject(error);
        });
        this.api.interceptors.response.use((response) => response, (error) => {
            if (error.response?.status === 401) {
                localStorage.removeItem('authToken');
                window.location.href = '/login';
            }
            return Promise.reject(error);
        });
    }
    async selectBestEngine(taskType, requirements = {}) {
        try {
            const response = await this.api.post('/ai-engine', {
                action: 'selectEngine',
                taskType,
                requirements,
            });
            return response.data.data;
        }
        catch (error) {
            console.error('Error selecting AI engine:', error);
            return {
                engine: 'ChatGPT-4',
                reason: 'Default engine selection',
            };
        }
    }
    async executeAITask(engine, task) {
        try {
            const response = await this.api.post('/ai-engine', {
                action: 'execute',
                engine,
                task,
            });
            return response.data.data;
        }
        catch (error) {
            console.error('Error executing AI task:', error);
            throw new Error(`AI task execution failed: ${error.response?.data?.error || error.message}`);
        }
    }
    async getAvailableEngines() {
        try {
            const response = await this.api.post('/ai-engine', {
                action: 'getEngines',
            });
            return response.data.data.engines;
        }
        catch (error) {
            console.error('Error fetching AI engines:', error);
            return [
                {
                    name: 'ChatGPT-4',
                    model: 'gpt-4',
                    capabilities: ['text-generation', 'code-completion', 'analysis'],
                    status: 'active',
                    costPerToken: 0.00006,
                    latency: 'medium',
                },
                {
                    name: 'Claude-3',
                    model: 'claude-3',
                    capabilities: ['text-analysis', 'reasoning', 'writing'],
                    status: 'active',
                    costPerToken: 0.000015,
                    latency: 'medium',
                },
                {
                    name: 'Gemini-Pro',
                    model: 'gemini-pro',
                    capabilities: ['text-generation', 'image-understanding', 'multilingual'],
                    status: 'active',
                    costPerToken: 0.000000125,
                    latency: 'low',
                },
            ];
        }
    }
    async executeTasksBatch(tasks) {
        try {
            const response = await this.api.post('/ai-engine', {
                action: 'batchExecute',
                tasks,
            });
            return response.data.data.results;
        }
        catch (error) {
            console.error('Error executing batch AI tasks:', error);
            throw new Error(`Batch execution failed: ${error.response?.data?.error || error.message}`);
        }
    }
    async executeWorkflowTask(workflowId, nodeId, task, engine) {
        let selectedEngine = engine;
        if (!engine) {
            const selection = await this.selectBestEngine(task.type, task.requirements);
            selectedEngine = selection.engine;
        }
        return await this.executeAITask(selectedEngine, {
            ...task,
            context: task.context || `Workflow ID: ${workflowId}, Node ID: ${nodeId}`,
        });
    }
    async getTaskSuggestions(taskType) {
        const suggestions = {
            analysis: [
                '提供详细的数据分析',
                '识别关键模式和趋势',
                '给出具体改进建议',
            ],
            writing: [
                '保持内容逻辑清晰',
                '注意语法和标点符号',
                '确保表达准确流畅',
            ],
            coding: [
                '代码风格一致',
                '添加适当注释',
                '考虑边界情况',
            ],
            general: [
                '回答要准确完整',
                '结构清晰有条理',
                '考虑实际应用场景',
            ],
        };
        return suggestions[taskType] || suggestions['general'];
    }
    async estimateTaskCost(engine, prompt, estimatedTokens = 1000) {
        const engines = await this.getAvailableEngines();
        const engineInfo = engines.find(e => e.name === engine);
        if (!engineInfo) {
            throw new Error(`Engine ${engine} not found`);
        }
        const cost = engineInfo.costPerToken * estimatedTokens;
        return {
            cost: Math.round(cost * 1000000) / 1000000,
            currency: 'USD',
            estimatedTokens,
        };
    }
    validateTask(task) {
        const errors = [];
        if (!task.type || task.type.trim() === '') {
            errors.push('任务类型不能为空');
        }
        if (!task.prompt || task.prompt.trim() === '') {
            errors.push('提示词不能为空');
        }
        if (task.prompt && task.prompt.length > 5000) {
            errors.push('提示词长度不能超过5000字符');
        }
        if (task.context && task.context.length > 1000) {
            errors.push('上下文长度不能超过1000字符');
        }
        return {
            valid: errors.length === 0,
            errors,
        };
    }
}
export const aiEngineService = new AIEngineService();
//# sourceMappingURL=ai-engine-service.js.map