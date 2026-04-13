import { EventBus } from './event-bus.js';
import type { WorkflowDefinition, WorkflowStep } from './workflow-executor.js';
export interface VariableDef {
    description: string;
    required?: boolean;
    default?: string;
}
export interface WorkflowTemplate {
    id: string;
    name: string;
    description: string;
    version: number;
    steps: WorkflowStep[];
    variables: Record<string, VariableDef>;
    createdAt: Date;
    updatedAt: Date;
    usageCount: number;
    tags: string[];
}
export interface CreateTemplateInput {
    name: string;
    description: string;
    steps: WorkflowStep[];
    variables?: Record<string, VariableDef>;
    tags?: string[];
}
export interface InstantiateOptions {
    variables: Record<string, string>;
    workflowId?: string;
    workflowName?: string;
}
export declare class WorkflowTemplateService {
    private templates;
    private eventBus;
    constructor(eventBus?: EventBus);
    createTemplate(input: CreateTemplateInput): WorkflowTemplate;
    instantiate(templateId: string, options: InstantiateOptions): WorkflowDefinition;
    getTemplate(id: string): WorkflowTemplate | undefined;
    listTemplates(filter?: {
        tag?: string;
    }): WorkflowTemplate[];
    deleteTemplate(id: string): boolean;
    private scanVariables;
    private renderPayload;
    private renderValue;
}
//# sourceMappingURL=workflow-template.d.ts.map