interface AIEngineConfig {
    id: string;
    name: string;
    type: 'openai' | 'claude' | 'anthropic';
    model: string;
    apiKey: string;
    endpoint?: string;
    capabilities: string[];
    status: 'active' | 'inactive' | 'error';
}
interface AIEngineResult {
    success: boolean;
    data?: any;
    error?: string;
    executionTimeMs: number;
    tokensUsed?: number;
}
export declare class AIEngineIntegrationService {
    private postgresDb;
    private initializedEngines;
    private engineConfigs;
    private isInitialized;
    constructor();
    initializeAIEngineIntegration(): Promise<void>;
    private loadEngineConfigsFromDatabase;
    private initializeActiveEngines;
    private createEngineInstance;
    executeAIEngineTask(engineId: string, task: {
        prompt: string;
        temperature?: number;
        maxTokens?: number;
        systemPrompt?: string;
        capabilities?: string[];
    }): Promise<AIEngineResult>;
    private recordEngineExecution;
    getAvailableEngines(): Promise<Array<{
        id: string;
        name: string;
        type: string;
        status: string;
        capabilities: string[];
    }>>;
    getEngineStats(engineId?: string): Promise<any>;
    private startEngineHealthChecks;
    addEngine(config: AIEngineConfig): Promise<void>;
}
export declare const aiEngineIntegrationService: AIEngineIntegrationService;
export {};
//# sourceMappingURL=ai-engine-integration.service.d.ts.map