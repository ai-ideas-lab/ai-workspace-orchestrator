"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowScheduler = void 0;
const event_bus_js_1 = require("./event-bus.js");
const async_error_handler_js_1 = require("../utils/async-error-handler.js");
const errors_js_1 = require("../utils/errors.js");
class WorkflowScheduler {
    constructor(executor, eventBus) {
        this.schedules = new Map();
        this.workflowIndex = new Map();
        this.executor = executor;
        this.eventBus = eventBus ?? event_bus_js_1.EventBus.getInstance();
    }
    scheduleOnce(workflow, options = {}) {
        this.ensureNotScheduled(workflow.id);
        const delayMs = this.calculateDelay(options);
        const scheduleId = this.generateId('once');
        const entry = {
            id: scheduleId,
            workflowId: workflow.id,
            workflow,
            type: 'once',
            status: 'pending',
            executionCount: 0,
            maxExecutions: 1,
            createdAt: new Date(),
            nextRunAt: new Date(Date.now() + delayMs),
            lastRunAt: null,
            engineExecuteFn: options.engineExecuteFn,
        };
        entry.timer = setTimeout(async () => {
            await this.runEntry(entry);
        }, delayMs);
        if (entry.timer && typeof entry.timer === 'object' && 'unref' in entry.timer) {
            entry.timer.unref();
        }
        this.schedules.set(scheduleId, entry);
        this.workflowIndex.set(workflow.id, scheduleId);
        this.emitScheduleEvent('scheduler.once_created', scheduleId, workflow.id, { delayMs });
        return scheduleId;
    }
    scheduleRecurring(workflow, options) {
        this.ensureNotScheduled(workflow.id);
        if (!options.intervalMs || options.intervalMs < 1000) {
            throw new Error('intervalMs must be >= 1000ms');
        }
        const scheduleId = this.generateId('recur');
        const maxExecutions = options.maxExecutions ?? 0;
        const entry = {
            id: scheduleId,
            workflowId: workflow.id,
            workflow,
            type: 'recurring',
            status: 'pending',
            executionCount: 0,
            maxExecutions,
            createdAt: new Date(),
            nextRunAt: options.runImmediately ? new Date() : new Date(Date.now() + options.intervalMs),
            lastRunAt: null,
            engineExecuteFn: options.engineExecuteFn,
        };
        if (options.runImmediately) {
            setImmediate(async () => {
                await this.runEntry(entry);
                this.startInterval(entry, options.intervalMs);
            });
        }
        else {
            this.startInterval(entry, options.intervalMs);
        }
        this.schedules.set(scheduleId, entry);
        this.workflowIndex.set(workflow.id, scheduleId);
        this.emitScheduleEvent('scheduler.recurring_created', scheduleId, workflow.id, {
            intervalMs: options.intervalMs,
            maxExecutions,
        });
        return scheduleId;
    }
    cancel(workflowId) {
        const scheduleId = this.workflowIndex.get(workflowId);
        if (!scheduleId)
            return false;
        const entry = this.schedules.get(scheduleId);
        if (!entry)
            return false;
        this.clearEntryTimers(entry);
        entry.status = 'cancelled';
        entry.nextRunAt = null;
        this.emitScheduleEvent('scheduler.cancelled', scheduleId, workflowId, {});
        return true;
    }
    getSchedule(workflowId) {
        const scheduleId = this.workflowIndex.get(workflowId);
        if (!scheduleId)
            return null;
        const entry = this.schedules.get(scheduleId);
        if (!entry)
            return null;
        return this.entryToInfo(entry);
    }
    getActiveSchedules() {
        return [...this.schedules.values()]
            .filter((e) => e.status === 'pending' || e.status === 'running')
            .map((e) => this.entryToInfo(e));
    }
    getStats() {
        const entries = [...this.schedules.values()];
        return {
            totalScheduled: entries.length,
            activeCount: entries.filter((e) => e.status === 'pending' || e.status === 'running').length,
            completedCount: entries.filter((e) => e.status === 'completed').length,
            cancelledCount: entries.filter((e) => e.status === 'cancelled').length,
        };
    }
    shutdown() {
        for (const entry of this.schedules.values()) {
            this.clearEntryTimers(entry);
            if (entry.status === 'pending' || entry.status === 'running') {
                entry.status = 'cancelled';
                entry.nextRunAt = null;
            }
        }
        this.workflowIndex.clear();
    }
    async runEntry(entry) {
        if (entry.status === 'cancelled')
            return;
        entry.status = 'running';
        entry.lastRunAt = new Date();
        const context = {
            operation: `workflow_execute:${entry.workflowId}`,
            correlationId: entry.id,
            metadata: {
                workflowId: entry.workflowId,
                scheduleId: entry.id,
                scheduleType: entry.type,
                executionCount: entry.executionCount,
            },
        };
        try {
            const result = await async_error_handler_js_1.asyncErrorHandler.executeWithRetry(async () => {
                const executionResult = await this.executor.execute(entry.workflow, entry.engineExecuteFn);
                return executionResult;
            }, context, {
                maxRetries: 2,
                baseDelayMs: 1000,
                retryCondition: (error) => {
                    return (error instanceof errors_js_1.AppError &&
                        !error.isOperational &&
                        (error.message.includes('timeout') ||
                            error.message.includes('network') ||
                            error.message.includes('temporary')));
                },
            });
            entry.executionCount++;
            this.emitScheduleEvent('scheduler.executed', entry.id, entry.workflowId, {
                executionCount: entry.executionCount,
                workflowStatus: result.status,
                durationMs: result.durationMs,
                success: true,
            });
            if (entry.type === 'once') {
                entry.status = 'completed';
                entry.nextRunAt = null;
                this.clearEntryTimers(entry);
            }
            if (entry.type === 'recurring' && entry.maxExecutions > 0 && entry.executionCount >= entry.maxExecutions) {
                entry.status = 'completed';
                entry.nextRunAt = null;
                this.clearEntryTimers(entry);
            }
        }
        catch (err) {
            this.emitScheduleEvent('scheduler.execution_failed', entry.id, entry.workflowId, {
                error: err instanceof Error ? err.message : String(err),
                executionCount: entry.executionCount,
                isOperational: err instanceof errors_js_1.AppError ? err.isOperational : false,
            });
            if (entry.type === 'once') {
                entry.status = 'completed';
                entry.nextRunAt = null;
            }
        }
    }
    startInterval(entry, intervalMs) {
        const context = {
            operation: `workflow_interval:${entry.workflowId}`,
            userId: entry.workflow.userId,
            correlationId: `${entry.id}_interval`,
            metadata: {
                workflowId: entry.workflowId,
                scheduleId: entry.id,
                intervalMs,
            },
        };
        entry.interval = setInterval(async () => {
            try {
                if (entry.status === 'cancelled' || entry.status === 'completed') {
                    this.clearEntryTimers(entry);
                    return;
                }
                entry.nextRunAt = new Date(Date.now() + intervalMs);
                await async_error_handler_js_1.asyncErrorHandler.executeWithRetry(() => this.runEntry(entry), context, {
                    maxRetries: 1,
                    retryCondition: (error) => {
                        return error instanceof errors_js_1.AppError && !error.isOperational;
                    },
                });
            }
            catch (error) {
                console.error(`Interval execution failed for workflow ${entry.workflowId}:`, error);
                entry.nextRunAt = new Date(Date.now() + intervalMs);
                this.emitScheduleEvent('scheduler.interval_failed', entry.id, entry.workflowId, {
                    error: error instanceof Error ? error.message : String(error),
                    nextRunAt: entry.nextRunAt,
                });
            }
        }, intervalMs);
        if (typeof entry.interval === 'object' && 'unref' in entry.interval) {
            entry.interval.unref();
        }
    }
    calculateDelay(options) {
        if (options.delayMs !== undefined)
            return Math.max(0, options.delayMs);
        if (options.scheduledAt)
            return Math.max(0, options.scheduledAt.getTime() - Date.now());
        return 0;
    }
    ensureNotScheduled(workflowId) {
        const existingId = this.workflowIndex.get(workflowId);
        if (existingId) {
            const existing = this.schedules.get(existingId);
            if (existing && (existing.status === 'pending' || existing.status === 'running')) {
                throw new Error(`Workflow ${workflowId} already has an active schedule (${existingId})`);
            }
        }
    }
    clearEntryTimers(entry) {
        if (entry.timer) {
            clearTimeout(entry.timer);
            entry.timer = undefined;
        }
        if (entry.interval) {
            clearInterval(entry.interval);
            entry.interval = undefined;
        }
    }
    generateId(prefix) {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    }
    entryToInfo(entry) {
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
        };
    }
    emitScheduleEvent(type, scheduleId, workflowId, data) {
        try {
            this.eventBus.emit({
                type: type,
                scheduleId,
                workflowId,
                timestamp: new Date(),
                ...data,
            });
        }
        catch {
        }
    }
}
exports.WorkflowScheduler = WorkflowScheduler;
//# sourceMappingURL=workflow-scheduler.js.map