/**
 * RequestQueue 单元测试
 *
 * 验证优先级入队、出队引擎分配、熔断保护三个核心行为。
 */

import { RequestQueue, RequestPriority } from '../services/request-queue'';
import { CircuitBreaker, CircuitState } from '../services/circuit-breaker'';
import { loadBalancer } from '../services/load-balancer'';

// ── 测试辅助 ──────────────────────────────────────────────

let queue: RequestQueue;

function beforeEach() {
  queue = new RequestQueue();
  // 清空负载均衡器全局单例（测试隔离）
  for (const info of loadBalancer.getWeightInfo()) {
    loadBalancer.deregisterEngine(info.engineId);
  }
}

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(`ASSERT FAIL: ${msg}`);
}

function assertEqual<T>(actual: T, expected: T, label: string) {
  if (actual !== expected) {
    throw new Error(`ASSERT FAIL [${label}]: expected ${expected}, got ${actual}`);
  }
}

// ── 测试 1: enqueue 按 FIFO 排列同优先级请求 ───────────────

function testEnqueueFIFO() {
  beforeEach();
  queue.registerEngine('engine-a');

  const id1 = queue.enqueue({ taskType: 'text', payload: { a: 1 } }, 'NORMAL');
  const id2 = queue.enqueue({ taskType: 'code', payload: { b: 2 } }, 'NORMAL');

  assertEqual(queue.length, 2, 'queue length');
  const peek = queue.peek()!;
  assertEqual(peek.id, id1, 'FIFO: first enqueued should be first');
  console.log('  ✅ testEnqueueFIFO passed');
}

// ── 测试 2: 高优先级请求先出队 ────────────────────────────

function testPriorityOrdering() {
  beforeEach();
  queue.registerEngine('engine-a');

  queue.enqueue({ taskType: 'low', payload: {} }, 'LOW');
  queue.enqueue({ taskType: 'critical', payload: {} }, 'CRITICAL');
  queue.enqueue({ taskType: 'normal', payload: {} }, 'NORMAL');
  queue.enqueue({ taskType: 'high', payload: {} }, 'HIGH');

  assertEqual(queue.length, 4, 'queue length');

  // 出队顺序应该是 CRITICAL → HIGH → NORMAL → LOW
  const order: string[] = [];
  while (queue.length > 0) {
    const result = queue.processNext()!;
    order.push(result.request.taskType);
  }

  assertEqual(order[0], 'critical', '1st should be CRITICAL');
  assertEqual(order[1], 'high', '2nd should be HIGH');
  assertEqual(order[2], 'normal', '3rd should be NORMAL');
  assertEqual(order[3], 'low', '4th should be LOW');
  console.log('  ✅ testPriorityOrdering passed');
}

// ── 测试 3: processNext 分配引擎并出队 ─────────────────────

function testProcessNextAssignsEngine() {
  beforeEach();
  queue.registerEngine('gpt-4', { weight: 100 });

  queue.enqueue({ taskType: 'generation', payload: { prompt: 'hello' } }, 'HIGH');

  const result = queue.processNext()!;
  assert(result !== null, 'result should not be null');
  assertEqual(result.request.taskType, 'generation', 'task type');
  assertEqual(result.engineId, 'gpt-4', 'assigned engine');
  assertEqual(result.request.assignedEngineId, 'gpt-4', 'request.assignedEngineId');
  assertEqual(result.remainingCount, 0, 'queue should be empty');
  assertEqual(queue.length, 0, 'queue length after dequeue');
  console.log('  ✅ testProcessNextAssignsEngine passed');
}

// ── 测试 4: 熔断引擎被跳过 ────────────────────────────────

