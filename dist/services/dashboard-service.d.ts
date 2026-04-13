import { MetricsCollector, MetricsSnapshot, SystemHealth } from './metrics-collector.js';
export type AlertSeverity = 'info' | 'warning' | 'critical';
export interface Alert {
    id: string;
    severity: AlertSeverity;
    type: 'low_success_rate' | 'high_response_time' | 'engine_down' | 'queue_congestion' | 'circuit_open';
    title: string;
    message: string;
    engineId?: string;
    currentValue: number;
    threshold: number;
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
    generatedAt: Date;
    health: SystemHealth;
    engines: EngineStatusCard[];
    queue: {
        totalEnqueued: number;
        totalDequeued: number;
        totalFailed: number;
        avgWaitTimeMs: number;
        maxWaitTimeMs: number;
    };
    activeAlerts: Alert[];
    alertCount: number;
}
export interface AlertThresholds {
    minSuccessRate?: number;
    maxResponseTimeMs?: number;
    maxQueueWaitTimeMs?: number;
    engineDownTimeoutSec?: number;
}
export declare class DashboardService {
    private metricsCollector;
    private thresholds;
    private alertIdCounter;
    constructor(metricsCollector: MetricsCollector, thresholds?: AlertThresholds);
    getDashboardSummary(): DashboardSummary;
    getAlerts(snapshot?: MetricsSnapshot): Alert[];
    private createAlert;
    getExecutionStats(snapshots: MetricsSnapshot[]): ExecutionStats;
    private buildEngineCards;
}
//# sourceMappingURL=dashboard-service.d.ts.map