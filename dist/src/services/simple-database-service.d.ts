export declare class SimpleDatabaseService {
    private prisma;
    constructor();
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    testConnection(): Promise<boolean>;
    getAllEngines(): Promise<any>;
    createEngine(engine: any): Promise<any>;
    updateEngineLoad(id: string, load: number): Promise<any>;
    createExecution(execution: any): Promise<any>;
    updateExecution(id: string, updates: any): Promise<any>;
    getExecutionHistory(options?: any): Promise<any>;
    getExecutionStats(): Promise<{
        total: any;
        status: Record<string, number>;
        avgExecutionTime: number;
        successRate: number;
    }>;
    getDatabaseInfo(): Promise<{
        version: string;
        size: string;
        tables: number;
        indexes: number;
    }>;
    healthCheck(): Promise<{
        status: string;
        message: any;
    }>;
}
export declare const simpleDatabaseService: SimpleDatabaseService;
//# sourceMappingURL=simple-database-service.d.ts.map