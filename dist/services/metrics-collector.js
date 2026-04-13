"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsCollector = void 0;
class MetricsCollector {
    constructor(eventBus, options) {
        this.startedAt = null;
        this.subscriptions = [];
        this.queueMetrics = {
            totalEnqueued: 0,
            totalDequeued: 0,
            totalFailed: 0,
            waitTimeSamples: [],
            avgWaitTimeMs: 0,
            maxWaitTimeMs: 0,
        };
        this.engineMetrics = new Map();
        this.circuitMetrics = new Map();
        this.recentRequestTimestamps = [];
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
    start() {
        if (this.startedAt)
            return;
        this.startedAt = new Date();
        const eventsToListen = [
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
            const sub = this.eventBus.on(eventType, (event) => {
                this.handleEvent(event);
            });
            this.subscriptions.push(sub);
        }
    }
    stop() {
        for (const sub of this.subscriptions) {
            sub.unsubscribe();
        }
        this.subscriptions = [];
    }
    reset() {
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
    getSnapshot() {
        const now = new Date();
        const engines = {};
        for (const [id, m] of this.engineMetrics) {
            engines[id] = { ...m };
        }
        const circuits = {};
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
    getEngineMetrics(engineId) {
        return this.engineMetrics.get(engineId) ?? null;
    }
    getQueueMetrics() {
        return { ...this.queueMetrics };
    }
    getSystemHealth() {
        return this.calculateSystemHealth();
    }
    handleEvent(event) {
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
                break;
        }
    }
    ensureEngineMetrics(engineId) {
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
    recordEngineSuccess(engineId, responseTimeMs) {
        this.ensureEngineMetrics(engineId);
        const m = this.engineMetrics.get(engineId);
        m.successCount++;
        m.totalResponseTimeMs += responseTimeMs;
        m.avgResponseTimeMs = m.totalResponseTimeMs / m.successCount;
        m.lastSuccessAt = new Date();
    }
    recordEngineFailure(engineId) {
        this.ensureEngineMetrics(engineId);
        const m = this.engineMetrics.get(engineId);
        m.failureCount++;
        m.lastFailureAt = new Date();
    }
    ensureCircuitMetrics(engineId) {
        if (!this.circuitMetrics.has(engineId)) {
            this.circuitMetrics.set(engineId, {
                engineId,
                stateChanges: [],
                resets: 0,
                lastStateChangedAt: null,
            });
        }
    }
    recordCircuitChange(engineId, oldState, newState, timestamp) {
        this.ensureCircuitMetrics(engineId);
        const cm = this.circuitMetrics.get(engineId);
        cm.stateChanges.push({ oldState, newState, timestamp: new Date(timestamp) });
        cm.lastStateChangedAt = new Date(timestamp);
        if (cm.stateChanges.length > this.options.maxCircuitChanges) {
            cm.stateChanges = cm.stateChanges.slice(-this.options.maxCircuitChanges);
        }
    }
    recordCircuitReset(engineId) {
        this.ensureCircuitMetrics(engineId);
        this.circuitMetrics.get(engineId).resets++;
    }
    recalculateWaitTimes() {
        const samples = this.queueMetrics.waitTimeSamples;
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
    trimRecentTimestamps() {
        const oneMinuteAgo = Date.now() - 60000;
        this.recentRequestTimestamps = this.recentRequestTimestamps.filter((t) => t.getTime() > oneMinuteAgo);
    }
    calculateSystemHealth() {
        const now = new Date();
        this.trimRecentTimestamps();
        const engines = [...this.engineMetrics.values()];
        const totalSuccess = engines.reduce((sum, e) => sum + e.successCount, 0);
        const totalFailure = engines.reduce((sum, e) => sum + e.failureCount, 0);
        const totalRequests = totalSuccess + totalFailure;
        const successRate = totalRequests > 0 ? totalSuccess / totalRequests : 1;
        const avgResponseTimeMs = totalSuccess > 0
            ? engines.reduce((sum, e) => sum + e.totalResponseTimeMs, 0) / totalSuccess
            : 0;
        const engineCount = engines.length;
        const healthyEngineCount = engines.filter((e) => {
            if (e.successCount === 0)
                return false;
            const cm = this.circuitMetrics.get(e.engineId);
            if (!cm || cm.stateChanges.length === 0)
                return true;
            const lastChange = cm.stateChanges[cm.stateChanges.length - 1];
            return lastChange.newState !== 'OPEN';
        }).length;
        const w = this.options.healthWeights;
        const successScore = this.scoreSuccessRate(successRate);
        const responseScore = this.scoreResponseTime(avgResponseTimeMs);
        const availabilityScore = this.scoreEngineAvailability(engineCount, healthyEngineCount);
        const score = Math.round(successScore * (w.successRate ?? 0.4) + responseScore * (w.responseTime ?? 0.3) + availabilityScore * (w.engineAvailability ?? 0.3));
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
    scoreSuccessRate(successRate) {
        return successRate * 100;
    }
    scoreResponseTime(avgResponseTimeMs) {
        return Math.max(0, Math.min(100, 100 - (avgResponseTimeMs - 200) * (100 / 4800)));
    }
    scoreEngineAvailability(engineCount, healthyCount) {
        return engineCount > 0 ? (healthyCount / engineCount) * 100 : 100;
    }
}
exports.MetricsCollector = MetricsCollector;
//# sourceMappingURL=metrics-collector.js.map