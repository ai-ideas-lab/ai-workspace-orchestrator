export interface EngineConfig {
    name: string;
    type: 'chatgpt' | 'claude' | 'gemini' | 'custom';
    endpoint: string;
    apiKey: string;
    maxTokens: number;
    temperature: number;
    enabled: boolean;
}
export interface Task {
    id: string;
    type: 'text-generation' | 'code-generation' | 'translation' | 'analysis';
    content: string;
    engine: string;
    parameters?: Record<string, any>;
}
export interface EngineResult {
    success: boolean;
    data?: any;
    error?: string;
    executionTime: number;
    cost?: number;
}
export declare class AIEngineService {
    private engines;
    constructor();
    private initializeDefaultEngines;
    selectEngine(task: Task): EngineConfig;
    getEngineConfig(engineName: string): EngineConfig;
    executeTask(task: Task): Promise<EngineResult>;
    private callEngine;
    private estimateCost;
    addEngine(config: EngineConfig): void;
    removeEngine(engineName: string): void;
    listEngines(): EngineConfig[];
}
//# sourceMappingURL=ai-engine-service.d.ts.map