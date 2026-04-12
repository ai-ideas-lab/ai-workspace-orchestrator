import { Router } from 'express';
import { analyticsService } from '../services/analytics.js';
const router = Router();
router.get('/metrics', (req, res) => {
    try {
        const metrics = analyticsService.collectSystemMetrics();
        res.json({
            success: true,
            data: metrics,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to collect system metrics',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/metrics/history', (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const history = analyticsService.getMetricsHistory(limit);
        res.json({
            success: true,
            data: history,
            count: history.length,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get metrics history',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/workflows', (req, res) => {
    try {
        const stats = analyticsService.getWorkflowStats();
        res.json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get workflow statistics',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/summary', (req, res) => {
    try {
        const summary = analyticsService.getSummary();
        res.json({
            success: true,
            data: summary,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get system summary',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.post('/simulate-execution', (req, res) => {
    try {
        const { workflowId, status, executionTime } = req.body;
        if (!workflowId || !status) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields',
                message: 'workflowId and status are required'
            });
        }
        const validStatuses = ['running', 'completed', 'failed', 'pending'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid status',
                message: `Status must be one of: ${validStatuses.join(', ')}`
            });
        }
        analyticsService.updateWorkflowStats(workflowId, status, executionTime);
        res.json({
            success: true,
            message: 'Workflow execution simulated successfully',
            data: {
                workflowId,
                status,
                executionTime,
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to simulate execution',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
export default router;
//# sourceMappingURL=analytics.js.map