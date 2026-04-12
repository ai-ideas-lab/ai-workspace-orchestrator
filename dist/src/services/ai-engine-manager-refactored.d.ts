import { WorkflowStep, EngineStats } from '../types';
export interface EngineStepExecutionResult {
    output: any;
    status: 'completed' | 'failed';
    error?: string;
    engineUsed: string;
    latency: number;
}
export declare class AIEngineManager {
    private engines;
    private activeEngines;
    private engineStats;
    initialize(): Promise<void>;
    executeStep(step: WorkflowStep, executionId?: string): Promise<EngineStepExecutionResult>;
    executeSteps(steps: WorkflowStep[], executionId?: string): Promise<{
        results: any[];
        failedSteps: string[];
        stats: any;
    }>;
    getSystemStatus(): Promise<{
        totalEngines: number;
        activeEngines: number;
        averageLoad: number;
        averageLatency: number;
        totalRequests: EngineStats;
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
        stats: EngineStats | undefined;
        capabilities: string[];
    }>;
    updateEngineLoad(engineId: string, load: number): void;
    private initializeDatabase;
    private loadEnginesFromDatabase;
    private initializeEngineStats;
    private registerEngine;
    private activateEngine;
    private selectBestEngine;
    private executeWithEngine;
    private handleStepFailure;
    private selectFallbackEngine;
    private executeOpenAIStep;
    private executeClaudeStep;
    private detectEngineType;
    private extractOperationParams;
    private getEngineById;
    private getSuitableEngines;
    private isEngineSuitable;
    private applyIntelligentSelection;
    private calculateEngineScore;
    private updateEngineActivation;
    private createSuccessResult;
    private recordEngineUsage;
    private updateEngineStats;
    private calculateNewSuccessRate;
    private calculateNewAverageLatency;
    private calculateAverageLoad;
    private calculateAverageLatency;
    private normalizeLoad;
    private calculateConcurrencyLimit;
    private createStepBatches;
    private validateEngine;
    private createEngineFromData;
}
export declare const aiEngineManager: AIEngineManager;
//# sourceMappingURL=ai-engine-manager-refactored.d.ts.map