"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRequestIdMiddleware = createRequestIdMiddleware;
exports.globalErrorHandler = globalErrorHandler;
exports.notFoundHandler = notFoundHandler;
exports.methodNotAllowedHandler = methodNotAllowedHandler;
exports.asyncRouteHandler = asyncRouteHandler;
exports.setupUnhandledRejectionListener = setupUnhandledRejectionListener;
exports.setupUncaughtExceptionListener = setupUncaughtExceptionListener;
exports.setupWarningListener = setupWarningListener;
exports.setupUnhandledAsyncErrorListener = setupUnhandledAsyncErrorListener;
exports.setupGlobalErrorMonitoring = setupGlobalErrorMonitoring;
const errors_js_1 = require("../utils/errors.js");
function createRequestIdMiddleware() {
    return (req, res, next) => {
        req.requestId = req.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        next();
    };
}
const error_aggregator_js_1 = require("../utils/error-aggregator.js");
const circuit_breaker_js_1 = require("../services/circuit-breaker.js");
const circuitBreakers = new Map();
const config_js_1 = require("../constants/config.js");
function getCircuitBreaker(service) {
    if (!circuitBreakers.has(service)) {
        circuitBreakers.set(service, new circuit_breaker_js_1.CircuitBreaker({
            failureThreshold: 5,
            resetTimeoutMs: config_js_1.TIME_CONFIG.EXTRA_LONG_DELAY,
            halfOpenMaxAttempts: 1,
        }));
    }
    return circuitBreakers.get(service);
}
function updateCircuitBreakerState(service, error) {
    const circuitBreaker = getCircuitBreaker(service);
    if (shouldTriggerCircuitBreak(error)) {
        circuitBreaker.recordFailure();
        console.warn(`熔断器触发: ${service} 进入OPEN状态`);
    }
    else {
        circuitBreaker.recordSuccess();
    }
}
const CIRCUIT_BREAK_PATTERNS = [
    'ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED',
    'database', 'connection', 'timeout',
    'AI_ENGINE_ERROR', 'external service'
];
function containsCircuitBreakPattern(error) {
    return CIRCUIT_BREAK_PATTERNS.some(pattern => error.message.includes(pattern));
}
function shouldTriggerCircuitBreak(error) {
    return containsCircuitBreakPattern(error);
}
function isServiceCircuited(service) {
    const circuitBreaker = getCircuitBreaker(service);
    return circuitBreaker.getState() === 'OPEN';
}
function globalErrorHandler(err, req, res, next) {
    const requestId = req.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const service = identifyServiceFromError(err, req);
    updateCircuitBreakerState(service, err);
    const context = {
        path: req.path,
        method: req.method,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        userId: req.user?.id,
        sessionId: req.session?.id,
        requestId,
        service,
        circuitState: isServiceCircuited(service) ? 'OPEN' : 'CLOSED',
    };
    let severity = 'medium';
    if ((0, errors_js_1.isAppError)(err) && !err.isOperational) {
        severity = 'high';
    }
    else if (err.message.includes('critical') || err.message.includes('fatal')) {
        severity = 'critical';
    }
    else if (isServiceCircuited(service)) {
        severity = 'high';
    }
    const errorId = error_aggregator_js_1.errorAggregator.recordError(err, context, severity);
    res.setHeader('X-Error-ID', errorId);
    res.setHeader('X-Circuit-State', circuitBreakers.get(service)?.getState() || 'CLOSED');
    logError(err, req, requestId, errorId, service);
    if (res.headersSent) {
        return next(err);
    }
    if ((0, errors_js_1.isAppError)(err)) {
        handleAppError(err, res, requestId, errorId);
    }
    else {
        handleGenericError(err, res, requestId, errorId, req);
    }
}
function identifyServiceFromError(error, req) {
    const path = req.path || '';
    if (path.includes('/api/ai') || path.includes('/workflow')) {
        return 'ai-engine';
    }
    if (path.includes('/api/database') || path.includes('/db')) {
        return 'database';
    }
    if (path.includes('/api/auth') || path.includes('/login')) {
        return 'auth';
    }
    if (path.includes('/api/queue') || path.includes('/request')) {
        return 'request-queue';
    }
    if (error.message.includes('database') || error.message.includes('prisma')) {
        return 'database';
    }
    if (error.message.includes('ai') || error.message.includes('engine')) {
        return 'ai-engine';
    }
    if (error.message.includes('auth') || error.message.includes('token')) {
        return 'auth';
    }
    return 'unknown';
}
function logError(err, req, requestId, errorId, service) {
    const errorInfo = {
        requestId,
        errorId,
        service,
        circuitState: service ? getCircuitBreaker(service).getState() : 'unknown',
        error: {
            name: err.name,
            message: err.message,
            stack: err.stack,
            code: err.code,
        },
        request: {
            method: req.method,
            url: req.url,
            userAgent: req.get('User-Agent'),
            ip: req.ip,
            headers: {
                'content-type': req.get('Content-Type'),
                'content-length': req.get('Content-Length'),
            },
        },
        timestamp: new Date().toISOString(),
    };
    const circuitState = service ? getCircuitBreaker(service).getState() : 'unknown';
    if ((0, errors_js_1.isErrorOperational)(err)) {
        console.warn('业务逻辑错误:', errorInfo);
    }
    else if (circuitState === 'OPEN') {
        console.warn('系统错误(熔断中):', errorInfo);
    }
    else {
        console.error('系统错误:', errorInfo);
    }
    if (err instanceof UnhandledPromiseRejection) {
        console.error('未处理的Promise拒绝:', errorInfo);
    }
}
function handleAppError(err, res, requestId, errorId) {
    const statusCode = err.statusCode;
    const response = {
        success: false,
        error: {
            code: err.errorCode,
            message: err.userMessage || err.message,
            details: err.details,
            requestId,
            errorId,
            timestamp: new Date().toISOString(),
        },
        meta: {
            timestamp: new Date().toISOString(),
            requestId,
        },
    };
    res.setHeader('X-Error-Code', err.errorCode);
    res.setHeader('X-Request-ID', requestId);
    res.setHeader('X-Error-ID', errorId);
    res.status(statusCode).json(response);
}
function handleGenericError(err, res, requestId, errorId, req) {
    const statusCode = 500;
    const isProduction = process.env.NODE_ENV === 'production';
    const service = req ? identifyServiceFromError(err, req) : 'unknown';
    const circuitState = service !== 'unknown' ? getCircuitBreaker(service).getState() : 'unknown';
    let responseMessage = isProduction ? '服务器内部错误' : err.message;
    let responseCode = 'INTERNAL_ERROR';
    let statusCode_1 = statusCode;
    if (circuitState === 'OPEN') {
        responseMessage = service === 'ai-engine' ? 'AI服务暂时不可用，请稍后重试' :
            service === 'database' ? '数据库服务暂时不可用，请稍后重试' :
                '服务暂时不可用，请稍后重试';
        responseCode = 'SERVICE_UNAVAILABLE';
        statusCode_1 = 503;
        const circuitBreaker = getCircuitBreaker(service);
        const resetTime = circuitBreaker.getResetTime();
        if (resetTime) {
            responseMessage += `（预计${Math.ceil((resetTime - Date.now()) / 1000)}秒后恢复）`;
        }
    }
    const response = {
        success: false,
        error: {
            code: responseCode,
            message: responseMessage,
            details: isProduction ? undefined : {
                name: err.name,
                stack: err.stack,
                originalError: err.message,
                service,
                circuitState,
            },
            requestId,
            errorId,
            timestamp: new Date().toISOString(),
        },
        meta: {
            timestamp: new Date().toISOString(),
            requestId,
            service,
            circuitState,
        },
    };
    res.setHeader('X-Error-Code', responseCode);
    res.setHeader('X-Request-ID', requestId);
    res.setHeader('X-Error-ID', errorId);
    res.setHeader('X-Circuit-State', circuitState);
    res.status(statusCode_1).json(response);
}
function notFoundHandler(req, res) {
    const requestId = req.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const response = {
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: `路径 ${req.method} ${req.originalUrl} 不存在`,
            details: {
                path: req.originalUrl,
                method: req.method,
                timestamp: new Date().toISOString(),
            },
            requestId,
            timestamp: new Date().toISOString(),
        },
        meta: {
            timestamp: new Date().toISOString(),
            requestId,
        },
    };
    res.setHeader('X-Error-Code', 'NOT_FOUND');
    res.setHeader('X-Request-ID', requestId);
    res.status(404).json(response);
}
function methodNotAllowedHandler(req, res) {
    const requestId = req.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const response = {
        success: false,
        error: {
            code: 'METHOD_NOT_ALLOWED',
            message: `方法 ${req.method} 不允许用于 ${req.originalUrl}`,
            details: {
                allowedMethods: res.get('Allow'),
                path: req.originalUrl,
                method: req.method,
            },
            requestId,
            timestamp: new Date().toISOString(),
        },
        meta: {
            timestamp: new Date().toISOString(),
            requestId,
        },
    };
    res.setHeader('X-Error-Code', 'METHOD_NOT_ALLOWED');
    res.setHeader('X-Request-ID', requestId);
    res.status(405).json(response);
}
function asyncRouteHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next))
            .catch(next)
            .catch(err => {
            if (!(0, errors_js_1.isAppError)(err)) {
                err = new Error(err.message);
            }
            next(err);
        });
    };
}
function setupUnhandledRejectionListener() {
    process.on('unhandledRejection', (reason, promise) => {
        const err = new Error(`Unhandled Promise Rejection: ${String(reason)}`);
        err.isUnhandledRejection = true;
        console.error('未处理的Promise拒绝:', {
            reason,
            promise,
            stack: err.stack,
        });
        if (process.env.NODE_ENV !== 'production') {
            throw err;
        }
    });
}
function setupUncaughtExceptionListener() {
    process.on('uncaughtException', (error) => {
        console.error('未捕获的异常:', error);
        process.exit(1);
    });
}
function setupWarningListener() {
    process.on('warning', (warning) => {
        console.warn('进程警告:', warning);
    });
}
function setupUnhandledAsyncErrorListener() {
    process.on('unhandledRejection', (reason, promise) => {
        const err = new Error(`Unhandled Promise Rejection: ${String(reason)}`);
        err.isUnhandledRejection = true;
        err.promise = promise;
        console.error('未处理的Promise拒绝:', {
            reason,
            promise,
            stack: err.stack,
            timestamp: new Date().toISOString(),
        });
        if (process.env.NODE_ENV !== 'production') {
            throw err;
        }
    });
    process.on('uncaughtException', (error) => {
        console.error('未捕获的异常:', {
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
        });
        process.exit(1);
    });
}
function setupGlobalErrorMonitoring() {
    setupUnhandledRejectionListener();
    setupUncaughtExceptionListener();
    setupWarningListener();
    setupUnhandledAsyncErrorListener();
}
class UnhandledPromiseRejection extends Error {
    constructor(message) {
        super(message);
        this.name = 'UnhandledPromiseRejection';
    }
}
//# sourceMappingURL=errorMiddleware.js.map