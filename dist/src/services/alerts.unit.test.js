import { alertService } from '../services/alerts.js';
const mockMetrics = {
    cpu: 85,
    memory: 90,
    responseTime: 1200,
    activeWorkflows: 15,
    activeConnections: 180
};
describe('Alert Service', () => {
    let testAlertCount;
    beforeEach(() => {
        testAlertCount = alertService['alerts'].length;
    });
    afterEach(() => {
        while (alertService['alerts'].length > testAlertCount) {
            alertService['alerts'].pop();
        }
    });
    describe('Alert Monitoring', () => {
        test('should trigger CPU high alert when CPU usage > 80%', () => {
            const initialAlertCount = alertService.getAlerts().length;
            alertService.monitorSystemMetrics({
                ...mockMetrics,
                cpu: 85
            });
            const alerts = alertService.getAlerts();
            expect(alerts.length).toBeGreaterThan(initialAlertCount);
            const cpuAlerts = alerts.filter(a => a.metric === 'cpu');
            expect(cpuAlerts.length).toBeGreaterThan(0);
            expect(cpuAlerts[0].severity).toBe('warning');
        });
        test('should trigger critical alert when CPU usage > 95%', () => {
            const initialAlertCount = alertService.getAlerts().length;
            alertService.monitorSystemMetrics({
                ...mockMetrics,
                cpu: 96
            });
            const alerts = alertService.getAlerts();
            const criticalAlerts = alerts.filter(a => a.severity === 'critical');
            expect(criticalAlerts.length).toBeGreaterThan(0);
            const cpuCriticalAlerts = criticalAlerts.filter(a => a.metric === 'cpu');
            expect(cpuCriticalAlerts.length).toBeGreaterThan(0);
        });
        test('should trigger memory high alert when memory usage > 85%', () => {
            const initialAlertCount = alertService.getAlerts().length;
            alertService.monitorSystemMetrics({
                ...mockMetrics,
                memory: 86
            });
            const alerts = alertService.getAlerts();
            const memoryAlerts = alerts.filter(a => a.metric === 'memory');
            expect(memoryAlerts.length).toBeGreaterThan(0);
            expect(memoryAlerts[0].severity).toBe('warning');
        });
        test('should not trigger duplicate alerts for same rule', () => {
            const initialAlertCount = alertService.getAlerts().length;
            alertService.monitorSystemMetrics({
                ...mockMetrics,
                cpu: 85
            });
            const afterFirstAlert = alertService.getAlerts().length;
            expect(afterFirstAlert).toBeGreaterThan(initialAlertCount);
            alertService.monitorSystemMetrics({
                ...mockMetrics,
                cpu: 87
            });
            const afterSecondAlert = alertService.getAlerts().length;
            expect(afterSecondAlert).toBe(afterFirstAlert);
        });
    });
    describe('Alert Management', () => {
        test('should resolve an alert', () => {
            alertService.monitorSystemMetrics({
                ...mockMetrics,
                cpu: 85
            });
            const alerts = alertService.getAlerts();
            const activeAlert = alerts.find(a => a.status === 'active');
            expect(activeAlert).toBeDefined();
            const alertId = activeAlert.id;
            const success = alertService.resolveAlert(alertId);
            expect(success).toBe(true);
            const updatedAlert = alertService.getAlerts().find(a => a.id === alertId);
            expect(updatedAlert?.status).toBe('resolved');
        });
        test('should resolve all active alerts', () => {
            alertService.monitorSystemMetrics({
                ...mockMetrics,
                cpu: 85,
                memory: 90
            });
            const initialActiveCount = alertService.getAlerts('active').length;
            expect(initialActiveCount).toBeGreaterThan(0);
            const resolvedCount = alertService.resolveAllAlerts();
            expect(resolvedCount).toBe(initialActiveCount);
            const activeAlerts = alertService.getAlerts('active');
            expect(activeAlerts.length).toBe(0);
        });
        test('should get alert summary', () => {
            alertService.monitorSystemMetrics({
                ...mockMetrics,
                cpu: 85,
                memory: 96
            });
            const summary = alertService.getAlertSummary();
            expect(summary.totalAlerts).toBeGreaterThan(0);
            expect(summary.activeAlerts).toBeGreaterThan(0);
            expect(summary.alertsBySeverity).toBeDefined();
            expect(summary.recentAlerts).toBeDefined();
        });
    });
    describe('Alert Rules', () => {
        test('should get default alert rules', () => {
            const rules = alertService.getRules();
            expect(rules.length).toBeGreaterThan(0);
            const cpuRule = rules.find(r => r.id === 'cpu-high');
            expect(cpuRule).toBeDefined();
            expect(cpuRule.name).toBe('CPU使用率过高');
            expect(cpuRule.threshold).toBe(80);
        });
        test('should add new alert rule', () => {
            const newRule = {
                name: '测试CPU规则',
                description: '测试CPU规则',
                metric: 'cpu',
                threshold: 50,
                condition: 'greater_than',
                severity: 'warning',
                enabled: true
            };
            const createdRule = alertService.addRule(newRule);
            expect(createdRule.name).toBe(newRule.name);
            expect(createdRule.threshold).toBe(newRule.threshold);
            expect(createdRule.id).toBeDefined();
        });
        test('should update alert rule', () => {
            const rules = alertService.getRules();
            const ruleToUpdate = rules[0];
            const success = alertService.updateRule(ruleToUpdate.id, {
                threshold: 90,
                enabled: false
            });
            expect(success).toBe(true);
            const updatedRule = alertService.getRules().find(r => r.id === ruleToUpdate.id);
            expect(updatedRule?.threshold).toBe(90);
            expect(updatedRule?.enabled).toBe(false);
        });
        test('should delete alert rule', () => {
            const rules = alertService.getRules();
            const ruleToDelete = rules[0];
            const initialCount = rules.length;
            const success = alertService.deleteRule(ruleToDelete.id);
            expect(success).toBe(true);
            const updatedRules = alertService.getRules();
            expect(updatedRules.length).toBe(initialCount - 1);
        });
    });
    describe('System Health', () => {
        test('should return excellent health when no alerts', () => {
            alertService.resolveAllAlerts();
            const health = alertService.getSystemHealth();
            expect(health).toBe('excellent');
        });
        test('should return warning health when warning alerts exist', () => {
            alertService.monitorSystemMetrics({
                ...mockMetrics,
                cpu: 85
            });
            const health = alertService.getSystemHealth();
            expect(health).toBe('good');
        });
        test('should return critical health when critical alerts exist', () => {
            alertService.monitorSystemMetrics({
                ...mockMetrics,
                cpu: 96
            });
            const health = alertService.getSystemHealth();
            expect(health).toBe('critical');
        });
    });
    describe('Alert History', () => {
        test('should maintain alert history', () => {
            const initialHistoryLength = alertService['alertHistory'].length;
            alertService.monitorSystemMetrics({
                ...mockMetrics,
                cpu: 85
            });
            expect(alertService['alertHistory'].length).toBeGreaterThan(initialHistoryLength);
        });
        test('should clear alert history', () => {
            alertService.monitorSystemMetrics({
                ...mockMetrics,
                cpu: 85
            });
            const initialHistoryLength = alertService['alertHistory'].length;
            expect(initialHistoryLength).toBeGreaterThan(0);
            alertService.clearAlertHistory();
            expect(alertService['alertHistory'].length).toBe(0);
        });
    });
});
//# sourceMappingURL=alerts.unit.test.js.map