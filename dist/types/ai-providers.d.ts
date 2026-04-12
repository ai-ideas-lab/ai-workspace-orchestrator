export type AIProvider = 'openai' | 'anthropic' | 'google';
export interface AIProviderConfig {
    id: string;
    provider: AIProvider;
    apiKey: string;
    model: string;
    baseUrl: string;
    maxTokens: number;
    temperature: number;
    createdAt: string;
    updatedAt: string;
    isActive: boolean;
}
export interface AITask {
    id: string;
    type: 'text-generation' | 'code-analysis' | 'image-generation' | 'document-processing';
    provider: AIProvider;
    input: string;
    parameters: Record<string, any>;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    result?: string;
    error?: string;
    startTime?: string;
    endTime?: string;
    duration?: number;
}
export interface AIProviderType {
    TEXT_GENERATION: 'text-generation';
    CODE_GENERATION: 'code-generation';
    IMAGE_GENERATION: 'image-generation';
    DOCUMENT_PROCESSING: 'document-processing';
    ANALYSIS: 'analysis';
}
export type AITaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export interface Workflow {
    id: string;
    name: string;
    description: string;
    steps: WorkflowStep[];
    status: 'draft' | 'active' | 'paused';
    createdAt: string;
    updatedAt: string;
    lastRunAt?: string;
}
export interface WorkflowStep {
    id: string;
    name: string;
    type: 'ai-task' | 'condition' | 'parallel' | 'sequential';
    config: Record<string, any>;
    nextSteps: string[];
}
export interface ExecutionHistory {
    id: string;
    workflowId: string;
    status: 'running' | 'completed' | 'failed' | 'cancelled';
    startTime: string;
    endTime?: string;
    duration?: number;
    steps: ExecutionStep[];
    logs: LogEntry[];
}
export interface ExecutionStep {
    id: string;
    stepId: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
    startTime?: string;
    endTime?: string;
    duration?: number;
    result?: any;
    error?: string;
}
export interface LogEntry {
    timestamp: string;
    level: 'info' | 'warn' | 'error' | 'debug';
    message: string;
    data?: any;
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    details?: any;
}
export interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
//# sourceMappingURL=ai-providers.d.ts.map