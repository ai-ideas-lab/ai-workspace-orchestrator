/**
 * WorkflowExecutor - 工作流执行引擎
 *
 * 将预定义的工作流（DAG 步骤列表）通过 RequestQueue 分发给 AI 引擎执行，
 * 利用 CircuitBreaker 做故障保护、EventBus 发布状态变更事件。
 *
 * 核心职责:
 *   1. execute()  — 按拓扑序执行工作流步骤，支持并行分支
 *   2. cancel()   — 取消正在执行的工作流
 *
 * 使用方式:
 *   const executor = new WorkflowExecutor();
 *   executor.registerEngine('gpt-4', { weight: 100 });
 *   const result = await executor.execute(workflow);
 */

import { RequestQueue, RequestPriority, ProcessResult } from './request-queue.js';
import { EventBus } from './event-bus.js';
import { CircuitBreaker } from './circuit-breaker.js';

// ── 工作流类型定义 ──────────────────────────────────────

export type StepStatus = 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'SKIPPED';

export interface WorkflowStep {
  id: string;
  /** 步骤名称 */
  name: string;
  /** AI 任务类型（如 text-generation, image-generation） */
  taskType: string;
  /** 请求负载 */
  payload: Record<string, unknown>;
  /** 上游步骤 ID 列表（空数组 = 根步骤，可立即执行） */
  dependsOn: string[];
  /** 该步骤的优先级 */
  priority?: RequestPriority;
  /** 最大重试次数（默认 0） */
  maxRetries?: number;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  steps: WorkflowStep[];
  /** 全局默认优先级 */
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
  status: 'COMPLETED' | 'FAILED' | 'CANCELLED';
  steps: StepResult[];
  startedAt: Date;
  finishedAt: Date;
  /** 总执行时长 ms */
  durationMs: number;
}

// ── 内部追踪结构 ────────────────────────────────────────

interface StepTracker {
  step: WorkflowStep;
  status: StepStatus;
  result: StepResult;
  retries: number;
}

// ── 核心类 ──────────────────────────────────────────────

export class WorkflowExecutor {
  private queue: RequestQueue;
  private eventBus: EventBus;

  /** 活跃工作流追踪 workflowId → StepTracker[] */
  private activeWorkflows = new Map<string, StepTracker[]>();
  /** 取消标记 */
  private cancelled = new Set<string>();

  constructor(queue?: RequestQueue, eventBus?: EventBus) {
    this.queue = queue ?? new RequestQueue();
    this.eventBus = eventBus ?? EventBus.getInstance();
  }

  // ── 核心函数 1: 执行工作流 ────────────────────────────

