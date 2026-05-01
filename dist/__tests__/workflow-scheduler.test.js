"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const workflow_scheduler_1 = require("../services/workflow-scheduler");
const event_bus_1 = require("../services/event-bus");
function createTestWorkflow(id = 'wf-test') {
    return {
        id,
        name: `Test Workflow ${id}`,
        steps: [
            { id: 'step-1', name: 'Step 1', taskType: 'text', payload: {}, dependsOn: [] },
        ],
    };
}
function createMockExecutor() {
    return {
        execute: globals_1.jest.fn().mockResolvedValue({
            workflowId: 'wf-test',
            status: 'COMPLETED',
            steps: [],
            startedAt: new Date(),
            finishedAt: new Date(),
            durationMs: 100,
        }),
        registerEngine: globals_1.jest.fn(),
        cancel: globals_1.jest.fn(),
    };
}
(0, globals_1.describe)('WorkflowScheduler', () => {
    let scheduler;
    let executor;
    let eventBus;
    (0, globals_1.beforeEach)(() => {
        globals_1.jest.useFakeTimers();
        eventBus = event_bus_1.EventBus.getInstance();
        executor = createMockExecutor();
        scheduler = new workflow_scheduler_1.WorkflowScheduler(executor, eventBus);
    });
    (0, globals_1.afterEach)(() => {
        scheduler.shutdown();
        globals_1.jest.useRealTimers();
    });
    (0, globals_1.describe)('scheduleOnce()', () => {
        (0, globals_1.it)('应注册一次性调度并返回调度 ID', () => {
            const id = scheduler.scheduleOnce(createTestWorkflow(), { delayMs: 5000 });
            (0, globals_1.expect)(id).toMatch(/^once-\d+-[a-z0-9]+$/);
            const info = scheduler.getSchedule('wf-test');
            (0, globals_1.expect)(info).toBeDefined();
            (0, globals_1.expect)(info.type).toBe('once');
            (0, globals_1.expect)(info.status).toBe('pending');
            (0, globals_1.expect)(info.nextRunAt).toBeDefined();
        });
        (0, globals_1.it)('应在指定延迟后执行工作流', async () => {
            const wf = createTestWorkflow();
            scheduler.scheduleOnce(wf, { delayMs: 1000 });
            (0, globals_1.expect)(executor.execute).not.toHaveBeenCalled();
            await globals_1.jest.advanceTimersByTimeAsync(1000);
            (0, globals_1.expect)(executor.execute).toHaveBeenCalledTimes(1);
            (0, globals_1.expect)(executor.execute).toHaveBeenCalledWith(wf, undefined);
        });
        (0, globals_1.it)('执行完毕后状态应变为 completed', async () => {
            const wf = createTestWorkflow();
            scheduler.scheduleOnce(wf, { delayMs: 100 });
            await globals_1.jest.advanceTimersByTimeAsync(100);
            const info = scheduler.getSchedule('wf-test');
            (0, globals_1.expect)(info.status).toBe('completed');
            (0, globals_1.expect)(info.executionCount).toBe(1);
            (0, globals_1.expect)(info.nextRunAt).toBeNull();
        });
        (0, globals_1.it)('同一工作流不能重复调度', () => {
            scheduler.scheduleOnce(createTestWorkflow(), { delayMs: 5000 });
            (0, globals_1.expect)(() => {
                scheduler.scheduleOnce(createTestWorkflow(), { delayMs: 3000 });
            }).toThrow('already has an active schedule');
        });
        (0, globals_1.it)('支持 scheduledAt 绝对时间', () => {
            const futureDate = new Date(Date.now() + 10000);
            const id = scheduler.scheduleOnce(createTestWorkflow(), { scheduledAt: futureDate });
            const info = scheduler.getSchedule('wf-test');
            (0, globals_1.expect)(info).toBeDefined();
            (0, globals_1.expect)(info.nextRunAt.getTime()).toBeCloseTo(futureDate.getTime(), -2);
        });
    });
    (0, globals_1.describe)('scheduleRecurring()', () => {
        (0, globals_1.it)('应注册周期性调度', () => {
            const id = scheduler.scheduleRecurring(createTestWorkflow(), { intervalMs: 5000 });
            (0, globals_1.expect)(id).toMatch(/^recur-\d+-[a-z0-9]+$/);
            const info = scheduler.getSchedule('wf-test');
            (0, globals_1.expect)(info.type).toBe('recurring');
            (0, globals_1.expect)(info.status).toBe('pending');
            (0, globals_1.expect)(info.maxExecutions).toBe(0);
        });
        (0, globals_1.it)('应按间隔重复执行', async () => {
            const wf = createTestWorkflow();
            scheduler.scheduleRecurring(wf, { intervalMs: 2000 });
            await globals_1.jest.advanceTimersByTimeAsync(2000);
            (0, globals_1.expect)(executor.execute).toHaveBeenCalledTimes(1);
            await globals_1.jest.advanceTimersByTimeAsync(2000);
            (0, globals_1.expect)(executor.execute).toHaveBeenCalledTimes(2);
            await globals_1.jest.advanceTimersByTimeAsync(2000);
            (0, globals_1.expect)(executor.execute).toHaveBeenCalledTimes(3);
        });
        (0, globals_1.it)('达到 maxExecutions 后应停止', async () => {
            const wf = createTestWorkflow();
            scheduler.scheduleRecurring(wf, { intervalMs: 1000, maxExecutions: 2 });
            await globals_1.jest.advanceTimersByTimeAsync(1000);
            (0, globals_1.expect)(executor.execute).toHaveBeenCalledTimes(1);
            await globals_1.jest.advanceTimersByTimeAsync(1000);
            (0, globals_1.expect)(executor.execute).toHaveBeenCalledTimes(2);
            await globals_1.jest.advanceTimersByTimeAsync(1000);
            (0, globals_1.expect)(executor.execute).toHaveBeenCalledTimes(2);
            const info = scheduler.getSchedule('wf-test');
            (0, globals_1.expect)(info.status).toBe('completed');
            (0, globals_1.expect)(info.executionCount).toBe(2);
        });
        (0, globals_1.it)('intervalMs 小于 1000 应抛出错误', () => {
            (0, globals_1.expect)(() => {
                scheduler.scheduleRecurring(createTestWorkflow(), { intervalMs: 500 });
            }).toThrow('intervalMs must be >= 1000ms');
        });
        (0, globals_1.it)('runImmediately=true 应立即执行第一次', async () => {
            const wf = createTestWorkflow();
            scheduler.scheduleRecurring(wf, { intervalMs: 5000, runImmediately: true });
            await globals_1.jest.advanceTimersByTimeAsync(0);
            (0, globals_1.expect)(executor.execute).toHaveBeenCalledTimes(1);
        });
    });
    (0, globals_1.describe)('cancel()', () => {
        (0, globals_1.it)('应取消一次性调度', () => {
            scheduler.scheduleOnce(createTestWorkflow(), { delayMs: 10000 });
            const result = scheduler.cancel('wf-test');
            (0, globals_1.expect)(result).toBe(true);
            const info = scheduler.getSchedule('wf-test');
            (0, globals_1.expect)(info.status).toBe('cancelled');
        });
        (0, globals_1.it)('应取消周期性调度并停止执行', async () => {
            scheduler.scheduleRecurring(createTestWorkflow(), { intervalMs: 2000 });
            await globals_1.jest.advanceTimersByTimeAsync(2000);
            (0, globals_1.expect)(executor.execute).toHaveBeenCalledTimes(1);
            scheduler.cancel('wf-test');
            await globals_1.jest.advanceTimersByTimeAsync(2000);
            (0, globals_1.expect)(executor.execute).toHaveBeenCalledTimes(1);
        });
        (0, globals_1.it)('取消不存在的工作流应返回 false', () => {
            (0, globals_1.expect)(scheduler.cancel('nonexistent')).toBe(false);
        });
    });
    (0, globals_1.describe)('getStats() & getActiveSchedules()', () => {
        (0, globals_1.it)('应正确统计调度信息', async () => {
            scheduler.scheduleOnce(createTestWorkflow('wf-1'), { delayMs: 100 });
            scheduler.scheduleRecurring(createTestWorkflow('wf-2'), { intervalMs: 5000 });
            const stats = scheduler.getStats();
            (0, globals_1.expect)(stats.totalScheduled).toBe(2);
            (0, globals_1.expect)(stats.activeCount).toBe(2);
            (0, globals_1.expect)(stats.completedCount).toBe(0);
            (0, globals_1.expect)(stats.cancelledCount).toBe(0);
            await globals_1.jest.advanceTimersByTimeAsync(100);
            const stats2 = scheduler.getStats();
            (0, globals_1.expect)(stats2.completedCount).toBe(1);
            (0, globals_1.expect)(stats2.activeCount).toBe(1);
        });
        (0, globals_1.it)('getActiveSchedules 应只返回活跃调度', () => {
            scheduler.scheduleOnce(createTestWorkflow('wf-1'), { delayMs: 10000 });
            scheduler.scheduleOnce(createTestWorkflow('wf-2'), { delayMs: 10000 });
            const active = scheduler.getActiveSchedules();
            (0, globals_1.expect)(active).toHaveLength(2);
        });
    });
    (0, globals_1.describe)('shutdown()', () => {
        (0, globals_1.it)('应取消所有定时器', async () => {
            scheduler.scheduleOnce(createTestWorkflow('wf-1'), { delayMs: 10000 });
            scheduler.scheduleRecurring(createTestWorkflow('wf-2'), { intervalMs: 5000 });
            scheduler.shutdown();
            await globals_1.jest.advanceTimersByTimeAsync(10000);
            (0, globals_1.expect)(executor.execute).not.toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=workflow-scheduler.test.js.map