export const config = {
    server: {
        port: process.env.PORT || 3000,
        host: process.env.HOST || 'localhost',
        cors: {
            origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
            credentials: true
        }
    },
    database: {
        url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/ai-workspace-orchestrator',
        maxConnections: 10,
        connectionTimeout: 30000,
        idleTimeout: 300000
    },
    log: {
        level: process.env.LOG_LEVEL || 'info',
        file: process.env.LOG_FILE,
        format: 'json'
    },
    ai: {
        openai: {
            apiKey: process.env.OPENAI_API_KEY,
            baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
            models: {
                gpt4: 'gpt-4-turbo-preview',
                gpt35: 'gpt-3.5-turbo',
                gpt4o: 'gpt-4o'
            }
        },
        anthropic: {
            apiKey: process.env.ANTHROPIC_API_KEY,
            baseURL: process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com/v1',
            models: {
                sonnet: 'claude-3-sonnet-20240229',
                opus: 'claude-3-opus-20240229',
                haiku: 'claude-3-haiku-20240307'
            }
        }
    },
    security: {
        jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
        jwtExpiration: '24h',
        bcryptRounds: 12,
        rateLimit: {
            windowMs: 15 * 60 * 1000,
            max: 100
        }
    },
    upload: {
        maxFileSize: 10 * 1024 * 1024,
        allowedTypes: [
            'image/jpeg',
            'image/png',
            'image/gif',
            'application/pdf',
            'text/plain',
            'text/csv',
            'application/json'
        ],
        uploadPath: process.env.UPLOAD_PATH || './uploads'
    },
    redis: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        ttl: 3600
    },
    email: {
        smtp: {
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        },
        from: process.env.EMAIL_FROM || 'noreply@ai-workspace.com'
    },
    monitoring: {
        enabled: process.env.MONITORING_ENABLED === 'true',
        sentryDsn: process.env.SENTRY_DSN,
        prometheusPort: parseInt(process.env.PROMETHEUS_PORT || '9090')
    },
    features: {
        enableAuth: process.env.ENABLE_AUTH !== 'false',
        enableAnalytics: process.env.ENABLE_ANALYTICS !== 'false',
        enableEmailNotifications: process.env.ENABLE_EMAIL_NOTIFICATIONS !== 'false',
        enableRateLimiting: process.env.ENABLE_RATE_LIMITING !== 'false'
    }
};
export function getEnvironment() {
    return process.env.NODE_ENV || 'development';
}
export function isDevelopment() {
    return getEnvironment() === 'development';
}
export function isProduction() {
    return getEnvironment() === 'production';
}
export function isTest() {
    return getEnvironment() === 'test';
}
export function getDatabaseURL() {
    return config.database.url;
}
export function getJWTSecret() {
    return config.security.jwtSecret;
}
export function validateConfig() {
    const errors = [];
    if (!config.ai.openai.apiKey && getEnvironment() === 'production') {
        errors.push('OPENAI_API_KEY is required in production');
    }
    if (!config.ai.anthropic.apiKey && getEnvironment() === 'production') {
        errors.push('ANTHROPIC_API_KEY is required in production');
    }
    if (!config.security.jwtSecret && getEnvironment() === 'production') {
        errors.push('JWT_SECRET is required in production');
    }
    if (!config.database.url) {
        errors.push('DATABASE_URL is required');
    }
    return {
        valid: errors.length === 0,
        errors
    };
}
export function getConfigValue(path) {
    const keys = path.split('.');
    let value = config;
    for (const key of keys) {
        if (value && typeof value === 'object' && key in value) {
            value = value[key];
        }
        else {
            return undefined;
        }
    }
    return value;
}
export function setConfigValue(path, value) {
    const keys = path.split('.');
    let current = config;
    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (key && (!(key in current) || typeof current[key] !== 'object')) {
            current[key] = {};
        }
        current = current ? current[key] : undefined;
    }
    const lastKey = keys[keys.length - 1];
    if (lastKey && current) {
        current[lastKey] = value;
    }
}
//# sourceMappingURL=index.js.map