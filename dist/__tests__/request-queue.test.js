"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const request_queue_1 = require("../services/request-queue");
const circuit_breaker_1 = require("../services/circuit-breaker");
const load_balancer_1 = require("../services/load-balancer");
let queue;
function beforeEach() {
    queue = new request_queue_1.RequestQueue();
    for (const info of load_balancer_1.loadBalancer.getWeightInfo()) {
        load_balancer_1.loadBalancer.deregisterEngine(info.engineId);
    }
}
function assert(condition, msg) {
    if (!condition)
        throw new Error(`ASSERT FAIL: ${msg}`);
}
function assertEqual(actual, expected, label) {
    if (actual !== expected) {
        throw new Error(`ASSERT FAIL [${label}]: expected ${expected}, got ${actual}`);
    }
}
function testEnqueueFIFO() {
    beforeEach();
    queue.registerEngine('engine-a');
    const id1 = queue.enqueue({ taskType: 'text', payload: { a: 1 } }, 'NORMAL');
    const id2 = queue.enqueue({ taskType: 'code', payload: { b: 2 } }, 'NORMAL');
    assertEqual(queue.length, 2, 'queue length');
    const peek = queue.peek();
    assertEqual(peek.id, id1, 'FIFO: first enqueued should be first');
    console.log('  ✅ testEnqueueFIFO passed');
}
function testPriorityOrdering() {
    beforeEach();
    queue.registerEngine('engine-a');
    queue.enqueue({ taskType: 'low', payload: {} }, 'LOW');
    queue.enqueue({ taskType: 'critical', payload: {} }, 'CRITICAL');
    queue.enqueue({ taskType: 'normal', payload: {} }, 'NORMAL');
    queue.enqueue({ taskType: 'high', payload: {} }, 'HIGH');
    assertEqual(queue.length, 4, 'queue length');
    const order = [];
    while (queue.length > 0) {
        const result = queue.processNext();
        order.push(result.request.taskType);
    }
    assertEqual(order[0], 'critical', '1st should be CRITICAL');
    assertEqual(order[1], 'high', '2nd should be HIGH');
    assertEqual(order[2], 'normal', '3rd should be NORMAL');
    assertEqual(order[3], 'low', '4th should be LOW');
    console.log('  ✅ testPriorityOrdering passed');
}
function testProcessNextAssignsEngine() {
    beforeEach();
    queue.registerEngine('gpt-4', { weight: 100 });
    queue.enqueue({ taskType: 'generation', payload: { prompt: 'hello' } }, 'HIGH');
    const result = queue.processNext();
    assert(result !== null, 'result should not be null');
    assertEqual(result.request.taskType, 'generation', 'task type');
    assertEqual(result.engineId, 'gpt-4', 'assigned engine');
    assertEqual(result.request.assignedEngineId, 'gpt-4', 'request.assignedEngineId');
    assertEqual(result.remainingCount, 0, 'queue should be empty');
    assertEqual(queue.length, 0, 'queue length after dequeue');
    console.log('  ✅ testProcessNextAssignsEngine passed');
}
function testCircuitBreakerBlocksEngine() {
    beforeEach();
    queue.registerEngine('broken-engine');
    queue.registerEngine('healthy-engine');
    const cb = new circuit_breaker_1.CircuitBreaker({ failureThreshold: 1, resetTimeoutMs: 60000 });
    cb.recordFailure('broken-engine');
    const q = new request_queue_1.RequestQueue(cb);
    load_balancer_1.loadBalancer.registerEngine('broken-engine');
    load_balancer_1.loadBalancer.registerEngine('healthy-engine');
    q.enqueue({ taskType: 'task', payload: {} }, 'NORMAL');
    let gotHealthy = false;
    for (let i = 0; i < 5; i++) {
        const tmpQ = new request_queue_1.RequestQueue(cb);
        tmpQ.enqueue({ taskType: `task-${i}`, payload: {} }, 'NORMAL');
        const res = tmpQ.processNext();
        if (res && res.engineId === 'healthy-engine') {
            gotHealthy = true;
            break;
        }
    }
    assert(gotHealthy, 'should eventually assign to healthy engine');
    console.log('  ✅ testCircuitBreakerBlocksEngine passed');
}
function testEmptyQueue() {
    beforeEach();
    const result = queue.processNext();
    assertEqual(result, null, 'empty queue should return null');
    assertEqual(queue.length, 0, 'length should be 0');
    console.log('  ✅ testEmptyQueue passed');
}
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
function testReportSuccessAndFailure() {
    const cb = new circuit_breaker_1.CircuitBreaker({ failureThreshold: 3, resetTimeoutMs: 10000 });
    const q = new request_queue_1.RequestQueue(cb);
    q.reportFailure('eng-1');
    q.reportFailure('eng-1');
    q.reportFailure('eng-1');
    assertEqual(cb.getState('eng-1'), circuit_breaker_1.CircuitState.OPEN, 'should be OPEN after 3 failures');
    q.reportSuccess('eng-2');
    assertEqual(cb.getState('eng-2'), circuit_breaker_1.CircuitState.CLOSED, 'eng-2 should stay CLOSED');
    console.log('  ✅ testReportSuccessAndFailure passed');
}
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
    }
    catch (err) {
        console.error(`  ❌ ${test.name}: ${err.message}`);
        failed++;
    }
}
console.log(`\n📊 Results: ${passed} passed, ${failed} failed, ${tests.length} total\n`);
if (failed > 0)
    process.exit(1);
//# sourceMappingURL=request-queue.test.js.map