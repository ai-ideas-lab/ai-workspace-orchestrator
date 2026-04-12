import { z } from 'zod';
declare const ConfigSchema: z.ZodObject<{
    port: z.ZodDefault<z.ZodNumber>;
    host: z.ZodDefault<z.ZodString>;
    database: z.ZodObject<{
        url: z.ZodString;
        provider: z.ZodDefault<z.ZodEnum<["postgresql", "sqlite"]>>;
        maxConnections: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        url: string;
        provider: "postgresql" | "sqlite";
        maxConnections: number;
    }, {
        url: string;
        provider?: "postgresql" | "sqlite" | undefined;
        maxConnections?: number | undefined;
    }>;
    ai: z.ZodObject<{
        openai: z.ZodObject<{
            apiKey: z.ZodOptional<z.ZodString>;
            model: z.ZodDefault<z.ZodString>;
            maxTokens: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            model: string;
            maxTokens: number;
            apiKey?: string | undefined;
        }, {
            apiKey?: string | undefined;
            model?: string | undefined;
            maxTokens?: number | undefined;
        }>;
        anthropic: z.ZodObject<{
            apiKey: z.ZodOptional<z.ZodString>;
            model: z.ZodDefault<z.ZodString>;
            maxTokens: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            model: string;
            maxTokens: number;
            apiKey?: string | undefined;
        }, {
            apiKey?: string | undefined;
            model?: string | undefined;
            maxTokens?: number | undefined;
        }>;
        google: z.ZodObject<{
            apiKey: z.ZodOptional<z.ZodString>;
            model: z.ZodDefault<z.ZodString>;
            maxTokens: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            model: string;
            maxTokens: number;
            apiKey?: string | undefined;
        }, {
            apiKey?: string | undefined;
            model?: string | undefined;
            maxTokens?: number | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        openai: {
            model: string;
            maxTokens: number;
            apiKey?: string | undefined;
        };
        anthropic: {
            model: string;
            maxTokens: number;
            apiKey?: string | undefined;
        };
        google: {
            model: string;
            maxTokens: number;
            apiKey?: string | undefined;
        };
    }, {
        openai: {
            apiKey?: string | undefined;
            model?: string | undefined;
            maxTokens?: number | undefined;
        };
        anthropic: {
            apiKey?: string | undefined;
            model?: string | undefined;
            maxTokens?: number | undefined;
        };
        google: {
            apiKey?: string | undefined;
            model?: string | undefined;
            maxTokens?: number | undefined;
        };
    }>;
    auth: z.ZodObject<{
        jwtSecret: z.ZodString;
        jwtExpiry: z.ZodDefault<z.ZodString>;
        bcryptRounds: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        jwtSecret: string;
        jwtExpiry: string;
        bcryptRounds: number;
    }, {
        jwtSecret: string;
        jwtExpiry?: string | undefined;
        bcryptRounds?: number | undefined;
    }>;
    logging: z.ZodObject<{
        level: z.ZodDefault<z.ZodEnum<["debug", "info", "warn", "error"]>>;
        format: z.ZodDefault<z.ZodEnum<["json", "text"]>>;
    }, "strip", z.ZodTypeAny, {
        level: "error" | "info" | "warn" | "debug";
        format: "json" | "text";
    }, {
        level?: "error" | "info" | "warn" | "debug" | undefined;
        format?: "json" | "text" | undefined;
    }>;
    cache: z.ZodObject<{
        provider: z.ZodDefault<z.ZodEnum<["redis", "memory"]>>;
        ttl: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        provider: "redis" | "memory";
        ttl: number;
    }, {
        provider?: "redis" | "memory" | undefined;
        ttl?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    database: {
        url: string;
        provider: "postgresql" | "sqlite";
        maxConnections: number;
    };
    port: number;
    host: string;
    ai: {
        openai: {
            model: string;
            maxTokens: number;
            apiKey?: string | undefined;
        };
        anthropic: {
            model: string;
            maxTokens: number;
            apiKey?: string | undefined;
        };
        google: {
            model: string;
            maxTokens: number;
            apiKey?: string | undefined;
        };
    };
    auth: {
        jwtSecret: string;
        jwtExpiry: string;
        bcryptRounds: number;
    };
    logging: {
        level: "error" | "info" | "warn" | "debug";
        format: "json" | "text";
    };
    cache: {
        provider: "redis" | "memory";
        ttl: number;
    };
}, {
    database: {
        url: string;
        provider?: "postgresql" | "sqlite" | undefined;
        maxConnections?: number | undefined;
    };
    ai: {
        openai: {
            apiKey?: string | undefined;
            model?: string | undefined;
            maxTokens?: number | undefined;
        };
        anthropic: {
            apiKey?: string | undefined;
            model?: string | undefined;
            maxTokens?: number | undefined;
        };
        google: {
            apiKey?: string | undefined;
            model?: string | undefined;
            maxTokens?: number | undefined;
        };
    };
    auth: {
        jwtSecret: string;
        jwtExpiry?: string | undefined;
        bcryptRounds?: number | undefined;
    };
    logging: {
        level?: "error" | "info" | "warn" | "debug" | undefined;
        format?: "json" | "text" | undefined;
    };
    cache: {
        provider?: "redis" | "memory" | undefined;
        ttl?: number | undefined;
    };
    port?: number | undefined;
    host?: string | undefined;
}>;
export type Config = z.infer<typeof ConfigSchema>;
export declare const defaultConfig: Config;
export declare function validateConfig(config: Partial<Config>): Config;
export declare function createConfig(): Config;
export declare function getAIProviderConfig(provider: 'openai' | 'anthropic' | 'google'): {
    model: string;
    maxTokens: number;
    apiKey?: string | undefined;
} | {
    model: string;
    maxTokens: number;
    apiKey?: string | undefined;
} | {
    model: string;
    maxTokens: number;
    apiKey?: string | undefined;
};
export declare function isAIProviderAvailable(provider: 'openai' | 'anthropic' | 'google'): boolean;
export declare function getAvailableAIProviders(): ('openai' | 'anthropic' | 'google')[];
export {};
//# sourceMappingURL=config.d.ts.map