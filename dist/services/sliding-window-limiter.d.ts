export interface LimiterConfig {
    windowMs: number;
    maxRequests: number;
}
export declare class SlidingWindowLimiter {
    private config;
    private entries;
    constructor(config: LimiterConfig);
    tryAcquire(priority?: string): boolean;
    get remaining(): number;
    reset(): void;
}
//# sourceMappingURL=sliding-window-limiter.d.ts.map