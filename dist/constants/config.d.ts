export declare const TIME_CONFIG: {
    readonly SHORT_DELAY: 1000;
    readonly MEDIUM_DELAY: 2000;
    readonly LONG_DELAY: 5000;
    readonly EXTRA_LONG_DELAY: 30000;
    readonly VERY_SHORT_DELAY: 100;
    readonly RETRY_BASE_DELAY: 1000;
    readonly CACHE_TTL_SHORT: number;
    readonly CACHE_TTL_MEDIUM: number;
    readonly CACHE_TTL_LONG: number;
    readonly REQUEST_TIMEOUT: 10000;
    readonly HEALTH_CHECK_INTERVAL: 30000;
    readonly SESSION_TIMEOUT: number;
};
export declare const RETRY_CONFIG: {
    readonly MAX_RETRIES_DEFAULT: 3;
    readonly MAX_RETRIES_CRITICAL: 5;
    readonly MAX_RETRIES_NON_CRITICAL: 2;
    readonly BASE_DELAY_MS: 1000;
    readonly MAX_DELAY_MS: 5000;
    readonly RETRY_MULTIPLIER: 2;
    readonly RETRY_JITTER_FACTOR: 0.1;
};
export declare const HTTP_STATUS: {
    readonly OK: 200;
    readonly CREATED: 201;
    readonly BAD_REQUEST: 400;
    readonly UNAUTHORIZED: 401;
    readonly FORBIDDEN: 403;
    readonly NOT_FOUND: 404;
    readonly INTERNAL_SERVER_ERROR: 500;
    readonly BAD_GATEWAY: 502;
    readonly SERVICE_UNAVAILABLE: 503;
    readonly GATEWAY_TIMEOUT: 504;
};
export declare const DATABASE_CONFIG: {
    readonly MAX_CONNECTIONS: 10;
    readonly CONNECTION_TIMEOUT: 5000;
    readonly IDLE_TIMEOUT: 30000;
    readonly MAX_LIFETIME: 1800000;
    readonly QUERY_TIMEOUT: 10000;
    readonly RETRY_COUNT: 3;
};
export declare const PAGINATION_CONFIG: {
    readonly DEFAULT_PAGE_SIZE: 20;
    readonly MAX_PAGE_SIZE: 100;
    readonly PAGE_SIZE_OPTIONS: readonly [10, 20, 50, 100];
};
export declare const CACHE_CONFIG: {
    readonly DEFAULT_TTL: 300;
    readonly MAX_TTL: 3600;
    readonly CLEANUP_INTERVAL: 600;
    readonly MAX_SIZE: 1000;
};
export declare const UPLOAD_CONFIG: {
    readonly MAX_FILE_SIZE: number;
    readonly ALLOWED_TYPES: readonly ["image/jpeg", "image/png", "application/pdf", "text/plain"];
    readonly MAX_FILES: 5;
};
export declare const LOG_CONFIG: {
    readonly LEVELS: readonly ["error", "warn", "info", "debug"];
    readonly MAX_LOG_SIZE: number;
    readonly MAX_LOG_FILES: 5;
    readonly LOG_FORMAT: "json";
};
export type TimeConfig = typeof TIME_CONFIG;
export type RetryConfig = typeof RETRY_CONFIG;
export type HttpStatus = typeof HTTP_STATUS[keyof typeof HTTP_STATUS];
export type DatabaseConfig = typeof DATABASE_CONFIG;
export type PaginationConfig = typeof PAGINATION_CONFIG;
export type CacheConfig = typeof CACHE_CONFIG;
export type UploadConfig = typeof UPLOAD_CONFIG;
export type LogConfig = typeof LOG_CONFIG;
//# sourceMappingURL=config.d.ts.map