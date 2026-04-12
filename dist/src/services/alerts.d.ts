export interface AlertRule {
    id: string;
    name: string;
    description: string;
    metric: 'cpu' | 'memory' | 'responseTime' | 'activeWorkflows' | 'activeConnections';
    threshold: number;
    condition: 'greater_than' | 'less_than';
    severity: 'info' | 'warning' | 'error' | 'critical';
    enabled: boolean;
    createdAt: string;
    lastTriggered?: string;
}
export interface Alert {
    id: string;
    ruleId: string;
    ruleName: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    message: string;
    metric: string;
    currentValue: number;
    threshold: number;
    triggeredAt: string;
    resolvedAt?: string;
    status: 'active' | 'resolved';
}
export interface AlertSummary {
    totalAlerts: number;
    activeAlerts: number;
    resolvedAlerts: number;
    alertsBySeverity: {
        info: number;
        warning: number;
        error: number;
        critical: number;
    };
    recentAlerts: Alert[];
}
declare class AlertService {
    private alerts;
    private rules;
    private alertHistory;
    constructor();
    private initializeDefaultRules;
    monitorSystemMetrics(metrics: any): void;
    private checkCondition;
    private triggerAlert;
    private getMetricUnit;
    getAlerts(status?: 'active' | 'resolved'): Alert[];
    getAlertSummary(): AlertSummary;
    resolveAlert(alertId: string): boolean;
    resolveAllAlerts(): number;
    getRules(): AlertRule[];
    addRule(rule: Omit<AlertRule, 'id' | 'createdAt'>): AlertRule;
    updateRule(ruleId: string, updates: Partial<AlertRule>): boolean;
    deleteRule(ruleId: string): boolean;
    clearAlertHistory(keepRecent?: number): void;
    getSystemHealth(): 'excellent' | 'good' | 'warning' | 'critical';
}
export declare const alertService: AlertService;
export {};
//# sourceMappingURL=alerts.d.ts.map