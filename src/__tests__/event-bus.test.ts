/**
 * EventBus 单元测试
 *
 * 验证发布/订阅、通配符监听、一次性订阅、事件日志等核心行为。
 */

import { describe, it, expect } from '@jest/globals';
import { EventBus, OrchestratorEvent } from '../services/event-bus'.ts';

// ── 测试辅助 ──────────────────────────────────────────────

function createBus(): EventBus {
  EventBus.resetInstance();
  return new EventBus({ maxLogSize: 50 });
}

// ── 测试 1: on + emit 基本订阅与发布 ──────────────────────

describe('EventBus - Basic Subscription', () => {
  it('should deliver events to subscribers', () => {
    const bus = createBus();
    const received: OrchestratorEvent[] = [];

    bus.on('request.enqueued', (e) => {
      received.push(e);
    });

    const delivered = bus.emit({
      type: 'request.enqueued',
      requestId: 'req_001',
      taskType: 'text-generation',
      priority: 'HIGH',
    });

    expect(delivered).toBe(1);
    expect(received.length).toBe(1);
    expect(received[0].type).toBe('request.enqueued');
    expect((received[0] as any).requestId).toBe('req_001');
    expect(received[0].timestamp).toBeInstanceOf(Date);
  });

  it('should handle unsubscribe correctly', () => {
    const bus = createBus();
    let count = 0;

    const sub = bus.on('engine.success', () => { count++; });

    bus.emit({ type: 'engine.success', engineId: 'gpt-4', responseTimeMs: 120 });
    expect(count).toBe(1);

    sub.unsubscribe();

    bus.emit({ type: 'engine.success', engineId: 'gpt-4', responseTimeMs: 100 });
    expect(count).toBe(1);
  });

  it('should deliver to multiple subscribers', () => {
    const bus = createBus();
    const results: number[] = [];

    bus.on('circuit.reset', () => { results.push(1); });
    bus.on('circuit.reset', () => { results.push(2); });
    bus.on('circuit.reset', () => { results.push(3); });

    const delivered = bus.emit({ type: 'circuit.reset', engineId: 'gpt-4' });

    expect(delivered).toBe(3);
    expect(results.length).toBe(3);
  });

  it('should handle listener errors without affecting others', () => {
    const bus = createBus();
    let secondCalled = false;

    bus.on('engine.failure', () => { throw new Error('boom'); });
    bus.on('engine.failure', () => { secondCalled = true; });

    const delivered = bus.emit({ type: 'engine.failure', engineId: 'e1', errorMessage: 'err' });

    expect(secondCalled).toBe(true);
    expect(delivered).toBe(2);
  });
});

// ── 测试 2: 通配符和一次性订阅 ──────────────────────────────

describe('EventBus - Advanced Subscription', () => {
  it('should handle wildcard listeners', () => {
    const bus = createBus();
    const allTypes: string[] = [];

    bus.onAny((e) => { allTypes.push(e.type); });

    bus.emit({ type: 'request.enqueued', requestId: 'r1', taskType: 't', priority: 'NORMAL' });
    bus.emit({ type: 'engine.failure', engineId: 'e1', errorMessage: 'timeout' });
    bus.emit({ type: 'circuit.state_changed', engineId: 'e1', oldState: 'CLOSED', newState: 'OPEN' });

    expect(allTypes.length).toBe(3);
    expect(allTypes[0]).toBe('request.enqueued');
    expect(allTypes[1]).toBe('engine.failure');
    expect(allTypes[2]).toBe('circuit.state_changed');
  });

  it('should handle one-time subscriptions', () => {
    const bus = createBus();
    let count = 0;

    bus.once('engine.registered', () => { count++; });

    bus.emit({ type: 'engine.registered', engineId: 'gpt-4', weight: 100 });
    bus.emit({ type: 'engine.registered', engineId: 'claude-3', weight: 80 });

    expect(count).toBe(1);
  });

  it('should deliver to both typed and wildcard listeners', () => {
    const bus = createBus();
    let typedCount = 0;
    let anyCount = 0;

    bus.on('engine.success', () => { typedCount++; });
    bus.onAny(() => { anyCount++; });

    bus.emit({ type: 'engine.success', engineId: 'gpt-4', responseTimeMs: 100 });

    expect(typedCount).toBe(1);
    expect(anyCount).toBe(1);
  });
});

// ── 测试 3: 事件日志和查询功能 ───────────────────────────────

