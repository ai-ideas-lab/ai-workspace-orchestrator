export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';
export interface HealthCheckResult {
    name: string;
    status: HealthStatus;
    message?: string;
    durationMs: number;
    details?: Record<string, unknown>;
    checkedAt: Date;
    error?: string;
}
export interface HealthReport {
    status: HealthStatus;
    checks: Record<string, HealthCheckResult>;
    totalDurationMs: number;
    timestamp: Date;
    version: string;
    summary: {
        healthy: number;
        degraded: number;
        unhealthy: number;
        total: number;
    };
}
export type HealthCheckProvider = () => HealthCheckInput | Promise<HealthCheckInput>;
export interface HealthCheckInput {
    status: HealthStatus;
    message?: string;
    details?: Record<string, unknown>;
    error?: string;
}
export interface HealthCheckOptions {
    checkTimeoutMs?: number;
    version?: string;
}
export declare class HealthCheckService {
    private providers;
    private checkTimeoutMs;
    private version;
    constructor(options?: HealthCheckOptions);
    register(name: string, provider: HealthCheckProvider): void;
    deregister(name: string): boolean;
    getRegisteredChecks(): string[];
    check(): Promise<HealthReport>;
    private createTimeout;
}
//# sourceMappingURL=health-check.d.ts.map