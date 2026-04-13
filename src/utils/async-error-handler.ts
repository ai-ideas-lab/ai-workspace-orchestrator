/**
 * Enhanced Async Error Handler - 增强异步错误处理器
 * 
 * 提供统一的async函数错误处理，确保所有异步操作都有适当的错误捕获和处理。
 * 支持自动重试、错误分类、上下文追踪等功能。
 */

import { AppError, SystemError, TimeoutError, NetworkError, WorkflowError } from './errors.js';
import { errorLogger } from './enhanced-error-logger.js';

export interface AsyncRetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  retryCondition?: (error: unknown) => boolean;
  onRetry?: (error: unknown, attempt: number) => void;
}

export interface AsyncOperationContext {
  operation: string;
  userId?: string;
  sessionId?: string;
  correlationId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * 增强异步错误处理器
 */
export class AsyncErrorHandler {
  private static instance: AsyncErrorHandler;
  private defaultRetryOptions: AsyncRetryOptions = {
    maxRetries: 3,
    baseDelayMs: 1000,
    maxDelayMs: 10000,
    retryCondition: (error) => {
      // 默认重试条件：网络错误、超时错误、临时性系统错误
      return (
        error instanceof NetworkError ||
        error instanceof TimeoutError ||
        (error instanceof SystemError && error.message.includes('temporary')) ||
        (error as any).code === 'ECONNRESET' ||
        (error as any).code === 'ETIMEDOUT'
      );
    },
  };

  static getInstance(): AsyncErrorHandler {
    if (!AsyncErrorHandler.instance) {
      AsyncErrorHandler.instance = new AsyncErrorHandler();
    }
    return AsyncErrorHandler.instance;
  }

