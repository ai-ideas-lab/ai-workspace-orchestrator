export interface AIEngine {
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
}
export interface WorkflowExecution {
    id: string;
    workflowName: string;
    status: string;
    startTime: string;
    endTime?: string;
    duration?: number;
    aiEngine?: string;
    input: string;
    output: string;
    error?: string;
    userId: string;
    createdAt: string;
}
export interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface WorkflowExecutionsResult {
    executions: WorkflowExecution[];
    total: number;
    hasMore: boolean;
}
//# sourceMappingURL=database-types.d.ts.map