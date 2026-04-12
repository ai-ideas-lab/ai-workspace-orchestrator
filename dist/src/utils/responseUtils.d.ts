import { Response } from 'express';
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    details?: any;
    timestamp: string;
}
export declare const successResponse: <T>(res: Response, data: T, message?: string, status?: number) => Response;
export declare const errorResponse: (res: Response, error: string, details?: any, status?: number) => Response;
export declare const validationErrorResponse: (res: Response, details: any) => Response;
export declare const authErrorResponse: (res: Response, error: string) => Response;
export declare const conflictErrorResponse: (res: Response, error: string) => Response;
//# sourceMappingURL=responseUtils.d.ts.map