"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultConfig = void 0;
exports.validateConfig = validateConfig;
exports.createConfig = createConfig;
exports.getAIProviderConfig = getAIProviderConfig;
exports.isAIProviderAvailable = isAIProviderAvailable;
exports.getAvailableAIProviders = getAvailableAIProviders;
const zod_1 = require("zod");
const ConfigSchema = zod_1.z.object({
    port: zod_1.z.number().default(3000),
    host: zod_1.z.string().default('localhost'),
    database: zod_1.z.object({
        url: zod_1.z.string(),
        provider: zod_1.z.enum(['postgresql', 'sqlite']).default('sqlite'),
        maxConnections: zod_1.z.number().default(10),
    }),
    ai: zod_1.z.object({
        openai: zod_1.z.object({
            apiKey: zod_1.z.string().optional(),
            model: zod_1.z.string().default('gpt-4'),
            maxTokens: zod_1.z.number().default(2000),
        }),
        anthropic: zod_1.z.object({
            apiKey: zod_1.z.string().optional(),
            model: zod_1.z.string().default('claude-3-opus-20240229'),
            maxTokens: zod_1.z.number().default(2000),
        }),
        google: zod_1.z.object({
            apiKey: zod_1.z.string().optional(),
            model: zod_1.z.string().default('gemini-pro'),
            maxTokens: zod_1.z.number().default(2000),
        }),
    }),
    auth: zod_1.z.object({
        jwtSecret: zod_1.z.string().min(32),
        jwtExpiry: zod_1.z.string().default('24h'),
        bcryptRounds: zod_1.z.number().default(12),
    }),
    logging: zod_1.z.object({
        level: zod_1.z.enum(['debug', 'info', 'warn', 'error']).default('info'),
        format: zod_1.z.enum(['json', 'text']).default('json'),
    }),
    cache: zod_1.z.object({
        provider: zod_1.z.enum(['redis', 'memory']).default('memory'),
        ttl: zod_1.z.number().default(3600),
    }),
});
exports.defaultConfig = {
    port: 3000,
    host: 'localhost',
    database: {
        url: process.env.DATABASE_URL || 'file:./dev.db',
        provider: 'sqlite',
        maxConnections: 10,
    },
    ai: {
        openai: {
            model: 'gpt-4',
            maxTokens: 2000,
        },
        anthropic: {
            model: 'claude-3-opus-20240229',
            maxTokens: 2000,
        },
        google: {
            model: 'gemini-pro',
            maxTokens: 2000,
        },
    },
    auth: {
        jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-this-in-production',
        jwtExpiry: '24h',
        bcryptRounds: 12,
    },
    logging: {
        level: 'info',
        format: 'json',
    },
    cache: {
        provider: 'memory',
        ttl: 3600,
    },
};
function validateConfig(config) {
    return ConfigSchema.parse(config);
}
function createConfig() {
    const envConfig = {
        port: parseInt(process.env.PORT || '3000'),
        host: process.env.HOST || 'localhost',
        database: {
            url: process.env.DATABASE_URL || 'file:./dev.db',
            provider: process.env.DATABASE_PROVIDER || 'sqlite',
            maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10'),
        },
        ai: {
            openai: {
                apiKey: process.env.OPENAI_API_KEY,
                model: process.env.OPENAI_MODEL || 'gpt-4',
                maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '2000'),
            },
            anthropic: {
                apiKey: process.env.ANTHROPIC_API_KEY,
                model: process.env.ANTHROPIC_MODEL || 'claude-3-opus-20240229',
                maxTokens: parseInt(process.env.ANTHROPIC_MAX_TOKENS || '2000'),
            },
            google: {
                apiKey: process.env.GOOGLE_AI_API_KEY,
                model: process.env.GOOGLE_MODEL || 'gemini-pro',
                maxTokens: parseInt(process.env.GOOGLE_MAX_TOKENS || '2000'),
            },
        },
        auth: {
            jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-this-in-production',
            jwtExpiry: process.env.JWT_EXPIRY || '24h',
            bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
        },
        logging: {
            level: process.env.LOG_LEVEL || 'info',
            format: process.env.LOG_FORMAT || 'json',
        },
        cache: {
            provider: process.env.CACHE_PROVIDER || 'memory',
            ttl: Math.max(1, parseInt(process.env.CACHE_TTL || '3600')),
        },
    };
    return validateConfig({ ...exports.defaultConfig, ...envConfig });
}
function getAIProviderConfig(provider) {
    const config = createConfig();
    return config.ai[provider];
}
function isAIProviderAvailable(provider) {
    const config = getAIProviderConfig(provider);
    return !!config.apiKey;
}
function getAvailableAIProviders() {
    const providers = [];
    if (isAIProviderAvailable('openai'))
        providers.push('openai');
    if (isAIProviderAvailable('anthropic'))
        providers.push('anthropic');
    if (isAIProviderAvailable('google'))
        providers.push('google');
    return providers;
}
//# sourceMappingURL=config.js.map