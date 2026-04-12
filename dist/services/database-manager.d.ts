import { PrismaClient } from '@prisma/client';
export declare class DatabaseManager {
    private static instance;
    private prisma;
    private isInitialized;
    private constructor();
    static getInstance(): DatabaseManager;
    initialize(): Promise<void>;
    healthCheck(): Promise<{
        connected: boolean;
        latency: number;
        error?: string;
        databaseType?: string;
    }>;
    loadEnginesFromDatabase(): Promise<any[]>;
    recordWorkflowExecution(data: {
        workflow_id: string;
        user_id?: string;
        trigger_data?: any;
    }): Promise<string>;
    updateWorkflowExecution(executionId: string, status: string, result?: any, errorMessage?: string): Promise<void>;
    recordStepExecution(data: {
        execution_id: string;
        step_id: string;
        status: string;
        input_data?: any;
    }): Promise<string>;
    updateStepExecution(historyId: string, status: string, output_data?: any, errorMessage?: string): Promise<void>;
    getWorkflowStats(): Promise<{
        total: number;
        success: number;
        failed: number;
        success_rate: number;
        average_execution_time: number;
    }>;
    getRecentExecutions(limit?: number): Promise<any[]>;
    getSystemStats(): Promise<{
        totalWorkflows: number;
        totalExecutions: number;
        recentExecutions: number;
        isConnected: boolean;
        databaseType: string;
    }>;
    createAIEngine(data: {
        name: string;
        type: string;
        endpoint: string;
        capabilities: string[];
        config?: any;
    }): Promise<string>;
    updateEngineLoad(engineId: string, load: number): Promise<void>;
    private seedInitialData;
    disconnect(): Promise<void>;
    $queryRaw(sql: TemplateStringsArray, ...params: any[]): Promise<any>;
    getPrisma(): PrismaClient;
}
export declare const databaseManager: DatabaseManager;
//# sourceMappingURL=database-manager.d.ts.map