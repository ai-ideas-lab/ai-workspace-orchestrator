"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
class DatabaseService {
    constructor() {
        this.prisma = new client_1.PrismaClient({
            log: ['query', 'info', 'warn', 'error'],
        });
    }
    static getInstance() {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }
    async connect() {
        try {
            await this.prisma.$connect();
            console.log('Database connected successfully');
        }
        catch (error) {
            console.error('Failed to connect to database:', error);
            throw error;
        }
    }
    async disconnect() {
        try {
            await this.prisma.$disconnect();
            console.log('Database disconnected successfully');
        }
        catch (error) {
            console.error('Failed to disconnect from database:', error);
            throw error;
        }
    }
    getPrisma() {
        return this.prisma;
    }
    async healthCheck() {
        try {
            await this.prisma.$queryRaw `SELECT 1`;
            return true;
        }
        catch (error) {
            console.error('Database health check failed:', error);
            return false;
        }
    }
    async executeRawQuery(query, params) {
        try {
            if (params && params.length > 0) {
                return await this.prisma.$queryRawUnsafe(query, ...params);
            }
            else {
                return await this.prisma.$queryRawUnsafe(query);
            }
        }
        catch (error) {
            console.error('Raw query execution failed:', error);
            throw error;
        }
    }
}
exports.default = DatabaseService;
//# sourceMappingURL=database.js.map