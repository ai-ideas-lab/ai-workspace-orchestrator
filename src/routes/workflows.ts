import { Router } from "express";
import { WorkflowDependencyAnalyzer } from "../services/workflow-dependency-analyzer.js";
import { WorkflowExecutor, WorkflowStep } from "../services/workflow-executor.js";
import { WorkflowScheduler } from "../services/workflow-scheduler.js";
import { WorkflowInput, WorkflowStore } from "../services/workflow-store.js";

function isWorkflowInput(value: unknown): value is WorkflowInput {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Partial<WorkflowInput>;
  return (
    typeof candidate.name === "string" &&
    Array.isArray(candidate.steps) &&
    candidate.steps.length > 0 &&
    candidate.steps.every(isWorkflowStep)
  );
}

function isWorkflowStep(value: unknown): value is WorkflowStep {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Partial<WorkflowStep>;
  return (
    typeof candidate.id === "string" &&
    candidate.id.trim().length > 0 &&
    typeof candidate.name === "string" &&
    candidate.name.trim().length > 0 &&
    typeof candidate.taskType === "string" &&
    candidate.taskType.trim().length > 0 &&
    !!candidate.payload &&
    typeof candidate.payload === "object" &&
    !Array.isArray(candidate.payload) &&
    Array.isArray(candidate.dependsOn) &&
    candidate.dependsOn.every((dependency) => typeof dependency === "string")
  );
}

function isNonNegativeInteger(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}

export function createWorkflowRouter(
  store: WorkflowStore,
  executor: WorkflowExecutor,
  scheduler: WorkflowScheduler,
): Router {
  const router = Router();
  const analyzer = new WorkflowDependencyAnalyzer();

  router.get("/", (_request, response) => {
    response.json({ success: true, data: store.list() });
  });

  router.post("/validate", (request, response) => {
    const steps = request.body?.steps;
    if (!Array.isArray(steps) || steps.length === 0 || !steps.every(isWorkflowStep)) {
      response.status(400).json({
        success: false,
        error: { code: "INVALID_WORKFLOW", message: "steps must contain valid workflow steps" },
      });
      return;
    }
    const report = analyzer.validate(steps);
    response.status(report.valid ? 200 : 422).json({ success: report.valid, data: report });
  });

  router.post("/", (request, response) => {
    if (!isWorkflowInput(request.body) || !request.body.name.trim()) {
      response.status(400).json({
        success: false,
        error: { code: "INVALID_WORKFLOW", message: "name and steps are required" },
      });
      return;
    }
    const report = analyzer.validate(request.body.steps);
    if (!report.valid) {
      response.status(422).json({
        success: false,
        error: { code: "INVALID_WORKFLOW", message: "Workflow is not a valid DAG", details: report },
      });
      return;
    }
    response.status(201).json({ success: true, data: store.create(request.body) });
  });

  router.post("/:id/clone", (request, response) => {
    const cloned = store.clone(request.params["id"] ?? "", request.body?.name);
    if (!cloned) {
      response.status(404).json({ success: false, error: { code: "NOT_FOUND" } });
      return;
    }
    response.status(201).json({ success: true, data: cloned });
  });

  router.post("/:id/execute", async (request, response, next) => {
    try {
      const workflow = store.get(request.params["id"] ?? "");
      if (!workflow) {
        response.status(404).json({ success: false, error: { code: "NOT_FOUND" } });
        return;
      }
      const result = await executor.execute(workflow);
      response.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:id/schedule", (request, response) => {
    const workflow = store.get(request.params["id"] ?? "");
    if (!workflow) {
      response.status(404).json({ success: false, error: { code: "NOT_FOUND" } });
      return;
    }
    const { type = "once", delayMs = 0, intervalMs, maxExecutions } = request.body ?? {};
    if (type !== "once" && type !== "recurring") {
      response.status(400).json({
        success: false,
        error: { code: "INVALID_SCHEDULE", message: "type must be once or recurring" },
      });
      return;
    }

    let scheduleId: string;
    if (type === "recurring") {
      const parsedInterval = Number(intervalMs);
      const parsedMaximum = Number(maxExecutions ?? 0);
      if (
        !Number.isFinite(parsedInterval) ||
        parsedInterval < 1000 ||
        !isNonNegativeInteger(parsedMaximum)
      ) {
        response.status(400).json({
          success: false,
          error: {
            code: "INVALID_SCHEDULE",
            message: "intervalMs must be >= 1000 and maxExecutions must be a non-negative integer",
          },
        });
        return;
      }
      scheduleId = scheduler.scheduleRecurring(workflow, {
        intervalMs: parsedInterval,
        maxExecutions: parsedMaximum,
      });
    } else {
      const parsedDelay = Number(delayMs);
      if (!Number.isFinite(parsedDelay) || parsedDelay < 0) {
        response.status(400).json({
          success: false,
          error: { code: "INVALID_SCHEDULE", message: "delayMs must be a non-negative number" },
        });
        return;
      }
      scheduleId = scheduler.scheduleOnce(workflow, { delayMs: parsedDelay });
    }
    response.status(201).json({ success: true, data: { scheduleId } });
  });

  router.get("/:id/schedule", (request, response) => {
    const schedule = scheduler.getSchedule(request.params["id"] ?? "");
    response.status(schedule ? 200 : 404).json(
      schedule
        ? { success: true, data: schedule }
        : { success: false, error: { code: "NOT_FOUND" } },
    );
  });

  router.delete("/:id/schedule", (request, response) => {
    const cancelled = scheduler.cancel(request.params["id"] ?? "");
    response.status(cancelled ? 204 : 404).send();
  });

  router.get("/:id", (request, response) => {
    const workflow = store.get(request.params["id"] ?? "");
    response.status(workflow ? 200 : 404).json(
      workflow
        ? { success: true, data: workflow }
        : { success: false, error: { code: "NOT_FOUND" } },
    );
  });

  router.put("/:id", (request, response) => {
    if (
      (request.body?.name !== undefined &&
        (typeof request.body.name !== "string" || !request.body.name.trim())) ||
      (request.body?.steps !== undefined &&
        (!Array.isArray(request.body.steps) ||
          request.body.steps.length === 0 ||
          !request.body.steps.every(isWorkflowStep)))
    ) {
      response.status(400).json({
        success: false,
        error: { code: "INVALID_WORKFLOW", message: "Invalid workflow update" },
      });
      return;
    }
    if (request.body?.steps !== undefined) {
      const report = analyzer.validate(request.body.steps);
      if (!report.valid) {
        response.status(422).json({
          success: false,
          error: { code: "INVALID_WORKFLOW", message: "Workflow is not a valid DAG", details: report },
        });
        return;
      }
    }
    const updated = store.update(request.params["id"] ?? "", request.body ?? {});
    response.status(updated ? 200 : 404).json(
      updated
        ? { success: true, data: updated }
        : { success: false, error: { code: "NOT_FOUND" } },
    );
  });

  router.delete("/:id", (request, response) => {
    response.status(store.delete(request.params["id"] ?? "") ? 204 : 404).send();
  });

  return router;
}
