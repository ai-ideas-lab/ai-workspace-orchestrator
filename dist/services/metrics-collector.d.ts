import { EventBus } from './event-bus.js';
export interface EngineMetrics {
    engineId: string;
    successCount: number;
    failureCount: number;
    totalResponseTimeMs: number;
    avgResponseTimeMs: number;
    lastSuccessAt: Date | null;
    lastFailureAt: Date | null;
}
export interface QueueMetrics {
    totalEnqueued: number;
    totalDequeued: number;
    totalFailed: number;
    waitTimeSamples: Array<{
        requestId: string;
        waitTimeMs: number;
        timestamp: Date;
    }>;
    avgWaitTimeMs: number;
    maxWaitTimeMs: number;
}
export interface CircuitMetrics {
    engineId: string;
    stateChanges: Array<{
        oldState: string;
        newState: string;
        timestamp: Date;
    }>;
    resets: number;
    lastStateChangedAt: Date | null;
}
export interface SystemHealth {
    score: number;
    totalRequests: number;
    successRate: number;
    avgResponseTimeMs: number;
    engineCount: number;
    healthyEngineCount: number;
    recentRequestsPerMinute: number;
    collectingSince: Date;
}
export interface MetricsSnapshot {
    collectedAt: Date;
    uptimeMs: number;
    queue: QueueMetrics;
    engines: Record<string, EngineMetrics>;
    circuits: Record<string, CircuitMetrics>;
    system: SystemHealth;
}
export interface MetricsCollectorOptions {
    maxWaitTimeSamples?: number;
    maxCircuitChanges?: number;
    healthWeights?: {
        successRate?: number;
        responseTime?: number;
        engineAvailability?: number;
    };
}
export declare class MetricsCollector {
    private eventBus;
    private options;
    private startedAt;
    private subscriptions;
    private queueMetrics;
    private engineMetrics;
    private circuitMetrics;
    private recentRequestTimestamps;
    constructor(eventBus: EventBus, options?: MetricsCollectorOptions);
    start(): void;
    stop(): void;
    reset(): void;
    getSnapshot(): MetricsSnapshot;
    getEngineMetrics(engineId: string): EngineMetrics | null;
    getQueueMetrics(): QueueMetrics;
    getSystemHealth(): SystemHealth;
    private handleEvent;
    private ensureEngineMetrics;
    private recordEngineSuccess;
    private recordEngineFailure;
    private ensureCircuitMetrics;
    private recordCircuitChange;
    private recordCircuitReset;
    private recalculateWaitTimes;
    private trimRecentTimestamps;
    private calculateSystemHealth;
    private scoreSuccessRate;
    private scoreResponseTime;
    private scoreEngineAvailability;
}
//# sourceMappingURL=metrics-collector.d.ts.map