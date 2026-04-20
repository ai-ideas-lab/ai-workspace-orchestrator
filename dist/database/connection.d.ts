import { PrismaClient } from '@prisma/client';
import { Config } from '../utils/config.js';
export declare class DatabaseConnection {
    private static instance;
    private static isConnected;
    static createConnection(config: Config): Promise<PrismaClient>;
    private static createPostgreSQLConnection;
    private static createSQLiteConnection;
    private static buildPostgresUrl;
    static disconnect(): Promise<void>;
    static getStatus(): {
        connected: boolean;
        provider?: string;
    };
    static healthCheck(): Promise<boolean>;
    static getStats(): Promise<{
        totalWorkflows: number;
        totalExecutions: number;
        totalUsers: number;
        databaseSize?: string;
    }>;
}
//# sourceMappingURL=connection.d.ts.map