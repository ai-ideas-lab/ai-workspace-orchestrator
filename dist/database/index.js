"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.Database = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
class Database {
    constructor() { }
    static getInstance() {
        if (!Database.instance) {
            Database.instance = new client_1.PrismaClient({
                log: ['query', 'info', 'warn', 'error'],
            });
        }
        return Database.instance;
    }
    static async connect() {
        if (Database.isConnected) {
            logger_1.logger.info('Database already connected');
            return;
        }
        try {
            const client = Database.getInstance();
            await client.$connect();
            Database.isConnected = true;
            logger_1.logger.info('Database connected successfully');
        }
        catch (error) {
            logger_1.logger.error('Failed to connect to database:', error);
            throw error;
        }
    }
    static async disconnect() {
        if (!Database.isConnected) {
            logger_1.logger.info('Database already disconnected');
            return;
        }
        try {
            const client = Database.getInstance();
            await client.$disconnect();
            Database.isConnected = false;
            logger_1.logger.info('Database disconnected successfully');
        }
        catch (error) {
            logger_1.logger.error('Failed to disconnect from database:', error);
            throw error;
        }
    }
    static async healthCheck() {
        if (!Database.isConnected) {
            return false;
        }
        try {
            const client = Database.getInstance();
            await client.$queryRaw `SELECT 1`;
            return true;
        }
        catch (error) {
            logger_1.logger.error('Database health check failed:', error);
            return false;
        }
    }
    static get isConnected() {
        return Database.isConnected;
    }
}
exports.Database = Database;
Database.isConnected = false;
exports.db = Database.getInstance();
//# sourceMappingURL=index.js.map