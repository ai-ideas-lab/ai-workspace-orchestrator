interface AIEngineConfig {
    id: string;
    name: string;
    type: 'openai' | 'anthropic' | 'google';
    endpoint?: string;
    apiKey: string;
    capabilities: string[];
    maxTokens?: number;
    temperature?: number;
}
interface AIEngineResponse {
    success: boolean;
    data?: any;
    error?: string;
    executionTime: number;
}
declare class AIEngineService {
    private engines;
    private openaiClients;
    private anthropicClients;
    private googleClients;
    constructor();
    private initializeDefaultEngines;
    registerEngine(config: AIEngineConfig): void;
    getEngine(engineId: string): AIEngineConfig | undefined;
    getAllEngines(): AIEngineConfig[];
    executeTask(engineId: string, task: string, options?: {
        model?: string;
        temperature?: number;
        maxTokens?: number;
        systemPrompt?: string;
    }): Promise<AIEngineResponse>;
    private executeOpenAI;
    private executeAnthropic;
    private executeGoogle;
    loadEnginesFromDatabase(): Promise<void>;
    updateEngineLoad(engineId: string, load: number): Promise<void>;
}
export default AIEngineService;
//# sourceMappingURL=ai-engine.d.ts.map