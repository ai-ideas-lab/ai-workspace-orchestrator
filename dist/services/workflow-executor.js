"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowExecutor = void 0;
const request_queue_js_1 = require("./request-queue.js");
const event_bus_js_1 = require("./event-bus.js");
class WorkflowExecutor {
    constructor(queue, eventBus) {
        this.activeWorkflows = new Map();
        this.cancelled = new Set();
        this.queue = queue ?? new request_queue_js_1.RequestQueue();
        this.eventBus = eventBus ?? event_bus_js_1.EventBus.getInstance();
    }
    async execute(workflow, engineExecuteFn) {
        const startedAt = new Date();
        const trackers = workflow.steps.map((step) => ({
            step,
            status: 'PENDING',
            result: {
                stepId: step.id,
                status: 'PENDING',
                retries: 0,
            },
            retries: 0,
        }));
        this.activeWorkflows.set(workflow.id, trackers);
        this.eventBus.emit({
            type: 'workflow.started',
            workflowId: workflow.id,
            stepCount: workflow.steps.length,
            timestamp: new Date(),
        });
        const maxIterations = workflow.steps.length * 3;
        for (let iteration = 0; iteration < maxIterations; iteration++) {
            if (this.cancelled.has(workflow.id)) {
                this.markRemainingSkipped(trackers);
                break;
            }
            const pending = trackers.filter((t) => t.status === 'PENDING');
            if (pending.length === 0)
                break;
            const ready = pending.filter((t) => t.step.dependsOn.every((depId) => {
                const dep = trackers.find((d) => d.step.id === depId);
                return dep && dep.status === 'SUCCEEDED';
            }));
            for (const t of pending) {
                const hasFailedDep = t.step.dependsOn.some((depId) => {
                    const dep = trackers.find((d) => d.step.id === depId);
                    return dep && (dep.status === 'FAILED' || dep.status === 'SKIPPED');
                });
                if (hasFailedDep && t.status === 'PENDING') {
                    t.status = 'SKIPPED';
                    t.result.status = 'SKIPPED';
                }
            }
            const promises = ready.map((tracker) => this.executeStep(workflow.id, tracker, workflow.defaultPriority ?? 'NORMAL', engineExecuteFn));
            if (promises.length > 0) {
                await Promise.all(promises);
            }
            else if (ready.length === 0) {
                const allPendingSkipped = pending.every((t) => t.status === 'SKIPPED' || t.status === 'FAILED');
                if (allPendingSkipped)
                    break;
                await new Promise((resolve) => setTimeout(resolve, 50));
            }
        }
        const finishedAt = new Date();
        const allSteps = trackers.map((t) => t.result);
        const hasFailure = allSteps.some((s) => s.status === 'FAILED');
        const wasCancelled = this.cancelled.has(workflow.id);
        const result = {
            workflowId: workflow.id,
            status: wasCancelled ? 'CANCELLED' : hasFailure ? 'FAILED' : 'COMPLETED',
            steps: allSteps,
            startedAt,
            finishedAt,
            durationMs: finishedAt.getTime() - startedAt.getTime(),
        };
        this.eventBus.emit({
            type: 'workflow.completed',
            workflowId: workflow.id,
            status: result.status,
            durationMs: result.durationMs,
            timestamp: new Date(),
        });
        this.activeWorkflows.delete(workflow.id);
        this.cancelled.delete(workflow.id);
        return result;
    }
    cancel(workflowId) {
        if (!this.activeWorkflows.has(workflowId))
            return false;
        this.cancelled.add(workflowId);
        this.eventBus.emit({
            type: 'workflow.cancelled',
            workflowId,
            timestamp: new Date(),
        });
        return true;
    }
    registerEngine(engineId, opts) {
        this.queue.registerEngine(engineId, opts);
    }
    deregisterEngine(engineId) {
        return this.queue.deregisterEngine(engineId);
    }
    async executeStep(workflowId, tracker, defaultPriority, engineExecuteFn) {
        const { step, result } = tracker;
        const maxRetries = step.maxRetries ?? 0;
        tracker.status = 'RUNNING';
        result.status = 'RUNNING';
        result.startedAt = new Date();
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            if (this.cancelled.has(workflowId)) {
                tracker.status = 'SKIPPED';
                result.status = 'SKIPPED';
                return;
            }
            this.queue.enqueue({ taskType: step.taskType, payload: step.payload }, step.priority ?? defaultPriority);
            const processResult = this.queue.processNext();
            if (!processResult) {
                tracker.status = 'FAILED';
                result.status = 'FAILED';
                result.error = 'No available engine (all circuit-broken or no engines registered)';
                result.finishedAt = new Date();
                return;
            }
            result.engineId = processResult.engineId;
            result.retries = attempt;
            try {
                let execResult;
                if (engineExecuteFn) {
                    execResult = await engineExecuteFn(step.taskType, step.payload, processResult.engineId);
                }
                else {
                    execResult = { ok: true, taskType: step.taskType, engineId: processResult.engineId };
                }
                this.queue.reportSuccess(processResult.engineId);
                tracker.status = 'SUCCEEDED';
                result.status = 'SUCCEEDED';
                result.result = execResult;
                result.finishedAt = new Date();
                return;
            }
            catch (err) {
                this.queue.reportFailure(processResult.engineId);
                result.error = err instanceof Error ? err.message : String(err);
                if (attempt < maxRetries) {
                    await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
                    continue;
                }
                tracker.status = 'FAILED';
                result.status = 'FAILED';
                result.finishedAt = new Date();
            }
        }
    }
    markRemainingSkipped(trackers) {
        for (const t of trackers) {
            if (t.status === 'PENDING' || t.status === 'RUNNING') {
                t.status = 'SKIPPED';
                t.result.status = 'SKIPPED';
                if (!t.result.finishedAt)
                    t.result.finishedAt = new Date();
            }
        }
    }
}
exports.WorkflowExecutor = WorkflowExecutor;
//# sourceMappingURL=workflow-executor.js.map