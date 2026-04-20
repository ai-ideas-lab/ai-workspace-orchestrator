import { Workflow, WorkflowStep } from '../types';
export declare class OptimizedExecutionLogger {
    private maxLogAge;
    private cleanupIntervalMs;
    private cacheEnabled;
    private executionLogs;
    private stepLogs;
    private recentHistoryCacheKey;
    private performanceStatsCacheKey;
    private cleanupInterval;
    constructor(maxLogAge?: number, cleanupIntervalMs?: number, cacheEnabled?: boolean);
    logWorkflowStart(workflow: Workflow): Promise<void>;
    logStepStart(workflowId: string, step: WorkflowStep): Promise<void>;
    logStepComplete(workflowId: string, stepId: string, result: any, duration: number): Promise<void>;
    logStepFailure(workflowId: string, stepId: string, error: string, duration: number): Promise<void>;
    logWorkflowComplete(workflowId: string, finalStatus: 'completed' | 'failed'): Promise<void>;
    getWorkflowLog(workflowId: string): Promise<ExecutionLog | null>;
    getStepLogs(workflowId: string): Promise<StepExecutionLog[]>;
    getRecentExecutionHistory(limit?: number): Promise<ExecutionLogSummary[]>;
    getPerformanceStats(): Promise<PerformanceStats>;
    filterLogsByStatus(status: 'completed' | 'failed' | 'running'): Promise<ExecutionLogSummary[]>;
    getWorkflowLogsBatch(workflowIds: string[]): Promise<(ExecutionLog | null)[]>;
    updateWorkflowStatusBatch(updates: Array<{
        workflowId: string;
        status: 'completed' | 'failed';
    }>): Promise<void>;
    getMonitoringData(): {
        memoryUsage: number;
        totalLogs: number;
        cacheStats: any;
        uptime: number;
    };
    cleanupOldLogs(maxAge?: number): Promise<void>;
    private startCleanupTask;
    stopCleanupTask(): void;
    private updateWorkflowProgress;
    private estimateExecutionDuration;
    private calculateCacheHitRate;
    private getTotalCacheHits;
    private getTotalCacheMisses;
}
export declare const optimizedExecutionLogger: OptimizedExecutionLogger;
export { ExecutionLog, StepExecutionLog, ExecutionLogSummary, PerformanceStats } from './execution-logger';
//# sourceMappingURL=optimized-execution-logger.d.ts.map