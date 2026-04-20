import { AIProviderConfig, AITask } from '../types/ai-providers.js';
import { EventEmitter } from 'events';
export declare class AITaskExecutor extends EventEmitter {
    private providers;
    private activeTasks;
    private taskQueue;
    private isProcessing;
    registerProvider(config: AIProviderConfig): void;
    getProviders(): AIProviderConfig[];
    executeTask(task: AITask): Promise<AITask>;
    executeTasks(tasks: AITask[]): Promise<AITask[]>;
    cancelTask(taskId: string): boolean;
    getTaskStatus(taskId: string): AITask | null;
    getActiveTasks(): AITask[];
    cleanupOldTasks(maxAge?: number): number;
    private validateTask;
    private executeByProvider;
    private executeOpenAITask;
    private executeAnthropicTask;
    private executeGoogleAITask;
    private groupTasksByProvider;
    private calculateDuration;
}
export declare const aiTaskExecutor: AITaskExecutor;
//# sourceMappingURL=ai-task-executor.d.ts.map