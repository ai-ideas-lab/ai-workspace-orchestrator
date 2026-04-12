"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsService = void 0;
const client_1 = require("@prisma/client");
class AnalyticsService {
    constructor() {
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
async;
getUserWorkflowStats(userId, string);
{
    const prisma = new client_1.PrismaClient();
    try {
        const totalExecutions = await prisma.workflowExecution.count({
            where: { userId }
        });
        const completedExecutions = await prisma.workflowExecution.count({
            where: {
                userId,
                status: 'COMPLETED'
            }
        });
        const failedExecutions = await prisma.workflowExecution.count({
            where: {
                userId,
                status: 'FAILED'
            }
        });
        const runningExecutions = await prisma.workflowExecution.count({
            where: {
                userId,
                status: 'RUNNING'
            }
        });
        const executionTimes = await prisma.workflowExecution.findMany({
            where: { userId },
            select: { executionTimeMs: true }
        });
        const totalTime = executionTimes
            .filter(exec => exec.executionTimeMs !== null)
            .reduce((sum, exec) => sum + (exec.executionTimeMs || 0), 0);
        const validExecutions = executionTimes.filter(exec => exec.executionTimeMs !== null).length;
        const averageExecutionTime = validExecutions > 0 ? totalTime / validExecutions : 0;
        const successRate = totalExecutions > 0 ? (completedExecutions / totalExecutions) * 100 : 0;
        return {
            totalWorkflows: totalExecutions,
            completedWorkflows: completedExecutions,
            failedWorkflows: failedExecutions,
            runningWorkflows: runningExecutions,
            averageExecutionTime: Math.round(averageExecutionTime),
            successRate: Math.round(successRate * 100) / 100
        };
    }
    catch (error) {
        console.error('Error getting user workflow stats:', error);
        throw new Error('Failed to get user workflow statistics');
    }
    finally {
        await prisma.$disconnect();
    }
}
async;
getWorkflowExecutionTrends(days, number = 7);
{
    const prisma = new client_1.PrismaClient();
    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - days);
        const executions = await prisma.workflowExecution.findMany({
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate
                }
            },
            orderBy: { createdAt: 'asc' }
        });
        const dailyStats = {};
        for (let i = 0; i < days; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            dailyStats[dateStr] = {
                date: dateStr,
                total: 0,
                completed: 0,
                failed: 0,
                running: 0,
                averageTime: 0
            };
        }
        executions.forEach(execution => {
            const dateStr = execution.createdAt.toISOString().split('T')[0];
            const dayStats = dailyStats[dateStr];
            if (dayStats) {
                dayStats.total++;
                dayStats[execution.status.toLowerCase()]++;
                if (execution.executionTimeMs) {
                    if (!dayStats.executionTimes) {
                        dayStats.executionTimes = [];
                    }
                    dayStats.executionTimes.push(execution.executionTimeMs);
                }
            }
        });
        Object.keys(dailyStats).forEach(date => {
            const dayStats = dailyStats[date];
            if (dayStats.executionTimes && dayStats.executionTimes.length > 0) {
                const avgTime = dayStats.executionTimes.reduce((sum, time) => sum + time, 0) / dayStats.executionTimes.length;
                dayStats.averageTime = Math.round(avgTime);
            }
            delete dayStats.executionTimes;
        });
        return Object.values(dailyStats);
    }
    catch (error) {
        console.error('Error getting workflow execution trends:', error);
        throw new Error('Failed to get workflow execution trends');
    }
    finally {
        await prisma.$disconnect();
    }
}
async;
getWorkflowUsageStats();
{
    const prisma = new client_1.PrismaClient();
    try {
        const workflows = await prisma.workflow.findMany({
            include: {
                _count: {
                    select: { executions: true }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 10
        });
        return workflows.map(workflow => ({
            id: workflow.id,
            name: workflow.name,
            description: workflow.description,
            executionCount: workflow._count.executions,
            createdAt: workflow.createdAt,
            status: workflow.status
        }));
    }
    catch (error) {
        console.error('Error getting workflow usage stats:', error);
        throw new Error('Failed to get workflow usage statistics');
    }
    finally {
        await prisma.$disconnect();
    }
}
async;
getWorkflowSuccessRanking(limit, number = 10);
{
    const prisma = new client_1.PrismaClient();
    try {
        const workflows = await prisma.workflow.findMany({
            include: {
                executions: {
                    select: {
                        id: true,
                        status: true,
                        executionTimeMs: true
                    }
                },
                user: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 100
        });
        const workflowStats = workflows.map(workflow => {
            const executions = workflow.executions;
            const total = executions.length;
            const completed = executions.filter(exec => exec.status === 'COMPLETED').length;
            const failed = executions.filter(exec => exec.status === 'FAILED').length;
            const successRate = total > 0 ? (completed / total) * 100 : 0;
            const totalTime = executions
                .filter(exec => exec.executionTimeMs !== null)
                .reduce((sum, exec) => sum + (exec.executionTimeMs || 0), 0);
            const avgTime = total > 0 ? totalTime / total : 0;
            return {
                id: workflow.id,
                name: workflow.name,
                description: workflow.description,
                executionCount: total,
                successRate: Math.round(successRate * 100) / 100,
                averageExecutionTime: Math.round(avgTime),
                createdBy: workflow.user.name || workflow.user.email
            };
        });
        return workflowStats
            .sort((a, b) => b.successRate - a.successRate)
            .slice(0, limit);
    }
    catch (error) {
        console.error('Error getting workflow success ranking:', error);
        throw new Error('Failed to get workflow success ranking');
    }
    finally {
        await prisma.$disconnect();
    }
}
exports.analyticsService = new AnalyticsService();
//# sourceMappingURL=analytics.js.map