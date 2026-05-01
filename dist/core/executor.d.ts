import { WORKFLOW_STATUS } from '../constants';
export interface WorkflowStep {
    id: string;
    order: number;
    engineType: string;
    config: Record<string, any>;
    name?: string;
    description?: string;
}
export interface Workflow {
    id: string;
    name: string;
    description?: string;
    steps: WorkflowStep[];
    createdAt: Date;
    updatedAt: Date;
}
export interface ExecutionResult {
    stepId: string;
    output: any;
    status: typeof WORKFLOW_STATUS.COMPLETED | typeof WORKFLOW_STATUS.FAILED | typeof WORKFLOW_STATUS.PENDING;
    error?: string;
    duration?: number;
    metadata?: Record<string, any>;
}
export interface WorkflowExecutionResult {
    workflowId: string;
    results: ExecutionResult[];
    completedAt: Date;
    totalDuration?: number;
    success: boolean;
}
export declare function executeWorkflow(workflowId: string, userInput: string): Promise<WorkflowExecutionResult>;
//# sourceMappingURL=executor.d.ts.map