import { PrismaClient } from '@prisma/client';
declare class DatabaseService {
    private static instance;
    private prisma;
    private constructor();
    static getInstance(): DatabaseService;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    getPrisma(): PrismaClient;
    healthCheck(): Promise<boolean>;
    executeRawQuery(query: string, params?: any[]): Promise<any>;
}
export default DatabaseService;
//# sourceMappingURL=database.d.ts.map