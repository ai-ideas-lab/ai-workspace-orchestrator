"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const event_bus_1 = require("../services/event-bus");
function createBus() {
    event_bus_1.EventBus.resetInstance();
    return new event_bus_1.EventBus({ maxLogSize: 50 });
}
(0, globals_1.describe)('EventBus - Basic Subscription', () => {
    (0, globals_1.it)('should deliver events to subscribers', () => {
        const bus = createBus();
        const received = [];
        bus.on('request.enqueued', (e) => {
            received.push(e);
        });
        const delivered = bus.emit({
            type: 'request.enqueued',
            requestId: 'req_001',
            taskType: 'text-generation',
            priority: 'HIGH',
        });
        (0, globals_1.expect)(delivered).toBe(1);
        (0, globals_1.expect)(received.length).toBe(1);
        (0, globals_1.expect)(received[0].type).toBe('request.enqueued');
        (0, globals_1.expect)(received[0].requestId).toBe('req_001');
        (0, globals_1.expect)(received[0].timestamp).toBeInstanceOf(Date);
    });
    (0, globals_1.it)('should handle unsubscribe correctly', () => {
        const bus = createBus();
        let count = 0;
        const sub = bus.on('engine.success', () => { count++; });
        bus.emit({ type: 'engine.success', engineId: 'gpt-4', responseTimeMs: 120 });
        (0, globals_1.expect)(count).toBe(1);
        sub.unsubscribe();
        bus.emit({ type: 'engine.success', engineId: 'gpt-4', responseTimeMs: 100 });
        (0, globals_1.expect)(count).toBe(1);
    });
    (0, globals_1.it)('should deliver to multiple subscribers', () => {
        const bus = createBus();
        const results = [];
        bus.on('circuit.reset', () => { results.push(1); });
        bus.on('circuit.reset', () => { results.push(2); });
        bus.on('circuit.reset', () => { results.push(3); });
        const delivered = bus.emit({ type: 'circuit.reset', engineId: 'gpt-4' });
        (0, globals_1.expect)(delivered).toBe(3);
        (0, globals_1.expect)(results.length).toBe(3);
    });
    (0, globals_1.it)('should handle listener errors without affecting others', () => {
        const bus = createBus();
        let secondCalled = false;
        bus.on('engine.failure', () => { throw new Error('boom'); });
        bus.on('engine.failure', () => { secondCalled = true; });
        const delivered = bus.emit({ type: 'engine.failure', engineId: 'e1', errorMessage: 'err' });
        (0, globals_1.expect)(secondCalled).toBe(true);
        (0, globals_1.expect)(delivered).toBe(2);
    });
});
(0, globals_1.describe)('EventBus - Advanced Subscription', () => {
    (0, globals_1.it)('should handle wildcard listeners', () => {
        const bus = createBus();
        const allTypes = [];
        bus.onAny((e) => { allTypes.push(e.type); });
        bus.emit({ type: 'request.enqueued', requestId: 'r1', taskType: 't', priority: 'NORMAL' });
        bus.emit({ type: 'engine.failure', engineId: 'e1', errorMessage: 'timeout' });
        bus.emit({ type: 'circuit.state_changed', engineId: 'e1', oldState: 'CLOSED', newState: 'OPEN' });
        (0, globals_1.expect)(allTypes.length).toBe(3);
        (0, globals_1.expect)(allTypes[0]).toBe('request.enqueued');
        (0, globals_1.expect)(allTypes[1]).toBe('engine.failure');
        (0, globals_1.expect)(allTypes[2]).toBe('circuit.state_changed');
    });
    (0, globals_1.it)('should handle one-time subscriptions', () => {
        const bus = createBus();
        let count = 0;
        bus.once('engine.registered', () => { count++; });
        bus.emit({ type: 'engine.registered', engineId: 'gpt-4', weight: 100 });
        bus.emit({ type: 'engine.registered', engineId: 'claude-3', weight: 80 });
        (0, globals_1.expect)(count).toBe(1);
    });
    (0, globals_1.it)('should deliver to both typed and wildcard listeners', () => {
        const bus = createBus();
        let typedCount = 0;
        let anyCount = 0;
        bus.on('engine.success', () => { typedCount++; });
        bus.onAny(() => { anyCount++; });
        bus.emit({ type: 'engine.success', engineId: 'gpt-4', responseTimeMs: 100 });
        (0, globals_1.expect)(typedCount).toBe(1);
        (0, globals_1.expect)(anyCount).toBe(1);
    });
});
(0, globals_1.describe)('EventBus - Logging and Querying', () => {
    (0, globals_1.it)('should record events in log', () => {
        const bus = createBus();
        bus.emit({ type: 'request.enqueued', requestId: 'r1', taskType: 't', priority: 'HIGH' });
        bus.emit({ type: 'request.enqueued', requestId: 'r2', taskType: 't', priority: 'LOW' });
        bus.emit({ type: 'engine.success', engineId: 'gpt-4', responseTimeMs: 50 });
        const log = bus.getEventLog();
        (0, globals_1.expect)(log.length).toBe(3);
        const enqueueLog = bus.getEventLogByType('request.enqueued');
        (0, globals_1.expect)(enqueueLog.length).toBe(2);
        const recentLog = bus.getEventLog(1);
        (0, globals_1.expect)(recentLog.length).toBe(1);
        (0, globals_1.expect)(recentLog[0].event.type).toBe('engine.success');
        (0, globals_1.expect)(bus.totalEventsEmitted).toBe(3);
    });
    (0, globals_1.it)('should handle log size limits', () => {
        const bus = new event_bus_1.EventBus({ maxLogSize: 3 });
        for (let i = 0; i < 5; i++) {
            bus.emit({ type: 'queue.cleared', removedCount: i });
        }
        const log = bus.getEventLog();
        (0, globals_1.expect)(log.length).toBe(3);
        (0, globals_1.expect)(log[0].event.removedCount).toBe(2);
        (0, globals_1.expect)(log[2].event.removedCount).toBe(4);
    });
    (0, globals_1.it)('should return empty array for non-existent types', () => {
        const bus = createBus();
        bus.emit({ type: 'request.enqueued', requestId: 'r1', taskType: 't', priority: 'HIGH' });
        const emptyLog = bus.getEventLogByType('engine.failure');
        (0, globals_1.expect)(emptyLog.length).toBe(0);
        const limitLog = bus.getEventLogByType('request.enqueued', 0);
        (0, globals_1.expect)(limitLog.length).toBe(0);
    });
    (0, globals_1.it)('should record delivered count in log entries', () => {
        const bus = createBus();
        bus.on('engine.success', () => { });
        bus.on('engine.success', () => { });
        bus.onAny(() => { });
        bus.emit({ type: 'engine.success', engineId: 'gpt-4', responseTimeMs: 100 });
        const log = bus.getEventLog();
        (0, globals_1.expect)(log.length).toBe(1);
        (0, globals_1.expect)(log[0].deliveredTo).toBe(3);
        (0, globals_1.expect)(log[0].event.type).toBe('engine.success');
    });
});
(0, globals_1.describe)('EventBus - Statistics', () => {
    (0, globals_1.it)('should count listeners correctly', () => {
        const bus = createBus();
        bus.on('request.enqueued', () => { });
        bus.on('request.enqueued', () => { });
        bus.on('engine.success', () => { });
        bus.onAny(() => { });
        const counts = bus.getListenerCounts();
        (0, globals_1.expect)(counts['request.enqueued']).toBe(2);
        (0, globals_1.expect)(counts['engine.success']).toBe(1);
        (0, globals_1.expect)(counts['*']).toBe(1);
    });
    (0, globals_1.it)('should handle unknown types in counts', () => {
        const bus = createBus();
        const counts = bus.getListenerCounts();
        (0, globals_1.expect)(counts['*']).toBe(0);
        (0, globals_1.expect)(counts['unknown.type']).toBe(0);
        bus.onAny(() => { });
        const countsWithWildcard = bus.getListenerCounts();
        (0, globals_1.expect)(countsWithWildcard['*']).toBe(1);
    });
});
(0, globals_1.describe)('EventBus - Cleanup', () => {
    (0, globals_1.it)('should clear all listeners and events', () => {
        const bus = createBus();
        bus.on('request.enqueued', () => { });
        bus.onAny(() => { });
        bus.emit({ type: 'request.enqueued', requestId: 'r1', taskType: 't', priority: 'N' });
        (0, globals_1.expect)(bus.totalEventsEmitted).toBe(1);
        bus.clearAll();
        (0, globals_1.expect)(bus.totalEventsEmitted).toBe(0);
        const counts = bus.getListenerCounts();
        (0, globals_1.expect)(Object.keys(counts).length).toBe(0);
    });
    (0, globals_1.it)('should clear log but keep listeners', () => {
        const bus = createBus();
        bus.on('request.enqueued', () => { });
        bus.emit({ type: 'request.enqueued', requestId: 'r1', taskType: 't', priority: 'HIGH' });
        bus.emit({ type: 'request.enqueued', requestId: 'r2', taskType: 't', priority: 'LOW' });
        (0, globals_1.expect)(bus.totalEventsEmitted).toBe(2);
        bus.clearLog();
        (0, globals_1.expect)(bus.totalEventsEmitted).toBe(0);
        const log = bus.getEventLog();
        (0, globals_1.expect)(log.length).toBe(0);
        const counts = bus.getListenerCounts();
        (0, globals_1.expect)(counts['request.enqueued']).toBe(1);
    });
});
(0, globals_1.describe)('EventBus - Singleton', () => {
    (0, globals_1.it)('should return same instance', () => {
        event_bus_1.EventBus.resetInstance();
        const a = event_bus_1.EventBus.getInstance();
        const b = event_bus_1.EventBus.getInstance();
        (0, globals_1.expect)(a === b).toBe(true);
        event_bus_1.EventBus.resetInstance();
        const c = event_bus_1.EventBus.getInstance();
        (0, globals_1.expect)(a !== c).toBe(true);
        event_bus_1.EventBus.resetInstance();
    });
});
(0, globals_1.describe)('EventBus - Edge Cases', () => {
    (0, globals_1.it)('should handle non-existent event types', () => {
        const bus = createBus();
        const delivered = bus.emit({ type: 'request.enqueued', requestId: 'test', taskType: 'test', priority: 'NORMAL' });
        (0, globals_1.expect)(delivered).toBe(0);
        const delivered2 = bus.emit({ type: 'request.enqueued', requestId: 'test', taskType: 'test', priority: 'NORMAL' });
        (0, globals_1.expect)(delivered2).toBe(0);
    });
    (0, globals_1.it)('should handle large volumes of events', () => {
        const bus = createBus();
        let count = 0;
        bus.on('request.enqueued', () => { count++; });
        for (let i = 0; i < 100; i++) {
            bus.emit({ type: 'request.enqueued', requestId: `req_${i}`, taskType: 'test', priority: 'NORMAL' });
        }
        (0, globals_1.expect)(count).toBe(100);
        (0, globals_1.expect)(bus.totalEventsEmitted).toBe(100);
    });
    (0, globals_1.it)('should handle once subscription boundaries', () => {
        const bus = createBus();
        let count = 0;
        const sub = bus.once('engine.registered', () => { count++; });
        bus.emit({ type: 'engine.registered', engineId: 'test', weight: 100 });
        (0, globals_1.expect)(count).toBe(1);
        bus.emit({ type: 'test.event', test: 'data' });
        (0, globals_1.expect)(count).toBe(1);
        sub.unsubscribe();
        bus.emit({ type: 'test.event', test: 'data' });
        (0, globals_1.expect)(count).toBe(1);
    });
    (0, globals_1.it)('should handle invalid event types gracefully', () => {
        const bus = createBus();
        (0, globals_1.expect)(() => {
            bus.emit({ type: null, requestId: 'test' });
        }).not.toThrow();
        (0, globals_1.expect)(() => {
            bus.emit({ type: undefined, requestId: 'test' });
        }).not.toThrow();
    });
    (0, globals_1.it)('should handle wildcard listener errors gracefully', () => {
        const bus = createBus();
        let safeListenerCalled = false;
        bus.onAny((e) => {
            if (e.type === 'error.test') {
                throw new Error('Wildcard test error');
            }
            safeListenerCalled = true;
        });
        bus.on('engine.success', () => {
            safeListenerCalled = true;
        });
        bus.emit({ type: 'error.test', error: 'test' });
        bus.emit({ type: 'engine.success', engineId: 'test', responseTimeMs: 100 });
        (0, globals_1.expect)(safeListenerCalled).toBe(true);
    });
    (0, globals_1.it)('should handle concurrent listeners correctly', () => {
        const bus = createBus();
        const results = [];
        bus.on('request.enqueued', () => {
            results.push(1);
        });
        bus.on('request.enqueued', () => {
            results.push(2);
        });
        bus.on('request.enqueued', () => {
            results.push(3);
        });
        bus.emit({ type: 'request.enqueued', requestId: 'test', taskType: 'test', priority: 'NORMAL' });
        (0, globals_1.expect)(results.length).toBe(3);
        (0, globals_1.expect)(results).toContain(1);
        (0, globals_1.expect)(results).toContain(2);
        (0, globals_1.expect)(results).toContain(3);
    });
    (0, globals_1.it)('should handle max log size boundaries', () => {
        const bus = new event_bus_1.EventBus({ maxLogSize: 1 });
        bus.emit({ type: 'first.event', data: 'first' });
        bus.emit({ type: 'second.event', data: 'second' });
        const log = bus.getEventLog();
        (0, globals_1.expect)(log.length).toBe(1);
        (0, globals_1.expect)(log[0].event.type).toBe('queue.cleared');
    });
    (0, globals_1.it)('should ensure event timestamp accuracy', () => {
        const bus = createBus();
        const events = [];
        bus.onAny((e) => { events.push(e); });
        const beforeEmit = new Date();
        bus.emit({ type: 'test.event', data: 'test' });
        const afterEmit = new Date();
        (0, globals_1.expect)(events.length).toBe(1);
        (0, globals_1.expect)(events[0].timestamp).toBeInstanceOf(Date);
        const event = events[0];
        (0, globals_1.expect)(event.timestamp.getTime()).toBeGreaterThanOrEqual(beforeEmit.getTime());
        (0, globals_1.expect)(event.timestamp.getTime()).toBeLessThanOrEqual(afterEmit.getTime());
    });
    (0, globals_1.it)('should handle complex events correctly', () => {
        const bus = createBus();
        const events = [];
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
        (0, globals_1.expect)(events.length).toBe(2);
        const event1 = events[0];
        const event2 = events[1];
        (0, globals_1.expect)(event1.type).toBe('request.enqueued');
        (0, globals_1.expect)(event2.type).toBe('engine.success');
        (0, globals_1.expect)(events[0].requestId).toBe('complex_test');
        (0, globals_1.expect)(events[1].engineId).toBe('complex_engine');
    });
});
//# sourceMappingURL=event-bus.test.js.map