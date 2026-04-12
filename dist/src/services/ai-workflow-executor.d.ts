import { Workflow, ExecutionHistory } from '../types/ai-providers.js';
export declare class AIWorkflowExecutor {
    private executions;
    private workflows;
    registerWorkflow(workflow: Workflow): void;
    executeWorkflow(workflowId: string, inputData?: Record<string, any>): Promise<ExecutionHistory>;
    private executeWorkflowSteps;
    private executeStep;
    private executeAITaskStep;
    private executeConditionStep;
    private executeParallelStep;
    private executeSequentialStep;
    private resolveTemplate;
    private evaluateCondition;
    getExecutionHistory(executionId: string): ExecutionHistory | undefined;
    getWorkflowExecutions(workflowId: string): ExecutionHistory[];
    getAllExecutions(): ExecutionHistory[];
    cancelExecution(executionId: string): boolean;
    cleanupExecutions(maxAge?: number): number;
    createSampleWorkflows(): void;
}
export declare const aiWorkflowExecutor: AIWorkflowExecutor;
//# sourceMappingURL=ai-workflow-executor.d.ts.map