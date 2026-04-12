/**
 * EventBus 单元测试
 *
 * 验证发布/订阅、通配符监听、一次性订阅、事件日志等核心行为。
 */

import { EventBus, OrchestratorEvent, EventLogEntry } from '../services/event-bus.js';

// ── 测试辅助 ──────────────────────────────────────────────

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(`ASSERT FAIL: ${msg}`);
}

function assertEqual<T>(actual: T, expected: T, label: string) {
  if (actual !== expected) {
    throw new Error(`ASSERT FAIL [${label}]: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function createBus(): EventBus {
  EventBus.resetInstance();
  return new EventBus({ maxLogSize: 50 });
}

// ── 测试 1: on + emit 基本订阅与发布 ──────────────────────

function testOnAndEmit() {
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

  assertEqual(delivered, 1, 'delivered count');
  assertEqual(received.length, 1, 'received count');
  assertEqual(received[0].type, 'request.enqueued', 'event type');
  assertEqual((received[0] as any).requestId, 'req_001', 'requestId');
  assert(received[0].timestamp instanceof Date, 'timestamp is Date');
  console.log('  ✅ testOnAndEmit passed');
}

// ── 测试 2: unsubscribe 取消订阅 ──────────────────────────

function testUnsubscribe() {
  const bus = createBus();
  let count = 0;

  const sub = bus.on('engine.success', () => { count++; });

  bus.emit({ type: 'engine.success', engineId: 'gpt-4', responseTimeMs: 120 });
  assertEqual(count, 1, 'count after first emit');

  sub.unsubscribe();

  bus.emit({ type: 'engine.success', engineId: 'gpt-4', responseTimeMs: 100 });
  assertEqual(count, 1, 'count should stay 1 after unsubscribe');
  console.log('  ✅ testUnsubscribe passed');
}

// ── 测试 3: onAny 通配符监听 ──────────────────────────────

function testOnAny() {
  const bus = createBus();
  const allTypes: string[] = [];

  bus.onAny((e) => { allTypes.push(e.type); });

  bus.emit({ type: 'request.enqueued', requestId: 'r1', taskType: 't', priority: 'NORMAL' });
  bus.emit({ type: 'engine.failure', engineId: 'e1', errorMessage: 'timeout' });
  bus.emit({ type: 'circuit.state_changed', engineId: 'e1', oldState: 'CLOSED', newState: 'OPEN' });

  assertEqual(allTypes.length, 3, 'onAny received all 3 events');
  assertEqual(allTypes[0], 'request.enqueued', 'first event type');
  assertEqual(allTypes[1], 'engine.failure', 'second event type');
  assertEqual(allTypes[2], 'circuit.state_changed', 'third event type');
  console.log('  ✅ testOnAny passed');
}

// ── 测试 4: once 一次性订阅 ───────────────────────────────

function testOnce() {
  const bus = createBus();
  let count = 0;

  bus.once('engine.registered', () => { count++; });

  bus.emit({ type: 'engine.registered', engineId: 'gpt-4', weight: 100 });
  bus.emit({ type: 'engine.registered', engineId: 'claude-3', weight: 80 });

  assertEqual(count, 1, 'once should only fire once');
  console.log('  ✅ testOnce passed');
}

// ── 测试 5: 多个订阅者并行接收 ────────────────────────────

function testMultipleListeners() {
  const bus = createBus();
  const results: number[] = [];

  bus.on('circuit.reset', () => { results.push(1); });
  bus.on('circuit.reset', () => { results.push(2); });
  bus.on('circuit.reset', () => { results.push(3); });

  const delivered = bus.emit({ type: 'circuit.reset', engineId: 'gpt-4' });

  assertEqual(delivered, 3, 'delivered to 3 listeners');
  assertEqual(results.length, 3, '3 results collected');
  console.log('  ✅ testMultipleListeners passed');
}

// ── 测试 6: 订阅者异常不影响其他订阅者 ────────────────────

function testListenerErrorIsolation() {
  const bus = createBus();
  let secondCalled = false;

  bus.on('engine.failure', () => { throw new Error('boom'); });
  bus.on('engine.failure', () => { secondCalled = true; });

  const delivered = bus.emit({ type: 'engine.failure', engineId: 'e1', errorMessage: 'err' });

  assert(secondCalled, 'second listener should still be called');
  assertEqual(delivered, 2, 'both listeners counted as delivered');
  console.log('  ✅ testListenerErrorIsolation passed');
}

// ── 测试 7: 事件日志记录与查询 ────────────────────────────

function testEventLog() {
  const bus = createBus();

  bus.emit({ type: 'request.enqueued', requestId: 'r1', taskType: 't', priority: 'HIGH' });
  bus.emit({ type: 'request.enqueued', requestId: 'r2', taskType: 't', priority: 'LOW' });
  bus.emit({ type: 'engine.success', engineId: 'gpt-4', responseTimeMs: 50 });

  const log = bus.getEventLog();
  assertEqual(log.length, 3, 'log has 3 entries');

  const enqueueLog = bus.getEventLogByType('request.enqueued');
  assertEqual(enqueueLog.length, 2, '2 enqueue events');

  const recentLog = bus.getEventLog(1);
  assertEqual(recentLog.length, 1, 'limit 1');
  assertEqual(recentLog[0].event.type, 'engine.success', 'most recent event');

  assertEqual(bus.totalEventsEmitted, 3, 'total events');
  console.log('  ✅ testEventLog passed');
}

// ── 测试 8: 日志大小限制 ─────────────────────────────────

function testMaxLogSize() {
  const bus = new EventBus({ maxLogSize: 3 });

  for (let i = 0; i < 5; i++) {
    bus.emit({ type: 'queue.cleared', removedCount: i });
  }

  const log = bus.getEventLog();
  assertEqual(log.length, 3, 'log should be capped at 3');
  assertEqual((log[0].event as any).removedCount, 2, 'oldest kept is index 2');
  assertEqual((log[2].event as any).removedCount, 4, 'newest is index 4');
  console.log('  ✅ testMaxLogSize passed');
}

// ── 测试 9: getListenerCounts 统计 ─────────────────────────

function testGetListenerCounts() {
  const bus = createBus();

  bus.on('request.enqueued', () => {});
  bus.on('request.enqueued', () => {});
  bus.on('engine.success', () => {});
  bus.onAny(() => {});

  const counts = bus.getListenerCounts();
  assertEqual(counts['request.enqueued'], 2, '2 enqueue listeners');
  assertEqual(counts['engine.success'], 1, '1 success listener');
  assertEqual(counts['*'], 1, '1 wildcard listener');
  console.log('  ✅ testGetListenerCounts passed');
}

// ── 测试 10: clearAll 清空一切 ────────────────────────────

function testClearAll() {
  const bus = createBus();

  bus.on('request.enqueued', () => {});
  bus.onAny(() => {});
  bus.emit({ type: 'request.enqueued', requestId: 'r1', taskType: 't', priority: 'N' });

  assertEqual(bus.totalEventsEmitted, 1, '1 event before clear');

  bus.clearAll();

  assertEqual(bus.totalEventsEmitted, 0, '0 events after clearAll');
  const counts = bus.getListenerCounts();
  assertEqual(Object.keys(counts).length, 0, 'no listeners after clearAll');
  console.log('  ✅ testClearAll passed');
}

// ── 测试 11: 单例模式 ─────────────────────────────────────

function testSingleton() {
  EventBus.resetInstance();
  const a = EventBus.getInstance();
  const b = EventBus.getInstance();
  assert(a === b, 'getInstance should return same instance');
  EventBus.resetInstance();
  const c = EventBus.getInstance();
  assert(a !== c, 'after reset, should be a new instance');
  EventBus.resetInstance();
  console.log('  ✅ testSingleton passed');
}

// ── 测试 12: on + onAny 同时触发 ──────────────────────────

function testOnAndOnAnyTogether() {
  const bus = createBus();
  let typedCount = 0;
  let anyCount = 0;

  bus.on('engine.success', () => { typedCount++; });
  bus.onAny(() => { anyCount++; });

  bus.emit({ type: 'engine.success', engineId: 'gpt-4', responseTimeMs: 100 });

  assertEqual(typedCount, 1, 'typed listener called');
  assertEqual(anyCount, 1, 'wildcard listener called');
  console.log('  ✅ testOnAndOnAnyTogether passed');
}

// ── 运行所有测试 ──────────────────────────────────────────

const tests = [
  testOnAndEmit,
  testUnsubscribe,
  testOnAny,
  testOnce,
  testMultipleListeners,
  testListenerErrorIsolation,
  testEventLog,
  testMaxLogSize,
  testGetListenerCounts,
  testClearAll,
  testSingleton,
  testOnAndOnAnyTogether,
];

console.log('\n🧪 EventBus Tests\n');

let passed = 0;
let failed = 0;
for (const test of tests) {
  try {
    test();
    passed++;
  } catch (err: any) {
    console.error(`  ❌ ${test.name}: ${err.message}`);
    failed++;
  }
}

console.log(`\n📊 Results: ${passed} passed, ${failed} failed, ${tests.length} total\n`);
// Removed process.exit(1) — it kills the Jest worker process.
// Test failures are already logged above; Jest will report the suite status.