  /**
   * 按拓扑序执行工作流步骤。无依赖的步骤并行执行，
   * 某步骤所有依赖完成后才入队。任一步骤失败则跳过下游。
   *
   * @returns 完整执行结果
   */
  async execute(
    workflow: WorkflowDefinition,
    /** 模拟引擎执行函数，生产环境替换为真实 API 调用 */
    engineExecuteFn?: (taskType: string, payload: Record<string, unknown>, engineId: string) => Promise<Record<string, unknown>>,
  ): Promise<WorkflowResult> {
    const startedAt = new Date();
    const trackers = workflow.steps.map((step) => ({
      step,
      status: 'PENDING' as StepStatus,
      result: {
        stepId: step.id,
        status: 'PENDING' as StepStatus,
        retries: 0,
      } as StepResult,
      retries: 0,
    }));

    this.activeWorkflows.set(workflow.id, trackers);

    this.eventBus.emit({
      type: 'workflow.started' as any,
      workflowId: workflow.id,
      stepCount: workflow.steps.length,
      timestamp: new Date(),
    } as any);

    // 循环直到所有步骤完成或取消
    const maxIterations = workflow.steps.length * 3; // 安全阀
    for (let iteration = 0; iteration < maxIterations; iteration++) {
      if (this.cancelled.has(workflow.id)) {
        this.markRemainingSkipped(trackers);
        break;
      }

      const pending = trackers.filter((t) => t.status === 'PENDING');
      if (pending.length === 0) break; // 全部处理完

      // 找出依赖已满足的步骤（并行入队）
      const ready = pending.filter((t) =>
        t.step.dependsOn.every((depId) => {
          const dep = trackers.find((d) => d.step.id === depId);
          return dep && dep.status === 'SUCCEEDED';
        }),
      );

      // 检查是否有依赖失败的步骤 → 标记跳过
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

      // 并行执行就绪步骤
      const promises = ready.map((tracker) =>
        this.executeStep(
          workflow.id,
          tracker,
          workflow.defaultPriority ?? 'NORMAL',
          engineExecuteFn,
        ),
      );

      if (promises.length > 0) {
        await Promise.all(promises);
      } else if (ready.length === 0) {
        // 没有就绪步骤但还有 pending → 说明所有 pending 都被跳过了
        const allPendingSkipped = pending.every(
          (t) => t.status === 'SKIPPED' || t.status === 'FAILED',
        );
        if (allPendingSkipped) break;

        // 否则等待一小段时间避免空转（依赖还在执行中）
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }

    // 汇总结果
    const finishedAt = new Date();
    const allSteps = trackers.map((t) => t.result);
    const hasFailure = allSteps.some((s) => s.status === 'FAILED');
    const wasCancelled = this.cancelled.has(workflow.id);

    const result: WorkflowResult = {
      workflowId: workflow.id,
      status: wasCancelled ? 'CANCELLED' : hasFailure ? 'FAILED' : 'COMPLETED',
      steps: allSteps,
      startedAt,
      finishedAt,
      durationMs: finishedAt.getTime() - startedAt.getTime(),
    };

    this.eventBus.emit({
      type: 'workflow.completed' as any,
      workflowId: workflow.id,
      status: result.status,
      durationMs: result.durationMs,
      timestamp: new Date(),
    } as any);

    this.activeWorkflows.delete(workflow.id);
    this.cancelled.delete(workflow.id);

    return result;
  }

  // ── 核心函数 2: 取消工作流 ────────────────────────────

  /**
   * 取消正在执行的工作流。正在运行的步骤不会被中断，
   * 但尚未开始的步骤将标记为 SKIPPED。
   */
  cancel(workflowId: string): boolean {
    if (!this.activeWorkflows.has(workflowId)) return false;
    this.cancelled.add(workflowId);

    this.eventBus.emit({
      type: 'workflow.cancelled' as any,
      workflowId,
      timestamp: new Date(),
    } as any);

    return true;
  }

  // ── 引擎注册代理 ──────────────────────────────────────

  registerEngine(engineId: string, opts?: { weight?: number }): void {
    this.queue.registerEngine(engineId, opts);
  }

  deregisterEngine(engineId: string): void {
    this.queue.deregisterEngine(engineId);
  }

  // ── 私有方法 ──────────────────────────────────────────

  /** 执行单个步骤（含重试） */
  private async executeStep(
    workflowId: string,
    tracker: StepTracker,
    defaultPriority: RequestPriority,
    engineExecuteFn?: (taskType: string, payload: Record<string, unknown>, engineId: string) => Promise<Record<string, unknown>>,
  ): Promise<void> {
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

      // 先入队再通过队列分配引擎
      this.queue.enqueue(
        { taskType: step.taskType, payload: step.payload },
        step.priority ?? defaultPriority,
      );
      const processResult = this.queue.processNext();
      if (!processResult) {
        // 无可用引擎 → 失败
        tracker.status = 'FAILED';
        result.status = 'FAILED';
        result.error = 'No available engine (all circuit-broken or no engines registered)';
        result.finishedAt = new Date();
        return;
      }

      result.engineId = processResult.engineId;
      result.retries = attempt;

      try {
        let execResult: Record<string, unknown>;

        if (engineExecuteFn) {
          // 使用自定义执行函数
          execResult = await engineExecuteFn(step.taskType, step.payload, processResult.engineId);
        } else {
          // 默认：直接标记成功（用于测试/模拟）
          execResult = { ok: true, taskType: step.taskType, engineId: processResult.engineId };
        }

        // 成功
        this.queue.reportSuccess(processResult.engineId);
        tracker.status = 'SUCCEEDED';
        result.status = 'SUCCEEDED';
        result.result = execResult;
        result.finishedAt = new Date();
        return;
      } catch (err) {
        // 失败 → 报告熔断器
        this.queue.reportFailure(processResult.engineId);
        result.error = err instanceof Error ? err.message : String(err);

        if (attempt < maxRetries) {
          // 重试前短暂等待
          await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
          continue;
        }

        // 重试耗尽 → 最终失败
        tracker.status = 'FAILED';
        result.status = 'FAILED';
        result.finishedAt = new Date();
      }
    }
  }

  /** 将所有未完成步骤标记为 SKIPPED */
  private markRemainingSkipped(trackers: StepTracker[]): void {
    for (const t of trackers) {
      if (t.status === 'PENDING' || t.status === 'RUNNING') {
        t.status = 'SKIPPED';
        t.result.status = 'SKIPPED';
        if (!t.result.finishedAt) t.result.finishedAt = new Date();
      }
    }
  }
}
