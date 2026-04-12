"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseConfiguration = void 0;
const logger_js_1 = require("../utils/logger.js");
class DatabaseConfiguration {
    static createDatabaseConfig(config) {
        const databaseConfig = {
            provider: config.database.provider,
            url: this.resolveDatabaseUrl(config),
            maxConnections: config.database.maxConnections,
            timeout: parseInt(process.env.DB_TIMEOUT || '30000'),
            ssl: this.parseSSLConfig(),
        };
        if (config.database.provider === 'postgresql') {
            databaseConfig.sslConfig = this.getPostgresSSLConfig();
        }
        logger_js_1.logger.info(`Database configuration: ${databaseConfig.provider}://${databaseConfig.url.replace(/:[^:]*@/, ':***@')}`);
        return databaseConfig;
    }
    static resolveDatabaseUrl(config) {
        if (config.database.url) {
            return config.database.url;
        }
        if (process.env.DATABASE_URL) {
            return process.env.DATABASE_URL;
        }
        if (config.database.provider === 'postgresql') {
            return this.buildPostgresUrl();
        }
        else {
            return 'file:./dev.db';
        }
    }
    static buildPostgresUrl() {
        const host = process.env.POSTGRES_HOST || 'localhost';
        const port = process.env.POSTGRES_PORT || '5432';
        const username = process.env.POSTGRES_USER || 'postgres';
        const password = process.env.POSTGRES_PASSWORD || '';
        const database = process.env.POSTGRES_DB || 'ai_workspace';
        const encodedPassword = encodeURIComponent(password);
        return `postgresql://${username}:${encodedPassword}@${host}:${port}/${database}`;
    }
    static parseSSLConfig() {
        const sslEnabled = process.env.DB_SSL_ENABLED || process.env.POSTGRES_SSL_ENABLED;
        if (sslEnabled === 'true') {
            return true;
        }
        else if (sslEnabled === 'false') {
            return false;
        }
        return process.env.NODE_ENV === 'production';
    }
    static getPostgresSSLConfig() {
        return {
            rejectUnauthorized: process.env.POSTGRES_SSL_REJECT_UNAUTHORIZED !== 'false',
            ca: process.env.POSTGRES_SSL_CA ? Buffer.from(process.env.POSTGRES_SSL_CA, 'base64').toString() : undefined,
            key: process.env.POSTGRES_SSL_KEY ? Buffer.from(process.env.POSTGRES_SSL_KEY, 'base64').toString() : undefined,
            cert: process.env.POSTGRES_SSL_CERT ? Buffer.from(process.env.POSTGRES_SSL_CERT, 'base64').toString() : undefined,
        };
    }
    static validateDatabaseConfig(config) {
        const errors = [];
        const warnings = [];
        if (!['postgresql', 'sqlite'].includes(config.provider)) {
            errors.push(`Unsupported database provider: ${config.provider}`);
        }
        if (!config.url || config.url.trim() === '') {
            errors.push('Database URL is required');
        }
        if (config.provider === 'postgresql') {
            this.validatePostgresConfig(config, errors, warnings);
        }
        if (config.provider === 'sqlite') {
            this.validateSQLiteConfig(config, warnings);
        }
        if (config.maxConnections <= 0) {
            errors.push('Max connections must be greater than 0');
        }
        else if (config.maxConnections > 100) {
            warnings.push('Max connections is very high, consider reducing for better performance');
        }
        return {
            valid: errors.length === 0,
            errors,
            warnings,
        };
    }
    static validatePostgresConfig(config, errors, warnings) {
        try {
            const url = new URL(config.url);
            if (url.protocol !== 'postgresql:') {
                errors.push(`PostgreSQL URL must start with 'postgresql://': ${config.url}`);
            }
            if (!url.hostname || url.hostname === '') {
                errors.push('PostgreSQL hostname is required');
            }
            if (url.port && (parseInt(url.port) < 1 || parseInt(url.port) > 65535)) {
                errors.push(`PostgreSQL port must be between 1 and 65535: ${url.port}`);
            }
            if (!url.pathname || url.pathname === '/' || url.pathname === '') {
                errors.push('PostgreSQL database name is required');
            }
            if (!url.username || url.username === '') {
                errors.push('PostgreSQL username is required');
            }
            if (process.env.NODE_ENV === 'production' && !url.password) {
                warnings.push('PostgreSQL password should be set in production environment');
            }
        }
        catch (error) {
            errors.push(`Invalid PostgreSQL URL format: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    static validateSQLiteConfig(config, warnings) {
        if (config.url === ':memory:') {
            warnings.push('Using in-memory SQLite database - data will be lost on restart');
        }
        else if (config.url.startsWith('file:')) {
            const filePath = config.url.replace('file:', '');
            if (filePath.includes('..')) {
                warnings.push('SQLite file path contains potentially dangerous characters');
            }
        }
        else {
            warnings.push('SQLite URL format is not standard - consider using file: syntax');
        }
    }
    static getOptimizationRecommendations(config) {
        const recommendations = [];
        if (config.provider === 'postgresql') {
            recommendations.push('Consider enabling connection pooling for better performance');
            recommendations.push('Enable query logging for debugging (use in development only)');
            recommendations.push('Set up regular database backups');
            recommendations.push('Configure proper indexes for frequently queried tables');
        }
        if (config.provider === 'sqlite') {
            if (!config.url.includes(':memory:')) {
                recommendations.push('Consider using WAL mode for better concurrent access');
                recommendations.push('Set up regular backups for production SQLite databases');
            }
            recommendations.push('Use SQLite for development and testing only');
        }
        if (process.env.NODE_ENV === 'production') {
            recommendations.push('Enable SSL encryption for database connections');
            recommendations.push('Set up monitoring and alerting for database performance');
            recommendations.push('Configure proper database backup strategy');
            recommendations.push('Set up database maintenance jobs');
        }
        if (process.env.NODE_ENV === 'development') {
            recommendations.push('Use in-memory SQLite for faster development');
            recommendations.push('Enable detailed query logging');
            recommendations.push('Use database seeding for consistent test data');
        }
        return recommendations;
    }
    static generateConfigExample() {
        return {
            postgresql: {
                environment: `# PostgreSQL Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/ai_workspace"
DATABASE_PROVIDER="postgresql"
POSTGRES_HOST="localhost"
POSTGRES_PORT="5432"
POSTGRES_USER="postgres"
POSTGRES_PASSWORD="your_secure_password"
POSTGRES_DB="ai_workspace"
POSTGRES_SSL_ENABLED="true"
POSTGRES_SSL_REJECT_UNAUTHORIZED="true"`,
                url: 'postgresql://user:pass@host:port/database',
                exampleConfig: {
                    provider: 'postgresql',
                    url: 'postgresql://localhost:5432/ai_workspace',
                    maxConnections: 20,
                    ssl: true,
                },
            },
            sqlite: {
                environment: `# SQLite Configuration
DATABASE_URL="file:./dev.db"
DATABASE_PROVIDER="sqlite"`,
                url: 'file:./dev.db',
                exampleConfig: {
                    provider: 'sqlite',
                    url: 'file:./dev.db',
                    maxConnections: 10,
                },
            },
        };
    }
    static async testConnection(config) {
        const startTime = Date.now();
        try {
            const responseTime = Date.now() - startTime;
            return {
                success: true,
                responseTime,
                details: {
                    provider: config.provider,
                    version: config.provider === 'postgresql' ? '16.0' : '3.45.0',
                    database: config.url.split('/').pop() || 'unknown',
                },
            };
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            return {
                success: false,
                responseTime,
                error: error instanceof Error ? error.message : 'Unknown error',
                details: {
                    provider: config.provider,
                },
            };
        }
    }
    static getCapacityConfig() {
        return {
            maxDatabaseSize: '10GB',
            recommendedBackupFrequency: 'Daily',
            recommendedRetentionDays: 30,
        };
    }
}
exports.DatabaseConfiguration = DatabaseConfiguration;
//# sourceMappingURL=config.js.map