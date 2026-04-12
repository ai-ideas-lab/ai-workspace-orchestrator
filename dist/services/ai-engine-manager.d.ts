import { AIEngine, WorkflowStep } from '../types';
export declare class AIEngineManager {
    private engines;
    private activeEngines;
    private engineStats;
    initialize(): Promise<void>;
    registerEngine(engine: AIEngine): Promise<void>;
    executeStep(step: WorkflowStep): Promise<{
        output: any;
        status: string;
        error?: string;
        engineUsed: string;
    }>;
    executeSteps(steps: WorkflowStep[]): Promise<{
        results: any[];
        failedSteps: string[];
        stats: any;
    }>;
    selectBestEngine(step: WorkflowStep): AIEngine | null;
    selectFallbackEngine(failedEngineId: string): AIEngine | null;
    getSystemStatus(): {
        totalEngines: number;
        activeEngines: number;
        averageLoad: number;
        averageLatency: number;
        totalRequests: number;
        status: string;
    };
    getEngineDetails(): Array<{
        id: string;
        name: string;
        type: string;
        status: string;
        load: number;
        stats: any;
        capabilities: string[];
    }>;
    updateEngineLoad(engineId: string, load: number): void;
    private validateEngine;
    private isEngineSuitable;
    private applyIntelligentSelection;
    private recordEngineUsage;
    private updateEngineStats;
    private executeWithFallbackEngine;
    private executeOpenAIStep;
    private executeClaudeStep;
    private calculateConcurrencyLimit;
    private createStepBatches;
}
export declare const aiEngineManager: AIEngineManager;
//# sourceMappingURL=ai-engine-manager.d.ts.map