import { AIEngine } from '../types';
export declare class ClaudeEngine implements AIEngine {
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
    reason(params: {
        question: string;
        context?: string;
        reasoningType: 'logical' | 'mathematical' | 'scientific' | 'philosophical';
        stepByStep?: boolean;
    }): Promise<{
        reasoning: string;
        conclusion: string;
        steps?: string[];
    }>;
    processDocument(params: {
        content: string;
        task: 'summarize' | 'extract' | 'categorize' | 'analyze';
        options?: Record<string, any>;
    }): Promise<{
        result: any;
        metadata: any;
    }>;
    refactorCode(params: {
        sourceCode: string;
        sourceLanguage: string;
        refactoringGoals: string[];
        styleGuidelines?: string;
    }): Promise<{
        refactoredCode: string;
        changes: string[];
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
    private getReasoningPrompt;
    private getDocumentPrompt;
    private parseReasoning;
    private extractConclusion;
    private extractSteps;
}
export declare class ClaudeEngineFactory {
    static create(config?: {
        apiKey?: string;
        baseURL?: string;
        model?: string;
    }): ClaudeEngine;
    static createMultiple(): ClaudeEngine[];
}
//# sourceMappingURL=claude-engine.d.ts.map