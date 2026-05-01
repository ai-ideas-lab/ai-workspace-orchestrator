"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIScheduler = void 0;
class AIScheduler {
    async scheduleWorkflow(workflow) {
        const tasks = workflow.steps.map(step => ({
            id: step.id,
            type: step.type,
            priority: this.calculatePriority(step),
            estimatedDuration: this.estimateDuration(step)
        }));
        const schedule = await this.optimizeSchedule(tasks);
        return { scheduleId: crypto.randomUUID(), scheduledTasks: schedule };
    }
    calculatePriority(step) {
        return step.weight * (step.required ? TIMING.REQUIRED_PRIORITY_MULTIPLIER : 1.0);
    }
    estimateDuration(step) {
        return step.type === STEP_TYPE.AI ? TIMING.AI_DURATION_MS : TIMING.API_DURATION_MS;
    }
    logScheduleOptimization(tasks, optimized) {
        console.log(`优化前任务数: ${tasks.length}, 优化后任务数: ${optimized.length}`);
        console.log(`最高优先级任务: ${optimized[0]?.id || 'N/A'} (${optimized[0]?.priority || 0})`);
        console.log(`最低优先级任务: ${optimized[optimized.length - 1]?.id || 'N/A'} (${optimized[optimized.length - 1]?.priority || 0})`);
    }
    async optimizeSchedule(tasks) {
        const optimized = tasks.sort((a, b) => b.priority - a.priority);
        this.logScheduleOptimization(tasks, optimized);
        return optimized;
    }
}
exports.AIScheduler = AIScheduler;
//# sourceMappingURL=AIScheduler.js.map