export declare class AppError extends Error {
    readonly statusCode: number;
    readonly errorCode: string;
    readonly isOperational: boolean;
    readonly details?: Record<string, unknown>;
    readonly userMessage?: string;
    constructor(message: string, statusCode?: number, errorCode?: string, isOperational?: boolean, details?: Record<string, unknown>, userMessage?: string);
}
export declare class ValidationError extends AppError {
    constructor(message: string, field?: string, details?: Record<string, unknown>);
}
export declare class AuthenticationError extends AppError {
    constructor(message?: string, details?: Record<string, unknown>);
}
export declare class AuthorizationError extends AppError {
    constructor(message?: string, details?: Record<string, unknown>);
}
export declare class NotFoundError extends AppError {
    constructor(resource: string, id?: string | number, details?: Record<string, unknown>);
}
export declare class BusinessError extends AppError {
    constructor(message: string, errorCode?: string, details?: Record<string, unknown>, userMessage?: string);
}
export declare class ConflictError extends AppError {
    constructor(message: string, details?: Record<string, unknown>);
}
export declare class SystemError extends AppError {
    constructor(message: string, service?: string, details?: Record<string, unknown>);
}
export declare class ExternalServiceError extends AppError {
    constructor(service: string, message: string, statusCode?: number, details?: Record<string, unknown>);
}
export declare class NetworkError extends AppError {
    constructor(message: string, details?: Record<string, unknown>);
}
export declare class DatabaseError extends AppError {
    constructor(message: string, details?: Record<string, unknown>);
}
export declare class RateLimitError extends AppError {
    constructor(message: string, retryAfter?: number, details?: Record<string, unknown>);
}
export declare class WorkflowError extends AppError {
    constructor(message: string, workflowId?: string, stepId?: string, details?: Record<string, unknown>);
}
export declare class AIEngineError extends AppError {
    constructor(engineId: string, message: string, details?: Record<string, unknown>);
}
export declare class TimeoutError extends AppError {
    constructor(message: string, operation?: string, details?: Record<string, unknown>);
}
export declare class FileProcessingError extends AppError {
    constructor(filename: string, message: string, details?: Record<string, unknown>);
}
export declare function isAppError(error: unknown): error is AppError;
export declare function isErrorOperational(error: unknown): boolean;
export declare function getStatusCode(error: unknown): number;
export declare function getUserMessage(error: unknown): string;
export declare function getErrorCode(error: unknown): string;
//# sourceMappingURL=errors.d.ts.map