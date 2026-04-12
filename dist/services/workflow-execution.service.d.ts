import { Execution } from '../types';
export declare class WorkflowExecutionService {
    private executions;
    executeWorkflow(workflowId: string, input: Record<string, any>): Promise<Execution>;
    private executeStepsAsync;
    private executeStep;
    private executeAIStep;
    private executeDataProcessingStep;
    private executeAPICallStep;
    private executeConditionStep;
    private evaluateCondition;
    private updateExecutionStatus;
    private updateStepStatus;
    getExecution(executionId: string): Execution | undefined;
    getAllExecutions(): Execution[];
}
export declare const workflowExecutionService: WorkflowExecutionService;
//# sourceMappingURL=workflow-execution.service.d.ts.map