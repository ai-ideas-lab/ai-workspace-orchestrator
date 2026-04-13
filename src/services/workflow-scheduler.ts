/**
 * WorkflowScheduler - 工作流定时调度器
 *
 * 支持一次性定时执行和周期性重复执行工作流。
 * 基于 setTimeout / setInterval 实现，适合单进程场景。
 * 生产环境可替换为 Bull/BullMQ 等持久化队列。
 *
 * 核心函数:
 *   1. scheduleOnce()    — 一次性定时执行（延迟 ms 或指定时间）
 *   2. scheduleRecurring() — 周期性重复执行
 *
 * 使用方式:
 *   const scheduler = new WorkflowScheduler(executor);
 *   scheduler.scheduleOnce('wf-123', { delayMs: 60_000 });
 *   scheduler.scheduleRecurring('wf-456', { intervalMs: 300_000 });
 *   scheduler.cancel('wf-123');
 *   scheduler.shutdown();
 */

import { WorkflowExecutor, WorkflowDefinition } from './workflow-executor.js';
import { EventBus } from './event-bus.js';
import { asyncErrorHandler, AsyncOperationContext } from '../utils/async-error-handler.js';
import { AppError, WorkflowError } from '../utils/errors.js';

// ── 类型定义 ────────────────────────────────────────────

export type ScheduleType = 'once' | 'recurring';

export interface OnceScheduleOptions {
  /** 延迟执行时间（ms），与 scheduledAt 二选一 */
  delayMs?: number;
  /** 定时执行时间（绝对时间），与 delayMs 二选一 */
  scheduledAt?: Date;
  /** 传给 executor.execute 的引擎执行函数 */
  engineExecuteFn?: (taskType: string, payload: Record<string, unknown>, engineId: string) => Promise<Record<string, unknown>>;
}

export interface RecurringScheduleOptions {
  /** 重复间隔（ms） */
  intervalMs: number;
  /** 立即执行第一次（默认 false） */
  runImmediately?: boolean;
  /** 最大执行次数（0 = 无限，默认 0） */
  maxExecutions?: number;
  /** 传给 executor.execute 的引擎执行函数 */
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

// ── 核心类 ──────────────────────────────────────────────

export class WorkflowScheduler {
  private executor: WorkflowExecutor;
  private eventBus: EventBus;

  /** scheduleId → ScheduledEntry */
  private schedules = new Map<string, ScheduledEntry>();
  /** workflowId → scheduleId（一个工作流只能有一个调度） */
  private workflowIndex = new Map<string, string>();

  constructor(executor: WorkflowExecutor, eventBus?: EventBus) {
    this.executor = executor;
    this.eventBus = eventBus ?? EventBus.getInstance();
  }

  // ── 核心函数 1: 一次性定时执行 ──────────────────────

