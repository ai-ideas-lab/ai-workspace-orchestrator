"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorLogger = exports.EnhancedErrorLogger = void 0;
const errors_js_1 = require("./errors.js");
class EnhancedErrorLogger {
    constructor() {
        this.logs = [];
    }
    static getInstance() {
        if (!EnhancedErrorLogger.instance) {
            EnhancedErrorLogger.instance = new EnhancedErrorLogger();
        }
        return EnhancedErrorLogger.instance;
    }
    logError(error, context, metadata) {
        const errorDetails = {
            error: {
                name: error instanceof Error ? error.name : 'UnknownError',
                message: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                code: error.code,
                statusCode: error.statusCode,
            },
            context: this.normalizeContext(context),
            metadata,
            duration: this.getDuration(),
            memoryUsage: this.getMemoryUsage(),
        };
        if ((0, errors_js_1.isErrorOperational)(error) || error instanceof errors_js_1.AppError) {
            console.warn(`[${errorDetails.context.requestId}] 业务逻辑错误:`, errorDetails);
        }
        else {
            console.error(`[${errorDetails.context.requestId}] 系统错误:`, errorDetails);
        }
        this.logs.push(errorDetails);
        if (this.logs.length > 1000) {
            this.logs = this.logs.slice(-1000);
        }
    }
    logApiError(error, req, res, metadata) {
        const context = {
            requestId: req.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId: req.user?.id,
            sessionId: req.session?.id,
            userAgent: req.get('User-Agent') || '',
            ip: this.getClientIp(req),
            method: req.method,
            url: req.originalUrl,
            headers: {
                'content-type': req.get('Content-Type'),
                'content-length': req.get('Content-Length'),
                'authorization': req.get('Authorization') ? 'Bearer ***' : undefined,
                'x-forwarded-for': req.get('X-Forwarded-For'),
                'x-real-ip': req.get('X-Real-IP'),
            },
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            version: process.env.npm_package_version || '1.0.0',
        };
        this.logError(error, context, {
            ...metadata,
            response: {
                statusCode: res.statusCode,
                headers: res.getHeaders(),
            },
        });
    }
    logDatabaseError(error, operation, table, query, metadata) {
        this.logError(error, {
            requestId: `db_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
        }, {
            operation,
            table,
            query,
            ...metadata,
        });
    }
    logExternalServiceError(error, service, endpoint, request, response) {
        const context = {
            requestId: `ext_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
        };
        this.logError(error, context, {
            service,
            endpoint,
            request,
            response,
            latency: response?.latency,
        });
    }
    getErrorStats() {
        const now = Date.now();
        const dayAgo = now - 24 * 60 * 60 * 1000;
        const recentErrors = this.logs.filter(log => new Date(log.context.timestamp).getTime() > dayAgo);
        const operational = recentErrors.filter(log => (0, errors_js_1.isErrorOperational)(log.error));
        const system = recentErrors.filter(log => !(0, errors_js_1.isErrorOperational)(log.error));
        const byErrorCode = {};
        const byStatusCode = {};
        recentErrors.forEach(log => {
            const errorCode = log.error.code || 'UNKNOWN';
            const statusCode = log.error.statusCode || 500;
            byErrorCode[errorCode] = (byErrorCode[errorCode] || 0) + 1;
            byStatusCode[statusCode] = (byStatusCode[statusCode] || 0) + 1;
        });
        return {
            total: recentErrors.length,
            operational: operational.length,
            system: system.length,
            byErrorCode,
            byStatusCode,
            recent24h: recentErrors.length,
        };
    }
    getRecentErrors(limit = 50) {
        return this.logs.slice(-limit);
    }
    clearOldLogs(olderThanMs = 7 * 24 * 60 * 60 * 1000) {
        const cutoff = Date.now() - olderThanMs;
        this.logs = this.logs.filter(log => new Date(log.context.timestamp).getTime() > cutoff);
    }
    getClientIp(req) {
        return (req.headers['x-forwarded-for']?.split(',')[0] ||
            req.headers['x-real-ip'] ||
            req.connection?.remoteAddress ||
            req.socket?.remoteAddress ||
            'unknown');
    }
    getDuration() {
        if (global.performance && performance.now) {
            return performance.now();
        }
        return Date.now();
    }
    getMemoryUsage() {
        if (global.performance && performance.memory) {
            return {
                rss: performance.memory.rss,
                heapTotal: performance.memory.heapTotal,
                heapUsed: performance.memory.heapUsed,
                external: performance.memory.external,
            };
        }
        return {
            rss: 0,
            heapTotal: 0,
            heapUsed: 0,
            external: 0,
        };
    }
    normalizeContext(context) {
        return {
            requestId: context.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId: context.userId || undefined,
            sessionId: context.sessionId || undefined,
            userAgent: context.userAgent || '',
            ip: context.ip || 'unknown',
            method: context.method || 'unknown',
            url: context.url || 'unknown',
            headers: context.headers || {},
            timestamp: context.timestamp || new Date().toISOString(),
            environment: context.environment || process.env.NODE_ENV || 'development',
            version: context.version || process.env.npm_package_version || '1.0.0',
            traceId: context.traceId,
            spanId: context.spanId,
        };
    }
}
exports.EnhancedErrorLogger = EnhancedErrorLogger;
exports.errorLogger = EnhancedErrorLogger.getInstance();
//# sourceMappingURL=enhanced-error-logger.js.map