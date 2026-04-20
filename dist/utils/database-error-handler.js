"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseErrorHandler = void 0;
exports.withDatabaseErrorHandling = withDatabaseErrorHandling;
const client_1 = require("@prisma/client");
const errors_js_1 = require("./errors.js");
const enhanced_error_logger_js_1 = require("./enhanced-error-logger.js");
class DatabaseErrorHandler {
    static handlePrismaError(error, context) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            return this.handleKnownPrismaError(error, context);
        }
        else if (error instanceof client_1.Prisma.PrismaClientValidationError) {
            return this.handleValidationError(error, context);
        }
        else if (error instanceof client_1.Prisma.PrismaClientRustPanicError) {
            return this.handleRustPanicError(error, context);
        }
        else if (error instanceof client_1.Prisma.PrismaClientUnknownRequestError) {
            return this.handleUnknownRequestError(error, context);
        }
        else {
            return this.handleGenericError(error, context);
        }
    }
    static handleKnownPrismaError(error, context) {
        const errorCode = error.code;
        const meta = error.meta;
        enhanced_error_logger_js_1.logger.error('Prisma已知错误:', {
            code: errorCode,
            meta,
            context,
            stack: error.stack,
        });
        return this.handlePrismaErrorByCode(error, context, meta);
    }
    static handlePrismaErrorByCode(error, context, meta) {
        const errorCode = error.code;
        const errorHandlers = {
            'P2002': () => {
                const field = meta?.target?.[0] || '字段';
                return new errors_js_1.ValidationError(`${field}已存在，请使用其他值`, field, {
                    code: errorCode,
                    table: context.table,
                    target: meta?.target,
                });
            },
            'P2003': () => {
                const relationField = meta?.field_name || '关联字段';
                return new errors_js_1.ValidationError(`关联的${relationField}不存在`, relationField, {
                    code: errorCode,
                    table: context.table,
                    relationField: meta?.field_name,
                });
            },
            'P2025': () => {
                const modelName = meta?.model_name || '记录';
                return new errors_js_1.AppError(`${modelName}不存在`, 404, 'RECORD_NOT_FOUND', true, {
                    code: errorCode,
                    model: meta?.model_name,
                    cause: meta?.cause,
                }, `请求的${modelName}不存在`);
            },
            'P2016': () => {
                const modelName = meta?.model_name || '记录';
                return new errors_js_1.AppError(`${modelName}已被删除或不存在`, 404, 'RECORD_DELETED', true, {
                    code: errorCode,
                    model: meta?.model_name,
                }, `请求的${modelName}不存在或已被删除`);
            },
            'P2022': () => {
                return new errors_js_1.SystemError('数据库连接失败', 'database', {
                    code: errorCode,
                    originalError: error.message,
                    context,
                });
            },
            'P2001': () => {
                return new errors_js_1.AppError('查询结果为空', 404, 'QUERY_EMPTY', true, {
                    code: errorCode,
                    table: context.table,
                }, '未找到匹配的记录');
            },
            'P2010': () => {
                return new errors_js_1.DatabaseError(`数据库查询错误: ${error.message}`, {
                    code: errorCode,
                    table: context.table,
                    query: context.query,
                    originalError: error.message,
                });
            },
            'P2000': () => {
                return new errors_js_1.DatabaseError(`数据库约束错误: ${error.message}`, {
                    code: errorCode,
                    table: context.table,
                    operation: context.operation,
                    originalError: error.message,
                });
            },
        };
        const handler = errorHandlers[errorCode] || this.createDefaultDatabaseError.bind(this);
        return handler();
    }
    static createDefaultDatabaseError() {
        return new errors_js_1.DatabaseError('数据库操作失败', {
            code: 'UNKNOWN_PRISMA_ERROR',
            operation: 'unknown',
        });
    }
    static handleValidationError(error, context) {
        enhanced_error_logger_js_1.logger.error('Prisma验证错误:', {
            message: error.message,
            context,
            stack: error.stack,
        });
        return new errors_js_1.ValidationError('数据验证失败', undefined, {
            operation: context.operation,
            table: context.table,
            validationError: error.message,
        });
    }
    static handleRustPanicError(error, context) {
        enhanced_error_logger_js_1.logger.error('Prisma Rust panic错误:', {
            message: error.message,
            context,
            stack: error.stack,
        });
        return new errors_js_1.SystemError('数据库内部错误，请稍后重试', 'database', {
            code: 'RUST_PANIC',
            table: context.table,
            operation: context.operation,
            originalError: error.message,
        });
    }
    static handleUnknownRequestError(error, context) {
        enhanced_error_logger_js_1.logger.error('Prisma未知请求错误:', {
            message: error.message,
            context,
            stack: error.stack,
        });
        return new errors_js_1.DatabaseError(`数据库未知错误: ${error.message}`, {
            operation: context.operation,
            table: context.table,
            originalError: error.message,
        });
    }
    static handleGenericError(error, context) {
        enhanced_error_logger_js_1.logger.error('数据库通用错误:', {
            error,
            context,
            stack: error instanceof Error ? error.stack : undefined,
        });
        return new errors_js_1.DatabaseError('数据库操作失败', {
            operation: context.operation,
            table: context.table,
            originalError: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
        });
    }
    static wrapDatabaseOperation(operation, context, options = {}) {
        const { maxRetries = 3, baseDelayMs = 1000, maxDelayMs = 5000, fallbackValue } = options;
        let attemptCount = 0;
        const executeWithRetry = async () => {
            try {
                return await operation();
            }
            catch (error) {
                attemptCount++;
                const shouldRetry = this.isRetryableDatabaseError(error) && attemptCount < maxRetries;
                if (shouldRetry) {
                    const delay = Math.min(baseDelayMs * Math.pow(2, attemptCount - 1), maxDelayMs);
                    console.warn(`数据库操作重试 ${attemptCount}/${maxRetries}: ${context.operation}`, {
                        error: error instanceof Error ? error.message : String(error),
                        delay,
                        table: context.table,
                        operation: context.operation
                    });
                    await new Promise(resolve => setTimeout(resolve, delay));
                    return executeWithRetry();
                }
                else {
                    const appError = this.handlePrismaError(error, context);
                    if (fallbackValue !== undefined) {
                        console.error(`数据库操作失败，使用回退值: ${context.operation}`, {
                            error: appError.message,
                            table: context.table,
                            operation: context.operation,
                            attemptCount,
                            fallbackUsed: true
                        });
                        return fallbackValue;
                    }
                    throw appError;
                }
            }
        };
        return executeWithRetry();
    }
    static async executeBatchWithPartialFailure(operations, overallContext) {
        const successes = [];
        const failures = [];
        const promises = operations.map(async ({ id, operation, context }) => {
            try {
                const result = await this.wrapDatabaseOperation(operation, {
                    ...overallContext,
                    ...context,
                    operation: `${overallContext.operation}[${id}]`,
                });
                successes.push({ id, result });
            }
            catch (error) {
                if (error instanceof errors_js_1.AppError) {
                    failures.push({ id, error });
                }
                else {
                    const appError = this.handleGenericError(error, context);
                    failures.push({ id, error: appError });
                }
            }
        });
        await Promise.all(promises);
        return { successes, failures };
    }
    static isDatabaseError(error) {
        return error instanceof client_1.Prisma.PrismaClientKnownRequestError ||
            error instanceof client_1.Prisma.PrismaClientValidationError ||
            error instanceof client_1.Prisma.PrismaClientRustPanicError ||
            error instanceof client_1.Prisma.PrismaClientUnknownRequestError;
    }
    static isRetryableDatabaseError(error) {
        if (!this.isDatabaseError(error)) {
            return false;
        }
        const prismaError = error;
        const retryableCodes = [
            'P2022',
            'P2010',
            'P2000',
        ];
        return retryableCodes.includes(prismaError.code);
    }
}
exports.DatabaseErrorHandler = DatabaseErrorHandler;
function withDatabaseErrorHandling(context) {
    return function (target, propertyName, descriptor) {
        const method = descriptor.value;
        descriptor.value = (async function (...args) {
            return DatabaseErrorHandler.wrapDatabaseOperation(() => method.apply(this, args), context);
        });
        return descriptor;
    };
}
//# sourceMappingURL=database-error-handler.js.map