describe('EventBus - Logging and Querying', () => {
  it('should record events in log', () => {
    const bus = createBus();

    bus.emit({ type: 'request.enqueued', requestId: 'r1', taskType: 't', priority: 'HIGH' });
    bus.emit({ type: 'request.enqueued', requestId: 'r2', taskType: 't', priority: 'LOW' });
    bus.emit({ type: 'engine.success', engineId: 'gpt-4', responseTimeMs: 50 });

    const log = bus.getEventLog();
    expect(log.length).toBe(3);

    const enqueueLog = bus.getEventLogByType('request.enqueued');
    expect(enqueueLog.length).toBe(2);

    const recentLog = bus.getEventLog(1);
    expect(recentLog.length).toBe(1);
    expect(recentLog[0].event.type).toBe('engine.success');

    expect(bus.totalEventsEmitted).toBe(3);
  });

  it('should handle log size limits', () => {
    const bus = new EventBus({ maxLogSize: 3 });

    for (let i = 0; i < 5; i++) {
      bus.emit({ type: 'queue.cleared', removedCount: i });
    }

    const log = bus.getEventLog();
    expect(log.length).toBe(3);
    expect((log[0].event as any).removedCount).toBe(2);
    expect((log[2].event as any).removedCount).toBe(4);
  });

  it('should return empty array for non-existent types', () => {
    const bus = createBus();

    bus.emit({ type: 'request.enqueued', requestId: 'r1', taskType: 't', priority: 'HIGH' });
    
    const emptyLog = bus.getEventLogByType('engine.failure');
    expect(emptyLog.length).toBe(0);
    
    const limitLog = bus.getEventLogByType('request.enqueued', 0);
    expect(limitLog.length).toBe(0);
  });

  it('should record delivered count in log entries', () => {
    const bus = createBus();
    
    // 设置多个订阅者
    bus.on('engine.success', () => {});
    bus.on('engine.success', () => {});
    bus.onAny(() => {});
    
    bus.emit({ type: 'engine.success', engineId: 'gpt-4', responseTimeMs: 100 });
    
    const log = bus.getEventLog();
    expect(log.length).toBe(1);
    expect(log[0].deliveredTo).toBe(3);
    expect(log[0].event.type).toBe('engine.success');
  });
});

// ── 测试 4: 计数器和统计功能 ─────────────────────────────────

describe('EventBus - Statistics', () => {
  it('should count listeners correctly', () => {
    const bus = createBus();

    bus.on('request.enqueued', () => {});
    bus.on('request.enqueued', () => {});
    bus.on('engine.success', () => {});
    bus.onAny(() => {});

    const counts = bus.getListenerCounts();
    expect(counts['request.enqueued']).toBe(2);
    expect(counts['engine.success']).toBe(1);
    expect(counts['*']).toBe(1);
  });

  it('should handle unknown types in counts', () => {
    const bus = createBus();
    
    const counts = bus.getListenerCounts();
    expect(counts['*']).toBe(0);
    expect(counts['unknown.type']).toBe(0);
    
    bus.onAny(() => {});
    const countsWithWildcard = bus.getListenerCounts();
    expect(countsWithWildcard['*']).toBe(1);
  });
});

// ── 测试 5: 清理功能 ────────────────────────────────────────

describe('EventBus - Cleanup', () => {
  it('should clear all listeners and events', () => {
    const bus = createBus();

    bus.on('request.enqueued', () => {});
    bus.onAny(() => {});
    bus.emit({ type: 'request.enqueued', requestId: 'r1', taskType: 't', priority: 'N' });

    expect(bus.totalEventsEmitted).toBe(1);

    bus.clearAll();

    expect(bus.totalEventsEmitted).toBe(0);
    const counts = bus.getListenerCounts();
    expect(Object.keys(counts).length).toBe(0);
  });

  it('should clear log but keep listeners', () => {
    const bus = createBus();

    bus.on('request.enqueued', () => {});
    bus.emit({ type: 'request.enqueued', requestId: 'r1', taskType: 't', priority: 'HIGH' });
    bus.emit({ type: 'request.enqueued', requestId: 'r2', taskType: 't', priority: 'LOW' });

    expect(bus.totalEventsEmitted).toBe(2);
    
    bus.clearLog();
    
    expect(bus.totalEventsEmitted).toBe(0);
    const log = bus.getEventLog();
    expect(log.length).toBe(0);
    
    // 验证订阅者仍然存在
    const counts = bus.getListenerCounts();
    expect(counts['request.enqueued']).toBe(1);
  });
});

// ── 测试 6: 单例模式 ───────────────────────────────────────

describe('EventBus - Singleton', () => {
  it('should return same instance', () => {
    EventBus.resetInstance();
    const a = EventBus.getInstance();
    const b = EventBus.getInstance();
    expect(a === b).toBe(true);
    EventBus.resetInstance();
    const c = EventBus.getInstance();
    expect(a !== c).toBe(true);
    EventBus.resetInstance();
  });
});

// ── 测试 7: 边界条件 ───────────────────────────────────────

