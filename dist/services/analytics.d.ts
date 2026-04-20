export interface SystemMetrics {
    timestamp: string;
    cpuUsage: number;
    memoryUsage: number;
    activeConnections: number;
    activeWorkflows: number;
    responseTime: number;
}
export interface WorkflowStats {
    totalWorkflows: number;
    completedWorkflows: number;
    failedWorkflows: number;
    runningWorkflows: number;
    averageExecutionTime: number;
    successRate: number;
}
export interface MetricsHistory {
    timestamp: string;
    cpuUsage: number;
    memoryUsage: number;
    activeConnections: number;
    activeWorkflows: number;
}
export interface SystemSummary {
    totalWorkflows: number;
    completedToday: number;
    averageResponseTime: number;
    systemHealth: 'excellent' | 'good' | 'warning' | 'critical';
    uptime: string;
    lastUpdated: string;
}
declare class AnalyticsService {
    private metricsHistory;
    private workflowStats;
    collectSystemMetrics(): SystemMetrics;
    getMetricsHistory(limit?: number): MetricsHistory[];
    getWorkflowStats(): WorkflowStats;
    getSummary(): SystemSummary;
    updateWorkflowStats(workflowId: string, status: string, executionTime: number): void;
    private recordMetricsHistory;
    resetStats(): void;
}
export declare const analyticsService: AnalyticsService;
export {};
//# sourceMappingURL=analytics.d.ts.map