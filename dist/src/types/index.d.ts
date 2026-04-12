export interface Workflow {
    id: string;
    name: string;
    description: string;
    status: 'running' | 'completed' | 'failed' | 'pending';
    createdAt: Date;
    updatedAt: Date;
}
export interface Agent {
    id: string;
    name: string;
    type: 'openai' | 'anthropic' | 'google';
    status: 'active' | 'inactive';
    config: Record<string, any>;
}
export interface ExecutionHistory {
    id: string;
    workflowId: string;
    status: 'running' | 'completed' | 'failed';
    startTime: Date;
    endTime?: Date;
    duration?: number;
    logs: string[];
}
//# sourceMappingURL=index.d.ts.map