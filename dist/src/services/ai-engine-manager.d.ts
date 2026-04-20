import { AIEngine, WorkflowStep } from '../types';
export declare class AIEngineManager {
    private engines;
    private activeEngines;
    private engineStats;
    initialize(): Promise<void>;
    registerEngine(engine: AIEngine): Promise<void>;
    executeStep(step: WorkflowStep, executionId?: string): Promise<{
        output: any;
        status: string;
        error?: string;
        engineUsed: string;
    }>;
    executeSteps(steps: WorkflowStep[], executionId?: string): Promise<{
        results: any[];
        failedSteps: string[];
        stats: any;
    }>;
    private isEngineAvailable;
    private getSpecifiedEngine;
    selectBestEngine(step: WorkflowStep): AIEngine | null;
    selectFallbackEngine(failedEngineId: string): AIEngine | null;
    getSystemStatus(): Promise<{
        totalEngines: number;
        activeEngines: number;
        averageLoad: number;
        averageLatency: number;
        totalRequests: number;
        database: {
            totalExecutions: any;
            successRate: any;
            averageExecutionTime: any;
            error?: never;
        };
        status: string;
    } | {
        totalEngines: number;
        activeEngines: number;
        averageLoad: number;
        averageLatency: number;
        totalRequests: number;
        database: {
            error: any;
            totalExecutions?: never;
            successRate?: never;
            averageExecutionTime?: never;
        };
        status: string;
    }>;
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
    private parseEngineParameters;
    private executeClaudeStep;
    private calculateConcurrencyLimit;
    private createStepBatches;
    private createEngineFromData;
    private recordExecutionToDatabase;
    private updateExecutionInDatabase;
    private recordStepExecutionToDatabase;
    private updateStepExecutionInDatabase;
}
export declare const aiEngineManager: AIEngineManager;
//# sourceMappingURL=ai-engine-manager.d.ts.map