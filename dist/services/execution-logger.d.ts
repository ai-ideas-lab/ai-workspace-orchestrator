import { Workflow, WorkflowStep } from '../types';
export declare class ExecutionLogger {
    private executionLogs;
    private stepLogs;
    logWorkflowStart(workflow: Workflow): void;
    logStepStart(workflowId: string, step: WorkflowStep): void;
    logStepComplete(workflowId: string, stepId: string, result: any, duration: number): void;
    logStepFailure(workflowId: string, stepId: string, error: string, duration: number): void;
    logWorkflowComplete(workflowId: string, finalStatus: 'completed' | 'failed'): void;
    getWorkflowLog(workflowId: string): ExecutionLog | null;
    getStepLogs(workflowId: string): StepExecutionLog[];
    getRecentExecutionHistory(limit?: number): ExecutionLogSummary[];
    getPerformanceStats(): PerformanceStats;
    filterLogsByStatus(status: 'completed' | 'failed' | 'running'): ExecutionLogSummary[];
    cleanupOldLogs(maxAge?: number): void;
    private updateWorkflowProgress;
    private estimateExecutionDuration;
}
export interface ExecutionLog {
    workflowId: string;
    workflowName: string;
    startTime: Date;
    endTime?: Date;
    status: 'running' | 'completed' | 'failed';
    totalSteps: number;
    completedSteps: number;
    failedSteps: number;
    estimatedDuration: number;
    totalDuration?: number;
    stepLogs?: StepExecutionLog[];
    createdAt: Date;
    updatedAt: Date;
}
export interface StepExecutionLog {
    stepId: string;
    engineId: string;
    stepName: string;
    startTime: Date;
    endTime?: Date;
    status: 'running' | 'completed' | 'failed';
    input: any;
    parameters: Record<string, any>;
    result?: any;
    error?: string;
    duration?: number;
}
export interface ExecutionLogSummary {
    workflowId: string;
    workflowName: string;
    startTime: Date;
    endTime?: Date;
    status: 'running' | 'completed' | 'failed';
    totalSteps: number;
    completedSteps: number;
    failedSteps: number;
    totalDuration?: number;
    successRate: number;
}
export interface PerformanceStats {
    totalExecutions: number;
    averageDuration: number;
    successRate: number;
    totalSteps: number;
    averageStepsPerWorkflow: number;
}
export declare const executionLogger: ExecutionLogger;
//# sourceMappingURL=execution-logger.d.ts.map