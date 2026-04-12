import { z } from 'zod';
const ConfigSchema = z.object({
    port: z.number().default(3000),
    host: z.string().default('localhost'),
    database: z.object({
        url: z.string(),
        provider: z.enum(['postgresql', 'sqlite']).default('sqlite'),
        maxConnections: z.number().default(10),
    }),
    ai: z.object({
        openai: z.object({
            apiKey: z.string().optional(),
            model: z.string().default('gpt-4'),
            maxTokens: z.number().default(2000),
        }),
        anthropic: z.object({
            apiKey: z.string().optional(),
            model: z.string().default('claude-3-opus-20240229'),
            maxTokens: z.number().default(2000),
        }),
        google: z.object({
            apiKey: z.string().optional(),
            model: z.string().default('gemini-pro'),
            maxTokens: z.number().default(2000),
        }),
    }),
    auth: z.object({
        jwtSecret: z.string().min(32),
        jwtExpiry: z.string().default('24h'),
        bcryptRounds: z.number().default(12),
    }),
    logging: z.object({
        level: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
        format: z.enum(['json', 'text']).default('json'),
    }),
    cache: z.object({
        provider: z.enum(['redis', 'memory']).default('memory'),
        ttl: z.number().default(3600),
    }),
});
export const defaultConfig = {
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
export function validateConfig(config) {
    return ConfigSchema.parse(config);
}
export function createConfig() {
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
            ttl: parseInt(process.env.CACHE_TTL || '3600'),
        },
    };
    return validateConfig({ ...defaultConfig, ...envConfig });
}
export function getAIProviderConfig(provider) {
    const config = createConfig();
    return config.ai[provider];
}
export function isAIProviderAvailable(provider) {
    const config = getAIProviderConfig(provider);
    return !!config.apiKey;
}
export function getAvailableAIProviders() {
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