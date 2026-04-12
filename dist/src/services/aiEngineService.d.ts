export type AIProvider = 'openai' | 'anthropic' | 'google' | 'local';
export type AIModel = 'gpt-4' | 'gpt-4-turbo' | 'gpt-3.5-turbo' | 'claude-3-opus' | 'claude-3-sonnet' | 'claude-3-haiku' | 'gemini-pro' | 'gemini-ultra';
export interface AIEngineConfig {
    provider: AIProvider;
    model: AIModel;
    apiKey: string;
    baseUrl?: string;
    maxTokens?: number;
    temperature?: number;
}
export interface AIExecutionResult {
    success: boolean;
    content: string;
    model: string;
    tokensUsed?: number;
    duration: number;
    error?: string;
    metadata?: any;
}
export declare class AIEngineService {
    private engines;
    private openaiClients;
    private anthropicClients;
    private googleClients;
    initializeEngines(configs: AIEngineConfig[]): void;
    private createClient;
    getAvailableEngines(): AIProvider[];
    getEngineConfig(provider: AIProvider): AIEngineConfig | null;
    testConnection(provider: AIProvider): Promise<boolean>;
    executeEngine(provider: AIProvider, options: {
        prompt: string;
        systemPrompt?: string;
        maxTokens?: number;
        temperature?: number;
        jsonMode?: boolean;
        context?: string[];
    }): Promise<AIExecutionResult>;
    private executeOpenAI;
    private executeAnthropic;
    private executeGoogle;
    executeWithMultipleEngines(prompt: string, options?: {
        systemPrompt?: string;
        maxTokens?: number;
        temperature?: number;
        providers?: AIProvider[];
    }): Promise<Record<AIProvider, AIExecutionResult>>;
    compareEngines(prompt: string, options?: {
        systemPrompt?: string;
        maxTokens?: number;
        temperature?: number;
        providers?: AIProvider[];
    }): Promise<{
        comparison: Record<AIProvider, AIExecutionResult>;
        summary: string;
        bestProvider?: AIProvider;
    }>;
    getEngineStatus(): Record<AIProvider, {
        configured: boolean;
        lastTest?: Date;
    }>;
    removeEngine(provider: AIProvider): boolean;
}
export declare const aiEngineService: AIEngineService;
//# sourceMappingURL=aiEngineService.d.ts.map