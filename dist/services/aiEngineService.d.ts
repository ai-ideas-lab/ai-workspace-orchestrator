import { AIProvider } from '../types/ai-providers.js';
export interface AIEngineConfig {
    provider: AIProvider;
    model: string;
    maxTokens: number;
    temperature: number;
    baseUrl?: string;
}
export interface AIExecutionRequest {
    prompt: string;
    systemPrompt?: string;
    maxTokens?: number;
    temperature?: number;
    jsonMode?: boolean;
    context?: any;
}
export interface AIExecutionResult {
    success: boolean;
    data?: string;
    error?: string;
    provider: AIProvider;
    model: string;
    duration: number;
    tokenUsage?: {
        input: number;
        output: number;
        total: number;
    };
}
export declare class AIEngineService {
    private engines;
    private engineStatus;
    initializeEngines(configs: AIEngineConfig[]): void;
    private createEngine;
    getEngineStatus(): Record<AIProvider, boolean>;
    getAvailableEngines(): AIProvider[];
    testConnection(provider: AIProvider): Promise<boolean>;
    executeEngine(provider: AIProvider, request: AIExecutionRequest): Promise<AIExecutionResult>;
    private executeWithProvider;
    private executeOpenAI;
    private executeAnthropic;
    private executeGoogle;
    executeWithMultipleProviders(providers: AIProvider[], request: AIExecutionRequest): Promise<Record<AIProvider, AIExecutionResult>>;
    getEngineConfig(provider: AIProvider): AIEngineConfig | null;
    updateEngineConfig(provider: AIProvider, config: Partial<AIEngineConfig>): boolean;
    shutdown(): void;
}
export declare const aiEngineService: AIEngineService;
//# sourceMappingURL=aiEngineService.d.ts.map