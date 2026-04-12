import { PrismaClient } from '@prisma/client';
import { AIEngine, User, WorkflowExecutionsResult } from './database-types';
export declare class EnhancedDatabaseService {
    private prisma;
    private isDatabaseConnected;
    private useMockData;
    constructor();
    private initializeDatabase;
    private runMigrations;
    getPrisma(): PrismaClient | null;
    isDatabaseAvailable(): boolean;
    shouldUseMockData(): boolean;
    getAIEngines(): Promise<AIEngine[]>;
    private getMockAIEngines;
    getWorkflowExecutions(limit?: number, offset?: number): Promise<WorkflowExecutionsResult | {
        executions: ({
            user: {
                username: string;
                email: string;
                password: string;
                name: string | null;
                id: string;
                avatar: string | null;
                role: import(".prisma/client").$Enums.UserRole;
                createdAt: Date;
                updatedAt: Date;
            };
            workflow: {
                status: import(".prisma/client").$Enums.WorkflowStatus;
                userId: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                title: string;
                description: string | null;
                config: import("@prisma/client/runtime/client").JsonValue;
                tags: string | null;
                isPublic: boolean;
            };
        } & {
            error: string | null;
            status: import(".prisma/client").$Enums.ExecutionStatus;
            userId: string;
            output: import("@prisma/client/runtime/client").JsonValue | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            workflowId: string;
            input: import("@prisma/client/runtime/client").JsonValue | null;
            duration: number | null;
            startedAt: Date | null;
            completedAt: Date | null;
        })[];
        total: number;
        hasMore: boolean;
    }>;
    private getMockWorkflowExecutions;
    createUser(data: any): Promise<{
        username: string;
        email: string;
        password: string;
        name: string | null;
        id: string;
        avatar: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        createdAt: Date;
        updatedAt: Date;
    } | User>;
    private getMockUser;
    validateToken(token: string): Promise<{
        userId: string;
        email: string;
        role: string;
    } | null>;
    disconnect(): Promise<void>;
    healthCheck(): Promise<{
        status: string;
        mode: string;
        message: string;
        timestamp: string;
        tables?: never;
    } | {
        status: string;
        mode: string;
        message: string;
        timestamp: string;
        tables: number;
    }>;
    private getTableCount;
    getStatus(): {
        isDatabaseConnected: boolean;
        useMockData: boolean;
        databaseUrl: string;
        environment: string;
    };
}
export declare const enhancedDatabaseService: EnhancedDatabaseService;
//# sourceMappingURL=enhanced-database-service.d.ts.map