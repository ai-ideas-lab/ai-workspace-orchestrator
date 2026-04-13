import { AppError } from './errors.js';
export interface CircuitBreakerOptions {
    timeoutMs?: number;
    errorThreshold?: number;
    resetTimeoutMs?: number;
    monitoringIntervalMs?: number;
    fallback?: (error: Error) => Promise<any>;
    onStateChange?: (state: CircuitBreakerState, key: string) => void;
}
export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';
export declare class CircuitBreaker {
    private static instance;
    private circuits;
    private options;
    private constructor();
    static getInstance(options?: CircuitBreakerOptions): CircuitBreaker;
    execute<T>(key: string, operation: () => Promise<T>, options?: Partial<CircuitBreakerOptions>): Promise<T>;
    executeBatch<T>(operations: Array<{
        key: string;
        operation: () => Promise<T>;
    }>, options?: Partial<CircuitBreakerOptions>): Promise<Array<{
        key: string;
        result?: T;
        error?: AppError;
    }>>;
    getCircuitStates(): Record<string, CircuitBreakerState>;
    resetCircuit(key: string): void;
    resetAll(): void;
    private startMonitoring;
    private checkAndResetCircuits;
    private defaultFallback;
    private defaultStateChangeHandler;
}
export declare const circuitBreaker: CircuitBreaker;
export declare function withCircuitBreaker(key: string, options?: Partial<CircuitBreakerOptions>): (target: any, propertyName: string, descriptor: TypedPropertyDescriptor<any>) => TypedPropertyDescriptor<any>;
export declare function withApiCircuitBreaker(serviceKey: string, options?: Partial<CircuitBreakerOptions>): (target: any, propertyName: string, descriptor: TypedPropertyDescriptor<any>) => TypedPropertyDescriptor<any>;
//# sourceMappingURL=circuit-breaker.d.ts.map