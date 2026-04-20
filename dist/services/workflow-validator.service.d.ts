import { Workflow, WorkflowStep } from '../types/ai-providers.js';
export declare class WorkflowValidator {
    static validateWorkflow(workflow: Workflow): {
        valid: boolean;
        errors: string[];
    };
    private static validateDependencies;
    static validateExecutionInput(workflow: Workflow, input: any): {
        valid: boolean;
        errors: string[];
    };
    static getExecutionOrder(steps: WorkflowStep[]): WorkflowStep[];
}
//# sourceMappingURL=workflow-validator.service.d.ts.map