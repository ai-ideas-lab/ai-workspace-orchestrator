export declare class DatabaseManager {
    private isInitialized;
    initialize(): Promise<void>;
    private initializeAIEngines;
    loadEnginesFromDatabase(): Promise<any[]>;
    updateEngineStatus(engineId: string, status: string, load?: number): Promise<void>;
    recordWorkflowExecution(data: {
        workflow_id: string;
        user_id?: string;
        trigger_data?: any;
    }): Promise<string>;
    updateWorkflowExecution(executionId: string, status: string, result?: any, error_message?: string): Promise<void>;
    recordStepExecution(data: {
        execution_id: string;
        step_id: string;
        status: string;
        input_data?: any;
        output_data?: any;
        error_message?: string;
    }): Promise<string>;
    updateStepExecution(historyId: string, status: string, output_data?: any, error_message?: string): Promise<void>;
    getWorkflowStats(): Promise<any>;
    getExecutionHistory(params: {
        workflow_id?: string;
        status?: string;
        limit?: number;
        offset?: number;
    }): Promise<any[]>;
    createWorkflow(data: {
        user_id?: string;
        name: string;
        description?: string;
        config?: any;
    }): Promise<string>;
    updateWorkflowStatus(workflowId: string, status: string): Promise<void>;
    createWorkflowStep(data: {
        workflow_id: string;
        engine_id?: string;
        name: string;
        input?: any;
        parameters?: any;
        sequence_order: number;
    }): Promise<string>;
    updateWorkflowStep(stepId: string, data: {
        status?: string;
        output?: any;
        error_message?: string;
    }): Promise<void>;
    healthCheck(): Promise<{
        status: string;
        details: any;
    }>;
    isDatabaseInitialized(): boolean;
    shutdown(): Promise<void>;
}
export declare const databaseManager: DatabaseManager;
//# sourceMappingURL=database-manager.d.ts.map