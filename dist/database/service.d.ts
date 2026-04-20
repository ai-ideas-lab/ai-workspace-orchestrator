export declare class DatabaseService {
    static createWorkflow(data: {
        title: string;
        description?: string;
        config: Record<string, any>;
        tags?: string[];
        isPublic?: boolean;
        userId: string;
    }): Promise<any>;
    static getWorkflows(filters?: {
        userId?: string;
        status?: string;
        isPublic?: boolean;
        search?: string;
    }): Promise<any>;
    static getWorkflowById(id: string): Promise<any>;
    static updateWorkflow(id: string, data: {
        title?: string;
        description?: string;
        config?: Record<string, any>;
        tags?: string[];
        status?: string;
        isPublic?: boolean;
    }): Promise<any>;
    static deleteWorkflow(id: string): Promise<any>;
    static createExecution(data: {
        workflowId: string;
        userId: string;
        input?: Record<string, any>;
        status?: string;
    }): Promise<any>;
    static getExecutions(filters?: {
        workflowId?: string;
        userId?: string;
        status?: string;
        limit?: number;
        offset?: number;
    }): Promise<any>;
    static updateExecution(id: string, data: {
        status?: string;
        output?: Record<string, any>;
        error?: string;
        duration?: number;
        completedAt?: Date;
    }): Promise<any>;
    static getAgents(filters?: {
        userId?: string;
        type?: string;
        isActive?: boolean;
    }): Promise<any>;
    static updateAgent(id: string, data: {
        name?: string;
        config?: Record<string, any>;
        description?: string;
        isActive?: boolean;
    }): Promise<any>;
    static search(query: string, filters?: {
        type?: 'workflow' | 'execution' | 'agent';
        userId?: string;
        limit?: number;
    }): Promise<any[]>;
    static getStatistics(userId?: string): Promise<{
        totalWorkflows: any;
        totalExecutions: any;
        completedExecutions: any;
        failedExecutions: any;
        successRate: number;
        activeAgents: any;
        timestamp: string;
    }>;
}
//# sourceMappingURL=service.d.ts.map