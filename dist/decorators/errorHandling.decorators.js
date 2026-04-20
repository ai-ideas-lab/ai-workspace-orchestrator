"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorHandlingUtils = void 0;
exports.withErrorHandling = withErrorHandling;
exports.withRetry = withRetry;
exports.withTimeout = withTimeout;
exports.withDatabaseErrorHandling = withDatabaseErrorHandling;
exports.withInputValidation = withInputValidation;
exports.withPerformanceMonitoring = withPerformanceMonitoring;
exports.withLogging = withLogging;
exports.withCombinedErrorHandling = withCombinedErrorHandling;
const errors_js_1 = require("../utils/errors.js");
const async_error_handler_js_1 = require("../utils/async-error-handler.js");
const enhanced_error_logger_js_1 = require("../enhanced-error-logger.js");
function withErrorHandling(options = {}) {
    return function (target, propertyName, descriptor) {
        const method = descriptor.value;
        const asyncErrorHandler = async_error_handler_js_1.AsyncErrorHandler.getInstance();
        descriptor.value = (async function (...args) {
            const context = {
                operation: `${target.constructor.name}.${propertyName}`,
                userId: this.user?.id,
                sessionId: this.session?.id,
                correlationId: this.requestId || `op_${Date.now()}`,
                metadata: {
                    methodName: propertyName,
                    args: args.slice(0, 10),
                    timestamp: new Date().toISOString(),
                    ...this.metadata,
                },
            };
            try {
                if (options.timeout) {
                    return asyncErrorHandler.executeWithTimeout(() => method.apply(this, args), options.timeout, context);
                }
                else {
                    return asyncErrorHandler.executeWithRetry(() => method.apply(this, args), context, {
                        maxRetries: options.maxRetries,
                        baseDelayMs: options.baseRetryDelay,
                        maxDelayMs: options.maxRetryDelay,
                        retryCondition: options.retryCondition,
                        onRetry: (error, attempt) => {
                            if (options.logErrors) {
                                enhanced_error_logger_js_1.logger.warn(`方法 ${propertyName} 第 ${attempt} 次重试:`, {
                                    error: error instanceof Error ? error.message : String(error),
                                    attempt,
                                    maxRetries: options.maxRetries,
                                    context,
                                });
                            }
                            options.onError?.(error, context);
                        },
                    });
                }
            }
            catch (error) {
                if (options.logErrors) {
                    enhanced_error_logger_js_1.logger.error(`方法 ${propertyName} 执行失败:`, {
                        error,
                        context,
                        method: propertyName,
                        className: target.constructor.name,
                    });
                }
                options.onError?.(error, context);
                throw error;
            }
        });
        return descriptor;
    };
}
function withRetry(options) {
    return withErrorHandling({
        maxRetries: options.maxRetries || 3,
        baseRetryDelay: options.baseDelay || 1000,
        maxRetryDelay: options.maxDelay || 10000,
        retryCondition: options.retryCondition,
        logErrors: true,
    });
}
function withTimeout(timeoutMs) {
    return withErrorHandling({
        timeout: timeoutMs,
        logErrors: true,
    });
}
function withDatabaseErrorHandling(context) {
    return function (target, propertyName, descriptor) {
        const method = descriptor.value;
        descriptor.value = (async function (...args) {
            const dbContext = {
                operation: context.operation,
                table: context.table,
                userId: context.userId || this.user?.id,
                correlationId: this.requestId,
                metadata: {
                    methodName: propertyName,
                    timestamp: new Date().toISOString(),
                    ...this.metadata,
                },
            };
            try {
                const result = await method.apply(this, args);
                enhanced_error_logger_js_1.logger.debug(`数据库操作成功: ${context.operation}`, {
                    table: context.table,
                    userId: dbContext.userId,
                    correlationId: dbContext.correlationId,
                });
                return result;
            }
            catch (error) {
                enhanced_error_logger_js_1.logger.error(`数据库操作失败: ${context.operation}`, {
                    error,
                    table: context.table,
                    userId: dbContext.userId,
                    correlationId: dbContext.correlationId,
                });
                if (error instanceof errors_js_1.AppError) {
                    throw error;
                }
                throw new errors_js_1.SystemError(`数据库操作失败: ${error instanceof Error ? error.message : String(error)}`, 'database', {
                    operation: context.operation,
                    table: context.table,
                    originalError: error instanceof Error ? error.message : String(error),
                    stack: error instanceof Error ? error.stack : undefined,
                    context: dbContext,
                });
            }
        });
        return descriptor;
    };
}
function withInputValidation(validateFn) {
    return function (target, propertyName, descriptor) {
        const method = descriptor.value;
        descriptor.value = (function (...args) {
            try {
                validateFn(args);
                return method.apply(this, args);
            }
            catch (error) {
                if (error instanceof errors_js_1.ValidationError) {
                    throw error;
                }
                throw new errors_js_1.ValidationError(`输入验证失败: ${error instanceof Error ? error.message : String(error)}`, undefined, {
                    methodName: propertyName,
                    args,
                    validationError: error instanceof Error ? error.message : String(error),
                });
            }
        });
        return descriptor;
    };
}
function withPerformanceMonitoring(options) {
    return function (target, propertyName, descriptor) {
        const method = descriptor.value;
        descriptor.value = (async function (...args) {
            const startTime = Date.now();
            const startMemory = process.memoryUsage?.();
            try {
                const result = await method.apply(this, args);
                const duration = Date.now() - startTime;
                const endMemory = process.memoryUsage?.();
                const memoryUsed = startMemory && endMemory ? endMemory.heapUsed - startMemory.heapUsed : 0;
                if (duration > (options.thresholdMs || 1000)) {
                    enhanced_error_logger_js_1.logger.warn(`方法执行时间过长: ${propertyName}`, {
                        duration,
                        memoryUsed: Math.round(memoryUsed / 1024 / 1024) + 'MB',
                        methodName: propertyName,
                        className: target.constructor.name,
                    });
                }
                if (options.logSuccess) {
                    enhanced_error_logger_js_1.logger.debug(`方法执行成功: ${propertyName}`, {
                        duration,
                        memoryUsed: Math.round(memoryUsed / 1024 / 1024) + 'MB',
                    });
                }
                return result;
            }
            catch (error) {
                const duration = Date.now() - startTime;
                if (options.logFailure) {
                    enhanced_error_logger_js_1.logger.error(`方法执行失败: ${propertyName}`, {
                        duration,
                        error,
                        methodName: propertyName,
                        className: target.constructor.name,
                    });
                }
                throw error;
            }
        });
        return descriptor;
    };
}
function withLogging(options) {
    return function (target, propertyName, descriptor) {
        const method = descriptor.value;
        descriptor.value = (async function (...args) {
            const logLevel = options.logLevel || 'debug';
            const logFn = enhanced_error_logger_js_1.logger[logLevel];
            try {
                if (options.logArgs) {
                    logFn(`方法调用: ${propertyName}`, {
                        args,
                        className: target.constructor.name,
                        timestamp: new Date().toISOString(),
                    });
                }
                const result = await method.apply(this, args);
                if (options.logResult) {
                    logFn(`方法执行成功: ${propertyName}`, {
                        result: typeof result === 'object' ? JSON.stringify(result).substring(0, 500) + '...' : result,
                        duration: 'pending',
                        className: target.constructor.name,
                        timestamp: new Date().toISOString(),
                    });
                }
                return result;
            }
            catch (error) {
                if (options.logError) {
                    enhanced_error_logger_js_1.logger.error(`方法执行失败: ${propertyName}`, {
                        error,
                        args,
                        className: target.constructor.name,
                        timestamp: new Date().toISOString(),
                    });
                }
                throw error;
            }
        });
        return descriptor;
    };
}
function withCombinedErrorHandling(options) {
    return function (target, propertyName, descriptor) {
        const method = descriptor.value;
        if (options.validation) {
            descriptor = withInputValidation(options.validation).call(this, target, propertyName, descriptor);
        }
        if (options.performance) {
            descriptor = withPerformanceMonitoring(options.performance).call(this, target, propertyName, descriptor);
        }
        descriptor = withErrorHandling(options).call(this, target, propertyName, descriptor);
        return descriptor;
    };
}
exports.ErrorHandlingUtils = {
    createContext(target, propertyName, correlationId) {
        return {
            operation: `${target.constructor.name}.${propertyName}`,
            userId: target.user?.id,
            sessionId: target.session?.id,
            correlationId: correlationId || `op_${Date.now()}`,
            metadata: {
                methodName: propertyName,
                timestamp: new Date().toISOString(),
                ...target.metadata,
            },
        };
    },
    defaultRetryCondition(error) {
        return (error instanceof errors_js_1.SystemError &&
            !error.isOperational &&
            (error.message.includes('timeout') ||
                error.message.includes('connection') ||
                error.message.includes('temporary') ||
                error.code === 'ECONNRESET' ||
                error.code === 'ETIMEDOUT'));
    },
    logError(methodName, error, context) {
        enhanced_error_logger_js_1.logger.error(`方法 ${methodName} 错误:`, {
            error,
            context,
            timestamp: new Date().toISOString(),
        });
    },
};
//# sourceMappingURL=errorHandling.decorators.js.map