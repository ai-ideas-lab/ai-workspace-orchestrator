import { AIProvider, AITask } from '../types/ai-providers.js';
export declare class AIEngine {
    private providers;
    private activeTasks;
    private taskQueue;
    private isProcessing;
    constructor();
    private initializeProviders;
    addProvider(provider: AIProvider): void;
    removeProvider(providerId: string): boolean;
    executeTask(task: Omit<AITask, 'id' | 'status' | 'startTime' | 'endTime' | 'duration'>): Promise<AITask>;
    private processQueue;
    private executeTaskInternal;
    private callAIProvider;
    private callOpenAI;
    private callAnthropic;
    private callGoogle;
    private getSystemPrompt;
    private updateTaskStatus;
    getTaskStatus(taskId: string): AITask | undefined;
    getActiveTasks(): AITask[];
    getQueueStatus(): {
        length: number;
        isProcessing: boolean;
    };
    cancelTask(taskId: string): boolean;
    private log;
    cleanupCompletedTasks(maxAge?: number): void;
}
export declare const aiEngine: AIEngine;
//# sourceMappingURL=ai-engine.d.ts.map