/**
 * DashboardService - 实时监控仪表板服务
 *
 * 聚合 MetricsCollector 采集的运行指标，生成仪表板所需的摘要数据和告警信息。
 * 为前端监控面板提供一站式数据接口。
 *
 * 核心职责:
 *   1. getDashboardSummary() — 生成仪表板概览（健康度、活跃引擎、队列状态、告警）
 *   2. getAlerts()           — 根据阈值规则生成实时告警列表
 *
 * 使用方式:
 *   const dashboard = new DashboardService(metricsCollector);
 *   const summary = dashboard.getDashboardSummary();
 *   const alerts = dashboard.getAlerts();
 */

import {
  MetricsCollector,
  MetricsSnapshot,
  SystemHealth,
  EngineMetrics,
} from './metrics-collector.js';

// ── 类型定义 ──────────────────────────────────────────────

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface Alert {
  /** 告警 ID */
  id: string;
  /** 严重级别 */
  severity: AlertSeverity;
  /** 告警类型 */
  type: 'low_success_rate' | 'high_response_time' | 'engine_down' | 'queue_congestion' | 'circuit_open';
  /** 告警标题 */
  title: string;
  /** 详细描述 */
  message: string;
  /** 关联引擎 ID（如适用） */
  engineId?: string;
  /** 当前值 */
  currentValue: number;
  /** 阈值 */
  threshold: number;
  /** 产生时间 */
  triggeredAt: Date;
}

export interface EngineStatusCard {
  engineId: string;
  status: 'healthy' | 'degraded' | 'down';
  successRate: number;
  avgResponseTimeMs: number;
  totalRequests: number;
  lastActivityAt: Date | null;
}

export interface ExecutionStats {
  total: number;
  success: number;
  failed: number;
  successRate: number;
  avgDurationMs: number;
  p95DurationMs: number;
}

export interface DashboardSummary {
  /** 采集时间 */
  generatedAt: Date;
  /** 系统健康度 */
  health: SystemHealth;
  /** 引擎状态卡片 */
  engines: EngineStatusCard[];
  /** 队列概况 */
  queue: {
    totalEnqueued: number;
    totalDequeued: number;
    totalFailed: number;
    avgWaitTimeMs: number;
    maxWaitTimeMs: number;
  };
  /** 当前活跃告警 */
  activeAlerts: Alert[];
  /** 活跃告警数 */
  alertCount: number;
}

// ── 可配置阈值 ──────────────────────────────────────────

export interface AlertThresholds {
  /** 成功率低于此值触发告警（默认 0.9） */
  minSuccessRate?: number;
  /** 平均响应时间高于此值触发告警 ms（默认 3000） */
  maxResponseTimeMs?: number;
  /** 队列平均等待时间高于此值触发告警 ms（默认 5000） */
  maxQueueWaitTimeMs?: number;
  /** 引擎无活动超过此值视为 down 秒（默认 300） */
  engineDownTimeoutSec?: number;
}

// ── 核心类 ──────────────────────────────────────────────

export class DashboardService {
  private metricsCollector: MetricsCollector;
  private thresholds: Required<AlertThresholds>;
  private alertIdCounter = 0;

  constructor(metricsCollector: MetricsCollector, thresholds?: AlertThresholds) {
    this.metricsCollector = metricsCollector;
    this.thresholds = {
      minSuccessRate: thresholds?.minSuccessRate ?? 0.9,
      maxResponseTimeMs: thresholds?.maxResponseTimeMs ?? 3000,
      maxQueueWaitTimeMs: thresholds?.maxQueueWaitTimeMs ?? 5000,
      engineDownTimeoutSec: thresholds?.engineDownTimeoutSec ?? 300,
    };
  }

  // ── 核心函数 1: 仪表板摘要 ──────────────────────────────

