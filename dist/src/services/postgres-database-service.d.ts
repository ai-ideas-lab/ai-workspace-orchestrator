import { PrismaClient } from '@prisma/client';
export declare class PostgresDatabaseService {
    private static instance;
    private prisma;
    private isInitialized;
    private constructor();
    static getInstance(): PostgresDatabaseService;
    initialize(): Promise<void>;
    private testConnection;
    createWorkflowExecution(data: {
        workflowId: string;
        userId: string;
        triggerData?: any;
        status: 'running' | 'completed' | 'failed' | 'cancelled';
    }): Promise<any>;
    updateWorkflowExecution(executionId: string, updateData: {
        status: 'running' | 'completed' | 'failed' | 'cancelled';
        result?: any;
        errorMessage?: string;
        executionTimeMs?: number;
    }): Promise<any>;
    getWorkflowExecutionWithHistory(executionId: string): Promise<{
        id: string;
        workflowId: any;
        userId: any;
        workflowName: any;
        username: string;
        status: import(".prisma/client").$Enums.ExecutionStatus;
        triggerData: any;
        result: any;
        errorMessage: any;
        executionTimeMs: any;
        startedAt: any;
        completedAt: any;
        createdAt: any;
        steps: any;
    } | null>;
    getWorkflowExecutions(params: {
        userId?: string;
        workflowId?: string;
        status?: string;
        limit?: number;
        offset?: number;
        sortBy?: 'created_at' | 'started_at';
        sortOrder?: 'asc' | 'desc';
    }): Promise<{
        executions: {
            id: string;
            workflowId: any;
            workflowName: never;
            userId: any;
            username: string;
            status: import(".prisma/client").$Enums.ExecutionStatus;
            triggerData: any;
            result: any;
            errorMessage: any;
            executionTimeMs: any;
            startedAt: any;
            completedAt: any;
            createdAt: any;
            stepCount: any;
        }[];
        total: number;
        hasMore: boolean;
        limit: number;
        offset: number;
    }>;
    createStepExecution(data: {
        executionId: string;
        stepId: string;
        status: 'running' | 'completed' | 'failed' | 'skipped';
        inputData?: any;
        outputData?: any;
        errorMessage?: string;
        durationMs?: number;
    }): Promise<any>;
    healthCheck(): Promise<{
        status: 'healthy' | 'unhealthy';
        connected: boolean;
        latency: number;
        database?: string;
        version?: string;
        error?: string;
    }>;
    disconnect(): Promise<void>;
    seedInitialData(): Promise<void>;
    getUserByEmail(email: string): Promise<{
        id: string;
        username: string;
        email: string;
        password: any;
        role: import(".prisma/client").$Enums.UserRole;
        created_at: any;
        updated_at: any;
    } | null>;
    createUser(userData: {
        username: string;
        email: string;
        password_hash: string;
        role: string;
    }): Promise<{
        id: string;
        username: string;
        email: string;
        password_hash: any;
        role: import(".prisma/client").$Enums.UserRole;
        created_at: any;
        updated_at: any;
    }>;
    getUserById(id: string): Promise<{
        id: string;
        username: string;
        email: string;
        password_hash: any;
        role: import(".prisma/client").$Enums.UserRole;
        created_at: any;
        updated_at: any;
    } | null>;
    getPrisma(): PrismaClient<import(".prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/client").DefaultArgs>;
}
export declare const postgresDb: PostgresDatabaseService;
//# sourceMappingURL=postgres-database-service.d.ts.map