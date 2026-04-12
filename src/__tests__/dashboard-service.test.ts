/**
 * DashboardService 单元测试
 */

import { EventBus } from '../services/event-bus.js';
import { MetricsCollector } from '../services/metrics-collector.js';
import { DashboardService, Alert, DashboardSummary, EngineStatusCard } from '../services/dashboard-service.js';

let eventBus: EventBus;
let collector: MetricsCollector;
let dashboard: DashboardService;

beforeEach(() => {
  EventBus.resetInstance();
  eventBus = new EventBus();
  collector = new MetricsCollector(eventBus);
  collector.start();
  dashboard = new DashboardService(collector);
});

afterEach(() => {
  collector.stop();
});

// ── 辅助：模拟引擎注册+成功 ──────────────────────────────

function simulateHealthyEngine(engineId: string, responseTimeMs = 150): void {
  eventBus.emit({ type: 'engine.registered', engineId, weight: 1 });
  eventBus.emit({ type: 'engine.success', engineId, responseTimeMs });
}

function simulateFailedEngine(engineId: string): void {
  eventBus.emit({ type: 'engine.registered', engineId, weight: 1 });
  eventBus.emit({ type: 'engine.failure', engineId, errorMessage: 'timeout' });
}

// ── getDashboardSummary ────────────────────────────────

describe('DashboardService - getDashboardSummary', () => {
  test('返回完整摘要结构', () => {
    simulateHealthyEngine('engine-1');
    const summary = dashboard.getDashboardSummary();

    expect(summary.generatedAt).toBeInstanceOf(Date);
    expect(summary.health).toBeDefined();
    expect(summary.engines).toBeInstanceOf(Array);
    expect(summary.queue).toBeDefined();
    expect(summary.activeAlerts).toBeInstanceOf(Array);
    expect(summary.alertCount).toBe(summary.activeAlerts.length);
  });

  test('空系统返回默认值', () => {
    const summary = dashboard.getDashboardSummary();

    expect(summary.health.score).toBe(100); // 无引擎时满健康
    expect(summary.engines).toHaveLength(0);
    expect(summary.queue.totalEnqueued).toBe(0);
    expect(summary.alertCount).toBe(0);
  });

  test('多引擎生成多个引擎卡片', () => {
    simulateHealthyEngine('engine-1');
    simulateHealthyEngine('engine-2');
    simulateHealthyEngine('engine-3');

    const summary = dashboard.getDashboardSummary();
    expect(summary.engines).toHaveLength(3);
    expect(summary.engines.every((e) => e.status === 'healthy')).toBe(true);
  });
});

// ── getAlerts ──────────────────────────────────────────

describe('DashboardService - getAlerts', () => {
  test('健康系统无告警', () => {
    simulateHealthyEngine('engine-1', 100);
    const alerts = dashboard.getAlerts();
    expect(alerts).toHaveLength(0);
  });

  test('低成功率触发告警', () => {
    // 注册引擎，多次失败
    eventBus.emit({ type: 'engine.registered', engineId: 'engine-1', weight: 1 });
    for (let i = 0; i < 8; i++) {
      eventBus.emit({ type: 'engine.failure', engineId: 'engine-1', errorMessage: 'err' });
    }
    for (let i = 0; i < 2; i++) {
      eventBus.emit({ type: 'engine.success', engineId: 'engine-1', responseTimeMs: 100 });
    }
    // 成功率 = 2/10 = 0.2 < 0.9

    const alerts = dashboard.getAlerts();
    const lowRateAlert = alerts.find((a) => a.type === 'low_success_rate');
    expect(lowRateAlert).toBeDefined();
    expect(lowRateAlert!.severity).toBe('critical'); // < 0.5 → critical
  });

  test('高响应时间触发告警', () => {
    simulateHealthyEngine('engine-1', 5000); // 5000ms > 默认阈值 3000ms

    const alerts = dashboard.getAlerts();
    const responseAlert = alerts.find((a) => a.type === 'high_response_time');
    expect(responseAlert).toBeDefined();
    expect(responseAlert!.currentValue).toBeGreaterThan(3000);
  });

  test('熔断器 OPEN 触发告警', () => {
    simulateHealthyEngine('engine-1');
    eventBus.emit({
      type: 'circuit.state_changed',
      engineId: 'engine-1',
      oldState: 'CLOSED',
      newState: 'OPEN',
    });

    const alerts = dashboard.getAlerts();
    const circuitAlert = alerts.find((a) => a.type === 'circuit_open');
    expect(circuitAlert).toBeDefined();
    expect(circuitAlert!.engineId).toBe('engine-1');
    expect(circuitAlert!.severity).toBe('critical');
  });

  test('告警按严重级别排序（critical 在前）', () => {
    // 触发多种告警
    eventBus.emit({ type: 'engine.registered', engineId: 'engine-1', weight: 1 });
    eventBus.emit({ type: 'engine.success', engineId: 'engine-1', responseTimeMs: 5000 });

    const alerts = dashboard.getAlerts();
    for (let i = 1; i < alerts.length; i++) {
      const order = { critical: 0, warning: 1, info: 2 };
      expect(order[alerts[i - 1].severity]).toBeLessThanOrEqual(order[alerts[i].severity]);
    }
  });

  test('自定义阈值生效', () => {
    const customDashboard = new DashboardService(collector, {
      minSuccessRate: 0.99, // 非常严格
    });

    simulateHealthyEngine('engine-1', 100);
    // 1次成功，成功率=1.0 >= 0.99，不触发
    expect(customDashboard.getAlerts()).toHaveLength(0);

    // 加一次失败，成功率=0.5 < 0.99
    eventBus.emit({ type: 'engine.failure', engineId: 'engine-1', errorMessage: 'err' });
    const alerts = customDashboard.getAlerts();
    expect(alerts.some((a) => a.type === 'low_success_rate')).toBe(true);
  });
});

// ── EngineStatusCard 状态判定 ──────────────────────────

describe('DashboardService - EngineStatusCard', () => {
  test('高成功率+低延迟 → healthy', () => {
    simulateHealthyEngine('engine-1', 100);
    const summary = dashboard.getDashboardSummary();
    const card = summary.engines.find((e) => e.engineId === 'engine-1');
    expect(card?.status).toBe('healthy');
  });

  test('成功率<90% → degraded', () => {
    eventBus.emit({ type: 'engine.registered', engineId: 'engine-1', weight: 1 });
    // 8 success, 2 failure → 80%
    for (let i = 0; i < 8; i++) {
      eventBus.emit({ type: 'engine.success', engineId: 'engine-1', responseTimeMs: 100 });
    }
    for (let i = 0; i < 2; i++) {
      eventBus.emit({ type: 'engine.failure', engineId: 'engine-1', errorMessage: 'err' });
    }

    const summary = dashboard.getDashboardSummary();
    const card = summary.engines.find((e) => e.engineId === 'engine-1');
    expect(card?.status).toBe('degraded');
    expect(card?.successRate).toBeCloseTo(0.8);
  });
});
