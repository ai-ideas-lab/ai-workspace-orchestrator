import { WorkflowExecution } from '@prisma/client';
declare class WorkflowExecutionEngine {
    private db;
    private aiEngine;
    constructor();
    executeWorkflow(workflowId: string, inputData?: Record<string, any>, userId?: string): Promise<WorkflowExecution>;
    private executeStep;
    private executeAITask;
    private executeHumanTask;
    private executeDataProcessing;
    private executeNotification;
    private executeValidation;
    private checkDependencies;
    private buildContextFromResults;
    private interpolatePrompt;
    private processData;
    private validateData;
    private validateInput;
    private generateExecutionResults;
}
export default WorkflowExecutionEngine;
//# sourceMappingURL=workflow-engine.d.ts.map