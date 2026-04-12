"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateDatabaseConfig = validateDatabaseConfig;
function validateDatabaseConfig(config) {
    const errors = [];
    const warnings = [];
    if (!['postgresql', 'sqlite'].includes(config.provider)) {
        errors.push(`Unsupported database provider: ${config.provider}`);
    }
    if (!config.url || config.url.trim() === '') {
        errors.push('Database URL is required');
    }
    if (config.provider === 'postgresql') {
        validatePostgresConfig(config, errors, warnings);
    }
    if (config.provider === 'sqlite') {
        validateSQLiteConfig(config, warnings);
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
function validatePostgresConfig(config, errors, warnings) {
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
function validateSQLiteConfig(config, warnings) {
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
//# sourceMappingURL=validation.js.map