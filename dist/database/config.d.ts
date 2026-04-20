import { Config } from '../utils/config.js';
export interface DatabaseConfig {
    provider: 'postgresql' | 'sqlite';
    url: string;
    maxConnections: number;
    timeout: number;
    ssl?: boolean;
    sslConfig?: {
        rejectUnauthorized: boolean;
        ca?: string;
        key?: string;
        cert?: string;
    };
}
export declare class DatabaseConfiguration {
    static createDatabaseConfig(config: Config): DatabaseConfig;
    private static resolveDatabaseUrl;
    private static buildPostgresUrl;
    private static parseSSLConfig;
    private static getPostgresSSLConfig;
    static validateDatabaseConfig(config: DatabaseConfig): {
        valid: boolean;
        errors: string[];
        warnings: string[];
    };
    private static validatePostgresConfig;
    private static validateSQLiteConfig;
    static getOptimizationRecommendations(config: DatabaseConfig): string[];
    static generateConfigExample(): {
        postgresql: {
            environment: string;
            url: string;
            exampleConfig: Record<string, any>;
        };
        sqlite: {
            environment: string;
            url: string;
            exampleConfig: Record<string, any>;
        };
    };
    static testConnection(config: DatabaseConfig): Promise<{
        success: boolean;
        responseTime: number;
        error?: string;
        details: {
            provider: string;
            version?: string;
            database?: string;
        };
    }>;
    static getCapacityConfig(): {
        maxDatabaseSize: string;
        recommendedBackupFrequency: string;
        recommendedRetentionDays: number;
    };
}
//# sourceMappingURL=config.d.ts.map