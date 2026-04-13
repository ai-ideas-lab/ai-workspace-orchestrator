import { RequestQueue, RequestPriority } from './request-queue.js';
import { EventBus } from './event-bus.js';
export type StepStatus = 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'SKIPPED';
export interface WorkflowStep {
    id: string;
    name: string;
    taskType: string;
    payload: Record<string, unknown>;
    dependsOn: string[];
    priority?: RequestPriority;
    maxRetries?: number;
}
export interface WorkflowDefinition {
    id: string;
    name: string;
    steps: WorkflowStep[];
    defaultPriority?: RequestPriority;
}
export interface StepResult {
    stepId: string;
    status: StepStatus;
    engineId?: string;
    result?: Record<string, unknown>;
    error?: string;
    startedAt?: Date;
    finishedAt?: Date;
    retries: number;
}
export interface WorkflowResult {
    workflowId: string;
    status: 'COMPLETED' | 'FAILED' | 'CANCELLED';
    steps: StepResult[];
    startedAt: Date;
    finishedAt: Date;
    durationMs: number;
}
export declare class WorkflowExecutor {
    private queue;
    private eventBus;
    private activeWorkflows;
    private cancelled;
    constructor(queue?: RequestQueue, eventBus?: EventBus);
    execute(workflow: WorkflowDefinition, engineExecuteFn?: (taskType: string, payload: Record<string, unknown>, engineId: string) => Promise<Record<string, unknown>>): Promise<WorkflowResult>;
    cancel(workflowId: string): boolean;
    registerEngine(engineId: string, opts?: {
        weight?: number;
    }): void;
    deregisterEngine(engineId: string): boolean;
    private executeStep;
    private markRemainingSkipped;
}
//# sourceMappingURL=workflow-executor.d.ts.map