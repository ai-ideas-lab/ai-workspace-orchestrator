import { Workflow, Execution } from '../types/database-mock.ts';
export interface WorkflowExecutionRequest {
    metadata?: Record<string, any>;
    triggeredBy?: string;
}
export interface WorkflowStepResult {
    stepId: string;
    status: 'completed' | 'failed' | 'skipped';
    result?: any;
    error?: string;
    duration: number;
}
export interface WorkflowExecutionResult {
    executionId: string;
    workflowId: string;
    status: 'running' | 'completed' | 'failed';
    steps: WorkflowStepResult[];
    startTime: Date;
    endTime?: Date;
    result?: any;
    error?: string;
}
export declare class WorkflowService {
    createWorkflow(data: {
        name: string;
        description: string;
        config?: any;
    }): Promise<Workflow>;
    getWorkflows(): Promise<Workflow[]>;
    getWorkflow(id: string): Promise<Workflow | null>;
    executeWorkflow(workflowId: string, request: WorkflowExecutionRequest): Promise<WorkflowExecutionResult>;
    private executeWorkflowSteps;
    private executeWorkflowStep;
    private executeAIStep;
    private executeConditionStep;
    private executeParallelStep;
    private executeSequentialStep;
    private evaluateCondition;
    getExecution(executionId: string): Promise<Execution | null>;
    getExecutions(limit?: number): Promise<Execution[]>;
    getWorkflowStats(workflowId: string): Promise<any>;
}
export declare const workflowService: WorkflowService;
//# sourceMappingURL=workflowService.d.ts.map