import { EventBus } from './event-bus.js';
export interface ContextSnapshot {
    workflowId: string;
    stepOutputs: Record<string, unknown>;
    variables: Record<string, unknown>;
    metadata: Record<string, unknown>;
    createdAt: Date;
    stepCount: number;
}
export interface ContextChangeEvent {
    type: 'step-output-set' | 'variable-set' | 'variable-deleted' | 'cleared';
    workflowId: string;
    key: string;
    value?: unknown;
    timestamp: Date;
}
export declare class WorkflowContext {
    readonly workflowId: string;
    private stepOutputs;
    private variables;
    private metadata;
    private changeLog;
    private eventBus;
    constructor(workflowId: string, eventBus?: EventBus);
    setStepOutput<T = unknown>(stepId: string, output: T): void;
    getStepOutput<T = unknown>(stepId: string): T | undefined;
    getStepOutputs<T = Record<string, unknown>>(stepIds: string[]): T;
    hasStepOutput(stepId: string): boolean;
    getCompletedStepIds(): string[];
    setVariable<T = unknown>(key: string, value: T): void;
    getVariable<T = unknown>(key: string): T | undefined;
    getVariableOrDefault<T = unknown>(key: string, defaultValue: T): T;
    deleteVariable(key: string): boolean;
    hasVariable(key: string): boolean;
    setMetadata(key: string, value: unknown): void;
    getMetadata(key: string): unknown;
    resolveExpression(expr: string): unknown;
    resolveObject<T = unknown>(obj: T): T;
    snapshot(): ContextSnapshot;
    restore(snapshot: ContextSnapshot): void;
    clear(): void;
    getChangeLog(): ContextChangeEvent[];
    getChangeCount(key: string): number;
    private resolvePath;
    private deepGet;
    private recordChange;
}
//# sourceMappingURL=workflow-context.d.ts.map