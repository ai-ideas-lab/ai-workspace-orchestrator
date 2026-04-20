export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: Record<string, unknown>;
        requestId?: string;
        timestamp: string;
    };
    meta?: {
        timestamp: string;
        requestId?: string;
        version?: string;
        pagination?: {
            page?: number;
            limit?: number;
            total?: number;
            hasNext?: boolean;
        };
    };
}
export declare function successResponse<T>(res: any, data: T, message?: string, statusCode?: number, meta?: ApiResponse<T>['meta']): void;
export declare function errorResponse(res: any, error: unknown, details?: Record<string, unknown>, statusCode?: number, requestId?: string): void;
export declare function validationErrorResponse(res: any, message: string, field?: string, details?: Record<string, unknown>, requestId?: string): void;
export declare function authenticationErrorResponse(res: any, message?: string, details?: Record<string, unknown>, requestId?: string): void;
export declare function authorizationErrorResponse(res: any, message?: string, details?: Record<string, unknown>, requestId?: string): void;
export declare function notFoundResponse(res: any, resource: string, id?: string | number, requestId?: string): void;
export declare function conflictResponse(res: any, message: string, details?: Record<string, unknown>, requestId?: string): void;
export declare function systemErrorResponse(res: any, message?: string, details?: Record<string, unknown>, requestId?: string): void;
export declare function paginatedResponse<T>(res: any, data: T[], total: number, page: number, limit: number, message?: string): void;
export declare function streamResponse(res: any, stream: NodeJS.ReadableStream, options?: {
    contentType?: string;
    filename?: string;
    status?: number;
}): void;
export declare function downloadResponse(res: any, data: Buffer | string, filename: string, contentType?: string): void;
export declare function redirectResponse(res: any, url: string, statusCode?: number): void;
export declare function noContentResponse(res: any): void;
export declare function createRequestIdMiddleware(): (req: any, res: any, next: any) => void;
export declare function createErrorHandlerMiddleware(): (err: any, req: any, res: any, next: any) => any;
export declare function asyncHandler(fn: Function): (req: any, res: any, next: any) => void;
export declare function createResponseInterceptor(): (req: any, res: any, next: any) => void;
//# sourceMappingURL=responseUtils.d.ts.map