export declare function scheduleAITasks(tasks: Array<{
    id: string;
    priority: number;
    aiEngine: string;
    estimatedDuration: number;
}>): Promise<{
    taskId: any;
    startTime: number;
    aiEngine: any;
    estimatedCompletion: any;
}[]>;
export declare function calculateTotalDuration(tasks: Array<{
    id: string;
    priority: number;
    aiEngine: string;
    estimatedDuration: number;
}>): number;
//# sourceMappingURL=taskScheduler.d.ts.map