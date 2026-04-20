/**
 * MetricsCollector - 运行指标收集器
 *
 * 订阅 EventBus 上的事件，实时采集系统运行指标，供监控仪表板和告警系统使用。
 *
 * 收集维度:
 *   1. 请求指标 — 入队/出队/失败计数、队列等待时长分布
 *   2. 引擎指标 — 每引擎成功/失败/平均响应时间
 *   3. 熔断指标 — 状态变更历史、当前熔断状态
 *   4. 汇总指标 — 系统整体健康度评分
 *
 * 使用方式:
 *   const collector = new MetricsCollector(eventBus);
 *   collector.start();
 *   const snapshot = collector.getSnapshot();
 */

import { EventBus, OrchestratorEvent, EventType } from './event-bus.js';

// ── 类型定义 ────────────────────────────────────────────

export interface EngineMetrics {
  engineId: string;
  successCount: number;
  failureCount: number;
  totalResponseTimeMs: number;
  avgResponseTimeMs: number;
  lastSuccessAt: Date | null;
  lastFailureAt: Date | null;
}

export interface QueueMetrics {
  totalEnqueued: number;
  totalDequeued: number;
  totalFailed: number;
  /** 等待时长样本（最近 N 个） */
  waitTimeSamples: Array<{ requestId: string; waitTimeMs: number; timestamp: Date }>;
  /** 平均等待时长 ms */
  avgWaitTimeMs: number;
  /** 最大等待时长 ms */
  maxWaitTimeMs: number;
}

export interface CircuitMetrics {
  engineId: string;
  stateChanges: Array<{ oldState: string; newState: string; timestamp: Date }>;
  resets: number;
  lastStateChangedAt: Date | null;
}

export interface SystemHealth {
  /** 综合健康评分 0-100 */
  score: number;
  /** 总请求数 */
  totalRequests: number;
  /** 成功率 (0-1) */
  successRate: number;
  /** 平均响应时间 ms */
  avgResponseTimeMs: number;
  /** 引擎数量 */
  engineCount: number;
  /** 健康引擎数量（有成功记录且无熔断） */
  healthyEngineCount: number;
  /** 最近 1 分钟请求数 */
  recentRequestsPerMinute: number;
  /** 采集开始时间 */
  collectingSince: Date;
}

export interface MetricsSnapshot {
  collectedAt: Date;
  uptimeMs: number;
  queue: QueueMetrics;
  engines: Record<string, EngineMetrics>;
  circuits: Record<string, CircuitMetrics>;
  system: SystemHealth;
}

// ── 可配置选项 ──────────────────────────────────────────

export interface MetricsCollectorOptions {
  /** 最大等待时长样本数（默认 200） */
  maxWaitTimeSamples?: number;
  /** 最大熔断状态变更记录数（默认 100/引擎） */
  maxCircuitChanges?: number;
  /** 健康评分权重 */
  healthWeights?: {
    successRate?: number;
    responseTime?: number;
    engineAvailability?: number;
  };
}

// ── 核心类 ──────────────────────────────────────────────

export class MetricsCollector {
  private eventBus: EventBus;
  private options: Required<MetricsCollectorOptions>;
  private startedAt: Date | null = null;
  private subscriptions: Array<{ unsubscribe: () => void }> = [];

  // ── 原始计数器 ────────────────────────────────────────

  private queueMetrics: QueueMetrics = {
    totalEnqueued: 0,
    totalDequeued: 0,
    totalFailed: 0,
    waitTimeSamples: [],
    avgWaitTimeMs: 0,
    maxWaitTimeMs: 0,
  };

  private engineMetrics = new Map<string, EngineMetrics>();
  private circuitMetrics = new Map<string, CircuitMetrics>();

  /** 最近请求时间戳（用于计算 RPM） */
  private recentRequestTimestamps: Date[] = [];

  constructor(eventBus: EventBus, options?: MetricsCollectorOptions) {
    this.eventBus = eventBus;
    this.options = {
      maxWaitTimeSamples: options?.maxWaitTimeSamples ?? 200,
      maxCircuitChanges: options?.maxCircuitChanges ?? 100,
      healthWeights: {
        successRate: options?.healthWeights?.successRate ?? 0.4,
        responseTime: options?.healthWeights?.responseTime ?? 0.3,
        engineAvailability: options?.healthWeights?.engineAvailability ?? 0.3,
      },
    };
  }

  // ── 生命周期 ──────────────────────────────────────────

  /** 开始采集：订阅 EventBus 事件 */
  start(): void {
    if (this.startedAt) return; // 已启动
    this.startedAt = new Date();

    const eventsToListen: EventType[] = [
      'request.enqueued',
      'request.dequeued',
      'request.failed',
      'engine.registered',
      'engine.deregistered',
      'engine.success',
      'engine.failure',
      'circuit.state_changed',
      'circuit.reset',
      'queue.cleared',
    ];

    for (const eventType of eventsToListen) {
      const sub = this.eventBus.on(eventType, (event: OrchestratorEvent) => {
        this.handleEvent(event);
      });
      this.subscriptions.push(sub);
    }
  }

