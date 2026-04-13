export interface WorkflowOptions {
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    timeoutMs?: number;
    retryCount?: number;
    metadata?: Record<string, unknown>;
}
export interface WorkflowResult {
    id: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    workflowId: string;
    inputVariables: Record<string, unknown>;
    outputVariables?: Record<string, unknown>;
    error?: string;
    startTime: Date;
    endTime?: Date;
    duration?: number;
    metadata?: Record<string, unknown>;
}
export declare class EnhancedWorkflowService {
    private static instance;
    private executor;
    private eventBus;
    private constructor();
    static getInstance(): EnhancedWorkflowService;
    executeWorkflow(workflowId: string, options?: WorkflowOptions): Promise<WorkflowResult>;
    private executeWorkflowInternal;
    private getWorkflowDefinition;
    private validateWorkflowState;
    getExecutionStatus(executionId: string): Promise<WorkflowResult | null>;
    cancelExecution(executionId: string): Promise<boolean>;
    getExecutionHistory(workflowId: string, options?: {
        page?: number;
        limit?: number;
        status?: string;
        startDate?: string;
        endDate?: string;
    }): Promise<{
        data: WorkflowResult[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
}
export declare const WorkflowService: EnhancedWorkflowService;
//# sourceMappingURL=enhanced-workflow-service.d.ts.map