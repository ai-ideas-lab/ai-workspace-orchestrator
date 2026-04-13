import type { WorkflowDefinition, WorkflowStep } from './workflow-executor.js';
export interface ValidationError {
    level: 'error' | 'warning';
    path: string;
    message: string;
}
export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
    errorsOnly: ValidationError[];
    warnings: ValidationError[];
}
export interface ValidatorOptions {
    allowedTaskTypes?: string[];
    maxSteps?: number;
    maxPayloadBytes?: number;
    stepIdPattern?: RegExp;
    customRules?: Array<(def: WorkflowDefinition) => ValidationError[]>;
}
export declare class WorkflowValidator {
    private readonly allowedTaskTypes;
    private readonly maxSteps;
    private readonly maxPayloadBytes;
    private readonly stepIdPattern;
    private readonly customRules;
    private readonly dependencyAnalyzer;
    constructor(options?: ValidatorOptions);
    validate(definition: WorkflowDefinition): ValidationResult;
    validateStep(step: WorkflowStep, index: number, seenIds?: Set<string>): ValidationError[];
}
//# sourceMappingURL=workflow-validator.d.ts.map