import { Workflow, ExecutionHistory } from '../types/ai-providers.js';
import { EventEmitter } from 'events';
export declare class AIWorkflowOrchestrator extends EventEmitter {
    private activeExecutions;
    private workflowQueue;
    private isProcessing;
    startWorkflow(workflow: Workflow): Promise<ExecutionHistory>;
    cancelWorkflow(executionId: string): boolean;
    getExecutionHistory(executionId: string): ExecutionHistory | null;
    getWorkflowExecutions(workflowId: string): ExecutionHistory[];
    getActiveExecutions(): ExecutionHistory[];
    getExecutionStats(): {
        total: number;
        running: number;
        completed: number;
        failed: number;
        cancelled: number;
    };
    private executeWorkflowSteps;
    private executeStep;
    private executeAITask;
    private executeCondition;
    private executeParallel;
    private executeSequential;
    private checkStepPreconditions;
    private sortStepsByDependencies;
    private evaluateCondition;
    private evaluateComplexCondition;
    private replaceTemplateVariables;
    private getNestedValue;
    private determineExecutionStatus;
    private calculateDuration;
}
export declare const aiWorkflowOrchestrator: AIWorkflowOrchestrator;
//# sourceMappingURL=ai-workflow-orchestrator.d.ts.map