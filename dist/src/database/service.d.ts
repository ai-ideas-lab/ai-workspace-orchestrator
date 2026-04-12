export declare class DatabaseService {
    static createWorkflow(data: {
        title: string;
        description?: string;
        config: Record<string, any>;
        tags?: string[];
        isPublic?: boolean;
        userId: string;
    }): Promise<{
        status: import(".prisma/client").$Enums.WorkflowStatus;
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string | null;
        config: import("@prisma/client/runtime/client.js").JsonValue;
        tags: string | null;
        isPublic: boolean;
    }>;
    static getWorkflows(filters?: {
        userId?: string;
        status?: string;
        isPublic?: boolean;
        search?: string;
    }): Promise<({
        user: {
            username: string;
            name: string | null;
            id: string;
        };
        _count: {
            comments: number;
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
        config: import("@prisma/client/runtime/client.js").JsonValue;
        tags: string | null;
        isPublic: boolean;
    })[]>;
    static getWorkflowById(id: string): Promise<{
        user: {
            username: string;
            name: string | null;
            id: string;
        };
        executions: ({
            agents: ({
                agent: {
                    type: import(".prisma/client").$Enums.AgentType;
                    userId: string;
                    name: string;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    description: string | null;
                    config: import("@prisma/client/runtime/client.js").JsonValue;
                    isAvailable: boolean;
                };
            } & {
                error: string | null;
                status: import(".prisma/client").$Enums.ExecutionStatus;
                output: import("@prisma/client/runtime/client.js").JsonValue | null;
                id: string;
                input: import("@prisma/client/runtime/client.js").JsonValue;
                duration: number | null;
                startedAt: Date | null;
                completedAt: Date | null;
                agentId: string;
                executionId: string;
            })[];
        } & {
            error: string | null;
            status: import(".prisma/client").$Enums.ExecutionStatus;
            userId: string;
            output: import("@prisma/client/runtime/client.js").JsonValue | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            workflowId: string;
            input: import("@prisma/client/runtime/client.js").JsonValue | null;
            duration: number | null;
            startedAt: Date | null;
            completedAt: Date | null;
        })[];
    } & {
        status: import(".prisma/client").$Enums.WorkflowStatus;
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string | null;
        config: import("@prisma/client/runtime/client.js").JsonValue;
        tags: string | null;
        isPublic: boolean;
    }>;
    static updateWorkflow(id: string, data: {
        title?: string;
        description?: string;
        config?: Record<string, any>;
        tags?: string[];
        status?: string;
        isPublic?: boolean;
    }): Promise<{
        user: {
            username: string;
            name: string | null;
            id: string;
        };
    } & {
        status: import(".prisma/client").$Enums.WorkflowStatus;
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string | null;
        config: import("@prisma/client/runtime/client.js").JsonValue;
        tags: string | null;
        isPublic: boolean;
    }>;
    static deleteWorkflow(id: string): Promise<{
        status: import(".prisma/client").$Enums.WorkflowStatus;
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string | null;
        config: import("@prisma/client/runtime/client.js").JsonValue;
        tags: string | null;
        isPublic: boolean;
    }>;
    static createExecution(data: {
        workflowId: string;
        userId: string;
        input?: Record<string, any>;
        status?: string;
    }): Promise<{
        error: string | null;
        status: import(".prisma/client").$Enums.ExecutionStatus;
        userId: string;
        output: import("@prisma/client/runtime/client.js").JsonValue | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        workflowId: string;
        input: import("@prisma/client/runtime/client.js").JsonValue | null;
        duration: number | null;
        startedAt: Date | null;
        completedAt: Date | null;
    }>;
    static getExecutions(filters?: {
        workflowId?: string;
        userId?: string;
        status?: string;
        limit?: number;
        offset?: number;
    }): Promise<({
        user: {
            username: string;
            id: string;
        };
        workflow: {
            id: string;
            title: string;
        };
        agents: ({
            agent: {
                type: import(".prisma/client").$Enums.AgentType;
                name: string;
                id: string;
            };
        } & {
            error: string | null;
            status: import(".prisma/client").$Enums.ExecutionStatus;
            output: import("@prisma/client/runtime/client.js").JsonValue | null;
            id: string;
            input: import("@prisma/client/runtime/client.js").JsonValue;
            duration: number | null;
            startedAt: Date | null;
            completedAt: Date | null;
            agentId: string;
            executionId: string;
        })[];
    } & {
        error: string | null;
        status: import(".prisma/client").$Enums.ExecutionStatus;
        userId: string;
        output: import("@prisma/client/runtime/client.js").JsonValue | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        workflowId: string;
        input: import("@prisma/client/runtime/client.js").JsonValue | null;
        duration: number | null;
        startedAt: Date | null;
        completedAt: Date | null;
    })[]>;
    static updateExecution(id: string, data: {
        status?: string;
        output?: Record<string, any>;
        error?: string;
        duration?: number;
        completedAt?: Date;
    }): Promise<{
        user: {
            username: string;
            id: string;
        };
        workflow: {
            id: string;
            title: string;
        };
    } & {
        error: string | null;
        status: import(".prisma/client").$Enums.ExecutionStatus;
        userId: string;
        output: import("@prisma/client/runtime/client.js").JsonValue | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        workflowId: string;
        input: import("@prisma/client/runtime/client.js").JsonValue | null;
        duration: number | null;
        startedAt: Date | null;
        completedAt: Date | null;
    }>;
    static getAgents(filters?: {
        userId?: string;
        type?: string;
        isActive?: boolean;
    }): Promise<({
        user: {
            username: string;
            id: string;
        };
        _count: {
            executions: number;
        };
    } & {
        type: import(".prisma/client").$Enums.AgentType;
        userId: string;
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        config: import("@prisma/client/runtime/client.js").JsonValue;
        isAvailable: boolean;
    })[]>;
    static updateAgent(id: string, data: {
        name?: string;
        config?: Record<string, any>;
        description?: string;
        isActive?: boolean;
    }): Promise<{
        user: {
            username: string;
            id: string;
        };
    } & {
        type: import(".prisma/client").$Enums.AgentType;
        userId: string;
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        config: import("@prisma/client/runtime/client.js").JsonValue;
        isAvailable: boolean;
    }>;
    static search(query: string, filters?: {
        type?: 'workflow' | 'execution' | 'agent';
        userId?: string;
        limit?: number;
    }): Promise<any[]>;
    static getStatistics(userId?: string): Promise<{
        totalWorkflows: number;
        totalExecutions: number;
        completedExecutions: number;
        failedExecutions: number;
        successRate: number;
        activeAgents: number;
        timestamp: string;
    }>;
}
//# sourceMappingURL=service.d.ts.map