export interface EnginePerformanceSnapshot {
    engineId: string;
    avgResponseMs: number;
    successRate: number;
    requestsInFlight: number;
    activeRequests: number;
}
declare class LoadBalancer {
    private engines;
    registerEngine(engineId: string, weight?: number): void;
    deregisterEngine(engineId: string): boolean;
    selectEngine(): string | null;
    updateWeights(snapshots: EnginePerformanceSnapshot[]): void;
    getWeightInfo(): Array<{
        engineId: string;
        weight: number;
        effectiveWeight: number;
        currentWeight: number;
    }>;
}
export declare const loadBalancer: LoadBalancer;
export {};
//# sourceMappingURL=load-balancer.d.ts.map