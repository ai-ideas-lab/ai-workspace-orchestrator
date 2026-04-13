"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.coordinateTask = coordinateTask;
function coordinateTask(task, agents) {
    const assigned = assignAgents(task, agents);
    const priority = calculatePriority(task, assigned);
    const schedule = optimizeSchedule(task, priority);
    return {
        taskId: task.id,
        status: 'scheduled',
        assignedAgents: assigned,
        estimatedCompletion: schedule.eta,
        priority: priority
    };
}
//# sourceMappingURL=coordination.js.map