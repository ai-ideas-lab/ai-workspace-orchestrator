interface MockUser {
    id: string;
    username: string;
    email: string;
    password_hash: string;
    role: string;
    created_at: string;
    updated_at: string;
}
interface MockUserCreate {
    username: string;
    email: string;
    password_hash: string;
    role: string;
}
interface MockAIEngine {
    id: string;
    name: string;
    type: string;
    endpoint: string;
    capabilities: string[];
    status: string;
    load: number;
    created_at: string;
    updated_at: string;
}
interface MockWorkflowExecution {
    id: string;
    workflow_id: string;
    user_id?: string;
    status: string;
    trigger_data?: any;
    result?: any;
    error_message?: string;
    started_at?: string;
    completed_at?: string;
    execution_time_ms?: number;
    created_at: string;
}
export declare class MockDatabaseService {
    private users;
    private aiEngines;
    private workflowExecutions;
    getAIEngines(): Promise<MockAIEngine[]>;
    getAIEngine(id: string): Promise<MockAIEngine | undefined>;
    createAIEngine(data: Partial<MockAIEngine>): Promise<MockAIEngine>;
    updateAIEngine(id: string, data: Partial<MockAIEngine>): Promise<MockAIEngine | null>;
    deleteAIEngine(id: string): Promise<boolean>;
    getWorkflowExecutions(filters?: any): Promise<MockWorkflowExecution[]>;
    createWorkflowExecution(data: Partial<MockWorkflowExecution>): Promise<MockWorkflowExecution>;
    updateWorkflowExecution(id: string, data: Partial<MockWorkflowExecution>): Promise<MockWorkflowExecution | null>;
    getWorkflowExecutionStats(): Promise<{
        totalExecutions: number;
        successRate: string;
        averageExecutionTime: number;
    }>;
    getSystemStats(): Promise<{
        totalEngines: number;
        activeEngines: number;
        averageLoad: number;
        averageLatency: number;
        totalRequests: number;
        database: {
            totalExecutions: number;
            successRate: string;
            averageExecutionTime: number;
        };
        status: string;
    }>;
    getUserByEmail(email: string): Promise<MockUser | undefined>;
    createUser(userData: MockUserCreate): Promise<MockUser>;
    getUserById(id: string): Promise<MockUser | undefined>;
    updateUser(id: string, userData: Partial<MockUser>): Promise<MockUser | null>;
    deleteUser(id: string): Promise<boolean>;
}
export declare const mockDatabaseService: MockDatabaseService;
export {};
//# sourceMappingURL=mock-database-service.d.ts.map