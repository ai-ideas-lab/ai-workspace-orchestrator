import { AppError } from './errors.js';
export interface DatabaseErrorContext {
    operation: string;
    table: string;
    query?: string;
    parameters?: Record<string, unknown>;
    userId?: string;
    correlationId?: string;
}
export declare class DatabaseErrorHandler {
    static handlePrismaError(error: unknown, context: DatabaseErrorContext): AppError;
    private static handleKnownPrismaError;
    private static handleValidationError;
    private static handleRustPanicError;
    private static handleUnknownRequestError;
    private static handleGenericError;
    static wrapDatabaseOperation<T>(operation: () => Promise<T>, context: DatabaseErrorContext): Promise<T>;
    static executeBatchWithPartialFailure<T>(operations: Array<{
        id: string;
        operation: () => Promise<T>;
        context: DatabaseErrorContext;
    }>, overallContext: DatabaseErrorContext): Promise<{
        successes: Array<{
            id: string;
            result: T;
        }>;
        failures: Array<{
            id: string;
            error: AppError;
        }>;
    }>;
    static isDatabaseError(error: unknown): boolean;
    static isRetryableDatabaseError(error: unknown): boolean;
}
export declare function withDatabaseErrorHandling(context: DatabaseErrorContext): <T extends (...args: any[]) => Promise<any>>(target: any, propertyName: string, descriptor: TypedPropertyDescriptor<T>) => TypedPropertyDescriptor<T>;
//# sourceMappingURL=database-error-handler.d.ts.map