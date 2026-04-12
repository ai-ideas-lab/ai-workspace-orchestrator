export class ExecutionLogger {
    executionLogs = new Map();
    stepLogs = new Map();
    logWorkflowStart(workflow) {
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
        console.log(`[ExecutionLogger] 工作流开始执行: ${workflow.name} (${workflow.id})`);
    }
    logStepStart(workflowId, step) {
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
        console.log(`[ExecutionLogger] 步骤开始: ${step.engineId} (${step.id})`);
    }
    logStepComplete(workflowId, stepId, result, duration) {
        const stepLogs = this.stepLogs.get(workflowId);
        if (stepLogs) {
            const stepLog = stepLogs.find(log => log.stepId === stepId);
            if (stepLog) {
                stepLog.endTime = new Date();
                stepLog.status = 'completed';
                stepLog.result = result;
                stepLog.duration = duration;
                console.log(`[ExecutionLogger] 步骤完成: ${stepId} (${duration}ms)`);
            }
        }
        this.updateWorkflowProgress(workflowId, 'completed');
    }
    logStepFailure(workflowId, stepId, error, duration) {
        const stepLogs = this.stepLogs.get(workflowId);
        if (stepLogs) {
            const stepLog = stepLogs.find(log => log.stepId === stepId);
            if (stepLog) {
                stepLog.endTime = new Date();
                stepLog.status = 'failed';
                stepLog.error = error;
                stepLog.duration = duration;
                console.log(`[ExecutionLogger] 步骤失败: ${stepId} (${error})`);
            }
        }
        this.updateWorkflowProgress(workflowId, 'failed');
    }
    logWorkflowComplete(workflowId, finalStatus) {
        const log = this.executionLogs.get(workflowId);
        if (log) {
            log.endTime = new Date();
            log.status = finalStatus;
            log.totalDuration = log.endTime.getTime() - log.startTime.getTime();
            console.log(`[ExecutionLogger] 工作流完成: ${log.workflowName} (${finalStatus}, ${log.totalDuration}ms)`);
        }
    }
    getWorkflowLog(workflowId) {
        return this.executionLogs.get(workflowId) || null;
    }
    getStepLogs(workflowId) {
        return this.stepLogs.get(workflowId) || [];
    }
    getRecentExecutionHistory(limit = 10) {
        const logs = Array.from(this.executionLogs.values())
            .filter(log => log.endTime !== null)
            .sort((a, b) => b.endTime.getTime() - a.endTime.getTime())
            .slice(0, limit);
        return logs.map(log => ({
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
    }
    getPerformanceStats() {
        const allLogs = Array.from(this.executionLogs.values()).filter(log => log.endTime !== null);
        if (allLogs.length === 0) {
            return {
                totalExecutions: 0,
                averageDuration: 0,
                successRate: 0,
                totalSteps: 0,
                averageStepsPerWorkflow: 0
            };
        }
        const totalDuration = allLogs.reduce((sum, log) => sum + (log.totalDuration || 0), 0);
        const totalSuccesses = allLogs.filter(log => log.status === 'completed').length;
        const totalSteps = allLogs.reduce((sum, log) => sum + log.totalSteps, 0);
        return {
            totalExecutions: allLogs.length,
            averageDuration: totalDuration / allLogs.length,
            successRate: (totalSuccesses / allLogs.length) * 100,
            totalSteps,
            averageStepsPerWorkflow: totalSteps / allLogs.length
        };
    }
    filterLogsByStatus(status) {
        return this.getRecentExecutionHistory(100).filter(log => log.status === status);
    }
    cleanupOldLogs(maxAge = 7 * 24 * 60 * 60 * 1000) {
        const cutoffTime = new Date(Date.now() - maxAge);
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
        console.log(`[ExecutionLogger] 清理了 ${logsToDelete.length} 条旧日志`);
    }
    updateWorkflowProgress(workflowId, stepStatus) {
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
}
export const executionLogger = new ExecutionLogger();
//# sourceMappingURL=execution-logger.js.map