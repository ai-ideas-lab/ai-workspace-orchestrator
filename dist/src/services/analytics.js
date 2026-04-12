class AnalyticsService {
    metricsHistory = [];
    workflowStats = {
        totalWorkflows: 0,
        completedWorkflows: 0,
        failedWorkflows: 0,
        runningWorkflows: 0,
        averageExecutionTime: 0,
        successRate: 0
    };
    collectSystemMetrics() {
        const timestamp = new Date().toISOString();
        const cpuUsage = Math.random() * 100;
        const memoryUsage = Math.random() * 100;
        const activeConnections = Math.floor(Math.random() * 100) + 50;
        const activeWorkflows = Math.floor(Math.random() * 10) + 1;
        const responseTime = Math.random() * 1000 + 100;
        return {
            timestamp,
            cpuUsage,
            memoryUsage,
            activeConnections,
            activeWorkflows,
            responseTime
        };
    }
    getMetricsHistory(limit = 20) {
        return this.metricsHistory.slice(-limit);
    }
    getWorkflowStats() {
        return { ...this.workflowStats };
    }
    getSummary() {
        const completedToday = Math.floor(this.workflowStats.completedWorkflows * 0.3);
        const averageResponseTime = Math.random() * 500 + 200;
        let systemHealth = 'good';
        if (averageResponseTime < 300)
            systemHealth = 'excellent';
        else if (averageResponseTime > 800)
            systemHealth = 'critical';
        else if (averageResponseTime > 600)
            systemHealth = 'warning';
        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);
        const uptimeString = `${hours}h ${minutes}m ${seconds}s`;
        return {
            totalWorkflows: this.workflowStats.totalWorkflows,
            completedToday,
            averageResponseTime,
            systemHealth,
            uptime: uptimeString,
            lastUpdated: new Date().toISOString()
        };
    }
    updateWorkflowStats(workflowId, status, executionTime) {
        this.workflowStats.totalWorkflows++;
        switch (status) {
            case 'completed':
                this.workflowStats.completedWorkflows++;
                break;
            case 'failed':
                this.workflowStats.failedWorkflows++;
                break;
            case 'running':
                this.workflowStats.runningWorkflows++;
                break;
        }
        const currentTotalTime = this.workflowStats.averageExecutionTime * (this.workflowStats.totalWorkflows - 1);
        this.workflowStats.averageExecutionTime = (currentTotalTime + executionTime) / this.workflowStats.totalWorkflows;
        this.workflowStats.successRate = this.workflowStats.completedWorkflows / this.workflowStats.totalWorkflows;
        this.recordMetricsHistory();
    }
    recordMetricsHistory() {
        const metrics = this.collectSystemMetrics();
        this.metricsHistory.push({
            timestamp: metrics.timestamp,
            cpuUsage: metrics.cpuUsage,
            memoryUsage: metrics.memoryUsage,
            activeConnections: metrics.activeConnections,
            activeWorkflows: metrics.activeWorkflows
        });
        if (this.metricsHistory.length > 1000) {
            this.metricsHistory = this.metricsHistory.slice(-500);
        }
    }
    resetStats() {
        this.metricsHistory = [];
        this.workflowStats = {
            totalWorkflows: 0,
            completedWorkflows: 0,
            failedWorkflows: 0,
            runningWorkflows: 0,
            averageExecutionTime: 0,
            successRate: 0
        };
    }
}
export const analyticsService = new AnalyticsService();
//# sourceMappingURL=analytics.js.map