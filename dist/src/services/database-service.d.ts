import sqlite3 from 'sqlite3';
export declare class DatabaseService {
    private static instance;
    private db;
    private isInitialized;
    private constructor();
    static getInstance(): DatabaseService;
    initialize(): Promise<void>;
    private createTables;
    private run;
    private get;
    private all;
    getDb(): sqlite3.Database;
    testConnection(): Promise<boolean>;
    disconnect(): Promise<void>;
    healthCheck(): Promise<{
        status: 'healthy' | 'unhealthy';
        connected: boolean;
        latency: number;
        error?: string;
    }>;
    clear(): Promise<void>;
}
export declare const db: DatabaseService;
//# sourceMappingURL=database-service.d.ts.map