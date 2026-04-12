import { PrismaClient } from '@prisma/client';
declare const prisma: PrismaClient<{
    log: ("error" | "info" | "query" | "warn")[];
    errorFormat: "pretty";
}, "error" | "info" | "query" | "warn", $Extensions.DefaultArgs>;
export declare class DatabaseManager {
    private static instance;
    static getInstance(): Promise<PrismaClient>;
    static disconnect(): Promise<void>;
    static healthCheck(): Promise<boolean>;
}
export declare const dbUtils: {
    getStats(): Promise<{
        totalWorkflows: any;
        totalExecutions: any;
        recentExecutions: any;
        databaseType: string;
        isConnected: boolean;
    }>;
    getWorkflowStats(): Promise<any>;
    getRecentExecutions(limit?: number): Promise<any>;
    cleanupOldData(daysToKeep?: number): Promise<{
        deletedExecutions: any;
        deletedSteps: any;
    }>;
};
export { prisma };
export default DatabaseManager;
//# sourceMappingURL=database.d.ts.map