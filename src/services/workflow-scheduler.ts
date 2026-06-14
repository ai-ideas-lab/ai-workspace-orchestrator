import { EventBus } from "./event-bus.js";
import {
  WorkflowDefinition,
  WorkflowExecutor,
  WorkflowResult,
} from "./workflow-executor.js";

export type ScheduleType = "once" | "recurring";
type EngineExecute = (
  taskType: string,
  payload: Record<string, unknown>,
  engineId: string,
) => Promise<Record<string, unknown>>;

export interface OnceScheduleOptions {
  delayMs?: number;
  scheduledAt?: Date;
  engineExecuteFn?: EngineExecute;
}

export interface RecurringScheduleOptions {
  intervalMs: number;
  runImmediately?: boolean;
  maxExecutions?: number;
  engineExecuteFn?: EngineExecute;
}

interface ScheduledEntry {
  id: string;
  workflowId: string;
  workflow: WorkflowDefinition;
  type: ScheduleType;
  status: "pending" | "running" | "completed" | "cancelled";
  timer?: NodeJS.Timeout;
  executionCount: number;
  maxExecutions: number;
  createdAt: Date;
  nextRunAt: Date | null;
  lastRunAt: Date | null;
  intervalMs?: number;
  engineExecuteFn?: EngineExecute;
  lastResult?: WorkflowResult;
}

export type ScheduleInfo = Omit<
  ScheduledEntry,
  "workflow" | "timer" | "engineExecuteFn" | "intervalMs"
>;

export interface SchedulerStats {
  totalScheduled: number;
  activeCount: number;
  completedCount: number;
  cancelledCount: number;
}

export class WorkflowScheduler {
  private readonly schedules = new Map<string, ScheduledEntry>();
  private readonly workflowIndex = new Map<string, string>();

  constructor(
    private readonly executor: WorkflowExecutor,
    private readonly eventBus: EventBus = EventBus.getInstance(),
  ) {}

  scheduleOnce(workflow: WorkflowDefinition, options: OnceScheduleOptions = {}): string {
    this.ensureNotScheduled(workflow.id);
    const delayMs =
      options.delayMs ??
      (options.scheduledAt ? Math.max(0, options.scheduledAt.getTime() - Date.now()) : 0);
    const entry = this.createEntry(workflow, "once", 1, options.engineExecuteFn);
    entry.nextRunAt = new Date(Date.now() + Math.max(0, delayMs));
    this.register(entry);
    entry.timer = this.createTimer(entry, Math.max(0, delayMs));
    return entry.id;
  }

  scheduleRecurring(
    workflow: WorkflowDefinition,
    options: RecurringScheduleOptions,
  ): string {
    if (options.intervalMs < 1000) {
      throw new Error("intervalMs must be >= 1000ms");
    }
    this.ensureNotScheduled(workflow.id);
    const entry = this.createEntry(
      workflow,
      "recurring",
      Math.max(0, options.maxExecutions ?? 0),
      options.engineExecuteFn,
    );
    entry.intervalMs = options.intervalMs;
    entry.nextRunAt = options.runImmediately ? new Date() : new Date(Date.now() + options.intervalMs);
    this.register(entry);
    entry.timer = this.createTimer(entry, options.runImmediately ? 0 : options.intervalMs);
    return entry.id;
  }

  cancel(workflowId: string): boolean {
    const entry = this.getEntry(workflowId);
    if (!entry || entry.status === "completed" || entry.status === "cancelled") {
      return false;
    }
    this.clearTimer(entry);
    entry.status = "cancelled";
    entry.nextRunAt = null;
    this.eventBus.emit({ type: "scheduler.cancelled", workflowId, scheduleId: entry.id } as never);
    return true;
  }

  getSchedule(workflowId: string): ScheduleInfo | null {
    const entry = this.getEntry(workflowId);
    return entry ? this.toInfo(entry) : null;
  }

  getActiveSchedules(): ScheduleInfo[] {
    return [...this.schedules.values()]
      .filter(({ status }) => status === "pending" || status === "running")
      .map((entry) => this.toInfo(entry));
  }

