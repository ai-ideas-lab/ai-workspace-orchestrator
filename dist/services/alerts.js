"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.alertService = void 0;
class AlertService {
    constructor() {
        this.alerts = [];
        this.rules = [];
        this.alertHistory = [];
        this.initializeDefaultRules();
    }
    initializeDefaultRules() {
        this.rules = [
            {
                id: 'cpu-high',
                name: 'CPU使用率过高',
                description: '当CPU使用率超过80%时触发',
                metric: 'cpu',
                threshold: 80,
                condition: 'greater_than',
                severity: 'warning',
                enabled: true,
                createdAt: new Date().toISOString()
            },
            {
                id: 'cpu-critical',
                name: 'CPU使用率严重过高',
                description: '当CPU使用率超过95%时触发',
                metric: 'cpu',
                threshold: 95,
                condition: 'greater_than',
                severity: 'critical',
                enabled: true,
                createdAt: new Date().toISOString()
            },
            {
                id: 'memory-high',
                name: '内存使用率过高',
                description: '当内存使用率超过85%时触发',
                metric: 'memory',
                threshold: 85,
                condition: 'greater_than',
                severity: 'warning',
                enabled: true,
                createdAt: new Date().toISOString()
            },
            {
                id: 'memory-critical',
                name: '内存使用率严重过高',
                description: '当内存使用率超过95%时触发',
                metric: 'memory',
                threshold: 95,
                condition: 'greater_than',
                severity: 'critical',
                enabled: true,
                createdAt: new Date().toISOString()
            },
            {
                id: 'response-time-slow',
                name: '响应时间过慢',
                description: '当平均响应时间超过1000ms时触发',
                metric: 'responseTime',
                threshold: 1000,
                condition: 'greater_than',
                severity: 'error',
                enabled: true,
                createdAt: new Date().toISOString()
            },
            {
                id: 'too-many-workflows',
                name: '活跃工作流过多',
                description: '当活跃工作流超过20个时触发',
                metric: 'activeWorkflows',
                threshold: 20,
                condition: 'greater_than',
                severity: 'warning',
                enabled: true,
                createdAt: new Date().toISOString()
            },
            {
                id: 'too-many-connections',
                name: '活跃连接过多',
                description: '当活跃连接超过200个时触发',
                metric: 'activeConnections',
                threshold: 200,
                condition: 'greater_than',
                severity: 'error',
                enabled: true,
                createdAt: new Date().toISOString()
            }
        ];
    }
    monitorSystemMetrics(metrics) {
        const activeRules = this.rules.filter(rule => rule.enabled);
        for (const rule of activeRules) {
            if (!metrics[rule.metric])
                continue;
            const currentValue = metrics[rule.metric];
            const shouldTrigger = this.checkCondition(currentValue, rule.threshold, rule.condition);
            if (shouldTrigger) {
                this.triggerAlert(rule, currentValue);
            }
        }
    }
    checkCondition(currentValue, threshold, condition) {
        switch (condition) {
            case 'greater_than':
                return currentValue > threshold;
            case 'less_than':
                return currentValue < threshold;
            default:
                return false;
        }
    }
    triggerAlert(rule, currentValue) {
        const existingActiveAlert = this.alerts.find(alert => alert.ruleId === rule.id && alert.status === 'active');
        if (existingActiveAlert) {
            return;
        }
        const alert = {
            id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ruleId: rule.id,
            ruleName: rule.name,
            severity: rule.severity,
            message: `${rule.name}: 当前值 ${currentValue.toFixed(2)}${this.getMetricUnit(rule.metric)}, 阈值: ${rule.threshold}`,
            metric: rule.metric,
            currentValue,
            threshold: rule.threshold,
            triggeredAt: new Date().toISOString(),
            status: 'active'
        };
        this.alerts.push(alert);
        this.alertHistory.push(alert);
        rule.lastTriggered = new Date().toISOString();
        console.log(`🚨 Alert triggered: ${alert.severity.toUpperCase()} - ${alert.message}`);
    }
    getMetricUnit(metric) {
        switch (metric) {
            case 'cpu':
            case 'memory':
                return '%';
            case 'responseTime':
                return 'ms';
            default:
                return '';
        }
    }
    getAlerts(status) {
        if (!status) {
            return [...this.alerts];
        }
        return this.alerts.filter(alert => alert.status === status);
    }
    getAlertSummary() {
        const activeAlerts = this.getAlerts('active');
        const resolvedAlerts = this.getAlerts('resolved');
        return {
            totalAlerts: this.alerts.length,
            activeAlerts: activeAlerts.length,
            resolvedAlerts: resolvedAlerts.length,
            alertsBySeverity: {
                info: activeAlerts.filter(a => a.severity === 'info').length,
                warning: activeAlerts.filter(a => a.severity === 'warning').length,
                error: activeAlerts.filter(a => a.severity === 'error').length,
                critical: activeAlerts.filter(a => a.severity === 'critical').length
            },
            recentAlerts: this.alertHistory.slice(-10).reverse()
        };
    }
    resolveAlert(alertId) {
        const alert = this.alerts.find(a => a.id === alertId && a.status === 'active');
        if (alert) {
            alert.status = 'resolved';
            alert.resolvedAt = new Date().toISOString();
            console.log(`✅ Alert resolved: ${alertId}`);
            return true;
        }
        return false;
    }
    resolveAllAlerts() {
        let resolvedCount = 0;
        const activeAlerts = this.getAlerts('active');
        for (const alert of activeAlerts) {
            if (this.resolveAlert(alert.id)) {
                resolvedCount++;
            }
        }
        return resolvedCount;
    }
    getRules() {
        return [...this.rules];
    }
    addRule(rule) {
        const newRule = {
            ...rule,
            id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString()
        };
        this.rules.push(newRule);
        return newRule;
    }
    updateRule(ruleId, updates) {
        const ruleIndex = this.rules.findIndex(rule => rule.id === ruleId);
        if (ruleIndex !== -1) {
            this.rules[ruleIndex] = { ...this.rules[ruleIndex], ...updates };
            return true;
        }
        return false;
    }
    deleteRule(ruleId) {
        const ruleIndex = this.rules.findIndex(rule => rule.id === ruleId);
        if (ruleIndex !== -1) {
            this.rules.splice(ruleIndex, 1);
            return true;
        }
        return false;
    }
    clearAlertHistory(keepRecent) {
        if (keepRecent && keepRecent > 0) {
            this.alertHistory = this.alertHistory.slice(-keepRecent);
        }
        else {
            this.alertHistory = [];
        }
        console.log('📋 Alert history cleared');
    }
    getSystemHealth() {
        const activeAlerts = this.getAlerts('active');
        const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical').length;
        const errorAlerts = activeAlerts.filter(a => a.severity === 'error').length;
        const warningAlerts = activeAlerts.filter(a => a.severity === 'warning').length;
        if (criticalAlerts > 0)
            return 'critical';
        if (errorAlerts > 0)
            return 'critical';
        if (warningAlerts > 2)
            return 'warning';
        if (warningAlerts > 0)
            return 'good';
        return 'excellent';
    }
}
exports.alertService = new AlertService();
//# sourceMappingURL=alerts.js.map