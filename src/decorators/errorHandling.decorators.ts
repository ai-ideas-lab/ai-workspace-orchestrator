/**
 * Enhanced Error Handling Decorators - 增强错误处理装饰器
 * 
 * 提供统一的装饰器模式，为类方法添加错误处理、重试、超时等功能
 */

import { AppError, SystemError, TimeoutError, ValidationError } from '../utils/errors.js';
import { AsyncErrorHandler, AsyncOperationContext } from '../utils/async-error-handler.js';
import { logger } from '../enhanced-error-logger.js';

export interface ErrorHandlingOptions {
  /** 最大重试次数 */
  maxRetries?: number;
  /** 重试基础延迟（毫秒） */
  baseRetryDelay?: number;
  /** 最大重试延迟（毫秒） */
  maxRetryDelay?: number;
  /** 超时时间（毫秒） */
  timeout?: number;
  /** 是否启用错误日志 */
  logErrors?: boolean;
  /** 自定义重试条件 */
  retryCondition?: (error: unknown) => boolean;
  /** 错误回调函数 */
  onError?: (error: unknown, context: AsyncOperationContext) => void;
}

/**
 * 装饰器：为类方法添加错误处理
 */
export function withErrorHandling(options: ErrorHandlingOptions = {}) {
  return function <T extends (...args: any[]) => Promise<any>>(
    target: any,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    const method = descriptor.value!;
    const asyncErrorHandler = AsyncErrorHandler.getInstance();

    descriptor.value = (async function(this: any, ...args: Parameters<T>): Promise<ReturnType<T>> {
      const context: AsyncOperationContext = {
        operation: `${target.constructor.name}.${propertyName}`,
        userId: this.user?.id,
        sessionId: this.session?.id,
        correlationId: this.requestId || `op_${Date.now()}`,
        metadata: {
          methodName: propertyName,
          args: args.slice(0, 10), // 只记录前10个参数避免过大
          timestamp: new Date().toISOString(),
          ...this.metadata,
        },
      };

      try {
        if (options.timeout) {
          return asyncErrorHandler.executeWithTimeout(
            () => method.apply(this, args),
            options.timeout,
            context
          );
        } else {
          return asyncErrorHandler.executeWithRetry(
            () => method.apply(this, args),
            context,
            {
              maxRetries: options.maxRetries,
              baseDelayMs: options.baseRetryDelay,
              maxDelayMs: options.maxRetryDelay,
              retryCondition: options.retryCondition,
              onRetry: (error, attempt) => {
                if (options.logErrors) {
                  logger.warn(`方法 ${propertyName} 第 ${attempt} 次重试:`, {
                    error: error instanceof Error ? error.message : String(error),
                    attempt,
                    maxRetries: options.maxRetries,
                    context,
                  });
                }
                options.onError?.(error, context);
              },
            }
          );
        }
      } catch (error) {
        if (options.logErrors) {
          logger.error(`方法 ${propertyName} 执行失败:`, {
            error,
            context,
            method: propertyName,
            className: target.constructor.name,
          });
        }
        options.onError?.(error, context);
        throw error;
      }
    }) as any;

    return descriptor;
  };
}

/**
 * 装饰器：为类方法添加重试机制
 */
export function withRetry(options: {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  retryCondition?: (error: unknown) => boolean;
}) {
  return withErrorHandling({
    maxRetries: options.maxRetries || 3,
    baseRetryDelay: options.baseDelay || 1000,
    maxRetryDelay: options.maxDelay || 10000,
    retryCondition: options.retryCondition,
    logErrors: true,
  });
}

/**
 * 装饰器：为类方法添加超时控制
 */
export function withTimeout(timeoutMs: number) {
  return withErrorHandling({
    timeout: timeoutMs,
    logErrors: true,
  });
}

/**
 * 装饰器：为类方法添加数据库错误处理
 */
export function withDatabaseErrorHandling(context: {
  table: string;
  operation: string;
  userId?: string;
}) {
  return function <T extends (...args: any[]) => Promise<any>>(
    target: any,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    const method = descriptor.value!;

    descriptor.value = (async function(this: any, ...args: Parameters<T>): Promise<ReturnType<T>> {
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
        
        // 如果操作成功，记录成功日志
        logger.debug(`数据库操作成功: ${context.operation}`, {
          table: context.table,
          userId: dbContext.userId,
          correlationId: dbContext.correlationId,
        });
        
        return result;
      } catch (error) {
        // 记录数据库错误
        logger.error(`数据库操作失败: ${context.operation}`, {
          error,
          table: context.table,
          userId: dbContext.userId,
          correlationId: dbContext.correlationId,
        });

        // 根据错误类型转换
        if (error instanceof AppError) {
          // 如果已经是应用错误，重新抛出
          throw error;
        }

        // 转换为数据库错误
        throw new SystemError(
          `数据库操作失败: ${error instanceof Error ? error.message : String(error)}`,
          'database',
          {
            operation: context.operation,
            table: context.table,
            originalError: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            context: dbContext,
          }
        );
      }
    }) as any;

    return descriptor;
  };
}

/**
 * 装饰器：为类方法添加输入验证
 */