  /** 停止采集：取消所有订阅 */
  stop(): void {
    for (const sub of this.subscriptions) {
      sub.unsubscribe();
    }
    this.subscriptions = [];
  }

  /** 重置所有指标 */
  reset(): void {
    this.queueMetrics = {
      totalEnqueued: 0,
      totalDequeued: 0,
      totalFailed: 0,
      waitTimeSamples: [],
      avgWaitTimeMs: 0,
      maxWaitTimeMs: 0,
    };
    this.engineMetrics.clear();
    this.circuitMetrics.clear();
    this.recentRequestTimestamps = [];
    this.startedAt = new Date();
  }

  // ── 查询接口 ──────────────────────────────────────────

  /** 获取当前完整指标快照 */
  getSnapshot(): MetricsSnapshot {
    const now = new Date();
    const engines: Record<string, EngineMetrics> = {};
    for (const [id, m] of this.engineMetrics) {
      engines[id] = { ...m };
    }

    const circuits: Record<string, CircuitMetrics> = {};
    for (const [id, m] of this.circuitMetrics) {
      circuits[id] = {
        ...m,
        stateChanges: [...m.stateChanges],
      };
    }

    return {
      collectedAt: now,
      uptimeMs: this.startedAt ? now.getTime() - this.startedAt.getTime() : 0,
      queue: { ...this.queueMetrics, waitTimeSamples: [...this.queueMetrics.waitTimeSamples] },
      engines,
      circuits,
      system: this.calculateSystemHealth(),
    };
  }

  /** 获取指定引擎指标 */
  getEngineMetrics(engineId: string): EngineMetrics | null {
    return this.engineMetrics.get(engineId) ?? null;
  }

  /** 获取队列指标 */
  getQueueMetrics(): QueueMetrics {
    return { ...this.queueMetrics };
  }

  /** 获取系统健康度 */
  getSystemHealth(): SystemHealth {
    return this.calculateSystemHealth();
  }

  // ── 内部处理 ──────────────────────────────────────────

  private handleEvent(event: OrchestratorEvent): void {
    switch (event.type) {
      case 'request.enqueued':
        this.queueMetrics.totalEnqueued++;
        this.recentRequestTimestamps.push(event.timestamp);
        this.trimRecentTimestamps();
        break;

      case 'request.dequeued':
        this.queueMetrics.totalDequeued++;
        this.queueMetrics.waitTimeSamples.push({
          requestId: event.requestId,
          waitTimeMs: event.waitTimeMs,
          timestamp: event.timestamp,
        });
        this.recalculateWaitTimes();
        break;

      case 'request.failed':
        this.queueMetrics.totalFailed++;
        break;

      case 'engine.registered':
        this.ensureEngineMetrics(event.engineId);
        break;

      case 'engine.deregistered':
        // 保留历史数据，不删除
        break;

      case 'engine.success':
        this.recordEngineSuccess(event.engineId, event.responseTimeMs);
        break;

      case 'engine.failure':
        this.recordEngineFailure(event.engineId);
        break;

      case 'circuit.state_changed':
        this.recordCircuitChange(event.engineId, event.oldState, event.newState, event.timestamp);
        break;

      case 'circuit.reset':
        this.recordCircuitReset(event.engineId);
        break;

      case 'queue.cleared':
        // 队列清空事件不影响累计指标
        break;
    }
  }

  private ensureEngineMetrics(engineId: string): void {
    if (!this.engineMetrics.has(engineId)) {
      this.engineMetrics.set(engineId, {
        engineId,
        successCount: 0,
        failureCount: 0,
        totalResponseTimeMs: 0,
        avgResponseTimeMs: 0,
        lastSuccessAt: null,
        lastFailureAt: null,
      });
    }
  }

  private recordEngineSuccess(engineId: string, responseTimeMs: number): void {
    this.ensureEngineMetrics(engineId);
    const m = this.engineMetrics.get(engineId)!;
    m.successCount++;
    m.totalResponseTimeMs += responseTimeMs;
    m.avgResponseTimeMs = m.totalResponseTimeMs / m.successCount;
    m.lastSuccessAt = new Date();
  }

  private recordEngineFailure(engineId: string): void {
    this.ensureEngineMetrics(engineId);
    const m = this.engineMetrics.get(engineId)!;
    m.failureCount++;
    m.lastFailureAt = new Date();
  }

