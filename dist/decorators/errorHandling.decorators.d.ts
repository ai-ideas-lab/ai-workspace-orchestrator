import { AsyncOperationContext } from '../utils/async-error-handler.js';
export interface ErrorHandlingOptions {
    maxRetries?: number;
    baseRetryDelay?: number;
    maxRetryDelay?: number;
    timeout?: number;
    logErrors?: boolean;
    retryCondition?: (error: unknown) => boolean;
    onError?: (error: unknown, context: AsyncOperationContext) => void;
}
export declare function withErrorHandling(options?: ErrorHandlingOptions): <T extends (...args: any[]) => Promise<any>>(target: any, propertyName: string, descriptor: TypedPropertyDescriptor<T>) => TypedPropertyDescriptor<T>;
export declare function withRetry(options: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    retryCondition?: (error: unknown) => boolean;
}): <T extends (...args: any[]) => Promise<any>>(target: any, propertyName: string, descriptor: TypedPropertyDescriptor<T>) => TypedPropertyDescriptor<T>;
export declare function withTimeout(timeoutMs: number): <T extends (...args: any[]) => Promise<any>>(target: any, propertyName: string, descriptor: TypedPropertyDescriptor<T>) => TypedPropertyDescriptor<T>;
export declare function withDatabaseErrorHandling(context: {
    table: string;
    operation: string;
    userId?: string;
}): <T extends (...args: any[]) => Promise<any>>(target: any, propertyName: string, descriptor: TypedPropertyDescriptor<T>) => TypedPropertyDescriptor<T>;
export declare function withInputValidation(validateFn: (args: any[]) => void): <T extends (...args: any[]) => any>(target: any, propertyName: string, descriptor: TypedPropertyDescriptor<T>) => TypedPropertyDescriptor<T>;
export declare function withPerformanceMonitoring(options: {
    thresholdMs?: number;
    logSuccess?: boolean;
    logFailure?: boolean;
}): <T extends (...args: any[]) => Promise<any>>(target: any, propertyName: string, descriptor: TypedPropertyDescriptor<T>) => TypedPropertyDescriptor<T>;
export declare function withLogging(options: {
    logArgs?: boolean;
    logResult?: boolean;
    logError?: boolean;
    logLevel?: 'debug' | 'info' | 'warn' | 'error';
}): <T extends (...args: any[]) => Promise<any>>(target: any, propertyName: string, descriptor: TypedPropertyDescriptor<T>) => TypedPropertyDescriptor<T>;
export declare function withCombinedErrorHandling(options: ErrorHandlingOptions & {
    validation?: (args: any[]) => void;
    performance?: {
        thresholdMs?: number;
        logSuccess?: boolean;
        logFailure?: boolean;
    };
}): <T extends (...args: any[]) => Promise<any>>(target: any, propertyName: string, descriptor: TypedPropertyDescriptor<T>) => TypedPropertyDescriptor<T>;
export declare const ErrorHandlingUtils: {
    createContext(target: any, propertyName: string, correlationId?: string): AsyncOperationContext;
    defaultRetryCondition(error: unknown): boolean;
    logError(methodName: string, error: unknown, context: AsyncOperationContext): void;
};
//# sourceMappingURL=errorHandling.decorators.d.ts.map