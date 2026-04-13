export declare enum CircuitState {
    CLOSED = "CLOSED",
    OPEN = "OPEN",
    HALF_OPEN = "HALF_OPEN"
}
interface CircuitBreakerConfig {
    failureThreshold?: number;
    resetTimeoutMs?: number;
    halfOpenMaxAttempts?: number;
}
export declare class CircuitBreaker {
    private failureThreshold;
    private resetTimeoutMs;
    private halfOpenMaxAttempts;
    private engines;
    constructor(config?: CircuitBreakerConfig);
    private getOrCreate;
    allowRequest(engineId: string): boolean;
    getState(engineId: string): CircuitState;
    recordSuccess(engineId: string): void;
    recordFailure(engineId: string): void;
    reset(engineId: string): void;
    resetAll(): void;
    getAllStates(): Record<string, {
        state: CircuitState;
        failures: number;
        successes: number;
    }>;
}
export {};
//# sourceMappingURL=circuit-breaker.d.ts.map