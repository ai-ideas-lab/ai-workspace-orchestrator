export declare const EXECUTION_CONSTANTS: {
    readonly STATUS: {
        readonly COMPLETED: "completed";
        readonly FAILED: "failed";
        readonly PENDING: "pending";
        readonly SYSTEM_ERROR: "system-error";
    };
    readonly RETRY_CONFIG: {
        readonly DEFAULT_MAX_RETRIES: 2;
        readonly WORKFLOW_FETCH_MAX_RETRIES: 3;
        readonly BASE_DELAY_MS: 1000;
        readonly MAX_DELAY_MS: 5000;
    };
    readonly ERROR_TYPES: {
        readonly WORKFLOW_EXECUTION_ERROR: "workflow-execution-error";
        readonly DATABASE_CONNECTION_ERROR: "database";
        readonly AI_ENGINE_ERROR: "ai";
    };
    readonly METADATA_KEYS: {
        readonly ENGINE_TYPE: "engineType";
        readonly ORDER: "order";
        readonly SUCCESS: "success";
        readonly RETRIES: "retries";
        readonly FINAL_ERROR: "finalError";
        readonly UNEXPECTED_ERROR: "unexpectedError";
        readonly STEP_ID: "stepId";
        readonly USER_ID: "userId";
        readonly SESSION_ID: "sessionId";
        readonly CORRELATION_ID: "correlationId";
    };
};
export interface WorkflowStep {
    id: string;
    order: number;
    engineType: string;
    config: Record<string, any>;
    name?: string;
    description?: string;
}
export interface Workflow {
    id: string;
    name: string;
    description?: string;
    steps: WorkflowStep[];
    createdAt: Date;
    updatedAt: Date;
}
export interface ExecutionResult {
    stepId: string;
    output: any;
    status: typeof EXECUTION_CONSTANTS.STATUS.COMPLETED | typeof EXECUTION_CONSTANTS.STATUS.FAILED | typeof EXECUTION_CONSTANTS.STATUS.PENDING;
    error?: string;
    duration?: number;
    metadata?: Record<string, any>;
}
export interface WorkflowExecutionResult {
    workflowId: string;
    results: ExecutionResult[];
    completedAt: Date;
    totalDuration?: number;
    success: boolean;
}
export declare function executeWorkflow(workflowId: string, userInput: string): Promise<WorkflowExecutionResult>;
//# sourceMappingURL=executor.d.ts.map