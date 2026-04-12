import { Workflow, WorkflowStep } from '../types';
export declare class WorkflowTemplateLibrary {
    private templates;
    private userTemplates;
    initializeBuiltinTemplates(): void;
    getAllTemplates(): WorkflowTemplate[];
    getTemplatesByCategory(category: string): WorkflowTemplate[];
    searchTemplates(query: string): WorkflowTemplate[];
    getRecommendedTemplates(userId: string, limit?: number): WorkflowTemplate[];
    createWorkflowFromTemplate(templateId: string, customName?: string, customSteps?: WorkflowStep[]): Workflow | null;
    saveUserTemplate(userId: string, name: string, description: string, workflow: Workflow, tags?: string[]): WorkflowTemplate;
    getUserTemplates(userId: string): WorkflowTemplate[];
    deleteUserTemplate(userId: string, templateId: string): boolean;
    updateTemplateUsage(templateId: string): void;
    getPopularTemplates(limit?: number): WorkflowTemplate[];
    getTemplateStats(): {
        builtinTemplates: number;
        userTemplates: number;
        totalTemplates: number;
        totalUsage: number;
        averageUsage: number;
    };
    private getUserUsageHistory;
    private createContentCreationWorkflow;
    private createCodeReviewWorkflow;
    private createImageProcessingWorkflow;
    private createDataAnalysisWorkflow;
    private createCustomerSupportWorkflow;
}
export interface WorkflowTemplate {
    id: string;
    name: string;
    description: string;
    category: string;
    tags: string[];
    isBuiltin: boolean;
    popularity: number;
    usageCount: number;
    workflow: Workflow;
    createdAt?: Date;
    createdBy?: string;
    recommendationScore?: number;
}
export declare const workflowTemplateLibrary: WorkflowTemplateLibrary;
//# sourceMappingURL=workflow-template-library.d.ts.map