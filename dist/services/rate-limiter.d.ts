import { EventBus } from './event-bus.js';
export interface TokenBucketConfig {
    refillRate: number;
    maxTokens: number;
    currentTokens?: number;
}
export interface RateLimiterOptions {
    defaultRefillRate?: number;
    defaultMaxTokens?: number;
    emitEvents?: boolean;
}
export interface AcquireResult {
    allowed: boolean;
    remainingTokens: number;
    waitTimeMs: number;
    engineId: string;
}
export interface EngineRateLimitStats {
    engineId: string;
    totalAcquired: number;
    totalRejected: number;
    totalWaitedMs: number;
    currentTokens: number;
    maxTokens: number;
    refillRate: number;
    lastRefillAt: Date;
    lastAcquireAt: Date | null;
    lastRejectAt: Date | null;
}
export interface RateLimiterStats {
    engines: Record<string, EngineRateLimitStats>;
    totalAcquired: number;
    totalRejected: number;
    configuredEngines: number;
}
export declare class RateLimiterService {
    private eventBus;
    private emitEvents;
    private defaultConfig;
    private buckets;
    private stats;
    private globalAcquired;
    private globalRejected;
    constructor(eventBus?: EventBus, options?: RateLimiterOptions);
    setEngineLimit(engineId: string, config: TokenBucketConfig): void;
    removeEngineLimit(engineId: string): boolean;
    enableDefaultLimit(engineId: string): void;
    tryAcquire(engineId: string, tokens?: number): AcquireResult;
    acquire(engineId: string, tokens?: number, timeoutMs?: number): Promise<AcquireResult>;
    getRemainingTokens(engineId: string): number;
    getEngineConfig(engineId: string): TokenBucketConfig | null;
    getEngineStats(engineId: string): EngineRateLimitStats | null;
    getStats(): RateLimiterStats;
    isConfigured(engineId: string): boolean;
    getConfiguredEngines(): string[];
    getTopRejectedEngines(limit?: number): EngineRateLimitStats[];
    resetBucket(engineId: string): boolean;
    resetAll(): void;
    resetStats(): void;
    private initStats;
    private emitRateLimited;
}
//# sourceMappingURL=rate-limiter.d.ts.map