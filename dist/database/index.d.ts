import { PrismaClient } from '@prisma/client';
export declare class Database {
    private static instance;
    private static isConnected;
    private constructor();
    static getInstance(): PrismaClient;
    static connect(): Promise<void>;
    static disconnect(): Promise<void>;
    static healthCheck(): Promise<boolean>;
    static get isConnected(): boolean;
}
export declare const db: PrismaClient<import(".prisma/client").Prisma.PrismaClientOptions, never, $Extensions.DefaultArgs>;
//# sourceMappingURL=index.d.ts.map