"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimiterService = void 0;
class TokenBucket {
    constructor(config) {
        this.maxTokens = config.maxTokens;
        this.refillRate = config.refillRate;
        this.tokens = config.currentTokens ?? config.maxTokens;
        this.lastRefillAt = new Date();
    }
    refill() {
        const now = new Date();
        const elapsedMs = now.getTime() - this.lastRefillAt.getTime();
        const tokensToAdd = (elapsedMs / 1000) * this.refillRate;
        this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
        this.lastRefillAt = now;
    }
    tryConsume(n = 1) {
        this.refill();
        if (this.tokens >= n) {
            this.tokens -= n;
            return true;
        }
        return false;
    }
    waitTimeFor(n = 1) {
        this.refill();
        if (this.tokens >= n)
            return 0;
        const deficit = n - this.tokens;
        return (deficit / this.refillRate) * 1000;
    }
}
class RateLimiterService {
    constructor(eventBus, options) {
        this.buckets = new Map();
        this.stats = new Map();
        this.globalAcquired = 0;
        this.globalRejected = 0;
        this.eventBus = eventBus ?? null;
        this.emitEvents = options?.emitEvents ?? true;
        this.defaultConfig = {
            refillRate: options?.defaultRefillRate ?? 10,
            maxTokens: options?.defaultMaxTokens ?? 50,
        };
    }
    setEngineLimit(engineId, config) {
        const existing = this.buckets.get(engineId);
        if (existing) {
            const currentTokens = Math.min(existing.tokens, config.maxTokens);
            this.buckets.set(engineId, new TokenBucket({
                ...config,
                currentTokens,
            }));
        }
        else {
            this.buckets.set(engineId, new TokenBucket(config));
            this.initStats(engineId, config);
        }
    }
    removeEngineLimit(engineId) {
        return this.buckets.delete(engineId) && this.stats.delete(engineId);
    }
    enableDefaultLimit(engineId) {
        this.setEngineLimit(engineId, {
            refillRate: this.defaultConfig.refillRate,
            maxTokens: this.defaultConfig.maxTokens,
        });
    }
    tryAcquire(engineId, tokens = 1) {
        const bucket = this.buckets.get(engineId);
        if (!bucket) {
            return {
                allowed: true,
                remainingTokens: Infinity,
                waitTimeMs: 0,
                engineId,
            };
        }
        const allowed = bucket.tryConsume(tokens);
        const stats = this.stats.get(engineId);
        const now = new Date();
        if (allowed) {
            stats.totalAcquired++;
            stats.currentTokens = bucket.tokens;
            stats.lastAcquireAt = now;
            this.globalAcquired++;
            return {
                allowed: true,
                remainingTokens: bucket.tokens,
                waitTimeMs: 0,
                engineId,
            };
        }
        else {
            const waitTimeMs = bucket.waitTimeFor(tokens);
            stats.totalRejected++;
            stats.lastRejectAt = now;
            this.globalRejected++;
            this.emitRateLimited(engineId, waitTimeMs);
            return {
                allowed: false,
                remainingTokens: bucket.tokens,
                waitTimeMs,
                engineId,
            };
        }
    }
    async acquire(engineId, tokens = 1, timeoutMs = 30000) {
        const bucket = this.buckets.get(engineId);
        if (!bucket) {
            return { allowed: true, remainingTokens: Infinity, waitTimeMs: 0, engineId };
        }
        const startTime = Date.now();
        while (Date.now() - startTime < timeoutMs) {
            const result = this.tryAcquire(engineId, tokens);
            if (result.allowed) {
                const stats = this.stats.get(engineId);
                stats.totalWaitedMs += Date.now() - startTime;
                return result;
            }
            const waitMs = Math.max(10, result.waitTimeMs / 2);
            await new Promise((resolve) => setTimeout(resolve, waitMs));
        }
        const stats = this.stats.get(engineId);
        if (stats) {
            stats.totalRejected++;
            this.globalRejected++;
        }
        return {
            allowed: false,
            remainingTokens: bucket.tokens,
            waitTimeMs: Date.now() - startTime,
            engineId,
        };
    }
    getRemainingTokens(engineId) {
        const bucket = this.buckets.get(engineId);
        if (!bucket)
            return Infinity;
        bucket.refill();
        return bucket.tokens;
    }
    getEngineConfig(engineId) {
        const bucket = this.buckets.get(engineId);
        if (!bucket)
            return null;
        return {
            refillRate: bucket.refillRate,
            maxTokens: bucket.maxTokens,
            currentTokens: bucket.tokens,
        };
    }
    getEngineStats(engineId) {
        return this.stats.get(engineId) ?? null;
    }
    getStats() {
        const engines = {};
        for (const [id, s] of this.stats) {
            const bucket = this.buckets.get(id);
            engines[id] = {
                ...s,
                currentTokens: bucket?.tokens ?? s.currentTokens,
            };
        }
        return {
            engines,
            totalAcquired: this.globalAcquired,
            totalRejected: this.globalRejected,
            configuredEngines: this.buckets.size,
        };
    }
    isConfigured(engineId) {
        return this.buckets.has(engineId);
    }
    getConfiguredEngines() {
        return [...this.buckets.keys()];
    }
    getTopRejectedEngines(limit = 5) {
        return [...this.stats.values()]
            .sort((a, b) => b.totalRejected - a.totalRejected)
            .slice(0, limit);
    }
    resetBucket(engineId) {
        const bucket = this.buckets.get(engineId);
        if (!bucket)
            return false;
        bucket.tokens = bucket.maxTokens;
        bucket.lastRefillAt = new Date();
        return true;
    }
    resetAll() {
        for (const bucket of this.buckets.values()) {
            bucket.tokens = bucket.maxTokens;
            bucket.lastRefillAt = new Date();
        }
    }
    resetStats() {
        for (const stats of this.stats.values()) {
            stats.totalAcquired = 0;
            stats.totalRejected = 0;
            stats.totalWaitedMs = 0;
            stats.lastAcquireAt = null;
            stats.lastRejectAt = null;
        }
        this.globalAcquired = 0;
        this.globalRejected = 0;
    }
    initStats(engineId, config) {
        this.stats.set(engineId, {
            engineId,
            totalAcquired: 0,
            totalRejected: 0,
            totalWaitedMs: 0,
            currentTokens: config.currentTokens ?? config.maxTokens,
            maxTokens: config.maxTokens,
            refillRate: config.refillRate,
            lastRefillAt: new Date(),
            lastAcquireAt: null,
            lastRejectAt: null,
        });
    }
    emitRateLimited(engineId, waitTimeMs) {
        if (!this.emitEvents || !this.eventBus)
            return;
        this.eventBus.emit({
            type: 'request.failed',
            requestId: `rate-limit-${engineId}-${Date.now()}`,
            engineId,
            error: `Rate limited: engine ${engineId} exceeded rate limit, wait ${Math.ceil(waitTimeMs)}ms`,
            timestamp: new Date(),
        });
    }
}
exports.RateLimiterService = RateLimiterService;
//# sourceMappingURL=rate-limiter.js.map