"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbConfig = exports.DatabaseConfig = void 0;
const postgres_database_service_1 = require("../services/postgres-database-service");
class DatabaseConfig {
    constructor() {
        this.isInitialized = false;
        this.postgresDb = postgres_database_service_1.PostgresDatabaseService.getInstance();
    }
    static getInstance() {
        if (!DatabaseConfig.instance) {
            DatabaseConfig.instance = new DatabaseConfig();
        }
        return DatabaseConfig.instance;
    }
    async initialize() {
        if (this.isInitialized)
            return;
        try {
            const databaseUrl = process.env.DATABASE_URL;
            if (!databaseUrl) {
                throw new Error('DATABASE_URL environment variable is required');
            }
            const isPostgres = databaseUrl.startsWith('postgresql://');
            if (isPostgres) {
                console.log('🚀 Initializing PostgreSQL database...');
                await this.postgresDb.initialize();
                if (process.env.NODE_ENV === 'development') {
                    await this.postgresDb.seedInitialData();
                }
                this.isInitialized = true;
                console.log('✅ PostgreSQL database initialized successfully');
            }
            else {
                console.log('⚠️  SQLite database detected. Consider migrating to PostgreSQL for production.');
                this.isInitialized = true;
            }
        }
        catch (error) {
            console.error('❌ Failed to initialize database:', error);
            throw error;
        }
    }
    getPostgresDb() {
        if (!this.isInitialized) {
            throw new Error('Database not initialized. Call initialize() first.');
        }
        return this.postgresDb;
    }
    async healthCheck() {
        if (!this.isInitialized) {
            return {
                status: 'unhealthy',
                connected: false,
                latency: 0,
                error: 'Database not initialized'
            };
        }
        return this.postgresDb.healthCheck();
    }
    async disconnect() {
        if (this.isInitialized) {
            await this.postgresDb.disconnect();
            this.isInitialized = false;
        }
    }
}
exports.DatabaseConfig = DatabaseConfig;
exports.dbConfig = DatabaseConfig.getInstance();
//# sourceMappingURL=database.js.map