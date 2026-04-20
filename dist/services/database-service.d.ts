import { AIEngine, Workflow, WorkflowStep, WorkflowExecution } from '../types';
export declare class DatabaseService {
    private prisma;
    constructor();
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    testConnection(): Promise<boolean>;
    registerEngine(engine: Omit<AIEngine, 'id'>): Promise<AIEngine>;
    getEngine(id: string): Promise<AIEngine | null>;
    getAllEngines(): Promise<AIEngine[]>;
    getAvailableEngines(): Promise<AIEngine[]>;
    updateEngineLoad(id: string, load: number): Promise<AIEngine | null>;
    updateEngineStatus(id: string, status: string): Promise<AIEngine | null>;
    createWorkflow(workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>): Promise<Workflow>;
    getWorkflow(id: string): Promise<Workflow | null>;
    getUserWorkflows(userId?: string): Promise<Workflow[]>;
    updateWorkflowStatus(id: string, status: string): Promise<Workflow | null>;
    deleteWorkflow(id: string): Promise<boolean>;
    createWorkflowStep(step: Omit<WorkflowStep, 'id' | 'createdAt' | 'updatedAt'>): Promise<WorkflowStep>;
    updateWorkflowStep(id: string, updates: Partial<WorkflowStep>): Promise<WorkflowStep | null>;
    createExecution(execution: Omit<WorkflowExecution, 'id' | 'createdAt'>): Promise<WorkflowExecution>;
    updateExecution(id: string, updates: Partial<WorkflowExecution>): Promise<WorkflowExecution | null>;
    getExecutionHistory(options?: {
        page?: number;
        limit?: number;
        workflowId?: string;
        status?: string;
        startDate?: Date;
        endDate?: Date;
    }): Promise<WorkflowExecution[]>;
    getExecutionStats(): Promise<{
        total: number;
        status: Record<string, number>;
        avgExecutionTime: number;
        successRate: number;
    }>;
    recordStepExecutionHistory(data: {
        executionId: string;
        stepId: string;
        status: string;
        inputData?: any;
        outputData?: any;
        errorMessage?: string;
        startTime?: Date;
        endTime?: Date;
    }): Promise<void>;
    getTemplates(options?: {
        category?: string;
        isPublic?: boolean;
        limit?: number;
    }): Promise<any[]>;
    createWorkflowFromTemplate(templateId: string, userId?: string, customConfig?: any): Promise<{
        workflow: Workflow;
        template: any;
    }>;
    private mapDbAIEngineToAIEngine;
    private mapDbWorkflowToWorkflow;
    private mapDbWorkflowStepToWorkflowStep;
    private mapDbWorkflowExecutionToWorkflowExecution;
    cleanupOldData(daysToKeep?: number): Promise<number>;
}
export declare const databaseService: DatabaseService;
//# sourceMappingURL=database-service.d.ts.map