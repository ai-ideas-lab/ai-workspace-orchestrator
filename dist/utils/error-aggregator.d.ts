export interface ErrorIncident {
    id: string;
    timestamp: Date;
    severity: 'low' | 'medium' | 'high' | 'critical';
    service: string;
    errorType: string;
    message: string;
    details: Record<string, unknown>;
    affectedUsers: string[];
    circuitState: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
    metrics: {
        responseTime: number;
        errorRate: number;
        throughput: number;
    };
}
export interface ErrorAlert {
    id: string;
    type: 'error_spike' | 'circuit_breaker' | 'performance_degradation' | 'service_down';
    severity: 'warning' | 'error' | 'critical';
    service: string;
    message: string;
    timestamp: Date;
    metrics: Record<string, number>;
    resolved: boolean;
    resolvedAt?: Date;
}
export interface ErrorDashboard {
    summary: {
        totalErrors: number;
        operationalErrors: number;
        systemErrors: number;
        alertCount: number;
        healthScore: number;
    };
    services: {
        [serviceName: string]: {
            status: 'healthy' | 'degraded' | 'unhealthy';
            errorRate: number;
            avgResponseTime: number;
            circuitState: string;
            recentErrors: Array<{
                timestamp: Date;
                message: string;
                severity: string;
            }>;
        };
    };
    alerts: ErrorAlert[];
    trends: {
        last24h: number;
        last7d: number;
        last30d: number;
        change24h: number;
        change7d: number;
    };
}
export declare class ErrorAggregator {
    private incidents;
    private alerts;
    private serviceMetrics;
    private alertThresholds;
    constructor();
    recordError(error: unknown, context: {
        path: string;
        method: string;
        userAgent: string;
        ip: string;
        userId?: string;
        sessionId?: string;
        requestId?: string;
        service?: string;
        circuitState?: string;
    }, severity?: 'low' | 'medium' | 'high' | 'critical'): string;
    getDashboard(): ErrorDashboard;
    getServiceHealth(serviceName: string): {
        status: 'healthy' | 'degraded' | 'unhealthy';
        errorRate: number;
        avgResponseTime: number;
        circuitState: string;
        recentErrors: Array<{
            timestamp: Date;
            message: string;
            severity: string;
        }>;
    };
    resolveAlert(alertId: string): void;
    cleanupOldData(olderThanMs?: number): void;
    private generateErrorId;
    private identifyService;
    private getErrorType;
    private getErrorMessage;
    private getErrorDetails;
    private getCurrentMetrics;
    private updateServiceMetrics;
    private checkForAlerts;
    private groupIncidentsByService;
    private calculateServiceStatus;
    private calculateHealthScore;
    private calculateTrends;
    private startPeriodicCheck;
    private performHealthCheck;
}
export declare const errorAggregator: ErrorAggregator;
//# sourceMappingURL=error-aggregator.d.ts.map