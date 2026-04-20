import { NextRequest } from 'next/server';
export declare class AIEngineService {
    private openai;
    private anthropic;
    private engines;
    constructor();
    private initializeEngines;
    selectBestEngine(taskType: string, requirements?: any): Promise<string>;
    executeAITask(engineName: string, task: {
        type: string;
        prompt: string;
        context?: string;
        requirements?: any;
    }): Promise<any>;
    private executeWithChatGPT;
    private executeWithClaude;
    private executeWithGemini;
    private getSystemPrompt;
    getAvailableEngines(): {
        name: any;
        model: any;
        capabilities: any;
        status: string;
        costPerToken: any;
        latency: any;
    }[];
    executeTasksBatch(tasks: Array<{
        id: string;
        engine: string;
        task: any;
    }>): Promise<Array<any>>;
}
export declare const aiEngineService: AIEngineService;
export declare function POST(request: NextRequest): Promise<any>;
//# sourceMappingURL=ai-engine-service.d.ts.map