export function withInputValidation(validateFn: (args: any[]) => void) {
  return function <T extends (...args: any[]) => any>(
    target: any,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    const method = descriptor.value!;

    descriptor.value = (function(this: any, ...args: Parameters<T>): ReturnType<T> {
      try {
        validateFn(args);
        return method.apply(this, args);
      } catch (error) {
        if (error instanceof ValidationError) {
          throw error;
        }
        
        throw new ValidationError(
          `输入验证失败: ${error instanceof Error ? error.message : String(error)}`,
          undefined,
          {
            methodName: propertyName,
            args,
            validationError: error instanceof Error ? error.message : String(error),
          }
        );
      }
    }) as any;

    return descriptor;
  };
}

/**
 * 装饰器：为类方法添加性能监控
 */
export function withPerformanceMonitoring(options: {
  thresholdMs?: number;
  logSuccess?: boolean;
  logFailure?: boolean;
}) {
  return function <T extends (...args: any[]) => Promise<any>>(
    target: any,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    const method = descriptor.value!;

    descriptor.value = (async function(this: any, ...args: Parameters<T>): Promise<ReturnType<T>> {
      const startTime = Date.now();
      const startMemory = process.memoryUsage?.();
      
      try {
        const result = await method.apply(this, args);
        
        const duration = Date.now() - startTime;
        const endMemory = process.memoryUsage?.();
        const memoryUsed = startMemory && endMemory ? endMemory.heapUsed - startMemory.heapUsed : 0;

        // 记录性能指标
        if (duration > (options.thresholdMs || 1000)) {
          logger.warn(`方法执行时间过长: ${propertyName}`, {
            duration,
            memoryUsed: Math.round(memoryUsed / 1024 / 1024) + 'MB',
            methodName: propertyName,
            className: target.constructor.name,
          });
        }

        if (options.logSuccess) {
          logger.debug(`方法执行成功: ${propertyName}`, {
            duration,
            memoryUsed: Math.round(memoryUsed / 1024 / 1024) + 'MB',
          });
        }

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        
        if (options.logFailure) {
          logger.error(`方法执行失败: ${propertyName}`, {
            duration,
            error,
            methodName: propertyName,
            className: target.constructor.name,
          });
        }

        throw error;
      }
    }) as any;

    return descriptor;
  };
}

/**
 * 装饰器：为类方法添加日志记录
 */
export function withLogging(options: {
  logArgs?: boolean;
  logResult?: boolean;
  logError?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}) {
  return function <T extends (...args: any[]) => Promise<any>>(
    target: any,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    const method = descriptor.value!;

    descriptor.value = (async function(this: any, ...args: Parameters<T>): Promise<ReturnType<T>> {
      const logLevel = options.logLevel || 'debug';
      const logFn = logger[logLevel];

      try {
        // 记录输入参数
        if (options.logArgs) {
          logFn(`方法调用: ${propertyName}`, {
            args,
            className: target.constructor.name,
            timestamp: new Date().toISOString(),
          });
        }

        const result = await method.apply(this, args);
        
        // 记录执行结果
        if (options.logResult) {
          logFn(`方法执行成功: ${propertyName}`, {
            result: typeof result === 'object' ? JSON.stringify(result).substring(0, 500) + '...' : result,
            duration: 'pending',
            className: target.constructor.name,
            timestamp: new Date().toISOString(),
          });
        }

        return result;
      } catch (error) {
        // 记录错误
        if (options.logError) {
          logger.error(`方法执行失败: ${propertyName}`, {
            error,
            args,
            className: target.constructor.name,
            timestamp: new Date().toISOString(),
          });
        }
        throw error;
      }
    }) as any;

    return descriptor;
  };
}

/**
 * 装饰器：为类方法添加组合错误处理
 */
export function withCombinedErrorHandling(options: ErrorHandlingOptions & {
  validation?: (args: any[]) => void;
  performance?: {
    thresholdMs?: number;
    logSuccess?: boolean;
    logFailure?: boolean;
  };
}) {
  return function <T extends (...args: any[]) => Promise<any>>(
    target: any,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    const method = descriptor.value!;

    // 应用输入验证
    if (options.validation) {
      descriptor = withInputValidation(options.validation).call(this, target, propertyName, descriptor);
    }

    // 应用性能监控
    if (options.performance) {
      descriptor = withPerformanceMonitoring(options.performance).call(this, target, propertyName, descriptor);
    }

    // 应用错误处理
    descriptor = withErrorHandling(options).call(this, target, propertyName, descriptor);

    return descriptor;
  };
}

// 导出工具函数
export const ErrorHandlingUtils = {
  /**
   * 创建操作上下文
   */
  createContext(target: any, propertyName: string, correlationId?: string): AsyncOperationContext {
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

  /**
   * 判断是否应该重试
   */
  defaultRetryCondition(error: unknown): boolean {
    return (
      error instanceof SystemError &&
      !error.isOperational &&
      (error.message.includes('timeout') || 
       error.message.includes('connection') ||
       error.message.includes('temporary') ||
       (error as any).code === 'ECONNRESET' ||
       (error as any).code === 'ETIMEDOUT')
    );
  },

  /**
   * 记录错误日志
   */
  logError(methodName: string, error: unknown, context: AsyncOperationContext): void {
    logger.error(`方法 ${methodName} 错误:`, {
      error,
      context,
      timestamp: new Date().toISOString(),
    });
  },
};