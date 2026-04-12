import { Router } from 'express';
import { alertService } from '../services/alerts.js';
const router = Router();
router.get('/', (req, res) => {
    try {
        const { status } = req.query;
        const alerts = alertService.getAlerts(status);
        res.json({
            success: true,
            data: alerts,
            count: alerts.length,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get alerts',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/summary', (req, res) => {
    try {
        const summary = alertService.getAlertSummary();
        res.json({
            success: true,
            data: summary,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get alert summary',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.post('/:id/resolve', (req, res) => {
    try {
        const { id } = req.params;
        const success = alertService.resolveAlert(id);
        if (success) {
            res.json({
                success: true,
                message: `Alert ${id} resolved successfully`,
                timestamp: new Date().toISOString()
            });
        }
        else {
            res.status(404).json({
                success: false,
                error: 'Alert not found',
                message: `Alert with ID ${id} not found or already resolved`
            });
        }
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to resolve alert',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.post('/resolve-all', (req, res) => {
    try {
        const resolvedCount = alertService.resolveAllAlerts();
        res.json({
            success: true,
            message: `${resolvedCount} alerts resolved successfully`,
            resolvedCount,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to resolve all alerts',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/rules', (req, res) => {
    try {
        const rules = alertService.getRules();
        res.json({
            success: true,
            data: rules,
            count: rules.length,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get alert rules',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.post('/rules', (req, res) => {
    try {
        const { name, description, metric, threshold, condition, severity, enabled = true } = req.body;
        if (!name || !metric || !threshold || !condition || !severity) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields',
                message: 'name, metric, threshold, condition, and severity are required'
            });
        }
        const validMetrics = ['cpu', 'memory', 'responseTime', 'activeWorkflows', 'activeConnections'];
        if (!validMetrics.includes(metric)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid metric',
                message: `Metric must be one of: ${validMetrics.join(', ')}`
            });
        }
        const validConditions = ['greater_than', 'less_than'];
        if (!validConditions.includes(condition)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid condition',
                message: `Condition must be one of: ${validConditions.join(', ')}`
            });
        }
        const validSeverities = ['info', 'warning', 'error', 'critical'];
        if (!validSeverities.includes(severity)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid severity',
                message: `Severity must be one of: ${validSeverities.join(', ')}`
            });
        }
        const newRule = alertService.addRule({
            name,
            description,
            metric: metric,
            threshold,
            condition: condition,
            severity: severity,
            enabled
        });
        res.status(201).json({
            success: true,
            data: newRule,
            message: 'Alert rule created successfully',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to create alert rule',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.put('/rules/:id', (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const success = alertService.updateRule(id, updates);
        if (success) {
            res.json({
                success: true,
                message: `Alert rule ${id} updated successfully`,
                timestamp: new Date().toISOString()
            });
        }
        else {
            res.status(404).json({
                success: false,
                error: 'Alert rule not found',
                message: `Alert rule with ID ${id} not found`
            });
        }
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to update alert rule',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.delete('/rules/:id', (req, res) => {
    try {
        const { id } = req.params;
        const success = alertService.deleteRule(id);
        if (success) {
            res.json({
                success: true,
                message: `Alert rule ${id} deleted successfully`,
                timestamp: new Date().toISOString()
            });
        }
        else {
            res.status(404).json({
                success: false,
                error: 'Alert rule not found',
                message: `Alert rule with ID ${id} not found`
            });
        }
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to delete alert rule',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.delete('/history', (req, res) => {
    try {
        const { keepRecent } = req.query;
        alertService.clearAlertHistory(keepRecent ? parseInt(keepRecent) : undefined);
        res.json({
            success: true,
            message: 'Alert history cleared successfully',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to clear alert history',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/health', (req, res) => {
    try {
        const health = alertService.getSystemHealth();
        res.json({
            success: true,
            data: {
                health,
                timestamp: new Date().toISOString(),
                status: health === 'excellent' ? 'system is running excellently' :
                    health === 'good' ? 'system is running normally' :
                        health === 'warning' ? 'system has some issues, monitoring recommended' :
                            'system has critical issues, immediate attention required'
            }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get system health',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.post('/monitor', (req, res) => {
    try {
        const mockMetrics = {
            cpu: Math.random() * 100,
            memory: Math.random() * 100,
            responseTime: Math.random() * 1500 + 100,
            activeWorkflows: Math.floor(Math.random() * 25) + 1,
            activeConnections: Math.floor(Math.random() * 250) + 50
        };
        alertService.monitorSystemMetrics(mockMetrics);
        res.json({
            success: true,
            message: 'System monitoring completed',
            data: {
                monitoredMetrics: mockMetrics,
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to perform system monitoring',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
export default router;
//# sourceMappingURL=alerts.js.map