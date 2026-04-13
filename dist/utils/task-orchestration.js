"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateTaskPriority = calculateTaskPriority;
exports.getPriorityLevel = getPriorityLevel;
exports.sortTasksByPriority = sortTasksByPriority;
function calculateTaskPriority(task) {
    const now = new Date();
    let urgencyScore = task.urgency;
    if (task.deadline) {
        const daysToDeadline = Math.max(0, Math.ceil((task.deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
        if (daysToDeadline <= 1)
            urgencyScore = Math.min(10, urgencyScore + 5);
        else if (daysToDeadline <= 3)
            urgencyScore = Math.min(10, urgencyScore + 3);
        else if (daysToDeadline <= 7)
            urgencyScore = Math.min(10, urgencyScore + 1);
    }
    const priorityScore = (task.importance * 0.4) +
        (urgencyScore * 0.4) +
        ((11 - task.effort) * 0.2);
    return Math.round(Math.max(0, Math.min(100, priorityScore)));
}
function getPriorityLevel(priorityScore) {
    if (priorityScore >= 80)
        return 'critical';
    if (priorityScore >= 60)
        return 'high';
    if (priorityScore >= 40)
        return 'medium';
    return 'low';
}
function sortTasksByPriority(tasks) {
    if (!Array.isArray(tasks)) {
        throw new TypeError('tasks参数必须是数组类型');
    }
    tasks.forEach((task, index) => {
        if (typeof task.priorityScore !== 'number') {
            throw new Error(`任务索引 ${index} 缺少priorityScore属性或类型不是数字`);
        }
    });
    return [...tasks].sort((a, b) => b.priorityScore - a.priorityScore);
}
//# sourceMappingURL=task-orchestration.js.map