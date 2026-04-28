/**
 * MetricsCollector 单元测试
 *
 * 验证指标采集的准确性：请求计数、引擎指标、熔断指标、系统健康评分。
 */

import { EventBus } from '../services/event-bus'';
import { MetricsCollector } from '../services/metrics-collector'';
import type {
  RequestEnqueuedEvent,
  RequestDequeuedEvent,
  RequestFailedEvent,
  EngineRegisteredEvent,
  EngineSuccessEvent,
  EngineFailureEvent,
  CircuitStateChangedEvent,
  CircuitResetEvent,
} from '../services/event-bus'';

// ── 辅助 ────────────────────────────────────────────────

function createBus(): EventBus {
  EventBus.resetInstance();
  return EventBus.getInstance();
}

function ts(offsetMs = 0): Date {
  return new Date(Date.now() + offsetMs);
}

// ── 测试 ────────────────────────────────────────────────

describe('MetricsCollector', () => {
  let bus: EventBus;
  let collector: MetricsCollector;

  beforeEach(() => {
    bus = createBus();
    collector = new MetricsCollector(bus);
    collector.start();
  });

  afterEach(() => {
    collector.stop();
    bus.clearAll();
  });

  // ── 生命周期 ──────────────────────────────────────────

  test('start/stop 正常工作，stop 后不再采集', () => {
    collector.stop();

    bus.emit({ type: 'request.enqueued', requestId: 'r1', taskType: 'text', priority: 'NORMAL' } as any);

    const snap = collector.getSnapshot();
    expect(snap.queue.totalEnqueued).toBe(0);
  });

  test('重复 start 不重复订阅', () => {
    collector.start(); // 第二次
    collector.start(); // 第三次

    bus.emit({ type: 'request.enqueued', requestId: 'r1', taskType: 'text', priority: 'NORMAL' } as any);

    // 不应该多倍计数
    expect(collector.getSnapshot().queue.totalEnqueued).toBe(1);
  });

  test('reset 清空所有指标', () => {
    bus.emit({ type: 'request.enqueued', requestId: 'r1', taskType: 'text', priority: 'NORMAL' } as any);
    bus.emit({ type: 'engine.success', engineId: 'e1', responseTimeMs: 100 } as any);

    collector.reset();

    const snap = collector.getSnapshot();
    expect(snap.queue.totalEnqueued).toBe(0);
    expect(Object.keys(snap.engines)).toHaveLength(0);
  });

  // ── 队列指标 ──────────────────────────────────────────

  test('正确统计入队/出队/失败计数', () => {
    bus.emit({ type: 'request.enqueued', requestId: 'r1', taskType: 'text', priority: 'NORMAL' } as any);
    bus.emit({ type: 'request.enqueued', requestId: 'r2', taskType: 'text', priority: 'HIGH' } as any);
    bus.emit({ type: 'request.dequeued', requestId: 'r1', engineId: 'e1', waitTimeMs: 50 } as any);
    bus.emit({ type: 'request.failed', requestId: 'r2', engineId: 'e1', error: 'timeout' } as any);

    const q = collector.getQueueMetrics();
    expect(q.totalEnqueued).toBe(2);
    expect(q.totalDequeued).toBe(1);
    expect(q.totalFailed).toBe(1);
  });

  test('正确计算等待时长统计', () => {
    bus.emit({ type: 'request.dequeued', requestId: 'r1', engineId: 'e1', waitTimeMs: 100 } as any);
    bus.emit({ type: 'request.dequeued', requestId: 'r2', engineId: 'e1', waitTimeMs: 300 } as any);
    bus.emit({ type: 'request.dequeued', requestId: 'r3', engineId: 'e1', waitTimeMs: 200 } as any);

    const q = collector.getQueueMetrics();
    expect(q.avgWaitTimeMs).toBe(200); // (100+300+200)/3
    expect(q.maxWaitTimeMs).toBe(300);
    expect(q.waitTimeSamples).toHaveLength(3);
  });

  test('等待时长样本超过上限时自动截断', () => {
    const small = new MetricsCollector(bus, { maxWaitTimeSamples: 5 });
    small.start();

    for (let i = 0; i < 10; i++) {
      bus.emit({
        type: 'request.dequeued',
        requestId: `r${i}`,
        engineId: 'e1',
        waitTimeMs: i * 10,
      } as any);
    }

    const q = small.getQueueMetrics();
    expect(q.waitTimeSamples.length).toBeLessThanOrEqual(5);
    small.stop();
  });

  // ── 引擎指标 ──────────────────────────────────────────

  test('注册引擎后可获取初始指标', () => {
    bus.emit({ type: 'engine.registered', engineId: 'gpt-4', weight: 100 } as any);

    const m = collector.getEngineMetrics('gpt-4');
    expect(m).not.toBeNull();
    expect(m!.engineId).toBe('gpt-4');
    expect(m!.successCount).toBe(0);
    expect(m!.failureCount).toBe(0);
  });

  test('正确统计引擎成功/失败和平均响应时间', () => {
    bus.emit({ type: 'engine.registered', engineId: 'gpt-4', weight: 100 } as any);
    bus.emit({ type: 'engine.success', engineId: 'gpt-4', responseTimeMs: 200 } as any);
    bus.emit({ type: 'engine.success', engineId: 'gpt-4', responseTimeMs: 400 } as any);
    bus.emit({ type: 'engine.failure', engineId: 'gpt-4', errorMessage: 'timeout' } as any);

    const m = collector.getEngineMetrics('gpt-4')!;
    expect(m.successCount).toBe(2);
    expect(m.failureCount).toBe(1);
    expect(m.avgResponseTimeMs).toBe(300); // (200+400)/2
    expect(m.lastSuccessAt).not.toBeNull();
    expect(m.lastFailureAt).not.toBeNull();
  });

  test('未注册的引擎返回 null', () => {
    expect(collector.getEngineMetrics('nonexistent')).toBeNull();
  });

  // ── 熔断指标 ──────────────────────────────────────────

  test('记录熔断器状态变更历史', () => {
    bus.emit({
      type: 'circuit.state_changed',
      engineId: 'gpt-4',
      oldState: 'CLOSED',
      newState: 'OPEN',
    } as any);
    bus.emit({
      type: 'circuit.state_changed',
      engineId: 'gpt-4',
      oldState: 'OPEN',
      newState: 'HALF_OPEN',
    } as any);

    const snap = collector.getSnapshot();
    const cm = snap.circuits['gpt-4'];
    expect(cm).toBeDefined();
    expect(cm!.stateChanges).toHaveLength(2);
    expect(cm!.stateChanges[0].newState).toBe('OPEN');
    expect(cm!.stateChanges[1].newState).toBe('HALF_OPEN');
  });

  test('记录熔断器重置次数', () => {
    bus.emit({ type: 'circuit.reset', engineId: 'gpt-4' } as any);
    bus.emit({ type: 'circuit.reset', engineId: 'gpt-4' } as any);

    const snap = collector.getSnapshot();
    expect(snap.circuits['gpt-4']!.resets).toBe(2);
  });

  test('熔断器历史记录超过上限时自动截断', () => {
    const small = new MetricsCollector(bus, { maxCircuitChanges: 3 });
    small.start();

    for (let i = 0; i < 5; i++) {
      bus.emit({
        type: 'circuit.state_changed',
        engineId: 'e1',
        oldState: 'CLOSED',
        newState: i % 2 === 0 ? 'OPEN' : 'CLOSED',
      } as any);
    }

    const snap = small.getSnapshot();
    expect(snap.circuits['e1']!.stateChanges.length).toBeLessThanOrEqual(3);
    small.stop();
  });

  // ── 系统健康评分 ──────────────────────────────────────

  test('无数据时健康评分为满分', () => {
    const health = collector.getSystemHealth();
    expect(health.score).toBe(100);
    expect(health.totalRequests).toBe(0);
    expect(health.successRate).toBe(1); // 默认 100%
  });

  test('全部成功 → 高评分', () => {
    bus.emit({ type: 'engine.registered', engineId: 'e1', weight: 100 } as any);
    for (let i = 0; i < 10; i++) {
      bus.emit({ type: 'engine.success', engineId: 'e1', responseTimeMs: 150 } as any);
    }

    const health = collector.getSystemHealth();
    expect(health.score).toBeGreaterThanOrEqual(95);
    expect(health.successRate).toBe(1);
    expect(health.avgResponseTimeMs).toBe(150);
    expect(healthyEngineCount(health)).toBe(1);
  });

  test('半数失败 → 中等评分', () => {
    bus.emit({ type: 'engine.registered', engineId: 'e1', weight: 100 } as any);
    for (let i = 0; i < 5; i++) {
      bus.emit({ type: 'engine.success', engineId: 'e1', responseTimeMs: 200 } as any);
    }
    for (let i = 0; i < 5; i++) {
      bus.emit({ type: 'engine.failure', engineId: 'e1', errorMessage: 'err' } as any);
    }

    const health = collector.getSystemHealth();
    expect(health.score).toBeLessThanOrEqual(80);
    expect(health.successRate).toBe(0.5);
    expect(health.totalRequests).toBe(10);
  });

  test('引擎熔断为 OPEN 状态 → 不计入健康引擎', () => {
    bus.emit({ type: 'engine.registered', engineId: 'e1', weight: 100 } as any);
    bus.emit({ type: 'engine.success', engineId: 'e1', responseTimeMs: 100 } as any);
    bus.emit({
      type: 'circuit.state_changed',
      engineId: 'e1',
      oldState: 'CLOSED',
      newState: 'OPEN',
    } as any);

    const health = collector.getSystemHealth();
    expect(healthyEngineCount(health)).toBe(0);
  });

  // ── 快照完整性 ────────────────────────────────────────

  test('getSnapshot 返回完整结构', () => {
    bus.emit({ type: 'engine.registered', engineId: 'e1', weight: 100 } as any);
    bus.emit({ type: 'engine.success', engineId: 'e1', responseTimeMs: 100 } as any);

    const snap = collector.getSnapshot();
    expect(snap.collectedAt).toBeInstanceOf(Date);
    expect(snap.uptimeMs).toBeGreaterThanOrEqual(0);
    expect(snap.queue).toBeDefined();
    expect(snap.engines).toBeDefined();
    expect(snap.circuits).toBeDefined();
    expect(snap.system).toBeDefined();
    expect(snap.system.collectingSince).toBeInstanceOf(Date);
  });

  test('快照是深拷贝，不影响内部状态', () => {
    bus.emit({ type: 'engine.success', engineId: 'e1', responseTimeMs: 100 } as any);

    const snap1 = collector.getSnapshot();
    // 快照后新事件
    bus.emit({ type: 'engine.success', engineId: 'e1', responseTimeMs: 200 } as any);

    const snap2 = collector.getSnapshot();
    expect(snap2.engines['e1']!.successCount).toBe(snap1.engines['e1']!.successCount + 1);
  });
});

// ── 辅助函数 ────────────────────────────────────────────

/** 从 SystemHealth 中提取 healthyEngineCount */
function healthyEngineCount(health: any): number {
  return health.healthyEngineCount;
}
