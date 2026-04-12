export declare class DatabaseIntegrationService {
    private postgresDb;
    private memoryDb;
    private isInitialized;
    constructor();
    initializePostgreSQLIntegration(): Promise<void>;
    private migrateDataToPostgreSQL;
    private replaceMemoryDatabaseWithPostgreSQL;
    private verifyIntegration;
    getDatabaseStatus(): Promise<{
        type: 'memory' | 'postgresql';
        status: 'connected' | 'disconnected' | 'error';
        details: any;
    }>;
    getMigrationStats(): Promise<{
        totalUsers: number;
        totalPosts: number;
        lastMigrationTime?: Date;
        status: 'pending' | 'in-progress' | 'completed' | 'failed';
    }>;
}
export declare const databaseIntegrationService: DatabaseIntegrationService;
//# sourceMappingURL=database-integration.service.d.ts.map