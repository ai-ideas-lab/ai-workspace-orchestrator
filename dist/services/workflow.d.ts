export interface WorkflowStep {
    id: string;
    type: 'OPENAI' | 'ANTHROPIC' | 'GOOGLE' | 'CUSTOM';
    name: string;
    description?: string;
    config: any;
    nextSteps?: string[];
}
export interface WorkflowConfig {
    id: string;
    name: string;
    description?: string;
    steps: WorkflowStep[];
    context?: Record<string, any>;
}
export interface ExecutionContext {
    workflowId: string;
    executionId: string;
    input: any;
    context: Record<string, any>;
    results: Map<string, any>;
}
export declare class WorkflowService {
    private prisma;
    private aiEngine;
    constructor();
    createWorkflow(data: {
        name: string;
        description?: string;
        config: WorkflowConfig;
        userId: string;
        teamId?: string;
    }): Promise<$Result.GetResult<import(".prisma/client").Prisma.$WorkflowPayload<ExtArgs>, T, "create", GlobalOmitOptions>>;
    executeWorkflow(workflowId: string, input?: any): Promise<{
        executionId: string;
        status: string;
        results: {
            [k: string]: any;
        };
    }>;
    private executeWorkflowSteps;
    getWorkflowHistory(workflowId: string, limit?: number): Promise<any>;
    getExecutionDetails(executionId: string): Promise<any>;
    getAvailableEngines(): Promise<any>;
    createWorkflowTemplate(data: {
        name: string;
        description?: string;
        category: string;
        config: WorkflowConfig;
        isPublic: boolean;
        tags: string[];
    }): Promise<any>;
    getWorkflowTemplates(category?: string, isPublic?: boolean): Promise<any>;
}
//# sourceMappingURL=workflow.d.ts.map