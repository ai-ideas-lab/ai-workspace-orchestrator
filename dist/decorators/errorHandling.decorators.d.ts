import { Request } from 'express';
export declare function withErrorHandling(options?: {
    logErrors?: boolean;
    sanitizeUserError?: boolean;
    defaultErrorCode?: string;
    defaultStatusCode?: number;
}): (target: any, propertyName: string, descriptor: TypedPropertyDescriptor<any>) => TypedPropertyDescriptor<any>;
export declare function withRetry(options?: {
    maxRetries?: number;
    delayMs?: number;
    retryCondition?: (error: unknown) => boolean;
}): (target: any, propertyName: string, descriptor: TypedPropertyDescriptor<any>) => TypedPropertyDescriptor<any>;
export declare function withTransactionErrorHandler(operationName?: string): (target: any, propertyName: string, descriptor: TypedPropertyDescriptor<any>) => TypedPropertyDescriptor<any>;
export declare function withInputValidation(validator: (req: Request) => {
    isValid: boolean;
    errors?: string[];
}): (target: any, propertyName: string, descriptor: TypedPropertyDescriptor<any>) => TypedPropertyDescriptor<any>;
export declare function withPerformanceMonitoring(): (target: any, propertyName: string, descriptor: TypedPropertyDescriptor<any>) => TypedPropertyDescriptor<any>;
//# sourceMappingURL=errorHandling.decorators.d.ts.map