describe('EventBus - Edge Cases', () => {
  it('should handle non-existent event types', () => {
    const bus = createBus();
    
    const delivered = bus.emit({ type: 'non.existent.type', requestId: 'test' as any });
    expect(delivered).toBe(0);
    
    const delivered2 = bus.emit({ type: 'request.enqueued', requestId: 'test', taskType: 'test', priority: 'NORMAL' });
    expect(delivered2).toBe(0);
  });

  it('should handle large volumes of events', () => {
    const bus = createBus();
    let count = 0;
    
    bus.on('request.enqueued', () => { count++; });
    
    // 发布大量事件
    for (let i = 0; i < 100; i++) {
      bus.emit({ type: 'request.enqueued', requestId: `req_${i}`, taskType: 'test', priority: 'NORMAL' });
    }
    
    expect(count).toBe(100);
    expect(bus.totalEventsEmitted).toBe(100);
  });

  it('should handle once subscription boundaries', () => {
    const bus = createBus();
    let count = 0;
    
    const sub = bus.once('test.event', () => { count++; });
    
    // 第一次发布应该触发
    bus.emit({ type: 'test.event', test: 'data' } as any);
    expect(count).toBe(1);
    
    // 第二次发布不应该触发
    bus.emit({ type: 'test.event', test: 'data' } as any);
    expect(count).toBe(1);
    
    // 取消订阅后再发布
    sub.unsubscribe();
    bus.emit({ type: 'test.event', test: 'data' } as any);
    expect(count).toBe(1);
  });

  it('should handle invalid event types gracefully', () => {
    const bus = createBus();
    
    // 测试null/undefined事件类型
    expect(() => {
      // @ts-ignore - 测试无效输入
      bus.emit({ type: null, requestId: 'test' } as any);
    }).not.toThrow();
    
    expect(() => {
      // @ts-ignore - 测试无效输入
      bus.emit({ type: undefined, requestId: 'test' } as any);
    }).not.toThrow();
  });

  it('should handle wildcard listener errors gracefully', () => {
    const bus = createBus();
    let safeListenerCalled = false;
    
    // 添加一个会抛出错误的通配符监听器
    bus.onAny((e) => {
      if (e.type === 'error.test') {
        throw new Error('Wildcard test error');
      }
      safeListenerCalled = true;
    });
    
    // 添加一个安全的监听器
    bus.on('engine.success', () => {
      safeListenerCalled = true;
    });
    
    // 发布会导致错误的事件
    bus.emit({ type: 'error.test', error: 'test' } as any);
    
    // 发布安全事件
    bus.emit({ type: 'engine.success', engineId: 'test', responseTimeMs: 100 });
    
    expect(safeListenerCalled).toBe(true);
  });

  it('should handle concurrent listeners correctly', () => {
    const bus = createBus();
    const results: number[] = [];
    
    bus.on('concurrent.test', () => {
      results.push(1);
    });
    
    bus.on('concurrent.test', () => {
      results.push(2);
    });
    
    bus.on('concurrent.test', () => {
      results.push(3);
    });
    
    bus.emit({ type: 'concurrent.test', data: 'test' } as any);
    
    expect(results.length).toBe(3);
    expect(results).toContain(1);
    expect(results).toContain(2);
    expect(results).toContain(3);
  });

  it('should handle max log size boundaries', () => {
    const bus = new EventBus({ maxLogSize: 1 });
    
    bus.emit({ type: 'first.event', data: 'first' } as any);
    bus.emit({ type: 'second.event', data: 'second' } as any);
    
    const log = bus.getEventLog();
    expect(log.length).toBe(1);
    expect(log[0].event.type).toBe('second.event');
  });

  it('should ensure event timestamp accuracy', () => {
    const bus = createBus();
    const events: OrchestratorEvent[] = [];
    
    bus.onAny((e) => { events.push(e); });
    
    const beforeEmit = new Date();
    bus.emit({ type: 'test.event', data: 'test' } as any);
    const afterEmit = new Date();
    
    expect(events.length).toBe(1);
    expect(events[0].timestamp).toBeInstanceOf(Date);
    expect(events[0].timestamp.getTime()).toBeGreaterThanOrEqual(beforeEmit.getTime());
    expect(events[0].timestamp.getTime()).toBeLessThanOrEqual(afterEmit.getTime());
  });

  it('should handle complex events correctly', () => {
    const bus = createBus();
    const events: OrchestratorEvent[] = [];
    
    bus.onAny((e) => { events.push(e); });
    
    bus.emit({
      type: 'request.enqueued',
      requestId: 'complex_test',
      taskType: 'complex-analysis',
      priority: 'CRITICAL'
    });
    
    bus.emit({
      type: 'engine.success',
      engineId: 'complex_engine',
      responseTimeMs: 500
    });
    
    expect(events.length).toBe(2);
    expect(events[0].type).toBe('request.enqueued');
    expect(events[1].type).toBe('engine.success');
    expect((events[0] as any).requestId).toBe('complex_test');
    expect((events[1] as any).engineId).toBe('complex_engine');
  });
});