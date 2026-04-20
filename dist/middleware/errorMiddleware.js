"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestIdMiddleware = void 0;
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
const responseUtils_js_1 = require("../utils/responseUtils.js");
const error_aggregator_js_1 = require("../utils/error-aggregator.js");
exports.requestIdMiddleware = (0, responseUtils_js_1.createRequestIdMiddleware)();
const errorAggregator = error_aggregator_js_1.ErrorAggregator.getInstance();
function globalErrorHandler(err, req, res, next) {
    const requestId = req.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const context = {
        path: req.path,
        method: req.method,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        userId: req.user?.id,
        sessionId: req.session?.id,
        requestId,
    };
    let severity = 'medium';
    if ((0, errors_js_1.isAppError)(err) && !err.isOperational) {
        severity = 'high';
    }
    else if (err.message.includes('critical') || err.message.includes('fatal')) {
        severity = 'critical';
    }
    const errorId = errorAggregator.recordError(err, context, severity);
    res.setHeader('X-Error-ID', errorId);
    logError(err, req, requestId, errorId);
    if (res.headersSent) {
        return next(err);
    }
    if ((0, errors_js_1.isAppError)(err)) {
        handleAppError(err, res, requestId, errorId);
    }
    else {
        handleGenericError(err, res, requestId, errorId);
    }
}
function logError(err, req, requestId, errorId) {
    const errorInfo = {
        requestId,
        errorId,
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
    if ((0, errors_js_1.isErrorOperational)(err)) {
        console.warn('业务逻辑错误:', errorInfo);
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
function handleGenericError(err, res, requestId, errorId) {
    const statusCode = 500;
    const isProduction = process.env.NODE_ENV === 'production';
    const response = {
        success: false,
        error: {
            code: 'INTERNAL_ERROR',
            message: isProduction ? '服务器内部错误' : err.message,
            details: isProduction ? undefined : {
                name: err.name,
                stack: err.stack,
                originalError: err.message,
            },
            requestId,
            errorId,
            timestamp: new Date().toISOString(),
        },
        meta: {
            timestamp: new Date().toISOString(),
            requestId,
        },
    };
    res.setHeader('X-Error-Code', 'INTERNAL_ERROR');
    res.setHeader('X-Request-ID', requestId);
    res.setHeader('X-Error-ID', errorId);
    res.status(statusCode).json(response);
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