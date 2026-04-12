export interface CreateExecutionData {
    workflowId: string;
    status: 'running' | 'completed' | 'failed' | 'cancelled';
    triggerData?: any;
    result?: any;
    errorMessage?: string;
    executionTimeMs?: number;
}
export interface GetExecutionsParams {
    workflowId?: string;
    status?: string;
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    userId?: string;
    sortBy?: 'created_at' | 'started_at';
    sortOrder?: 'asc' | 'desc';
}
export interface ExecutionResult {
    success: boolean;
    data?: any;
    error?: string;
}
export interface ExecutionStats {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    runningExecutions: number;
    averageExecutionTime: number;
    executionsByStatus: Record<string, number>;
    executionsByDay: Record<string, number>;
}
export declare class WorkflowExecutionService {
    private postgresDb;
    constructor();
    createExecution(data: CreateExecutionData): Promise<ExecutionResult>;
    updateExecution(executionId: string, data: Partial<CreateExecutionData>): Promise<ExecutionResult>;
    getExecution(executionId: string): Promise<ExecutionResult>;
    getExecutions(params: GetExecutionsParams): Promise<ExecutionResult>;
    deleteExecution(executionId: string): Promise<ExecutionResult>;
    getExecutionStats(): Promise<ExecutionResult>;
    private getExecutionsByDay;
    createStepExecution(data: {
        executionId: string;
        stepId: string;
        status: 'running' | 'completed' | 'failed' | 'skipped';
        inputData?: any;
        outputData?: any;
        errorMessage?: string;
        durationMs?: number;
    }): Promise<ExecutionResult>;
    private logError;
}
export declare const workflowExecutionService: WorkflowExecutionService;
//# sourceMappingURL=workflow-execution-service.d.ts.map