export interface AITask {
    type: string;
    prompt: string;
    context?: string;
    requirements?: any;
}
export interface AIEngine {
    name: string;
    model: string;
    capabilities: string[];
    status: string;
    costPerToken: number;
    latency: string;
}
export interface AIExecutionResult {
    result: string;
    tokensUsed: number;
    confidence: number;
    engine: string;
    timestamp: string;
}
interface SelectEngineResponse {
    engine: string;
    reason: string;
}
interface BatchExecutionTask {
    id: string;
    engine: string;
    task: AITask;
}
interface BatchExecutionResponse {
    taskId: string;
    success: boolean;
    result?: AIExecutionResult;
    error?: string;
    timestamp: string;
}
declare class AIEngineService {
    private api;
    constructor();
    selectBestEngine(taskType: string, requirements?: any): Promise<SelectEngineResponse>;
    executeAITask(engine: string, task: AITask): Promise<AIExecutionResult>;
    getAvailableEngines(): Promise<AIEngine[]>;
    executeTasksBatch(tasks: BatchExecutionTask[]): Promise<BatchExecutionResponse[]>;
    executeWorkflowTask(workflowId: string, nodeId: string, task: AITask, engine?: string): Promise<AIExecutionResult>;
    getTaskSuggestions(taskType: string): Promise<string[]>;
    estimateTaskCost(engine: string, prompt: string, estimatedTokens?: number): Promise<{
        cost: number;
        currency: string;
        estimatedTokens: number;
    }>;
    validateTask(task: AITask): {
        valid: boolean;
        errors: string[];
    };
}
export declare const aiEngineService: AIEngineService;
export type { AITask, AIEngine, AIExecutionResult, SelectEngineResponse, BatchExecutionTask, BatchExecutionResponse };
//# sourceMappingURL=ai-engine-service.d.ts.map