  /**
   * 注册一个一次性调度。到达指定时间后自动执行工作流，
   * 执行完毕后标记 completed 并清理定时器。
   *
   * @returns 调度 ID
   * @throws 如果工作流已有活跃调度
   */
  scheduleOnce(
    workflow: WorkflowDefinition,
    options: OnceScheduleOptions = {},
  ): string {
    this.ensureNotScheduled(workflow.id);

    const delayMs = this.calculateDelay(options);
    const scheduleId = this.generateId('once');

    const entry: ScheduledEntry = {
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

    // 防止 Node.js 进程因这个定时器而无法退出（可选）
    if (entry.timer && typeof entry.timer === 'object' && 'unref' in entry.timer) {
      entry.timer.unref();
    }

    this.schedules.set(scheduleId, entry);
    this.workflowIndex.set(workflow.id, scheduleId);

    this.emitScheduleEvent('scheduler.once_created', scheduleId, workflow.id, { delayMs });

    return scheduleId;
  }

  // ── 核心函数 2: 周期性重复执行 ──────────────────────

  /**
   * 注册一个周期性调度。按指定间隔重复执行工作流，
   * 直到达到最大执行次数或被手动取消。
   *
   * @returns 调度 ID
   * @throws 如果工作流已有活跃调度
   */
  scheduleRecurring(
    workflow: WorkflowDefinition,
    options: RecurringScheduleOptions,
  ): string {
    this.ensureNotScheduled(workflow.id);

    if (!options.intervalMs || options.intervalMs < 1000) {
      throw new Error('intervalMs must be >= 1000ms');
    }

    const scheduleId = this.generateId('recur');
    const maxExecutions = options.maxExecutions ?? 0;

    const entry: ScheduledEntry = {
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

    // 如果需要立即执行一次
    if (options.runImmediately) {
      // 异步执行，不阻塞注册流程
      setImmediate(async () => {
        await this.runEntry(entry);
        // 启动间隔定时器
        this.startInterval(entry, options.intervalMs);
      });
    } else {
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

  // ── 管理接口 ──────────────────────────────────────────

  /** 取消指定工作流的调度 */
  cancel(workflowId: string): boolean {
    const scheduleId = this.workflowIndex.get(workflowId);
    if (!scheduleId) return false;

    const entry = this.schedules.get(scheduleId);
    if (!entry) return false;

    this.clearEntryTimers(entry);
    entry.status = 'cancelled';
    entry.nextRunAt = null;

    // 保留 workflowIndex 映射以便查询，ensureNotScheduled 会检查 status
    this.emitScheduleEvent('scheduler.cancelled', scheduleId, workflowId, {});
    return true;
  }

  /** 获取指定工作流的调度信息 */
  getSchedule(workflowId: string): ScheduleInfo | null {
    const scheduleId = this.workflowIndex.get(workflowId);
    if (!scheduleId) return null;
    const entry = this.schedules.get(scheduleId);
    if (!entry) return null;
    return this.entryToInfo(entry);
  }

  /** 获取所有活跃调度 */
  getActiveSchedules(): ScheduleInfo[] {
    return [...this.schedules.values()]
      .filter((e) => e.status === 'pending' || e.status === 'running')
      .map((e) => this.entryToInfo(e));
  }

  /** 获取调度统计 */
  getStats(): SchedulerStats {
    const entries = [...this.schedules.values()];
    return {
      totalScheduled: entries.length,
      activeCount: entries.filter((e) => e.status === 'pending' || e.status === 'running').length,
      completedCount: entries.filter((e) => e.status === 'completed').length,
      cancelledCount: entries.filter((e) => e.status === 'cancelled').length,
    };
  }

  /** 关闭调度器：取消所有定时器 */
  shutdown(): void {
    for (const entry of this.schedules.values()) {
      this.clearEntryTimers(entry);
      if (entry.status === 'pending' || entry.status === 'running') {
        entry.status = 'cancelled';
        entry.nextRunAt = null;
      }
    }
    this.workflowIndex.clear();
  }

  // ── 私有方法 ──────────────────────────────────────────

  /** 执行一个调度项 */
  private async runEntry(entry: ScheduledEntry): Promise<void> {
    if (entry.status === 'cancelled') return;

    entry.status = 'running';
    entry.lastRunAt = new Date();

    // 使用增强的错误处理器执行工作流
    const context: AsyncOperationContext = {
      operation: `workflow_execute:${entry.workflowId}`,
      userId: entry.workflow.userId,
      correlationId: entry.id,
      metadata: {
        workflowId: entry.workflowId,
        scheduleId: entry.id,
        scheduleType: entry.type,
        executionCount: entry.executionCount,
      },
    };

    try {
      const result = await asyncErrorHandler.executeWithRetry(
        async () => {
          const executionResult = await this.executor.execute(entry.workflow, entry.engineExecuteFn);
          return executionResult;
        },
        context,
        {
          maxRetries: 2,
          baseDelayMs: 1000,
          retryCondition: (error) => {
            // 只重试临时性错误，不重试业务逻辑错误
            return (
              error instanceof AppError && 
              !error.isOperational &&
              (error.message.includes('timeout') || 
               error.message.includes('network') ||
               error.message.includes('temporary'))
            );
          },
        }
      );

      entry.executionCount++;

      this.emitScheduleEvent('scheduler.executed', entry.id, entry.workflowId, {
        executionCount: entry.executionCount,
        workflowStatus: result.status,
        durationMs: result.durationMs,
        success: true,
      });

      // 一次性调度：完成后标记（保留索引以便查询）
      if (entry.type === 'once') {
        entry.status = 'completed';
        entry.nextRunAt = null;
        this.clearEntryTimers(entry);
      }

      // 周期性调度：检查是否达到最大执行次数
      if (entry.type === 'recurring' && entry.maxExecutions > 0 && entry.executionCount >= entry.maxExecutions) {
        entry.status = 'completed';
        entry.nextRunAt = null;
        this.clearEntryTimers(entry);
      }
    } catch (err) {
      // 记录执行失败事件
      this.emitScheduleEvent('scheduler.execution_failed', entry.id, entry.workflowId, {
        error: err instanceof Error ? err.message : String(err),
        executionCount: entry.executionCount,
        isOperational: err instanceof AppError ? err.isOperational : false,
      });

      // 执行失败不改变调度状态，下次继续尝试（周期性）
      if (entry.type === 'once') {
        entry.status = 'completed';
        entry.nextRunAt = null;
      }
    }
  }

  /** 启动间隔定时器 */
  private startInterval(entry: ScheduledEntry, intervalMs: number): void {
    const context: AsyncOperationContext = {
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
        // 检查是否已被取消或已完成
        if (entry.status === 'cancelled' || entry.status === 'completed') {
          this.clearEntryTimers(entry);
          return;
        }

        entry.nextRunAt = new Date(Date.now() + intervalMs);
        await asyncErrorHandler.executeWithRetry(
          () => this.runEntry(entry),
          context,
          {
            maxRetries: 1,
            retryCondition: (error) => {
              return error instanceof AppError && !error.isOperational;
            },
          }
        );
      } catch (error) {
        // 如果是最后一次执行失败，记录错误但继续间隔
        console.error(`Interval execution failed for workflow ${entry.workflowId}:`, error);
        
        // 更新下次执行时间，即使失败也要继续尝试
        entry.nextRunAt = new Date(Date.now() + intervalMs);
        
        // 发送失败事件
        this.emitScheduleEvent('scheduler.interval_failed', entry.id, entry.workflowId, {
          error: error instanceof Error ? error.message : String(error),
          nextRunAt: entry.nextRunAt,
        });
      }
    }, intervalMs);

    // 防止阻止进程退出
    if (typeof entry.interval === 'object' && 'unref' in entry.interval) {
      entry.interval.unref();
    }
  }

  /** 计算延迟时间 */
  private calculateDelay(options: OnceScheduleOptions): number {
    if (options.delayMs !== undefined) return Math.max(0, options.delayMs);
    if (options.scheduledAt) return Math.max(0, options.scheduledAt.getTime() - Date.now());
    return 0;
  }

  /** 确保工作流未被调度 */
  private ensureNotScheduled(workflowId: string): void {
    const existingId = this.workflowIndex.get(workflowId);
    if (existingId) {
      const existing = this.schedules.get(existingId);
      if (existing && (existing.status === 'pending' || existing.status === 'running')) {
        throw new Error(`Workflow ${workflowId} already has an active schedule (${existingId})`);
      }
    }
  }

  /** 清理定时器 */
  private clearEntryTimers(entry: ScheduledEntry): void {
    if (entry.timer) {
      clearTimeout(entry.timer);
      entry.timer = undefined;
    }
    if (entry.interval) {
      clearInterval(entry.interval);
      entry.interval = undefined;
    }
  }

  /** 生成调度 ID */
  private generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  /** 转换为公开信息 */
  private entryToInfo(entry: ScheduledEntry): ScheduleInfo {
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

  /** 发送调度事件 */
  private emitScheduleEvent(type: string, scheduleId: string, workflowId: string, data: Record<string, unknown>): void {
    try {
      this.eventBus.emit({
        type: type as any,
        scheduleId,
        workflowId,
        timestamp: new Date(),
        ...data,
      } as any);
    } catch {
      // EventBus emit 不应影响主流程
    }
  }
}
