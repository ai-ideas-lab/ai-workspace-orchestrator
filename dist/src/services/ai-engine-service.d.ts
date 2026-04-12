export interface AITask {
    type: 'analysis' | 'writing' | 'coding' | 'general';
    prompt: string;
    requirements?: Record<string, any>;
}
export interface AIEngine {
    name: string;
    model: string;
    type: string;
    capabilities: string[];
    maxTokens: number;
    temperature: number;
    costPerToken: number;
    latency: string;
}
export interface TaskResult {
    result: string;
    tokensUsed: number;
    confidence: number;
    engine: string;
    timestamp: string;
    cost?: number;
}
export declare class AIEngineService {
    private openai;
    private anthropic;
    private genAI;
    private engines;
    constructor();
    private initializeEngines;
    selectBestEngine(taskType: string, requirements?: Record<string, any>): Promise<string>;
    executeAITask(engineName: string, task: AITask): Promise<TaskResult>;
    private executeWithChatGPT;
    private executeWithClaude;
    private executeWithGemini;
    private getSystemPrompt;
    getAvailableEngines(): Array<AIEngine & {
        status: string;
    }>;
    estimateTaskCost(engineName: string, prompt: string, estimatedTokens?: number): Promise<{
        estimatedCost: number;
        currency: string;
    }>;
    validateTask(task: AITask): {
        isValid: boolean;
        errors: string[];
    };
    executeTasksBatch(tasks: Array<{
        id: string;
        engine: string;
        task: AITask;
    }>): Promise<Array<{
        taskId: string;
        success: boolean;
        result?: TaskResult;
        error?: string;
        timestamp: string;
    }>>;
}
export declare const aiEngineService: AIEngineService;
//# sourceMappingURL=ai-engine-service.d.ts.map