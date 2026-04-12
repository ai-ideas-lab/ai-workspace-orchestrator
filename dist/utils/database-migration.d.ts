export declare class DatabaseMigration {
    private postgresDb;
    private sqliteDb;
    constructor();
    migrate(): Promise<void>;
    private checkSqliteDatabaseExists;
    private migrateUsers;
    private migrateAIEngines;
    private migrateWorkflows;
    private migrateWorkflowSteps;
    private migrateWorkflowExecutions;
    private migrateStepExecutionHistory;
    generateMigrationReport(): Promise<{
        totalRecords: number;
        tables: string[];
        warnings: string[];
        errors: string[];
    }>;
}
export declare const dbMigration: DatabaseMigration;
//# sourceMappingURL=database-migration.d.ts.map