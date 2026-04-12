import { PrismaClient } from '@prisma/client';
export declare class EnhancedDatabaseService {
    private prisma;
    constructor();
    getPrisma(): PrismaClient;
    getAIEngines(): Promise<{
        id: string;
        name: string;
        type: string;
        description: string;
        status: string;
        capabilities: string[];
        config: {
            model: string;
            temperature: number;
            maxTokens: number;
        };
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    getWorkflowExecutions(limit?: number, offset?: number): Promise<{
        executions: {
            id: string;
            workflowName: string;
            status: string;
            startTime: string;
            endTime: string;
            duration: number;
            aiEngine: string | undefined;
            input: string;
            output: string;
            error: null;
            userId: string;
            createdAt: string;
        }[];
        total: number;
        hasMore: boolean;
    }>;
    createUser(data: any): Promise<{
        id: string;
        email: any;
        name: any;
        role: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    validateToken(token: string): Promise<{
        userId: string;
        email: string;
        role: string;
    } | null>;
    disconnect(): Promise<void>;
}
export declare const enhancedDatabaseService: EnhancedDatabaseService;
//# sourceMappingURL=enhanced-database-service.d.ts.map