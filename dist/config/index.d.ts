export declare const config: {
    app: {
        name: string;
        version: string;
        environment: string;
        port: number;
        host: string;
    };
    server: {
        port: string | number;
        host: string;
        cors: {
            origin: string;
            credentials: boolean;
        };
    };
    database: {
        url: string;
        provider: "postgresql" | "sqlite";
        maxConnections: number;
        connectionTimeout: number;
        idleTimeout: number;
    };
    log: {
        level: string;
        file: string | undefined;
        format: string;
    };
    logging: {
        level: string;
        filePath: string | undefined;
        format: string;
    };
    ai: {
        openai: {
            apiKey: string | undefined;
            baseURL: string;
            models: {
                gpt4: string;
                gpt35: string;
                gpt4o: string;
            };
        };
        anthropic: {
            apiKey: string | undefined;
            baseURL: string;
            models: {
                sonnet: string;
                opus: string;
                haiku: string;
            };
        };
    };
    security: {
        jwtSecret: string;
        jwtExpiration: string;
        bcryptRounds: number;
        rateLimit: {
            windowMs: number;
            max: number;
        };
    };
    upload: {
        maxFileSize: number;
        allowedTypes: string[];
        uploadPath: string;
    };
    redis: {
        url: string;
        ttl: number;
    };
    email: {
        smtp: {
            host: string | undefined;
            port: number;
            secure: boolean;
            auth: {
                user: string | undefined;
                pass: string | undefined;
            };
        };
        from: string;
    };
    monitoring: {
        enabled: boolean;
        sentryDsn: string | undefined;
        prometheusPort: number;
    };
    features: {
        enableAuth: boolean;
        enableAnalytics: boolean;
        enableEmailNotifications: boolean;
        enableRateLimiting: boolean;
    };
};
export type Environment = 'development' | 'test' | 'production';
export declare function getEnvironment(): Environment;
export declare function isDevelopment(): boolean;
export declare function isProduction(): boolean;
export declare function isTest(): boolean;
export declare function getDatabaseURL(): string;
export declare function getJWTSecret(): string;
export declare function validateConfig(): {
    valid: boolean;
    errors: string[];
};
export declare function getConfigValue(path: string): any;
export declare function setConfigValue(path: string, value: any): void;
export declare function loadConfig(): typeof config;
//# sourceMappingURL=index.d.ts.map