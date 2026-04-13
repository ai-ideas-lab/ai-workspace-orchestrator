"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
class DashboardService {
    constructor(metricsCollector, thresholds) {
        this.alertIdCounter = 0;
        this.metricsCollector = metricsCollector;
        this.thresholds = {
            minSuccessRate: thresholds?.minSuccessRate ?? 0.9,
            maxResponseTimeMs: thresholds?.maxResponseTimeMs ?? 3000,
            maxQueueWaitTimeMs: thresholds?.maxQueueWaitTimeMs ?? 5000,
            engineDownTimeoutSec: thresholds?.engineDownTimeoutSec ?? 300,
        };
    }
    getDashboardSummary() {
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
    getAlerts(snapshot) {
        const snap = snapshot ?? this.metricsCollector.getSnapshot();
        const alerts = [];
        const now = new Date();
        if (snap.system.successRate < this.thresholds.minSuccessRate) {
            alerts.push(this.createAlert(snap.system.successRate < 0.5 ? 'critical' : 'warning', 'low_success_rate', '系统成功率偏低', `当前成功率 ${(snap.system.successRate * 100).toFixed(1)}%，低于阈值 ${(this.thresholds.minSuccessRate * 100).toFixed(0)}%`, snap.system.successRate, this.thresholds.minSuccessRate, now));
        }
        if (snap.system.avgResponseTimeMs > this.thresholds.maxResponseTimeMs) {
            alerts.push(this.createAlert(snap.system.avgResponseTimeMs > 10000 ? 'critical' : 'warning', 'high_response_time', '平均响应时间过高', `当前平均 ${snap.system.avgResponseTimeMs.toFixed(0)}ms，超过阈值 ${this.thresholds.maxResponseTimeMs}ms`, snap.system.avgResponseTimeMs, this.thresholds.maxResponseTimeMs, now));
        }
        if (snap.queue.avgWaitTimeMs > this.thresholds.maxQueueWaitTimeMs) {
            alerts.push(this.createAlert(snap.queue.avgWaitTimeMs > 15000 ? 'critical' : 'warning', 'queue_congestion', '队列等待时间过长', `平均等待 ${snap.queue.avgWaitTimeMs.toFixed(0)}ms，超过阈值 ${this.thresholds.maxQueueWaitTimeMs}ms`, snap.queue.avgWaitTimeMs, this.thresholds.maxQueueWaitTimeMs, now));
        }
        for (const [engineId, engine] of Object.entries(snap.engines)) {
            const downTimeoutMs = this.thresholds.engineDownTimeoutSec * 1000;
            const lastActivity = engine.lastSuccessAt ?? engine.lastFailureAt;
            if (lastActivity && (now.getTime() - lastActivity.getTime()) > downTimeoutMs) {
                alerts.push(this.createAlert('critical', 'engine_down', `引擎 ${engineId} 无响应`, `引擎 ${engineId} 已超过 ${this.thresholds.engineDownTimeoutSec}s 无活动`, (now.getTime() - (lastActivity?.getTime() ?? 0)) / 1000, this.thresholds.engineDownTimeoutSec, now, engineId));
            }
            const engineTotal = engine.successCount + engine.failureCount;
            if (engineTotal >= 5) {
                const engineRate = engine.successCount / engineTotal;
                if (engineRate < this.thresholds.minSuccessRate) {
                    alerts.push(this.createAlert(engineRate < 0.5 ? 'critical' : 'warning', 'low_success_rate', `引擎 ${engineId} 成功率偏低`, `引擎 ${engineId} 成功率 ${(engineRate * 100).toFixed(1)}%`, engineRate, this.thresholds.minSuccessRate, now, engineId));
                }
            }
        }
        for (const [engineId, circuit] of Object.entries(snap.circuits)) {
            if (circuit.stateChanges.length > 0) {
                const lastChange = circuit.stateChanges[circuit.stateChanges.length - 1];
                if (lastChange.newState === 'OPEN') {
                    alerts.push(this.createAlert('critical', 'circuit_open', `引擎 ${engineId} 熔断器已断开`, `熔断器从 ${lastChange.oldState} 切换到 OPEN，引擎暂时不可用`, 1, 0, now, engineId));
                }
            }
        }
        const severityOrder = { critical: 0, warning: 1, info: 2 };
        alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
        return alerts;
    }
    createAlert(severity, type, title, message, currentValue, threshold, triggeredAt, engineId) {
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
    getExecutionStats(snapshots) {
        const durations = [];
        let success = 0, failed = 0;
        for (const snap of snapshots) {
            for (const em of Object.values(snap.engines)) {
                success += em.successCount;
                failed += em.failureCount;
                if (em.avgResponseTimeMs > 0)
                    durations.push(em.avgResponseTimeMs);
            }
        }
        durations.sort((a, b) => a - b);
        const p95 = durations.length > 0 ? durations[Math.floor(durations.length * 0.95)] : 0;
        const avg = durations.length > 0 ? durations.reduce((s, v) => s + v, 0) / durations.length : 0;
        const total = success + failed;
        return { total, success, failed, successRate: total > 0 ? success / total : 1, avgDurationMs: avg, p95DurationMs: p95 };
    }
    buildEngineCards(snapshot) {
        const now = new Date();
        const downTimeoutMs = this.thresholds.engineDownTimeoutSec * 1000;
        return Object.entries(snapshot.engines).map(([engineId, em]) => {
            const total = em.successCount + em.failureCount;
            const successRate = total > 0 ? em.successCount / total : 1;
            const lastActivity = em.lastSuccessAt ?? em.lastFailureAt;
            let status = 'healthy';
            if (successRate < 0.5) {
                status = 'down';
            }
            else if (successRate < this.thresholds.minSuccessRate ||
                em.avgResponseTimeMs > this.thresholds.maxResponseTimeMs ||
                (lastActivity && (now.getTime() - lastActivity.getTime()) > downTimeoutMs)) {
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
exports.DashboardService = DashboardService;
//# sourceMappingURL=dashboard-service.js.map