import { PostgresDatabaseService } from '../services/postgres-database-service';
export declare class DatabaseConfig {
    private static instance;
    private postgresDb;
    private isInitialized;
    private constructor();
    static getInstance(): DatabaseConfig;
    initialize(): Promise<void>;
    getPostgresDb(): PostgresDatabaseService;
    healthCheck(): Promise<any>;
    disconnect(): Promise<void>;
}
export declare const dbConfig: DatabaseConfig;
//# sourceMappingURL=database.d.ts.map