  /**
   * 生成仪表板概览数据。
   * 聚合所有子系统指标为前端可直消费的摘要结构。
   */
  getDashboardSummary(): DashboardSummary {
    const snapshot = this.metricsCollector.getSnapshot();
    const alerts = this.getAlerts(snapshot);

    return {
      generatedAt: new Date(),
      health: snapshot.system,
      engines: this.buildEngineCards(snapshot),
      queue: {
        totalEnqueued: snapshot.queue.totalEnqueued,
        totalDequeued: snapshot.queue.totalDequeued,
        totalFailed: snapshot.queue.totalFailed,
        avgWaitTimeMs: snapshot.queue.avgWaitTimeMs,
        maxWaitTimeMs: snapshot.queue.maxWaitTimeMs,
      },
      activeAlerts: alerts,
      alertCount: alerts.length,
    };
  }

  // ── 核心函数 2: 告警检测 ────────────────────────────────

  /**
   * 根据当前指标快照和阈值规则，生成实时告警列表。
   * 可选传入快照，不传则自动获取最新快照。
   */
  getAlerts(snapshot?: MetricsSnapshot): Alert[] {
    const snap = snapshot ?? this.metricsCollector.getSnapshot();
    const alerts: Alert[] = [];
    const now = new Date();

    // 1. 整体成功率告警
    if (snap.system.successRate < this.thresholds.minSuccessRate) {
      alerts.push(this.createAlert(
        snap.system.successRate < 0.5 ? 'critical' : 'warning',
        'low_success_rate',
        '系统成功率偏低',
        `当前成功率 ${(snap.system.successRate * 100).toFixed(1)}%，低于阈值 ${(this.thresholds.minSuccessRate * 100).toFixed(0)}%`,
        snap.system.successRate,
        this.thresholds.minSuccessRate,
        now,
      ));
    }

    // 2. 响应时间告警
    if (snap.system.avgResponseTimeMs > this.thresholds.maxResponseTimeMs) {
      alerts.push(this.createAlert(
        snap.system.avgResponseTimeMs > 10000 ? 'critical' : 'warning',
        'high_response_time',
        '平均响应时间过高',
        `当前平均 ${snap.system.avgResponseTimeMs.toFixed(0)}ms，超过阈值 ${this.thresholds.maxResponseTimeMs}ms`,
        snap.system.avgResponseTimeMs,
        this.thresholds.maxResponseTimeMs,
        now,
      ));
    }

    // 3. 队列拥堵告警
    if (snap.queue.avgWaitTimeMs > this.thresholds.maxQueueWaitTimeMs) {
      alerts.push(this.createAlert(
        snap.queue.avgWaitTimeMs > 15000 ? 'critical' : 'warning',
        'queue_congestion',
        '队列等待时间过长',
        `平均等待 ${snap.queue.avgWaitTimeMs.toFixed(0)}ms，超过阈值 ${this.thresholds.maxQueueWaitTimeMs}ms`,
        snap.queue.avgWaitTimeMs,
        this.thresholds.maxQueueWaitTimeMs,
        now,
      ));
    }

    // 4. 引擎级别告警
    for (const [engineId, engine] of Object.entries(snap.engines)) {
      // 引擎 down 检测
      const downTimeoutMs = this.thresholds.engineDownTimeoutSec * 1000;
      const lastActivity = engine.lastSuccessAt ?? engine.lastFailureAt;
      if (lastActivity && (now.getTime() - lastActivity.getTime()) > downTimeoutMs) {
        alerts.push(this.createAlert(
          'critical',
          'engine_down',
          `引擎 ${engineId} 无响应`,
          `引擎 ${engineId} 已超过 ${this.thresholds.engineDownTimeoutSec}s 无活动`,
          (now.getTime() - (lastActivity?.getTime() ?? 0)) / 1000,
          this.thresholds.engineDownTimeoutSec,
          now,
          engineId,
        ));
      }

      // 单引擎成功率告警
      const engineTotal = engine.successCount + engine.failureCount;
      if (engineTotal >= 5) { // 至少 5 次请求才检测
        const engineRate = engine.successCount / engineTotal;
        if (engineRate < this.thresholds.minSuccessRate) {
          alerts.push(this.createAlert(
            engineRate < 0.5 ? 'critical' : 'warning',
            'low_success_rate',
            `引擎 ${engineId} 成功率偏低`,
            `引擎 ${engineId} 成功率 ${(engineRate * 100).toFixed(1)}%`,
            engineRate,
            this.thresholds.minSuccessRate,
            now,
            engineId,
          ));
        }
      }
    }

    // 5. 熔断器 OPEN 告警
    for (const [engineId, circuit] of Object.entries(snap.circuits)) {
      if (circuit.stateChanges.length > 0) {
        const lastChange = circuit.stateChanges[circuit.stateChanges.length - 1];
        if (lastChange.newState === 'OPEN') {
          alerts.push(this.createAlert(
            'critical',
            'circuit_open',
            `引擎 ${engineId} 熔断器已断开`,
            `熔断器从 ${lastChange.oldState} 切换到 OPEN，引擎暂时不可用`,
            1,
            0,
            now,
            engineId,
          ));
        }
      }
    }

    // 按严重级别排序：critical > warning > info
    const severityOrder: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 };
    alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    return alerts;
  }

  // ── 内部辅助 ──────────────────────────────────────────

  private createAlert(
    severity: AlertSeverity,
    type: Alert['type'],
    title: string,
    message: string,
    currentValue: number,
    threshold: number,
    triggeredAt: Date,
    engineId?: string,
  ): Alert {
    return {
      id: `alert_${++this.alertIdCounter}`,
      severity,
      type,
      title,
      message,
      engineId,
      currentValue,
      threshold,
      triggeredAt,
    };
  }

  /**
   * 聚合工作流执行统计：成功率、平均耗时、P95 延迟。
   * 从最近 N 条指标快照中汇总各引擎数据，生成前端图表所需的趋势摘要。
   */
  getExecutionStats(snapshots: MetricsSnapshot[]): ExecutionStats {
    const durations: number[] = [];
    let success = 0, failed = 0;
    for (const snap of snapshots) {
      for (const em of Object.values(snap.engines)) {
        success += em.successCount;
        failed += em.failureCount;
        if (em.avgResponseTimeMs > 0) durations.push(em.avgResponseTimeMs);
      }
    }
    durations.sort((a, b) => a - b);
    const p95 = durations.length > 0 ? durations[Math.floor(durations.length * 0.95)] : 0;
    const avg = durations.length > 0 ? durations.reduce((s, v) => s + v, 0) / durations.length : 0;
    const total = success + failed;
    return { total, success, failed, successRate: total > 0 ? success / total : 1, avgDurationMs: avg, p95DurationMs: p95 };
  }

  private buildEngineCards(snapshot: MetricsSnapshot): EngineStatusCard[] {
    const now = new Date();
    const downTimeoutMs = this.thresholds.engineDownTimeoutSec * 1000;

    return Object.entries(snapshot.engines).map(([engineId, em]: [string, EngineMetrics]) => {
      const total = em.successCount + em.failureCount;
      const successRate = total > 0 ? em.successCount / total : 1;
      const lastActivity = em.lastSuccessAt ?? em.lastFailureAt;

      let status: EngineStatusCard['status'] = 'healthy';
      if (successRate < 0.5) {
        status = 'down';
      } else if (
        successRate < this.thresholds.minSuccessRate ||
        em.avgResponseTimeMs > this.thresholds.maxResponseTimeMs ||
        (lastActivity && (now.getTime() - lastActivity.getTime()) > downTimeoutMs)
      ) {
        status = 'degraded';
      }

      return {
        engineId,
        status,
        successRate,
        avgResponseTimeMs: em.avgResponseTimeMs,
        totalRequests: total,
        lastActivityAt: lastActivity,
      };
    });
  }
}
