import { AppError } from './errors.js';
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
export declare class AsyncErrorHandler {
    private static instance;
    private defaultRetryOptions;
    static getInstance(): AsyncErrorHandler;
    executeWithRetry<T>(operation: () => Promise<T>, context: AsyncOperationContext, options?: AsyncRetryOptions): Promise<T>;
    executeWithTimeout<T>(operation: () => Promise<T>, timeoutMs: number, context: AsyncOperationContext): Promise<T>;
    wrapAsync<T extends (...args: any[]) => Promise<any>>(fn: T, context: AsyncOperationContext, options?: AsyncRetryOptions): (...args: Parameters<T>) => Promise<ReturnType<T>>;
    executeBatchWithPartialFailure<T>(operations: Array<{
        id: string;
        operation: () => Promise<T>;
    }>, context: AsyncOperationContext, options?: AsyncRetryOptions): Promise<{
        successes: Array<{
            id: string;
            result: T;
        }>;
        failures: Array<{
            id: string;
            error: AppError;
        }>;
    }>;
    executeParallel<T>(operations: Array<{
        id: string;
        operation: () => Promise<T>;
    }>, context: AsyncOperationContext, concurrencyLimit?: number, options?: AsyncRetryOptions): Promise<Array<{
        id: string;
        result: T;
        error?: AppError;
    }>>;
    executeWithMonitoring<T>(operation: () => Promise<T>, context: AsyncOperationContext, options?: {
        timeoutMs?: number;
        maxMemoryMB?: number;
    }): Promise<T>;
    private enrichError;
    private logOperationSuccess;
    private logOperationFailure;
    private logOperationRetry;
    private logPerformanceMetrics;
    private sleep;
}
export declare const asyncErrorHandler: AsyncErrorHandler;
export declare function withAsyncErrorHandling<T extends (...args: any[]) => Promise<any>>(options?: AsyncRetryOptions): (target: any, propertyName: string, descriptor: TypedPropertyDescriptor<T>) => TypedPropertyDescriptor<T>;
export declare function withAsyncTimeout(timeoutMs: number): (target: any, propertyName: string, descriptor: TypedPropertyDescriptor<any>) => TypedPropertyDescriptor<any>;
//# sourceMappingURL=async-error-handler.d.ts.map