  /** 确保 CircuitMetrics 存在，不存在则初始化 */
  private ensureCircuitMetrics(engineId: string): void {
    if (!this.circuitMetrics.has(engineId)) {
      this.circuitMetrics.set(engineId, {
        engineId,
        stateChanges: [],
        resets: 0,
        lastStateChangedAt: null,
      });
    }
  }

  private recordCircuitChange(engineId: string, oldState: string, newState: string, timestamp: Date): void {
    this.ensureCircuitMetrics(engineId);
    const cm = this.circuitMetrics.get(engineId)!;
    cm.stateChanges.push({ oldState, newState, timestamp: new Date(timestamp) });
    cm.lastStateChangedAt = new Date(timestamp);

    // 限制历史长度
    if (cm.stateChanges.length > this.options.maxCircuitChanges) {
      cm.stateChanges = cm.stateChanges.slice(-this.options.maxCircuitChanges);
    }
  }

  private recordCircuitReset(engineId: string): void {
    this.ensureCircuitMetrics(engineId);
    this.circuitMetrics.get(engineId)!.resets++;
  }

  private recalculateWaitTimes(): void {
    const samples = this.queueMetrics.waitTimeSamples;
    // 保留最近 N 个样本
    if (samples.length > this.options.maxWaitTimeSamples) {
      this.queueMetrics.waitTimeSamples = samples.slice(-this.options.maxWaitTimeSamples);
    }
    const current = this.queueMetrics.waitTimeSamples;
    if (current.length === 0) {
      this.queueMetrics.avgWaitTimeMs = 0;
      this.queueMetrics.maxWaitTimeMs = 0;
      return;
    }
    const sum = current.reduce((acc, s) => acc + s.waitTimeMs, 0);
    this.queueMetrics.avgWaitTimeMs = sum / current.length;
    this.queueMetrics.maxWaitTimeMs = Math.max(...current.map((s) => s.waitTimeMs));
  }

  /** 清理超过 1 分钟的时间戳 */
  private trimRecentTimestamps(): void {
    const oneMinuteAgo = Date.now() - 60_000;
    this.recentRequestTimestamps = this.recentRequestTimestamps.filter(
      (t) => t.getTime() > oneMinuteAgo,
    );
  }

  /** 计算系统综合健康评分 */
  private calculateSystemHealth(): SystemHealth {
    const now = new Date();
    this.trimRecentTimestamps();

    const engines = [...this.engineMetrics.values()];
    const totalSuccess = engines.reduce((sum, e) => sum + e.successCount, 0);
    const totalFailure = engines.reduce((sum, e) => sum + e.failureCount, 0);
    const totalRequests = totalSuccess + totalFailure;
    const successRate = totalRequests > 0 ? totalSuccess / totalRequests : 1;

    const avgResponseTimeMs =
      totalSuccess > 0
        ? engines.reduce((sum, e) => sum + e.totalResponseTimeMs, 0) / totalSuccess
        : 0;

    const engineCount = engines.length;
    // 健康引擎：有成功记录，且最近没有熔断到 OPEN
    const healthyEngineCount = engines.filter((e) => {
      if (e.successCount === 0) return false;
      const cm = this.circuitMetrics.get(e.engineId);
      if (!cm || cm.stateChanges.length === 0) return true;
      const lastChange = cm.stateChanges[cm.stateChanges.length - 1];
      return lastChange.newState !== 'OPEN';
    }).length;

    // 健康评分（加权）
    const w = this.options.healthWeights;
    const successScore = this.scoreSuccessRate(successRate);
    const responseScore = this.scoreResponseTime(avgResponseTimeMs);
    const availabilityScore = this.scoreEngineAvailability(engineCount, healthyEngineCount);

    const score = Math.round(
      successScore * (w.successRate ?? 0.4) + responseScore * (w.responseTime ?? 0.3) + availabilityScore * (w.engineAvailability ?? 0.3),
    );

    return {
      score: Math.max(0, Math.min(100, score)),
      totalRequests,
      successRate,
      avgResponseTimeMs,
      engineCount,
      healthyEngineCount,
      recentRequestsPerMinute: this.recentRequestTimestamps.length,
      collectingSince: this.startedAt ?? now,
    };
  }

  /** 成功率评分（0-100），成功率直接映射为百分比 */
  private scoreSuccessRate(successRate: number): number {
    return successRate * 100;
  }

  /** 响应时间评分（< 200ms = 100, > 5000ms = 0, 线性衰减） */
  private scoreResponseTime(avgResponseTimeMs: number): number {
    return Math.max(0, Math.min(100, 100 - (avgResponseTimeMs - 200) * (100 / 4800)));
  }

  /** 引擎可用性评分（健康引擎占比） */
  private scoreEngineAvailability(engineCount: number, healthyCount: number): number {
    return engineCount > 0 ? (healthyCount / engineCount) * 100 : 100;
  }
}
