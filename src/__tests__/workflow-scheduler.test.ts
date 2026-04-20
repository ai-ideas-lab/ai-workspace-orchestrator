/**
 * WorkflowScheduler 单元测试
 *
 * 验证 scheduleOnce / scheduleRecurring / cancel / shutdown 的核心逻辑
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { WorkflowScheduler } from '../services/workflow-scheduler'.ts';
import { WorkflowExecutor, WorkflowDefinition } from '../services/workflow-executor'.ts';
import { EventBus } from '../services/event-bus'.ts';

// ── 测试用工作流定义 ────────────────────────────────────

function createTestWorkflow(id = 'wf-test'): WorkflowDefinition {
  return {
    id,
    name: `Test Workflow ${id}`,
    steps: [
      { id: 'step-1', name: 'Step 1', taskType: 'text', payload: {}, dependsOn: [] },
    ],
  };
}

// ── Mock WorkflowExecutor ──────────────────────────────

function createMockExecutor(): WorkflowExecutor {
  return {
    execute: jest.fn().mockResolvedValue({
      workflowId: 'wf-test',
      status: 'COMPLETED',
      steps: [],
      startedAt: new Date(),
      finishedAt: new Date(),
      durationMs: 100,
    }),
    registerEngine: jest.fn(),
    cancel: jest.fn(),
  } as unknown as WorkflowExecutor;
}

describe('WorkflowScheduler', () => {
  let scheduler: WorkflowScheduler;
  let executor: WorkflowExecutor;
  let eventBus: EventBus;

  beforeEach(() => {
    jest.useFakeTimers();
    eventBus = EventBus.getInstance();
    executor = createMockExecutor();
    scheduler = new WorkflowScheduler(executor, eventBus);
  });

  afterEach(() => {
    scheduler.shutdown();
    jest.useRealTimers();
  });

  // ── scheduleOnce ─────────────────────────────────────

  describe('scheduleOnce()', () => {
    it('应注册一次性调度并返回调度 ID', () => {
      const id = scheduler.scheduleOnce(createTestWorkflow(), { delayMs: 5000 });

      expect(id).toMatch(/^once-\d+-[a-z0-9]+$/);

      const info = scheduler.getSchedule('wf-test');
      expect(info).toBeDefined();
      expect(info!.type).toBe('once');
      expect(info!.status).toBe('pending');
      expect(info!.nextRunAt).toBeDefined();
    });

    it('应在指定延迟后执行工作流', async () => {
      const wf = createTestWorkflow();
      scheduler.scheduleOnce(wf, { delayMs: 1000 });

      expect(executor.execute).not.toHaveBeenCalled();

      await jest.advanceTimersByTimeAsync(1000);

      expect(executor.execute).toHaveBeenCalledTimes(1);
      expect(executor.execute).toHaveBeenCalledWith(wf, undefined);
    });

    it('执行完毕后状态应变为 completed', async () => {
      const wf = createTestWorkflow();
      scheduler.scheduleOnce(wf, { delayMs: 100 });

      await jest.advanceTimersByTimeAsync(100);

      const info = scheduler.getSchedule('wf-test');
      expect(info!.status).toBe('completed');
      expect(info!.executionCount).toBe(1);
      expect(info!.nextRunAt).toBeNull();
    });

    it('同一工作流不能重复调度', () => {
      scheduler.scheduleOnce(createTestWorkflow(), { delayMs: 5000 });
      expect(() => {
        scheduler.scheduleOnce(createTestWorkflow(), { delayMs: 3000 });
      }).toThrow('already has an active schedule');
    });

    it('支持 scheduledAt 绝对时间', () => {
      const futureDate = new Date(Date.now() + 10000);
      const id = scheduler.scheduleOnce(createTestWorkflow(), { scheduledAt: futureDate });

      const info = scheduler.getSchedule('wf-test');
      expect(info).toBeDefined();
      expect(info!.nextRunAt!.getTime()).toBeCloseTo(futureDate.getTime(), -2);
    });
  });

  // ── scheduleRecurring ───────────────────────────────

  describe('scheduleRecurring()', () => {
    it('应注册周期性调度', () => {
      const id = scheduler.scheduleRecurring(createTestWorkflow(), { intervalMs: 5000 });

      expect(id).toMatch(/^recur-\d+-[a-z0-9]+$/);

      const info = scheduler.getSchedule('wf-test');
      expect(info!.type).toBe('recurring');
      expect(info!.status).toBe('pending');
      expect(info!.maxExecutions).toBe(0);
    });

    it('应按间隔重复执行', async () => {
      const wf = createTestWorkflow();
      scheduler.scheduleRecurring(wf, { intervalMs: 2000 });

      // 第一次执行
      await jest.advanceTimersByTimeAsync(2000);
      expect(executor.execute).toHaveBeenCalledTimes(1);

      // 第二次执行
      await jest.advanceTimersByTimeAsync(2000);
      expect(executor.execute).toHaveBeenCalledTimes(2);

      // 第三次执行
      await jest.advanceTimersByTimeAsync(2000);
      expect(executor.execute).toHaveBeenCalledTimes(3);
    });

    it('达到 maxExecutions 后应停止', async () => {
      const wf = createTestWorkflow();
      scheduler.scheduleRecurring(wf, { intervalMs: 1000, maxExecutions: 2 });

      await jest.advanceTimersByTimeAsync(1000);
      expect(executor.execute).toHaveBeenCalledTimes(1);

      await jest.advanceTimersByTimeAsync(1000);
      expect(executor.execute).toHaveBeenCalledTimes(2);

      // 不应该有第三次
      await jest.advanceTimersByTimeAsync(1000);
      expect(executor.execute).toHaveBeenCalledTimes(2);

      const info = scheduler.getSchedule('wf-test');
      expect(info!.status).toBe('completed');
      expect(info!.executionCount).toBe(2);
    });

    it('intervalMs 小于 1000 应抛出错误', () => {
      expect(() => {
        scheduler.scheduleRecurring(createTestWorkflow(), { intervalMs: 500 });
      }).toThrow('intervalMs must be >= 1000ms');
    });

    it('runImmediately=true 应立即执行第一次', async () => {
      const wf = createTestWorkflow();
      scheduler.scheduleRecurring(wf, { intervalMs: 5000, runImmediately: true });

      // setImmediate 触发
      await jest.advanceTimersByTimeAsync(0);
      expect(executor.execute).toHaveBeenCalledTimes(1);
    });
  });

  // ── cancel ───────────────────────────────────────────

  describe('cancel()', () => {
    it('应取消一次性调度', () => {
      scheduler.scheduleOnce(createTestWorkflow(), { delayMs: 10000 });

      const result = scheduler.cancel('wf-test');
      expect(result).toBe(true);

      const info = scheduler.getSchedule('wf-test');
      expect(info!.status).toBe('cancelled');
    });

    it('应取消周期性调度并停止执行', async () => {
      scheduler.scheduleRecurring(createTestWorkflow(), { intervalMs: 2000 });

      await jest.advanceTimersByTimeAsync(2000);
      expect(executor.execute).toHaveBeenCalledTimes(1);

      scheduler.cancel('wf-test');

      await jest.advanceTimersByTimeAsync(2000);
      // 不应该再执行
      expect(executor.execute).toHaveBeenCalledTimes(1);
    });

    it('取消不存在的工作流应返回 false', () => {
      expect(scheduler.cancel('nonexistent')).toBe(false);
    });
  });

  // ── 统计和查询 ──────────────────────────────────────

  describe('getStats() & getActiveSchedules()', () => {
    it('应正确统计调度信息', async () => {
      scheduler.scheduleOnce(createTestWorkflow('wf-1'), { delayMs: 100 });
      scheduler.scheduleRecurring(createTestWorkflow('wf-2'), { intervalMs: 5000 });

      const stats = scheduler.getStats();
      expect(stats.totalScheduled).toBe(2);
      expect(stats.activeCount).toBe(2);
      expect(stats.completedCount).toBe(0);
      expect(stats.cancelledCount).toBe(0);

      // 完成 wf-1
      await jest.advanceTimersByTimeAsync(100);

      const stats2 = scheduler.getStats();
      expect(stats2.completedCount).toBe(1);
      expect(stats2.activeCount).toBe(1);
    });

    it('getActiveSchedules 应只返回活跃调度', () => {
      scheduler.scheduleOnce(createTestWorkflow('wf-1'), { delayMs: 10000 });
      scheduler.scheduleOnce(createTestWorkflow('wf-2'), { delayMs: 10000 });

      const active = scheduler.getActiveSchedules();
      expect(active).toHaveLength(2);
    });
  });

  // ── shutdown ─────────────────────────────────────────

  describe('shutdown()', () => {
    it('应取消所有定时器', async () => {
      scheduler.scheduleOnce(createTestWorkflow('wf-1'), { delayMs: 10000 });
      scheduler.scheduleRecurring(createTestWorkflow('wf-2'), { intervalMs: 5000 });

      scheduler.shutdown();

      await jest.advanceTimersByTimeAsync(10000);

      expect(executor.execute).not.toHaveBeenCalled();
    });
  });
});