  /**
   * 执行异步操作带错误处理和重试
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: AsyncOperationContext,
    options: AsyncRetryOptions = {}
  ): Promise<T> {
    const finalOptions = { ...this.defaultRetryOptions, ...options };
    let lastError: unknown;

    for (let attempt = 1; attempt <= (finalOptions.maxRetries || 3); attempt++) {
      try {
        const result = await operation();
        
        // 记录成功操作
        this.logOperationSuccess(context, attempt);
        return result;
      } catch (error) {
        lastError = error;
        
        // 检查是否应该重试
        const shouldRetry = finalOptions.retryCondition?.(error) ?? true;
        
        if (!shouldRetry || attempt === (finalOptions.maxRetries || 3)) {
          // 不重试或最后一次尝试，记录失败并抛出错误
          await this.logOperationFailure(context, error, attempt);
          throw this.enrichError(error, context);
        }

        // 记录重试
        await this.logOperationRetry(context, error, attempt);
        
        // 执行重试回调
        finalOptions.onRetry?.(error, attempt);
        
        // 计算延迟时间（指数退避）
        const delay = Math.min(
          (finalOptions.baseDelayMs || 1000) * Math.pow(2, attempt - 1),
          finalOptions.maxDelayMs || 10000
        );
        
        await this.sleep(delay);
      }
    }

    // 如果循环结束，抛出最后一个错误
    throw this.enrichError(lastError, context);
  }

  /**
   * 执行异步操作带超时控制
   */
  async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number,
    context: AsyncOperationContext
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new TimeoutError(`操作超时 (${timeoutMs}ms)`, context.operation));
      }, timeoutMs);
    });

    try {
      return await Promise.race([operation(), timeoutPromise]);
    } catch (error) {
      throw this.enrichError(error, context);
    }
  }

  /**
   * 包装异步函数，自动处理错误
   */
  wrapAsync<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    context: AsyncOperationContext,
    options: AsyncRetryOptions = {}
  ): (...args: Parameters<T>) => Promise<ReturnType<T>> {
    return async (...args: Parameters<T>) => {
      return this.executeWithRetry(
        () => fn(...args),
        context,
        options
      );
    };
  }

  /**
   * 批量异步操作，部分失败继续执行
   */
  async executeBatchWithPartialFailure<T>(
    operations: Array<{
      id: string;
      operation: () => Promise<T>;
    }>,
    context: AsyncOperationContext,
    options: AsyncRetryOptions = {}
  ): Promise<{
    successes: Array<{ id: string; result: T }>;
    failures: Array<{ id: string; error: AppError }>;
  }> {
    const successes: Array<{ id: string; result: T }> = [];
    const failures: Array<{ id: string; error: AppError }> = [];

    const promises = operations.map(async ({ id, operation }) => {
      try {
        const result = await this.executeWithRetry(
          operation,
          { ...context, operation: `${context.operation}[${id}]` },
          options
        );
        successes.push({ id, result });
      } catch (error) {
        failures.push({ id, error: this.enrichError(error, { ...context, operation: `${context.operation}[${id}]` }) });
      }
    });

    await Promise.all(promises);
    return { successes, failures };
  }

  /**
   * 并行执行异步操作
   */
  async executeParallel<T>(
    operations: Array<{
      id: string;
      operation: () => Promise<T>;
    }>,
    context: AsyncOperationContext,
    concurrencyLimit?: number,
    options: AsyncRetryOptions = {}
  ): Promise<Array<{ id: string; result: T; error?: AppError }>> {
    const results: Array<{ id: string; result: T; error?: AppError }> = [];

    if (concurrencyLimit) {
      // 限制并发数
      for (let i = 0; i < operations.length; i += concurrencyLimit) {
        const batch = operations.slice(i, i + concurrencyLimit);
        const batchPromises = batch.map(async ({ id, operation }) => {
          try {
            const result = await this.executeWithRetry(
              operation,
              { ...context, operation: `${context.operation}[${id}]` },
              options
            );
            return { id, result };
          } catch (error) {
            return { id, error: this.enrichError(error, { ...context, operation: `${context.operation}[${id}]` }) };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      }
    } else {
      // 无限制并发
      const promises = operations.map(async ({ id, operation }) => {
        try {
          const result = await this.executeWithRetry(
            operation,
            { ...context, operation: `${context.operation}[${id}]` },
            options
          );
          return { id, result };
        } catch (error) {
          return { id, error: this.enrichError(error, { ...context, operation: `${context.operation}[${id}]` }) };
        }
      });

      const results_1 = await Promise.all(promises);
      results.push(...results_1);
    }

    return results;
  }

  /**
   * 执行异步操作并监控性能
   */
  async executeWithMonitoring<T>(
    operation: () => Promise<T>,
    context: AsyncOperationContext,
    options: {
      timeoutMs?: number;
      maxMemoryMB?: number;
    } = {}
  ): Promise<T> {
    const startTime = Date.now();
    const startMemory = process.memoryUsage?.();

    try {
      const result = options.timeoutMs
        ? await this.executeWithTimeout(operation, options.timeoutMs, context)
        : await operation();

      // 记录成功指标
      const duration = Date.now() - startTime;
      const endMemory = process.memoryUsage?.();
      
      this.logPerformanceMetrics(context, duration, startMemory, endMemory, true);

      return result;
    } catch (error) {
      // 记录失败指标
      const duration = Date.now() - startTime;
      const endMemory = process.memoryUsage?.();
      
      this.logPerformanceMetrics(context, duration, startMemory, endMemory, false);
      
      throw this.enrichError(error, context);
    }
  }

  /**
   * 增强错误信息，添加上下文
   */
  private enrichError(error: unknown, context: AsyncOperationContext): AppError {
    if (error instanceof AppError) {
      // 如果已经是AppError，添加上下文信息
      return new AppError(
        error.message,
        error.statusCode,
        error.errorCode,
        error.isOperational,
        {
          ...error.details,
          operation: context.operation,
          correlationId: context.correlationId,
          userId: context.userId,
          timestamp: new Date().toISOString(),
          ...context.metadata,
        },
        error.userMessage
      );
    }

    // 如果不是AppError，转换为AppError
    return new SystemError(
      error instanceof Error ? error.message : String(error),
      'AsyncOperation',
      {
        operation: context.operation,
        correlationId: context.correlationId,
        userId: context.userId,
        originalError: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
        ...context.metadata,
      }
    );
  }

  /**
   * 记录操作成功
   */
  private async logOperationSuccess(context: AsyncOperationContext, attempt: number): Promise<void> {
    await errorLogger.logError(null, {
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

  /**
   * 记录操作失败
   */
  private async logOperationFailure(context: AsyncOperationContext, error: unknown, attempt: number): Promise<void> {
    await errorLogger.logError(error, {
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

  /**
   * 记录操作重试
   */
  private async logOperationRetry(context: AsyncOperationContext, error: unknown, attempt: number): Promise<void> {
    await errorLogger.logError(error, {
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

  /**
   * 记录性能指标
   */
  private logPerformanceMetrics(
    context: AsyncOperationContext,
    duration: number,
    startMemory: NodeJS.MemoryUsage | undefined,
    endMemory: NodeJS.MemoryUsage | undefined,
    success: boolean
  ): void {
    const memoryDelta = startMemory && endMemory ? {
      rss: endMemory.rss - startMemory.rss,
      heapTotal: endMemory.heapTotal - startMemory.heapTotal,
      heapUsed: endMemory.heapUsed - startMemory.heapUsed,
      external: endMemory.external - startMemory.external,
    } : undefined;

    errorLogger.logError(null, {
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

  /**
   * 睡眠函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 导出单例实例
export const asyncErrorHandler = AsyncErrorHandler.getInstance();

/**
 * 装饰器：为类方法添加异步错误处理
 */
export function withAsyncErrorHandling<T extends (...args: any[]) => Promise<any>>(
  options: AsyncRetryOptions = {}
) {
  return function (target: any, propertyName: string, descriptor: TypedPropertyDescriptor<T>) {
    const method = descriptor.value!;
    
    descriptor.value = (async function (this: any, ...args: Parameters<T>): Promise<ReturnType<T>> {
      const context: AsyncOperationContext = {
        operation: `${target.constructor.name}.${propertyName}`,
        userId: this.user?.id,
        sessionId: this.session?.id,
        metadata: this.metadata || {},
      };
      
      return asyncErrorHandler.executeWithRetry(
        () => method.apply(this, args),
        context,
        options
      );
    }) as any;
    
    return descriptor;
  };
}

/**
 * 装饰器：为类方法添加超时控制
 */
export function withAsyncTimeout(timeoutMs: number) {
  return function (target: any, propertyName: string, descriptor: TypedPropertyDescriptor<any>) {
    const method = descriptor.value!;
    
    descriptor.value = (async function (this: any, ...args: any[]): Promise<any> {
      const context: AsyncOperationContext = {
        operation: `${target.constructor.name}.${propertyName}`,
        userId: this.user?.id,
        sessionId: this.session?.id,
        metadata: this.metadata || {},
      };
      
      return asyncErrorHandler.executeWithTimeout(
        () => method.apply(this, args),
        timeoutMs,
        context
      );
    }) as any;
    
    return descriptor;
  };
}