export interface UserIntent {
    action: string;
    parameters: Record<string, any>;
    confidence: number;
    context: {
        userId: string;
        sessionId: string;
        timestamp: Date;
        environment: 'development' | 'staging' | 'production';
    };
}
export interface User {
    id: string;
    username: string;
    email: string;
    role: string;
    created_at: Date;
    updated_at: Date;
}
export interface LoginRequest {
    username: string;
    password: string;
}
export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
    role?: string;
}
export interface UpdateUserRequest {
    username?: string;
    email?: string;
    role?: string;
}
export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
}
export interface PasswordResetRequest {
    email: string;
}
export interface ResetPasswordWithTokenRequest {
    resetToken: string;
    newPassword: string;
}
export interface LoginResponse {
    user: User;
    token: string;
}
export interface RegisterResponse {
    user: User;
    token: string;
}
export interface AIEngine {
    id: string;
    name: string;
    type: 'text-generation' | 'image-generation' | 'code-analysis' | 'document-processing';
    endpoint: string;
    capabilities: string[];
    status: 'active' | 'inactive' | 'error';
    load: number;
}
export interface WorkflowStep {
    id: string;
    engineId: string;
    input: any;
    parameters: Record<string, any>;
    output?: any;
    status: 'pending' | 'running' | 'completed' | 'failed';
    error?: string;
}
export interface Workflow {
    id: string;
    name: string;
    description: string;
    steps: WorkflowStep[];
    status: 'draft' | 'running' | 'completed' | 'failed';
    createdAt: Date;
    updatedAt: Date;
}
export interface ParsedCommand {
    intent: string;
    entities: Record<string, any>;
    confidence: number;
    suggestedActions: string[];
}
export interface NLPEngine {
    parseCommand(text: string): Promise<ParsedCommand>;
    extractEntities(text: string): Promise<Record<string, any>>;
    classifyIntent(text: string): Promise<{
        intent: string;
        confidence: number;
    }>;
}
//# sourceMappingURL=index.d.ts.map