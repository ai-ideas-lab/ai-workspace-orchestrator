export declare class DatabaseHealth {
    static checkConnection(): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        details: {
            connected: boolean;
            responseTime: number;
            lastChecked: Date;
            error?: string;
        };
    }>;
    static checkTables(): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        details: {
            tables: {
                name: string;
                accessible: boolean;
                rowCount: number;
            }[];
            missingTables?: string[];
            timestamp: Date;
        };
    }>;
    static checkForeignKeys(): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        details: {
            violations: Array<{
                table: string;
                constraint: string;
                error: string;
            }>;
            timestamp: Date;
        };
    }>;
    static checkDataIntegrity(): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        details: {
            integrityChecks: Array<{
                check: string;
                passed: boolean;
                details: string;
                count?: number;
            }>;
            timestamp: Date;
        };
    }>;
    static comprehensiveHealthCheck(): Promise<{
        overall: 'healthy' | 'degraded' | 'unhealthy';
        components: {
            connection: Awaited<ReturnType<typeof this.checkConnection>>;
            tables: Awaited<ReturnType<typeof this.checkTables>>;
            foreignKeys: Awaited<ReturnType<typeof this.checkForeignKeys>>;
            integrity: Awaited<ReturnType<typeof this.checkDataIntegrity>>;
        };
        recommendations: string[];
        timestamp: Date;
    }>;
    private static generateRecommendations;
    static startPeriodicHealthCheck(intervalMs?: number): Promise<void>;
}
//# sourceMappingURL=health.d.ts.map