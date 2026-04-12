"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const analytics_js_1 = require("../services/analytics.js");
const router = (0, express_1.Router)();
router.get('/metrics', (req, res) => {
    try {
        const metrics = analytics_js_1.analyticsService.collectSystemMetrics();
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
        const history = analytics_js_1.analyticsService.getMetricsHistory(limit);
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
        const stats = analytics_js_1.analyticsService.getWorkflowStats();
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
        const summary = analytics_js_1.analyticsService.getSummary();
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
        analytics_js_1.analyticsService.updateWorkflowStats(workflowId, status, executionTime);
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
router.get('/user-stats/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'User ID is required'
            });
        }
        const stats = await analytics_js_1.analyticsService.getUserWorkflowStats(userId);
        res.json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get user workflow statistics',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/trends', async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 7;
        const trends = await analytics_js_1.analyticsService.getWorkflowExecutionTrends(days);
        res.json({
            success: true,
            data: trends,
            period: `${days} days`,
            count: trends.length,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get workflow execution trends',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/workflow-usage', async (req, res) => {
    try {
        const stats = await analytics_js_1.analyticsService.getWorkflowUsageStats();
        res.json({
            success: true,
            data: stats,
            count: stats.length,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get workflow usage statistics',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/success-ranking', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const ranking = await analytics_js_1.analyticsService.getWorkflowSuccessRanking(limit);
        res.json({
            success: true,
            data: ranking,
            limit: limit,
            count: ranking.length,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get workflow success ranking',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=analytics.js.map