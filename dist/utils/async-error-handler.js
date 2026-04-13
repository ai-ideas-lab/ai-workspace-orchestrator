"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncErrorHandler = exports.AsyncErrorHandler = void 0;
exports.withAsyncErrorHandling = withAsyncErrorHandling;
exports.withAsyncTimeout = withAsyncTimeout;
const errors_js_1 = require("./errors.js");
const enhanced_error_logger_js_1 = require("./enhanced-error-logger.js");
class AsyncErrorHandler {
    constructor() {
        this.defaultRetryOptions = {
            maxRetries: 3,
            baseDelayMs: 1000,
            maxDelayMs: 10000,
            retryCondition: (error) => {
                return (error instanceof errors_js_1.NetworkError ||
                    error instanceof errors_js_1.TimeoutError ||
                    (error instanceof errors_js_1.SystemError && error.message.includes('temporary')) ||
                    error.code === 'ECONNRESET' ||
                    error.code === 'ETIMEDOUT');
            },
        };
    }
    static getInstance() {
        if (!AsyncErrorHandler.instance) {
            AsyncErrorHandler.instance = new AsyncErrorHandler();
        }
        return AsyncErrorHandler.instance;
    }
    async executeWithRetry(operation, context, options = {}) {
        const finalOptions = { ...this.defaultRetryOptions, ...options };
        let lastError;
        for (let attempt = 1; attempt <= (finalOptions.maxRetries || 3); attempt++) {
            try {
                const result = await operation();
                this.logOperationSuccess(context, attempt);
                return result;
            }
            catch (error) {
                lastError = error;
                const shouldRetry = finalOptions.retryCondition?.(error) ?? true;
                if (!shouldRetry || attempt === (finalOptions.maxRetries || 3)) {
                    await this.logOperationFailure(context, error, attempt);
                    throw this.enrichError(error, context);
                }
                await this.logOperationRetry(context, error, attempt);
                finalOptions.onRetry?.(error, attempt);
                const delay = Math.min((finalOptions.baseDelayMs || 1000) * Math.pow(2, attempt - 1), finalOptions.maxDelayMs || 10000);
                await this.sleep(delay);
            }
        }
        throw this.enrichError(lastError, context);
    }
    async executeWithTimeout(operation, timeoutMs, context) {
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                reject(new errors_js_1.TimeoutError(`操作超时 (${timeoutMs}ms)`, context.operation));
            }, timeoutMs);
        });
        try {
            return await Promise.race([operation(), timeoutPromise]);
        }
        catch (error) {
            throw this.enrichError(error, context);
        }
    }
    wrapAsync(fn, context, options = {}) {
        return async (...args) => {
            return this.executeWithRetry(() => fn(...args), context, options);
        };
    }
    async executeBatchWithPartialFailure(operations, context, options = {}) {
        const successes = [];
        const failures = [];
        const promises = operations.map(async ({ id, operation }) => {
            try {
                const result = await this.executeWithRetry(operation, { ...context, operation: `${context.operation}[${id}]` }, options);
                successes.push({ id, result });
            }
            catch (error) {
                failures.push({ id, error: this.enrichError(error, { ...context, operation: `${context.operation}[${id}]` }) });
            }
        });
        await Promise.all(promises);
        return { successes, failures };
    }
    async executeParallel(operations, context, concurrencyLimit, options = {}) {
        const results = [];
        if (concurrencyLimit) {
            for (let i = 0; i < operations.length; i += concurrencyLimit) {
                const batch = operations.slice(i, i + concurrencyLimit);
                const batchPromises = batch.map(async ({ id, operation }) => {
                    try {
                        const result = await this.executeWithRetry(operation, { ...context, operation: `${context.operation}[${id}]` }, options);
                        return { id, result };
                    }
                    catch (error) {
                        return { id, error: this.enrichError(error, { ...context, operation: `${context.operation}[${id}]` }) };
                    }
                });
                const batchResults = await Promise.all(batchPromises);
                results.push(...batchResults);
            }
        }
        else {
            const promises = operations.map(async ({ id, operation }) => {
                try {
                    const result = await this.executeWithRetry(operation, { ...context, operation: `${context.operation}[${id}]` }, options);
                    return { id, result };
                }
                catch (error) {
                    return { id, error: this.enrichError(error, { ...context, operation: `${context.operation}[${id}]` }) };
                }
            });
            const results_1 = await Promise.all(promises);
            results.push(...results_1);
        }
        return results;
    }
    async executeWithMonitoring(operation, context, options = {}) {
        const startTime = Date.now();
        const startMemory = process.memoryUsage?.();
        try {
            const result = options.timeoutMs
                ? await this.executeWithTimeout(operation, options.timeoutMs, context)
                : await operation();
            const duration = Date.now() - startTime;
            const endMemory = process.memoryUsage?.();
            this.logPerformanceMetrics(context, duration, startMemory, endMemory, true);
            return result;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            const endMemory = process.memoryUsage?.();
            this.logPerformanceMetrics(context, duration, startMemory, endMemory, false);
            throw this.enrichError(error, context);
        }
    }
    enrichError(error, context) {
        if (error instanceof errors_js_1.AppError) {
            return new errors_js_1.AppError(error.message, error.statusCode, error.errorCode, error.isOperational, {
                ...error.details,
                operation: context.operation,
                correlationId: context.correlationId,
                userId: context.userId,
                timestamp: new Date().toISOString(),
                ...context.metadata,
            }, error.userMessage);
        }
        return new errors_js_1.SystemError(error instanceof Error ? error.message : String(error), 'AsyncOperation', {
            operation: context.operation,
            correlationId: context.correlationId,
            userId: context.userId,
            originalError: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            timestamp: new Date().toISOString(),
            ...context.metadata,
        });
    }
    async logOperationSuccess(context, attempt) {
        await enhanced_error_logger_js_1.errorLogger.logError(null, {
            requestId: context.correlationId || `async_${Date.now()}`,
            userId: context.userId,
            timestamp: new Date().toISOString(),
            method: 'ASYNC_OPERATION',
            url: context.operation,
        }, {
            operation: context.operation,
            attempt,
            status: 'success',
        });
    }
    async logOperationFailure(context, error, attempt) {
        await enhanced_error_logger_js_1.errorLogger.logError(error, {
            requestId: context.correlationId || `async_${Date.now()}`,
            userId: context.userId,
            timestamp: new Date().toISOString(),
            method: 'ASYNC_OPERATION',
            url: context.operation,
        }, {
            operation: context.operation,
            attempt,
            maxRetries: this.defaultRetryOptions.maxRetries,
            status: 'failed',
        });
    }
    async logOperationRetry(context, error, attempt) {
        await enhanced_error_logger_js_1.errorLogger.logError(error, {
            requestId: context.correlationId || `async_${Date.now()}`,
            userId: context.userId,
            timestamp: new Date().toISOString(),
            method: 'ASYNC_OPERATION',
            url: context.operation,
        }, {
            operation: context.operation,
            attempt,
            maxRetries: this.defaultRetryOptions.maxRetries,
            status: 'retry',
        });
    }
    logPerformanceMetrics(context, duration, startMemory, endMemory, success) {
        const memoryDelta = startMemory && endMemory ? {
            rss: endMemory.rss - startMemory.rss,
            heapTotal: endMemory.heapTotal - startMemory.heapTotal,
            heapUsed: endMemory.heapUsed - startMemory.heapUsed,
            external: endMemory.external - startMemory.external,
        } : undefined;
        enhanced_error_logger_js_1.errorLogger.logError(null, {
            requestId: context.correlationId || `async_${Date.now()}`,
            userId: context.userId,
            timestamp: new Date().toISOString(),
            method: 'ASYNC_OPERATION',
            url: context.operation,
        }, {
            operation: context.operation,
            duration,
            memoryDelta,
            success,
            ...context.metadata,
        });
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.AsyncErrorHandler = AsyncErrorHandler;
exports.asyncErrorHandler = AsyncErrorHandler.getInstance();
function withAsyncErrorHandling(options = {}) {
    return function (target, propertyName, descriptor) {
        const method = descriptor.value;
        descriptor.value = (async function (...args) {
            const context = {
                operation: `${target.constructor.name}.${propertyName}`,
                userId: this.user?.id,
                sessionId: this.session?.id,
                metadata: this.metadata || {},
            };
            return exports.asyncErrorHandler.executeWithRetry(() => method.apply(this, args), context, options);
        });
        return descriptor;
    };
}
function withAsyncTimeout(timeoutMs) {
    return function (target, propertyName, descriptor) {
        const method = descriptor.value;
        descriptor.value = (async function (...args) {
            const context = {
                operation: `${target.constructor.name}.${propertyName}`,
                userId: this.user?.id,
                sessionId: this.session?.id,
                metadata: this.metadata || {},
            };
            return exports.asyncErrorHandler.executeWithTimeout(() => method.apply(this, args), timeoutMs, context);
        });
        return descriptor;
    };
}
//# sourceMappingURL=async-error-handler.js.map