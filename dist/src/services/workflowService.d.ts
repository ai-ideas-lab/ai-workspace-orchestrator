export declare class WorkflowService {
    createWorkflow(data: {
        name: string;
        description: string;
        config?: any;
        status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    }): Promise<{
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
    }>;
    getWorkflows(): Promise<({
        steps: never;
        executions: {
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
        }[];
        _count: {
            steps: number;
            executions: number;
        };
    } & {
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
    })[]>;
    getWorkflow(id: string): Promise<{
        steps: never;
        executions: {
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
        }[];
    } & {
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
    }>;
    updateWorkflow(id: string, data: {
        name?: string;
        description?: string;
        config?: any;
        status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    }): Promise<{
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
    }>;
    deleteWorkflow(id: string): Promise<{
        success: boolean;
        id: string;
    }>;
    executeWorkflow(id: string, options?: {
        metadata?: any;
        triggeredBy?: string;
    }): Promise<any>;
    getExecution(id: string): Promise<any>;
    getExecutions(limit?: number, offset?: number): Promise<any>;
    updateExecutionStatus(id: string, status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'): Promise<any>;
    addStepToWorkflow(workflowId: string, stepData: {
        name: string;
        type: 'AI_TASK' | 'HUMAN_TASK' | 'DATA_PROCESSING' | 'NOTIFICATION' | 'VALIDATION';
        config?: any;
        order: number;
        dependencies?: string[];
    }): Promise<any>;
    getWorkflowStats(): Promise<{
        totalWorkflows: any;
        totalExecutions: any;
        recentExecutions: any;
        successRate: number;
        successCount: any;
        failureCount: number;
    }>;
}
export declare const workflowService: WorkflowService;
//# sourceMappingURL=workflowService.d.ts.map