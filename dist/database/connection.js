"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseConnection = void 0;
const client_1 = require("@prisma/client");
const logger_js_1 = require("../utils/logger.js");
class DatabaseConnection {
    static async createConnection(config) {
        try {
            if (this.isConnected && this.instance) {
                return this.instance;
            }
            logger_js_1.logger.info(`Connecting to database provider: ${config.database.provider}`);
            if (config.database.provider === 'postgresql') {
                this.instance = await this.createPostgreSQLConnection(config);
            }
            else {
                this.instance = await this.createSQLiteConnection(config);
            }
            this.isConnected = true;
            logger_js_1.logger.info('Database connection established successfully');
            await this.instance.$connect();
            await this.instance.$executeRaw `SELECT 1`;
            logger_js_1.logger.info('Database connection test successful');
            return this.instance;
        }
        catch (error) {
            logger_js_1.logger.error('Failed to create database connection:', error);
            throw error;
        }
    }
    static async createPostgreSQLConnection(config) {
        try {
            const postgresUrl = config.database.url || this.buildPostgresUrl(config);
            logger_js_1.logger.info(`Connecting to PostgreSQL: ${postgresUrl.replace(/:[^:]*@/, ':***@')}`);
            process.env.DATABASE_URL = postgresUrl;
            const prisma = new client_1.PrismaClient({
                log: ['query', 'info', 'warn', 'error'],
                errorFormat: 'pretty',
            });
            const session = await prisma.$connect();
            logger_js_1.logger.info('PostgreSQL connection established');
            return prisma;
        }
        catch (error) {
            logger_js_1.logger.error('PostgreSQL connection failed:', error);
            if (process.env.NODE_ENV === 'development') {
                logger_js_1.logger.warn('Falling back to SQLite for development');
                return this.createSQLiteConnection(config);
            }
            throw error;
        }
    }
    static async createSQLiteConnection(config) {
        try {
            const sqliteUrl = config.database.url || 'file:./dev.db';
            logger_js_1.logger.info(`Using SQLite database: ${sqliteUrl}`);
            process.env.DATABASE_URL = sqliteUrl;
            const prisma = new client_1.PrismaClient({
                log: ['query', 'info', 'warn', 'error'],
                errorFormat: 'pretty',
            });
            await prisma.$connect();
            logger_js_1.logger.info('SQLite database connected');
            return prisma;
        }
        catch (error) {
            logger_js_1.logger.error('SQLite connection failed:', error);
            throw error;
        }
    }
    static buildPostgresUrl(config) {
        const { database } = config;
        if (process.env.POSTGRES_URL) {
            return process.env.POSTGRES_URL;
        }
        const host = process.env.POSTGRES_HOST || 'localhost';
        const port = process.env.POSTGRES_PORT || 5432;
        const username = process.env.POSTGRES_USER || 'postgres';
        const password = process.env.POSTGRES_PASSWORD || '';
        const dbName = process.env.POSTGRES_DB || 'ai_workspace';
        return `postgresql://${username}:${password}@${host}:${port}/${dbName}`;
    }
    static async disconnect() {
        try {
            if (this.instance) {
                await this.instance.$disconnect();
                this.isConnected = false;
                this.instance = null;
                logger_js_1.logger.info('Database connection closed');
            }
        }
        catch (error) {
            logger_js_1.logger.error('Failed to close database connection:', error);
            throw error;
        }
    }
    static getStatus() {
        return {
            connected: this.isConnected,
            provider: this.instance?.$engineConfig?.provider,
        };
    }
    static async healthCheck() {
        try {
            if (!this.instance) {
                return false;
            }
            await this.instance.$queryRaw `SELECT 1`;
            return true;
        }
        catch (error) {
            logger_js_1.logger.error('Database health check failed:', error);
            return false;
        }
    }
    static async getStats() {
        try {
            if (!this.instance) {
                throw new Error('Database not connected');
            }
            const [totalWorkflows, totalExecutions, totalUsers,] = await Promise.all([
                this.instance.workflow.count(),
                this.instance.workflowExecution.count(),
                this.instance.user.count(),
            ]);
            let databaseSize;
            if (this.instance?.$engineConfig?.provider === 'postgresql') {
                try {
                    const result = await this.instance.$queryRaw `
            SELECT pg_size_pretty(pg_database_size(current_database())) as pg_size_pretty
          `;
                    databaseSize = result[0]?.pg_size_pretty;
                }
                catch (error) {
                    logger_js_1.logger.warn('Could not get database size:', error);
                }
            }
            return {
                totalWorkflows,
                totalExecutions,
                totalUsers,
                databaseSize,
            };
        }
        catch (error) {
            logger_js_1.logger.error('Failed to get database stats:', error);
            throw error;
        }
    }
}
exports.DatabaseConnection = DatabaseConnection;
DatabaseConnection.instance = null;
DatabaseConnection.isConnected = false;
//# sourceMappingURL=connection.js.map