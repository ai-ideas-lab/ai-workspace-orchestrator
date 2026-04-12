export interface DatabaseHealthStatus {
    status: 'healthy' | 'degraded' | 'unhealthy' | 'disconnected';
    lastChecked: Date;
    responseTime: number;
    error?: string;
    details: {
        connected: boolean;
        provider?: string;
        database?: string;
        totalConnections: number;
        activeConnections: number;
        slowQueryThreshold: number;
        lastSlowQuery?: Date;
        retryAttempts: number;
        maxRetries: number;
    };
}
export declare class DatabaseHealthMonitor {
    private static instance;
    private prisma;
    private isMonitoring;
    private healthCheckInterval;
    private connectionRetries;
    private maxRetries;
    private healthStatus;
    constructor();
    static getInstance(): DatabaseHealthMonitor;
    startMonitoring(intervalMs?: number): Promise<void>;
    stopMonitoring(): void;
    performHealthCheck(): Promise<DatabaseHealthStatus>;
    private detailedHealthCheck;
    private handleConnectionFailure;
    private updateHealthStatus;
    getCurrentStatus(): DatabaseHealthStatus;
    isDatabaseAvailable(): boolean;
    getDatabaseStats(): Promise<{
        totalWorkflows: number;
        totalExecutions: number;
        totalUsers: number;
        databaseSize?: string;
        uptime: string;
        lastHealthCheck: string;
    }>;
    checkForSlowQuery(): boolean;
    resetConnectionRetries(): void;
    private loadConfig;
}
export declare function checkDatabaseHealth(): Promise<DatabaseHealthStatus>;
export declare function startDatabaseHealthMonitoring(intervalMs?: number): Promise<void>;
export declare function stopDatabaseHealthMonitoring(): void;
//# sourceMappingURL=database-health-monitor.d.ts.map