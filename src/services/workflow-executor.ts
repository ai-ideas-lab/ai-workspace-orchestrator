import { EventBus } from "./event-bus.js";

export type RequestPriority = "LOW" | "NORMAL" | "HIGH" | "CRITICAL";
export type StepStatus = "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED" | "SKIPPED";

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
  status: "COMPLETED" | "FAILED" | "CANCELLED";
  steps: StepResult[];
  startedAt: Date;
  finishedAt: Date;
  durationMs: number;
}

type EngineExecute = (
  taskType: string,
  payload: Record<string, unknown>,
  engineId: string,
) => Promise<Record<string, unknown>>;

interface StepTracker {
  step: WorkflowStep;
  result: StepResult;
}

export class WorkflowExecutor {
  private readonly eventBus: EventBus;
  private readonly engines = new Map<string, number>();
  private readonly activeWorkflows = new Map<string, StepTracker[]>();
  private readonly cancelled = new Set<string>();
  private engineCursor = 0;

  constructor(_queue?: unknown, eventBus?: EventBus) {
    this.eventBus = eventBus ?? EventBus.getInstance();
  }

  registerEngine(engineId: string, options: { weight?: number } = {}): void {
    if (!engineId.trim()) {
      throw new Error("engineId is required");
    }
    this.engines.set(engineId, Math.max(1, options.weight ?? 1));
  }

  deregisterEngine(engineId: string): boolean {
    return this.engines.delete(engineId);
  }

  cancel(workflowId: string): boolean {
    if (!this.activeWorkflows.has(workflowId)) {
      return false;
    }
    this.cancelled.add(workflowId);
    this.eventBus.emit({ type: "workflow.cancelled", workflowId } as never);
    return true;
  }

  async execute(workflow: WorkflowDefinition, executeEngine?: EngineExecute): Promise<WorkflowResult> {
    this.validateWorkflow(workflow);

    const startedAt = new Date();
    const trackers = workflow.steps.map<StepTracker>((step) => ({
      step,
      result: { stepId: step.id, status: "PENDING", retries: 0 },
    }));
    this.activeWorkflows.set(workflow.id, trackers);
    this.eventBus.emit({
      type: "workflow.started",
      workflowId: workflow.id,
      stepCount: workflow.steps.length,
    } as never);

    try {
      while (trackers.some(({ result }) => result.status === "PENDING")) {
        if (this.cancelled.has(workflow.id)) {
          this.skipPending(trackers);
          break;
        }

        this.skipBlocked(trackers);
        const ready = trackers.filter(
          ({ step, result }) =>
            result.status === "PENDING" &&
            step.dependsOn.every(
              (dependencyId) =>
                trackers.find(({ step: candidate }) => candidate.id === dependencyId)?.result
                  .status === "SUCCEEDED",
            ),
        );

        if (ready.length === 0) {
          break;
        }

        await Promise.all(
          ready.map((tracker) => this.executeStep(workflow.id, tracker, executeEngine)),
        );
      }

      const finishedAt = new Date();
      const results = trackers.map(({ result }) => result);
      const status = this.cancelled.has(workflow.id)
        ? "CANCELLED"
        : results.some((result) => result.status === "FAILED")
          ? "FAILED"
          : "COMPLETED";
      const workflowResult: WorkflowResult = {
        workflowId: workflow.id,
        status,
        steps: results,
        startedAt,
        finishedAt,
        durationMs: finishedAt.getTime() - startedAt.getTime(),
      };

      this.eventBus.emit({
        type: "workflow.completed",
        workflowId: workflow.id,
        status,
        durationMs: workflowResult.durationMs,
      } as never);
      return workflowResult;
    } finally {
      this.activeWorkflows.delete(workflow.id);
      this.cancelled.delete(workflow.id);
    }
  }

  private async executeStep(
    workflowId: string,
    tracker: StepTracker,
    executeEngine?: EngineExecute,
  ): Promise<void> {
    const { step, result } = tracker;
    const maxRetries = Math.max(0, step.maxRetries ?? 0);
    result.status = "RUNNING";
    result.startedAt = new Date();

    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      if (this.cancelled.has(workflowId)) {
        result.status = "SKIPPED";
        result.finishedAt = new Date();
        return;
      }

      const engineId = this.selectEngine();
      result.engineId = engineId;
      result.retries = attempt;

      try {
        result.result = executeEngine
          ? await executeEngine(step.taskType, step.payload, engineId)
          : { ok: true, taskType: step.taskType, engineId };
        result.status = "SUCCEEDED";
        result.finishedAt = new Date();
        return;
      } catch (error) {
        result.error = error instanceof Error ? error.message : String(error);
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 10 * (attempt + 1)));
        }
      }
    }

    result.status = "FAILED";
    result.finishedAt = new Date();
  }

  private selectEngine(): string {
    const weighted = [...this.engines.entries()].flatMap(([engineId, weight]) =>
      Array.from({ length: Math.min(weight, 100) }, () => engineId),
    );
    if (weighted.length === 0) {
      return "default";
    }
    const engineId = weighted[this.engineCursor % weighted.length] ?? "default";
    this.engineCursor += 1;
    return engineId;
  }

  private skipBlocked(trackers: StepTracker[]): void {
    for (const tracker of trackers) {
      if (tracker.result.status !== "PENDING") {
        continue;
      }
      const blocked = tracker.step.dependsOn.some((dependencyId) => {
        const dependency = trackers.find(({ step }) => step.id === dependencyId);
        return dependency?.result.status === "FAILED" || dependency?.result.status === "SKIPPED";
      });
      if (blocked) {
        tracker.result.status = "SKIPPED";
        tracker.result.finishedAt = new Date();
      }
    }
  }

  private skipPending(trackers: StepTracker[]): void {
    for (const tracker of trackers) {
      if (tracker.result.status === "PENDING" || tracker.result.status === "RUNNING") {
        tracker.result.status = "SKIPPED";
        tracker.result.finishedAt = new Date();
      }
    }
  }

  private validateWorkflow(workflow: WorkflowDefinition): void {
    if (!workflow.id || !workflow.name || !Array.isArray(workflow.steps)) {
      throw new Error("Workflow id, name and steps are required");
    }

    const ids = new Set<string>();
    for (const step of workflow.steps) {
      if (!step.id || !step.name || !step.taskType || !Array.isArray(step.dependsOn)) {
        throw new Error("Each workflow step requires id, name, taskType and dependsOn");
      }
      if (ids.has(step.id)) {
        throw new Error(`Duplicate workflow step id: ${step.id}`);
      }
      ids.add(step.id);
    }

    for (const step of workflow.steps) {
      for (const dependencyId of step.dependsOn) {
        if (!ids.has(dependencyId)) {
          throw new Error(`Unknown dependency ${dependencyId} for step ${step.id}`);
        }
      }
    }

    const visiting = new Set<string>();
    const visited = new Set<string>();
    const byId = new Map(workflow.steps.map((step) => [step.id, step]));
    const visit = (stepId: string): void => {
      if (visiting.has(stepId)) {
        throw new Error("Workflow contains a dependency cycle");
      }
      if (visited.has(stepId)) {
        return;
      }
      visiting.add(stepId);
      for (const dependencyId of byId.get(stepId)?.dependsOn ?? []) {
        visit(dependencyId);
      }
      visiting.delete(stepId);
      visited.add(stepId);
    };
    for (const step of workflow.steps) {
      visit(step.id);
    }
  }
}
