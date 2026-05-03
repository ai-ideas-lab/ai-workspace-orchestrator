export declare function formatErrorMessage(error: any, prefix?: string): string;
export declare function extractErrorMessage(error: any, defaultValue?: string): string;
export declare function isErrorOfType(error: any, errorType?: string, property?: string, propertyValue?: any): boolean;
export declare function createStandardError(message: string, code?: string, statusCode?: number, originalError?: any): Error;
export declare function isRetryableError(error: any): boolean;
//# sourceMappingURL=error-helper.d.ts.map