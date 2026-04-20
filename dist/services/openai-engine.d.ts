import { AIEngine } from '../types';
export declare class OpenAIEngine implements AIEngine {
    id: string;
    name: string;
    type: string;
    endpoint: string;
    capabilities: string[];
    status: string;
    load: number;
    private apiKey;
    private baseURL;
    constructor(apiKey?: string, baseURL?: string);
    generateText(params: {
        prompt: string;
        systemPrompt?: string;
        temperature?: number;
        maxTokens?: number;
        model?: string;
    }): Promise<{
        content: string;
        usage: any;
    }>;
    analyzeCode(params: {
        code: string;
        language: string;
        analysisType: 'quality' | 'security' | 'performance' | 'documentation';
    }): Promise<{
        analysis: any;
        suggestions: string[];
        score: number;
    }>;
    generateImage(params: {
        prompt: string;
        size?: string;
        style?: string;
        quality?: string;
    }): Promise<{
        imageUrl: string;
        revisedPrompt?: string;
    }>;
    processDocument(params: {
        content: string;
        task: 'summarize' | 'extract' | 'categorize' | 'analyze';
        options?: Record<string, any>;
    }): Promise<{
        result: any;
        metadata: any;
    }>;
    transformCode(params: {
        sourceCode: string;
        sourceLanguage: string;
        targetLanguage: string;
        optimizationLevel?: 'basic' | 'intermediate' | 'advanced';
    }): Promise<{
        transformedCode: string;
        explanation: string;
        improvements: string[];
    }>;
    getStatus(): Promise<{
        status: string;
        load: number;
        latency?: number;
    }>;
    getUsageStats(): Promise<{
        totalRequests: number;
        totalTokens: number;
        averageLatency: number;
    }>;
    private getCodeAnalysisPrompt;
    private getDocumentPrompt;
}
export declare class OpenAIEngineFactory {
    static create(config?: {
        apiKey?: string;
        baseURL?: string;
        model?: string;
    }): OpenAIEngine;
    static createMultiple(): OpenAIEngine[];
}
//# sourceMappingURL=openai-engine.d.ts.map