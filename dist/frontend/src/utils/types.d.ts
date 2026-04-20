export interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    createdAt: string;
    lastLoginAt: string;
}
export interface Workflow {
    id: string;
    name: string;
    description: string;
    steps: WorkflowStep[];
    variables: Record<string, string>;
    error_handling: {
        max_retries: number;
        timeout: number;
    };
    status: 'draft' | 'active' | 'paused' | 'completed';
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    executionCount: number;
    successRate: number;
}
export interface WorkflowStep {
    id: string;
    type: string;
    agent: string;
    prompt: string;
    expected_output: string;
    status?: 'pending' | 'running' | 'completed' | 'failed';
    result?: any;
    error?: string;
}
export interface AIAgent {
    id: string;
    name: string;
    provider: 'openai' | 'anthropic' | 'google';
    model: string;
    config: Record<string, any>;
    status: 'active' | 'inactive' | 'error';
    lastUsed: string;
    usageCount: number;
}
export interface Team {
    id: string;
    name: string;
    description: string;
    members: TeamMember[];
    workflows: string[];
    createdAt: string;
    createdBy: string;
}
export interface TeamMember {
    userId: string;
    userEmail: string;
    userName: string;
    role: 'owner' | 'admin' | 'member';
    joinedAt: string;
}
export interface DashboardStats {
    totalWorkflows: number;
    activeWorkflows: number;
    totalExecutions: number;
    successRate: number;
    totalUsers: number;
    totalTeams: number;
    totalAIRequests: number;
    avgExecutionTime: number;
    costThisMonth: number;
    popularWorkflows: Array<{
        id: string;
        name: string;
        executionCount: number;
    }>;
}
export interface APIResponse<T = any> {
    data: T;
    message?: string;
    error?: string;
}
export interface WorkflowExecution {
    id: string;
    workflowId: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    startTime: string;
    endTime?: string;
    duration?: number;
    result?: any;
    error?: string;
    steps: WorkflowStep[];
    cost: number;
    tokensUsed: number;
}
//# sourceMappingURL=types.d.ts.map