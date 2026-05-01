export declare class AIScheduler {
    scheduleWorkflow(workflow: WorkflowConfig): Promise<ScheduledResult>;
    private calculatePriority;
    private estimateDuration;
    private logScheduleOptimization;
    private optimizeSchedule;
}
interface WorkflowStep {
    id: string;
    type: typeof STEP_TYPE.AI | typeof STEP_TYPE.API | typeof STEP_TYPE.DATA;
    weight: number;
    required: boolean;
}
interface WorkflowConfig {
    steps: WorkflowStep[];
}
interface ScheduledResult {
    scheduleId: string;
    scheduledTasks: ScheduledTask[];
}
interface Task extends WorkflowStep {
    priority: number;
    estimatedDuration: number;
}
interface ScheduledTask extends Task {
    startTime: number;
    endTime: number;
}
export {};
//# sourceMappingURL=AIScheduler.d.ts.map