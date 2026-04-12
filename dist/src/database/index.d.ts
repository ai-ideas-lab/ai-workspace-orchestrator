import { Config } from '../utils/config.js';
import { PrismaClient } from '@prisma/client';
export declare let prisma: PrismaClient;
export declare function setupDatabase(config: Config): Promise<void>;
export declare function getDatabaseStatus(): Promise<{
    connected: boolean;
    provider: string | undefined;
    stats: {
        totalWorkflows: number;
        totalExecutions: number;
        totalUsers: number;
        databaseSize?: string;
    };
    timestamp: string;
    error?: never;
} | {
    connected: boolean;
    error: string;
    timestamp: string;
    provider?: never;
    stats?: never;
}>;
export interface Workflow {
    id: string;
    name: string;
    description: string;
    status: 'draft' | 'active' | 'paused' | 'completed';
    config: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export interface Execution {
    id: string;
    workflowId: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    result?: any;
    error?: string;
    startTime: Date;
    endTime?: Date;
}
export interface Agent {
    id: string;
    name: string;
    type: 'openai' | 'anthropic' | 'google';
    config: Record<string, any>;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=index.d.ts.map