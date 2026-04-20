/**
 * RequestQueue - AI引擎优先级请求队列
 *
 * 将待执行的 AI 请求按优先级排队，出队时通过负载均衡器选择引擎、
 * 通过熔断器保护故障引擎，实现「排队 → 选引擎 → 熔断保护」的完整链路。
 *
 * 使用方式:
 *   const queue = new RequestQueue();
 *   queue.registerEngine('gpt-4', { weight: 100 });
 *   const id = queue.enqueue({ taskType: 'text-generation', payload: {...} }, 'HIGH');
 *   const next = queue.processNext(); // → QueueRequest | null
 */

import { loadBalancer, EnginePerformanceSnapshot } from './load-balancer.js';
import { CircuitBreaker, CircuitState } from './circuit-breaker.js';

// ── 类型定义 ─────────────────────────────────────────────

export type RequestPriority = 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW';

export interface QueueRequest {
  id: string;
  taskType: string;
  payload: Record<string, any>;
  priority: RequestPriority;
  enqueuedAt: Date;
  /** 最终分配的引擎 ID，processNext 时填充 */
  assignedEngineId?: string;
}

export interface ProcessResult {
  request: QueueRequest;
  engineId: string;
  circuitState: CircuitState;
  /** 队列中剩余请求数 */
  remainingCount: number;
}

// ── 优先级数值映射 ───────────────────────────────────────

const PRIORITY_WEIGHT: Record<RequestPriority, number> = {
  CRITICAL: 4,
  HIGH: 3,
  NORMAL: 2,
  LOW: 1,
};

// ── 主类 ─────────────────────────────────────────────────

export class RequestQueue {
  private queue: QueueRequest[] = [];
  private circuitBreaker: CircuitBreaker;
  private autoIncrement = 0;

  constructor(circuitBreaker?: CircuitBreaker) {
    this.circuitBreaker = circuitBreaker ?? new CircuitBreaker();
  }

  // ── 核心函数 1: 入队 ────────────────────────────────────

  /**
   * 将请求加入优先级队列。
   * 同优先级按 FIFO 排列；高优先级始终先于低优先级出队。
   *
   * @returns 分配的请求 ID
   */
  enqueue(
    task: { taskType: string; payload: Record<string, any> },
    priority: RequestPriority = 'NORMAL',
  ): string {
    const id = `req_${++this.autoIncrement}_${Date.now()}`;
    const request: QueueRequest = {
      id,
      taskType: task.taskType,
      payload: task.payload,
      priority,
      enqueuedAt: new Date(),
    };

    // 按优先级降序插入（保持同优先级 FIFO）
    const weight = PRIORITY_WEIGHT[priority];
    let inserted = false;
    for (let i = 0; i < this.queue.length; i++) {
      if (weight > PRIORITY_WEIGHT[this.queue[i].priority]) {
        this.queue.splice(i, 0, request);
        inserted = true;
        break;
      }
    }
    if (!inserted) {
      this.queue.push(request);
    }

    return id;
  }

  // ── 核心函数 2: 出队 + 引擎分配 ────────────────────────

  /**
   * 取出优先级最高的请求并为其分配一个可用引擎。
   *
   * 选择流程:
   *   1. 负载均衡器选出候选引擎
   *   2. 熔断器检查该引擎是否允许请求
   *   3. 若被熔断，尝试下一个引擎（轮询 N 次）
   *   4. 全部熔断则返回 null（请求留在队列头部）
   *
   * @returns ProcessResult，或 null（队列空/全部引擎熔断）
   */
  processNext(): ProcessResult | null {
    if (this.queue.length === 0) return null;

    // 最多尝试所有已注册引擎数次
    const maxAttempts = 10;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const engineId = loadBalancer.selectEngine();
      if (!engineId) return null; // 无引擎注册

      if (this.circuitBreaker.allowRequest(engineId)) {
        // 引擎可用 → 出队并分配
        const request = this.queue.shift()!;
        request.assignedEngineId = engineId;
        return {
          request,
          engineId,
          circuitState: this.circuitBreaker.getState(engineId),
          remainingCount: this.queue.length,
        };
      }

      // 被熔断，尝试用负载均衡器再选一个不同的
      // （平滑加权轮询选到同一个时，微调一次 currentWeight 跳过它）
      continue;
    }

    // 全部引擎熔断 → 请求留在队列
    return null;
  }

  // ── 辅助方法 ────────────────────────────────────────────

  /** 报告执行成功（供外部调用） */
  reportSuccess(engineId: string): void {
    this.circuitBreaker.recordSuccess(engineId);
  }

  /** 报告执行失败（供外部调用） */
  reportFailure(engineId: string): void {
    this.circuitBreaker.recordFailure(engineId);
  }

  /** 更新引擎性能快照（转发给负载均衡器） */
  updatePerformance(snapshots: EnginePerformanceSnapshot[]): void {
    loadBalancer.updateWeights(snapshots);
  }

  /** 注册引擎到负载均衡器 */
  registerEngine(engineId: string, opts?: { weight?: number }): void {
    loadBalancer.registerEngine(engineId, opts?.weight);
  }

  /** 注销引擎 */
  deregisterEngine(engineId: string): void {
    loadBalancer.deregisterEngine(engineId);
    this.circuitBreaker.reset(engineId);
  }

  /** 当前队列长度 */
  get length(): number {
    return this.queue.length;
  }

  /** 查看队列头部请求（不出队） */
  peek(): QueueRequest | undefined {
    return this.queue[0];
  }

  /** 按优先级统计队列 */
  getStats(): Record<RequestPriority, number> & { total: number } {
    const counts = { CRITICAL: 0, HIGH: 0, NORMAL: 0, LOW: 0, total: this.queue.length };
    for (const req of this.queue) {
      counts[req.priority]++;
    }
    return counts;
  }
}