  getStats(): SchedulerStats {
    const entries = [...this.schedules.values()];
    return {
      totalScheduled: entries.length,
      activeCount: entries.filter(({ status }) => status === "pending" || status === "running")
        .length,
      completedCount: entries.filter(({ status }) => status === "completed").length,
      cancelledCount: entries.filter(({ status }) => status === "cancelled").length,
    };
  }

  shutdown(): void {
    for (const entry of this.schedules.values()) {
      this.clearTimer(entry);
      if (entry.status === "pending" || entry.status === "running") {
        entry.status = "cancelled";
        entry.nextRunAt = null;
      }
    }
  }

  private createEntry(
    workflow: WorkflowDefinition,
    type: ScheduleType,
    maxExecutions: number,
    engineExecuteFn?: EngineExecute,
  ): ScheduledEntry {
    return {
      id: `${type === "once" ? "once" : "recur"}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,
      workflowId: workflow.id,
      workflow,
      type,
      status: "pending",
      executionCount: 0,
      maxExecutions,
      createdAt: new Date(),
      nextRunAt: null,
      lastRunAt: null,
      ...(engineExecuteFn ? { engineExecuteFn } : {}),
    };
  }

  private register(entry: ScheduledEntry): void {
    this.schedules.set(entry.id, entry);
    this.workflowIndex.set(entry.workflowId, entry.id);
  }

  private createTimer(entry: ScheduledEntry, delayMs: number): NodeJS.Timeout {
    const timer = setTimeout(() => {
      void this.runEntry(entry);
    }, delayMs);
    timer.unref();
    return timer;
  }

  private async runEntry(entry: ScheduledEntry): Promise<void> {
    if (entry.status === "cancelled" || entry.status === "completed") {
      return;
    }
    entry.status = "running";
    entry.lastRunAt = new Date();

    try {
      entry.lastResult = await this.executor.execute(entry.workflow, entry.engineExecuteFn);
      entry.executionCount += 1;
      this.eventBus.emit({
        type: "scheduler.executed",
        workflowId: entry.workflowId,
        scheduleId: entry.id,
        status: entry.lastResult.status,
      } as never);
    } finally {
      const reachedLimit = entry.maxExecutions > 0 && entry.executionCount >= entry.maxExecutions;
      if (entry.type === "once" || reachedLimit) {
        entry.status = "completed";
        entry.nextRunAt = null;
        this.clearTimer(entry);
      } else if (this.isActive(entry) && entry.intervalMs) {
        entry.status = "pending";
        entry.nextRunAt = new Date(Date.now() + entry.intervalMs);
        entry.timer = this.createTimer(entry, entry.intervalMs);
      }
    }
  }

  private getEntry(workflowId: string): ScheduledEntry | undefined {
    const scheduleId = this.workflowIndex.get(workflowId);
    return scheduleId ? this.schedules.get(scheduleId) : undefined;
  }

  private ensureNotScheduled(workflowId: string): void {
    const entry = this.getEntry(workflowId);
    if (entry && (entry.status === "pending" || entry.status === "running")) {
      throw new Error(`Workflow ${workflowId} already has an active schedule (${entry.id})`);
    }
  }

  private clearTimer(entry: ScheduledEntry): void {
    if (entry.timer) {
      clearTimeout(entry.timer);
      delete entry.timer;
    }
  }

  private isActive(entry: ScheduledEntry): boolean {
    return entry.status !== "cancelled" && entry.status !== "completed";
  }

  private toInfo(entry: ScheduledEntry): ScheduleInfo {
    return {
      id: entry.id,
      workflowId: entry.workflowId,
      type: entry.type,
      status: entry.status,
      executionCount: entry.executionCount,
      maxExecutions: entry.maxExecutions,
      createdAt: entry.createdAt,
      nextRunAt: entry.nextRunAt,
      lastRunAt: entry.lastRunAt,
      ...(entry.lastResult ? { lastResult: entry.lastResult } : {}),
    };
  }
}
