import { AIEngine, WorkflowStep, Workflow } from '../types';
import { WorkflowTemplate } from './workflow-template-library';
export declare class OptimizedAIScheduler {
    private maxConcurrentTasks;
    private maxRetries;
    private cacheEnabled;
    private engines;
    private runningWorkflows;
    private pendingTasks;
    private taskQueue;
    private isProcessing;
    private metrics;
    constructor(maxConcurrentTasks?: number, maxRetries?: number, cacheEnabled?: boolean);
    private initializeWorker;
    registerEngine(engine: AIEngine): Promise<void>;
    getAvailableEngines(engineType?: string): Promise<AIEngine[]>;
    selectBestEngine(engineType: string, priority?: 'high' | 'medium' | 'low'): Promise<AIEngine | null>;
    executeWorkflowStep(step: WorkflowStep): Promise<{
        success: boolean;
        result?: any;
        error?: string;
    }>;
    executeWorkflow(workflow: Workflow): Promise<{
        success: boolean;
        result?: any;
        error?: string;
    }>;
    executeWorkflowStepsBatch(steps: WorkflowStep[]): Promise<Array<{
        success: boolean;
        result?: any;
        error?: string;
    }>>;
    getSystemStatus(): Promise<any>;
    getPerformanceMetrics(): any;
    private updateEngineLoad;
    private callAIEngineWithRetry;
    private callAIEngine;
    private handleTaskResult;
    private updateProcessingTime;
    getWorkflowTemplates(category?: string): Promise<WorkflowTemplate[]>;
    getWorkflow(workflowId: string): Workflow | undefined;
    cancelWorkflow(workflowId: string): boolean;
    createWorkflow(name: string, description: string, steps: WorkflowStep[]): Workflow;
}
export declare const optimizedAIScheduler: OptimizedAIScheduler;
//# sourceMappingURL=optimized-ai-scheduler.d.ts.map