function testCircuitBreakerBlocksEngine() {
  beforeEach();
  queue.registerEngine('broken-engine');
  queue.registerEngine('healthy-engine');

  const cb = new CircuitBreaker({ failureThreshold: 1, resetTimeoutMs: 60_000 });

  // 手动触发熔断
  cb.recordFailure('broken-engine');
  // broken-engine 现在应该被熔断

  // 创建使用自定义熔断器的队列
  const q = new RequestQueue(cb);
  // 重新注册引擎到 loadBalancer（全局单例）
  loadBalancer.registerEngine('broken-engine');
  loadBalancer.registerEngine('healthy-engine');

  q.enqueue({ taskType: 'task', payload: {} }, 'NORMAL');

  // processNext 应该跳过被熔断的引擎
  // 注意：由于负载均衡器是全局单例，其他测试可能已注册过
  // 我们需要确保至少有一个健康引擎可用
  let gotHealthy = false;
  for (let i = 0; i < 5; i++) {
    const tmpQ = new RequestQueue(cb);
    tmpQ.enqueue({ taskType: `task-${i}`, payload: {} }, 'NORMAL');
    const res = tmpQ.processNext();
    if (res && res.engineId === 'healthy-engine') {
      gotHealthy = true;
      break;
    }
  }

  // 如果 broken-engine 被熔断且 healthy-engine 可用，
  // 最终应该分配到 healthy-engine
  assert(gotHealthy, 'should eventually assign to healthy engine');
  console.log('  ✅ testCircuitBreakerBlocksEngine passed');
}

// ── 测试 5: 空队列 processNext 返回 null ──────────────────

function testEmptyQueue() {
  beforeEach();
  const result = queue.processNext();
  assertEqual(result, null as any, 'empty queue should return null');
  assertEqual(queue.length, 0, 'length should be 0');
  console.log('  ✅ testEmptyQueue passed');
}

// ── 测试 6: getStats 统计正确 ──────────────────────────────

function testGetStats() {
  beforeEach();
  queue.enqueue({ taskType: 'a', payload: {} }, 'CRITICAL');
  queue.enqueue({ taskType: 'b', payload: {} }, 'HIGH');
  queue.enqueue({ taskType: 'c', payload: {} }, 'HIGH');
  queue.enqueue({ taskType: 'd', payload: {} }, 'NORMAL');
  queue.enqueue({ taskType: 'e', payload: {} }, 'LOW');
  queue.enqueue({ taskType: 'f', payload: {} }, 'LOW');

  const stats = queue.getStats();
  assertEqual(stats.CRITICAL, 1, 'CRITICAL count');
  assertEqual(stats.HIGH, 2, 'HIGH count');
  assertEqual(stats.NORMAL, 1, 'NORMAL count');
  assertEqual(stats.LOW, 2, 'LOW count');
  assertEqual(stats.total, 6, 'total count');
  console.log('  ✅ testGetStats passed');
}

// ── 测试 7: reportSuccess/Failure 转发到熔断器 ─────────────

function testReportSuccessAndFailure() {
  const cb = new CircuitBreaker({ failureThreshold: 3, resetTimeoutMs: 10_000 });
  const q = new RequestQueue(cb);

  q.reportFailure('eng-1');
  q.reportFailure('eng-1');
  q.reportFailure('eng-1');
  // 3次失败应触发熔断
  assertEqual(cb.getState('eng-1'), CircuitState.OPEN, 'should be OPEN after 3 failures');

  q.reportSuccess('eng-2');
  // eng-2 应该保持 CLOSED
  assertEqual(cb.getState('eng-2'), CircuitState.CLOSED, 'eng-2 should stay CLOSED');
  console.log('  ✅ testReportSuccessAndFailure passed');
}

// ── 运行所有测试 ──────────────────────────────────────────

const tests = [
  testEnqueueFIFO,
  testPriorityOrdering,
  testProcessNextAssignsEngine,
  testCircuitBreakerBlocksEngine,
  testEmptyQueue,
  testGetStats,
  testReportSuccessAndFailure,
];

console.log('\n🧪 RequestQueue Tests\n');

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
if (failed > 0) process.exit(1);
