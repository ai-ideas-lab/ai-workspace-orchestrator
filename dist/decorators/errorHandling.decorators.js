"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withErrorHandling = withErrorHandling;
exports.withRetry = withRetry;
exports.withTransactionErrorHandler = withTransactionErrorHandler;
exports.withInputValidation = withInputValidation;
exports.withPerformanceMonitoring = withPerformanceMonitoring;
const errors_js_1 = require("./errors.js");
const enhanced_error_logger_js_1 = require("./enhanced-error-logger.js");
function withErrorHandling(options = {}) {
    const { logErrors = true, sanitizeUserError = true, defaultErrorCode = 'INTERNAL_ERROR', defaultStatusCode = 500, } = options;
    return function (target, propertyName, descriptor) {
        const method = descriptor.value;
        descriptor.value = async function (req, res, next) {
            try {
                const result = await method.apply(this, [req, res, next]);
                if (res.headersSent) {
                    return result;
                }
                return result;
            }
            catch (error) {
                if (logErrors) {
                    enhanced_error_logger_js_1.logger.error(`控制器方法错误: ${target.constructor.name}.${propertyName}`, {
                        error: error instanceof Error ? error.message : String(error),
                        stack: error instanceof Error ? error.stack : undefined,
                        requestId: req.requestId,
                        userId: req.user?.id,
                        method: req.method,
                        url: req.originalUrl,
                    });
                }
                const appError = normalizeError(error, options);
                if (!res.headersSent) {
                    sendErrorResponse(res, appError);
                }
                if (!res.headersSent && next) {
                    next(appError);
                }
            }
        };
        return descriptor;
    };
}
function withRetry(options = {}) {
    const { maxRetries = 2, delayMs = 100, retryCondition = (error) => error instanceof errors_js_1.SystemError ||
        error.message.includes('timeout') ||
        error.message.includes('network') } = options;
    return function (target, propertyName, descriptor) {
        const method = descriptor.value;
        descriptor.value = async function (req, res, next) {
            let lastError;
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    return await method.apply(this, [req, res, next]);
                }
                catch (error) {
                    lastError = error;
                    if (!retryCondition(error) || attempt === maxRetries) {
                        break;
                    }
                    await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
                }
            }
            throw normalizeError(lastError, options);
        };
        return descriptor;
    };
}
function withTransactionErrorHandler(operationName = 'database operation') {
    return function (target, propertyName, descriptor) {
        const method = descriptor.value;
        descriptor.value = async function (req, res, next) {
            try {
                const result = await method.apply(this, [req, res, next]);
                return result;
            }
            catch (error) {
                enhanced_error_logger_js_1.logger.error(`${operationName} 失败:`, {
                    error: error instanceof Error ? error.message : String(error),
                    stack: error instanceof Error ? error.stack : undefined,
                    requestId: req.requestId,
                    userId: req.user?.id,
                    operation: operationName,
                });
                const appError = normalizeDatabaseError(error, operationName);
                sendErrorResponse(res, appError);
            }
        };
        return descriptor;
    };
}
function normalizeError(error, options) {
    const { sanitizeUserError = true, defaultErrorCode = 'INTERNAL_ERROR', defaultStatusCode = 500, } = options;
    if (error instanceof errors_js_1.AppError) {
        return error;
    }
    if (error instanceof Error) {
        let userMessage = error.message;
        if (sanitizeUserError) {
            userMessage = sanitizeErrorMessage(error.message);
        }
        if (error.message.includes('validation')) {
            return new errors_js_1.ValidationError(error.message, undefined, { originalError: error.message });
        }
        else if (error.message.includes('not found') || error.message.includes('不存在')) {
            return new errors_js_1.NotFoundError('Resource', undefined, { originalError: error.message });
        }
        else if (error.message.includes('network') || error.message.includes('timeout')) {
            return new errors_js_1.SystemError(error.message, 'network', { originalError: error.message });
        }
        return new errors_js_1.SystemError(userMessage, 'controller', { originalError: error.message, stack: error.stack });
    }
    const message = String(error);
    return new errors_js_1.SystemError(sanitizeUserError ? sanitizeErrorMessage(message) : message, 'controller', { originalError: message });
}
function normalizeDatabaseError(error, operation) {
    if (error instanceof Error) {
        const message = error.message.toLowerCase();
        if (message.includes('unique constraint') || message.includes('duplicate')) {
            return new errors_js_1.ValidationError('数据已存在，请使用其他值', undefined, {
                operation,
                originalError: error.message
            });
        }
        else if (message.includes('foreign key') || message.includes('constraint')) {
            return new errors_js_1.ValidationError('关联数据不存在', undefined, {
                operation,
                originalError: error.message
            });
        }
        else if (message.includes('not found')) {
            return new errors_js_1.NotFoundError('记录', undefined, {
                operation,
                originalError: error.message
            });
        }
    }
    return new errors_js_1.SystemError('数据库操作失败', 'database', { operation, originalError: error instanceof Error ? error.message : String(error) });
}
function sendErrorResponse(res, error) {
    res.setHeader('X-Error-Code', error.errorCode);
    res.setHeader('X-Request-ID', res.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    res.status(error.statusCode).json({
        success: false,
        error: {
            code: error.errorCode,
            message: error.userMessage || error.message,
            details: error.details,
            requestId: res.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
        },
        meta: {
            timestamp: new Date().toISOString(),
            requestId: res.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        },
    });
}
function sanitizeErrorMessage(message) {
    const sensitivePatterns = [
        /password/i,
        /token/i,
        /secret/i,
        /key/i,
        /api[_-]?key/i,
        /authorization/i,
        /bearer/i,
    ];
    let sanitized = message;
    sensitivePatterns.forEach(pattern => {
        sanitized = sanitized.replace(pattern, '[REDACTED]');
    });
    sanitized = sanitized.split('\n')[0];
    sanitized = sanitized.replace(/at .+$/gm, '');
    sanitized = sanitized.replace(/\(node:.+?\)/g, '');
    return sanitized.trim();
}
function withInputValidation(validator) {
    return function (target, propertyName, descriptor) {
        const method = descriptor.value;
        descriptor.value = async function (req, res, next) {
            const validation = validator(req);
            if (!validation.isValid) {
                const validationError = new errors_js_1.ValidationError('输入数据验证失败', undefined, { errors: validation.errors });
                sendErrorResponse(res, validationError);
                return;
            }
            return method.apply(this, [req, res, next]);
        };
        return descriptor;
    };
}
function withPerformanceMonitoring() {
    return function (target, propertyName, descriptor) {
        const method = descriptor.value;
        descriptor.value = async function (req, res, next) {
            const startTime = Date.now();
            try {
                const result = await method.apply(this, [req, res, next]);
                const duration = Date.now() - startTime;
                enhanced_error_logger_js_1.logger.info(`API端点性能: ${target.constructor.name}.${propertyName}`, {
                    duration,
                    method: req.method,
                    url: req.originalUrl,
                    requestId: req.requestId,
                    statusCode: res.statusCode,
                });
                return result;
            }
            catch (error) {
                const duration = Date.now() - startTime;
                enhanced_error_logger_js_1.logger.warn(`API端点性能异常: ${target.constructor.name}.${propertyName}`, {
                    duration,
                    method: req.method,
                    url: req.originalUrl,
                    requestId: req.requestId,
                    error: error instanceof Error ? error.message : String(error),
                });
                throw error;
            }
        };
        return descriptor;
    };
}
//# sourceMappingURL=errorHandling.decorators.js.map