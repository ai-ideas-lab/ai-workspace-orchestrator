import { Request, Response, NextFunction } from 'express';
export declare const requestIdMiddleware: (req: any, res: any, next: any) => void;
export declare function globalErrorHandler(err: Error, req: Request, res: Response, next: NextFunction): void;
export declare function notFoundHandler(req: Request, res: Response): void;
export declare function methodNotAllowedHandler(req: Request, res: Response): void;
export declare function asyncRouteHandler(fn: Function): (req: Request, res: Response, next: NextFunction) => void;
export declare function setupUnhandledRejectionListener(): void;
export declare function setupUncaughtExceptionListener(): void;
export declare function setupWarningListener(): void;
export declare function setupUnhandledAsyncErrorListener(): void;
export declare function setupGlobalErrorMonitoring(): void;
//# sourceMappingURL=errorMiddleware.d.ts.map