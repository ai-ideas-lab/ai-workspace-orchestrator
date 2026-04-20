import { EnginePerformanceSnapshot } from './load-balancer.js';
import { CircuitBreaker, CircuitState } from './circuit-breaker.js';
export type RequestPriority = 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW';
export interface QueueRequest {
    id: string;
    taskType: string;
    payload: Record<string, any>;
    priority: RequestPriority;
    enqueuedAt: Date;
    assignedEngineId?: string;
}
export interface ProcessResult {
    request: QueueRequest;
    engineId: string;
    circuitState: CircuitState;
    remainingCount: number;
}
export declare class RequestQueue {
    private queue;
    private circuitBreaker;
    private autoIncrement;
    constructor(circuitBreaker?: CircuitBreaker);
    enqueue(task: {
        taskType: string;
        payload: Record<string, any>;
    }, priority?: RequestPriority): string;
    processNext(): ProcessResult | null;
    reportSuccess(engineId: string): void;
    reportFailure(engineId: string): void;
    updatePerformance(snapshots: EnginePerformanceSnapshot[]): void;
    registerEngine(engineId: string, opts?: {
        weight?: number;
    }): void;
    deregisterEngine(engineId: string): void;
    get length(): number;
    peek(): QueueRequest | undefined;
    getStats(): Record<RequestPriority, number> & {
        total: number;
    };
}
//# sourceMappingURL=request-queue.d.ts.map