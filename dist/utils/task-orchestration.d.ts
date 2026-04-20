export declare function calculateTaskPriority(task: {
    deadline?: Date;
    importance: number;
    urgency: number;
    effort: number;
}): number;
export declare function getPriorityLevel(priorityScore: number): 'low' | 'medium' | 'high' | 'critical';
export declare function sortTasksByPriority(tasks: Array<{
    priorityScore: number;
}>): {
    priorityScore: number;
}[];
//# sourceMappingURL=task-orchestration.d.ts.map