"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthCheckService = void 0;
const STATUS_PRIORITY = {
    healthy: 0,
    degraded: 1,
    unhealthy: 2,
};
function worstOf(a, b) {
    return STATUS_PRIORITY[a] >= STATUS_PRIORITY[b] ? a : b;
}
class HealthCheckService {
    constructor(options) {
        this.providers = new Map();
        this.checkTimeoutMs = options?.checkTimeoutMs ?? 5000;
        this.version = options?.version ?? '1.0.0';
    }
    register(name, provider) {
        this.providers.set(name, provider);
    }
    deregister(name) {
        return this.providers.delete(name);
    }
    getRegisteredChecks() {
        return [...this.providers.keys()];
    }
    async check() {
        const startTime = Date.now();
        const checks = {};
        let aggregateStatus = 'healthy';
        const entries = [...this.providers.entries()];
        const results = await Promise.allSettled(entries.map(async ([name, provider]) => {
            const checkStart = Date.now();
            try {
                const result = await Promise.race([
                    Promise.resolve(provider()),
                    this.createTimeout(name),
                ]);
                const durationMs = Date.now() - checkStart;
                return { name, result, durationMs };
            }
            catch (err) {
                const durationMs = Date.now() - checkStart;
                return {
                    name,
                    result: {
                        status: 'unhealthy',
                        error: err instanceof Error ? err.message : String(err),
                    },
                    durationMs,
                };
            }
        }));
        let healthy = 0;
        let degraded = 0;
        let unhealthy = 0;
        for (const settled of results) {
            if (settled.status === 'fulfilled') {
                const { name, result, durationMs } = settled.value;
                const checkResult = {
                    name,
                    status: result.status,
                    message: result.message,
                    durationMs,
                    details: result.details,
                    checkedAt: new Date(),
                    error: result.error,
                };
                checks[name] = checkResult;
                aggregateStatus = worstOf(aggregateStatus, result.status);
                if (result.status === 'healthy')
                    healthy++;
                else if (result.status === 'degraded')
                    degraded++;
                else
                    unhealthy++;
            }
        }
        return {
            status: aggregateStatus,
            checks,
            totalDurationMs: Date.now() - startTime,
            timestamp: new Date(),
            version: this.version,
            summary: { healthy, degraded, unhealthy, total: entries.length },
        };
    }
    createTimeout(name) {
        return new Promise((_, reject) => setTimeout(() => reject(new Error(`Health check "${name}" timed out after ${this.checkTimeoutMs}ms`)), this.checkTimeoutMs));
    }
}
exports.HealthCheckService = HealthCheckService;
//# sourceMappingURL=health-check.js.map