interface ErrorContext {
    requestId: string;
    userId?: string;
    sessionId?: string;
    userAgent: string;
    ip: string;
    method: string;
    url: string;
    headers: Record<string, string>;
    timestamp: string;
    environment: string;
    version: string;
    traceId?: string;
    spanId?: string;
}
interface ErrorDetails {
    error: {
        name: string;
        message: string;
        stack?: string;
        code?: string;
        statusCode?: number;
    };
    context: ErrorContext;
    metadata?: Record<string, unknown>;
    duration?: number;
    memoryUsage?: {
        rss: number;
        heapTotal: number;
        heapUsed: number;
        external: number;
    };
}
export declare class EnhancedErrorLogger {
    private static instance;
    private logs;
    private constructor();
    static getInstance(): EnhancedErrorLogger;
    logError(error: unknown, context: Partial<ErrorContext>, metadata?: Record<string, unknown>): void;
    logApiError(error: unknown, req: any, res: any, metadata?: Record<string, unknown>): void;
    logDatabaseError(error: unknown, operation: string, table: string, query?: string, metadata?: Record<string, unknown>): void;
    logExternalServiceError(error: unknown, service: string, endpoint: string, request?: any, response?: any): void;
    getErrorStats(): {
        total: number;
        operational: number;
        system: number;
        byErrorCode: Record<string, number>;
        byStatusCode: Record<number, number>;
        recent24h: number;
    };
    getRecentErrors(limit?: number): ErrorDetails[];
    clearOldLogs(olderThanMs?: number): void;
    private getClientIp;
    private getDuration;
    private getMemoryUsage;
    private normalizeContext;
}
export declare const errorLogger: EnhancedErrorLogger;
export {};
//# sourceMappingURL=enhanced-error-logger.d.ts.map