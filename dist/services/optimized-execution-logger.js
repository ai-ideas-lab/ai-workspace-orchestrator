import { cacheService } from './cache-service';
export class OptimizedExecutionLogger {
    maxLogAge;
    cleanupIntervalMs;
    cacheEnabled;
    executionLogs = new Map();
    stepLogs = new Map();
    recentHistoryCacheKey = 'recent-execution-history';
    performanceStatsCacheKey = 'performance-stats';
    cleanupInterval = null;
    constructor(maxLogAge = 7 * 24 * 60 * 60 * 1000, cleanupIntervalMs = 60 * 60 * 1000, cacheEnabled = true) {
        this.maxLogAge = maxLogAge;
        this.cleanupIntervalMs = cleanupIntervalMs;
        this.cacheEnabled = cacheEnabled;
        this.startCleanupTask();
    }
    async logWorkflowStart(workflow) {
        const log = {
            workflowId: workflow.id,
            workflowName: workflow.name,
            startTime: new Date(),
            status: 'running',
            totalSteps: workflow.steps.length,
            completedSteps: 0,
            failedSteps: 0,
            estimatedDuration: this.estimateExecutionDuration(workflow.steps),
            stepLogs: []
        };
        this.executionLogs.set(workflow.id, log);
        if (this.cacheEnabled) {
            await Promise.all([
                cacheService.del(this.recentHistoryCacheKey),
                cacheService.del(this.performanceStatsCacheKey)
            ]);
        }
        console.log(`[OptimizedExecutionLogger] 工作流开始执行: ${workflow.name} (${workflow.id})`);
    }
    async logStepStart(workflowId, step) {
        const stepLog = {
            stepId: step.id,
            engineId: step.engineId,
            stepName: `步骤 ${step.id}`,
            startTime: new Date(),
            status: 'running',
            input: step.input,
            parameters: step.parameters,
            error: undefined,
            duration: 0
        };
        const workflowLog = this.executionLogs.get(workflowId);
        if (workflowLog) {
            if (!workflowLog.stepLogs) {
                workflowLog.stepLogs = [];
            }
            workflowLog.stepLogs.push(stepLog);
            const stepLogs = this.stepLogs.get(workflowId) || [];
            stepLogs.push(stepLog);
            this.stepLogs.set(workflowId, stepLogs);
        }
        console.log(`[OptimizedExecutionLogger] 步骤开始: ${step.engineId} (${step.id})`);
    }
    async logStepComplete(workflowId, stepId, result, duration) {
        const stepLogs = this.stepLogs.get(workflowId);
        if (stepLogs) {
            const stepLog = stepLogs.find(log => log.stepId === stepId);
            if (stepLog) {
                stepLog.endTime = new Date();
                stepLog.status = 'completed';
                stepLog.result = result;
                stepLog.duration = duration;
                console.log(`[OptimizedExecutionLogger] 步骤完成: ${stepId} (${duration}ms)`);
            }
        }
        await this.updateWorkflowProgress(workflowId, 'completed');
    }
    async logStepFailure(workflowId, stepId, error, duration) {
        const stepLogs = this.stepLogs.get(workflowId);
        if (stepLogs) {
            const stepLog = stepLogs.find(log => log.stepId === stepId);
            if (stepLog) {
                stepLog.endTime = new Date();
                stepLog.status = 'failed';
                stepLog.error = error;
                stepLog.duration = duration;
                console.log(`[OptimizedExecutionLogger] 步骤失败: ${stepId} (${error})`);
            }
        }
        await this.updateWorkflowProgress(workflowId, 'failed');
    }
    async logWorkflowComplete(workflowId, finalStatus) {
        const log = this.executionLogs.get(workflowId);
        if (log) {
            log.endTime = new Date();
            log.status = finalStatus;
            log.totalDuration = log.endTime.getTime() - log.startTime.getTime();
            if (this.cacheEnabled) {
                await Promise.all([
                    cacheService.del(this.recentHistoryCacheKey),
                    cacheService.del(this.performanceStatsCacheKey)
                ]);
            }
            console.log(`[OptimizedExecutionLogger] 工作流完成: ${log.workflowName} (${finalStatus}, ${log.totalDuration}ms)`);
        }
    }
    async getWorkflowLog(workflowId) {
        if (this.cacheEnabled) {
            const cached = await cacheService.get(`workflow-log:${workflowId}`);
            if (cached) {
                return cached;
            }
        }
        const log = this.executionLogs.get(workflowId) || null;
        if (this.cacheEnabled && log) {
            await cacheService.set(`workflow-log:${workflowId}`, log, 300000);
        }
        return log;
    }
    async getStepLogs(workflowId) {
        if (this.cacheEnabled) {
            const cached = await cacheService.get(`step-logs:${workflowId}`);
            if (cached) {
                return cached;
            }
        }
        const stepLogs = this.stepLogs.get(workflowId) || [];
        if (this.cacheEnabled) {
            await cacheService.set(`step-logs:${workflowId}`, stepLogs, 300000);
        }
        return stepLogs;
    }
    async getRecentExecutionHistory(limit = 10) {
        if (this.cacheEnabled) {
            const cacheKey = `${this.recentHistoryCacheKey}:${limit}`;
            const cached = await cacheService.get(cacheKey);
            if (cached) {
                return cached;
            }
        }
        const logs = Array.from(this.executionLogs.values())
            .filter(log => log.endTime !== null)
            .sort((a, b) => b.endTime.getTime() - a.endTime.getTime())
            .slice(0, limit);
        const summaries = logs.map(log => ({
            workflowId: log.workflowId,
            workflowName: log.workflowName,
            startTime: log.startTime,
            endTime: log.endTime,
            status: log.status,
            totalSteps: log.totalSteps,
            completedSteps: log.completedSteps,
            failedSteps: log.failedSteps,
            totalDuration: log.totalDuration,
            successRate: log.totalSteps > 0 ? (log.completedSteps / log.totalSteps) * 100 : 0
        }));
        if (this.cacheEnabled) {
            const cacheKey = `${this.recentHistoryCacheKey}:${limit}`;
            await cacheService.set(cacheKey, summaries, 60000);
        }
        return summaries;
    }
    async getPerformanceStats() {
        if (this.cacheEnabled) {
            const cached = await cacheService.get(this.performanceStatsCacheKey);
            if (cached) {
                return cached;
            }
        }
        const allLogs = Array.from(this.executionLogs.values()).filter(log => log.endTime !== null);
        if (allLogs.length === 0) {
            const stats = {
                totalExecutions: 0,
                averageDuration: 0,
                successRate: 0,
                totalSteps: 0,
                averageStepsPerWorkflow: 0,
                cacheHitRate: 0,
                totalCacheHits: 0,
                totalCacheMisses: 0
            };
            if (this.cacheEnabled) {
                await cacheService.set(this.performanceStatsCacheKey, stats, 300000);
            }
            return stats;
        }
        const totalDuration = allLogs.reduce((sum, log) => sum + (log.totalDuration || 0), 0);
        const totalSuccesses = allLogs.filter(log => log.status === 'completed').length;
        const totalSteps = allLogs.reduce((sum, log) => sum + log.totalSteps, 0);
        const stats = {
            totalExecutions: allLogs.length,
            averageDuration: totalDuration / allLogs.length,
            successRate: (totalSuccesses / allLogs.length) * 100,
            totalSteps,
            averageStepsPerWorkflow: totalSteps / allLogs.length,
            cacheHitRate: this.calculateCacheHitRate(),
            totalCacheHits: this.getTotalCacheHits(),
            totalCacheMisses: this.getTotalCacheMisses()
        };
        if (this.cacheEnabled) {
            await cacheService.set(this.performanceStatsCacheKey, stats, 300000);
        }
        return stats;
    }
    async filterLogsByStatus(status) {
        const allLogs = await this.getRecentExecutionHistory(100);
        return allLogs.filter(log => log.status === status);
    }
    async getWorkflowLogsBatch(workflowIds) {
        const results = [];
        for (const workflowId of workflowIds) {
            const log = await this.getWorkflowLog(workflowId);
            results.push(log);
        }
        return results;
    }
    async updateWorkflowStatusBatch(updates) {
        for (const update of updates) {
            const log = this.executionLogs.get(update.workflowId);
            if (log) {
                log.status = update.status;
                log.endTime = new Date();
                if (update.status === 'completed') {
                    log.totalDuration = log.endTime.getTime() - log.startTime.getTime();
                }
            }
        }
        if (this.cacheEnabled) {
            await Promise.all([
                cacheService.del(this.recentHistoryCacheKey),
                cacheService.del(this.performanceStatsCacheKey)
            ]);
        }
    }
    getMonitoringData() {
        return {
            memoryUsage: JSON.stringify([...this.executionLogs.values()]).length,
            totalLogs: this.executionLogs.size,
            cacheStats: this.cacheEnabled ? cacheService.getMemoryStats() : null,
            uptime: process.uptime()
        };
    }
    async cleanupOldLogs(maxAge) {
        const cutoffTime = new Date(Date.now() - (maxAge || this.maxLogAge));
        const logsToDelete = [];
        for (const [workflowId, log] of this.executionLogs) {
            if (log.endTime && log.endTime.getTime() < cutoffTime.getTime()) {
                logsToDelete.push(workflowId);
            }
        }
        logsToDelete.forEach(workflowId => {
            this.executionLogs.delete(workflowId);
            this.stepLogs.delete(workflowId);
        });
        if (this.cacheEnabled) {
            for (const workflowId of logsToDelete) {
                await Promise.all([
                    cacheService.del(`workflow-log:${workflowId}`),
                    cacheService.del(`step-logs:${workflowId}`)
                ]);
            }
            await Promise.all([
                cacheService.del(this.recentHistoryCacheKey),
                cacheService.del(this.performanceStatsCacheKey)
            ]);
        }
        console.log(`[OptimizedExecutionLogger] 清理了 ${logsToDelete.length} 条旧日志`);
    }
    startCleanupTask() {
        this.cleanupInterval = setInterval(async () => {
            await this.cleanupOldLogs();
            if (this.cacheEnabled) {
                cacheService.cleanup();
            }
        }, this.cleanupIntervalMs);
    }
    stopCleanupTask() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }
    async updateWorkflowProgress(workflowId, stepStatus) {
        const log = this.executionLogs.get(workflowId);
        if (log) {
            if (stepStatus === 'completed') {
                log.completedSteps++;
            }
            else {
                log.failedSteps++;
            }
            if (log.completedSteps === log.totalSteps) {
                log.status = 'completed';
            }
            else if (log.failedSteps > 0) {
                log.status = 'failed';
            }
            log.updatedAt = new Date();
            if (this.cacheEnabled) {
                await Promise.all([
                    cacheService.del(`workflow-log:${workflowId}`),
                    cacheService.del(this.recentHistoryCacheKey),
                    cacheService.del(this.performanceStatsCacheKey)
                ]);
            }
        }
    }
    estimateExecutionDuration(steps) {
        let baseTime = 0;
        steps.forEach(step => {
            switch (step.engineId) {
                case 'text-gen-1':
                    baseTime += 2000;
                    break;
                case 'image-gen-1':
                    baseTime += 5000;
                    break;
                case 'code-analysis-1':
                    baseTime += 3000;
                    break;
                default:
                    baseTime += 1000;
            }
        });
        return baseTime;
    }
    calculateCacheHitRate() {
        const hits = this.getTotalCacheHits();
        const misses = this.getTotalCacheMisses();
        const total = hits + misses;
        return total > 0 ? (hits / total) * 100 : 0;
    }
    getTotalCacheHits() {
        return 0;
    }
    getTotalCacheMisses() {
        return 0;
    }
}
export const optimizedExecutionLogger = new OptimizedExecutionLogger();
//# sourceMappingURL=optimized-execution-logger.js.map