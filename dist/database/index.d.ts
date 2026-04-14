declare const prismaClient: any;
export declare function connectToDatabase(): Promise<void>;
export declare function disconnectFromDatabase(): Promise<void>;
export declare function isDatabaseConnected(): boolean;
export declare function checkDatabaseHealth(): Promise<{
    status: 'healthy' | 'unhealthy';
    responseTime: number;
    error?: string;
}>;
export declare function getDatabaseStats(): Promise<{
    totalWorkflows: number;
    totalUsers: number;
    totalExecutions: number;
    databaseVersion: string;
}>;
export { prismaClient as prisma };
export default prisma;
//# sourceMappingURL=index.d.ts.map