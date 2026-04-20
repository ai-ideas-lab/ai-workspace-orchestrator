import { WorkflowExecutor, WorkflowDefinition } from './workflow-executor.js';
import { EventBus } from './event-bus.js';
export type ScheduleType = 'once' | 'recurring';
export interface OnceScheduleOptions {
    delayMs?: number;
    scheduledAt?: Date;
    engineExecuteFn?: (taskType: string, payload: Record<string, unknown>, engineId: string) => Promise<Record<string, unknown>>;
}
export interface RecurringScheduleOptions {
    intervalMs: number;
    runImmediately?: boolean;
    maxExecutions?: number;
    engineExecuteFn?: (taskType: string, payload: Record<string, unknown>, engineId: string) => Promise<Record<string, unknown>>;
}
interface ScheduledEntry {
    id: string;
    workflowId: string;
    workflow: WorkflowDefinition;
    type: ScheduleType;
    status: 'pending' | 'running' | 'completed' | 'cancelled';
    timer?: NodeJS.Timeout;
    interval?: NodeJS.Timeout;
    executionCount: number;
    maxExecutions: number;
    createdAt: Date;
    nextRunAt: Date | null;
    lastRunAt: Date | null;
    engineExecuteFn?: OnceScheduleOptions['engineExecuteFn'];
}
export interface ScheduleInfo {
    id: string;
    workflowId: string;
    type: ScheduleType;
    status: ScheduledEntry['status'];
    executionCount: number;
    maxExecutions: number;
    createdAt: Date;
    nextRunAt: Date | null;
    lastRunAt: Date | null;
}
export interface SchedulerStats {
    totalScheduled: number;
    activeCount: number;
    completedCount: number;
    cancelledCount: number;
}
export declare class WorkflowScheduler {
    private executor;
    private eventBus;
    private schedules;
    private workflowIndex;
    constructor(executor: WorkflowExecutor, eventBus?: EventBus);
    scheduleOnce(workflow: WorkflowDefinition, options?: OnceScheduleOptions): string;
    scheduleRecurring(workflow: WorkflowDefinition, options: RecurringScheduleOptions): string;
    cancel(workflowId: string): boolean;
    getSchedule(workflowId: string): ScheduleInfo | null;
    getActiveSchedules(): ScheduleInfo[];
    getStats(): SchedulerStats;
    shutdown(): void;
    private runEntry;
    private startInterval;
    private calculateDelay;
    private ensureNotScheduled;
    private clearEntryTimers;
    private generateId;
    private entryToInfo;
    private emitScheduleEvent;
}
export {};
//# sourceMappingURL=workflow-scheduler.d.ts.map