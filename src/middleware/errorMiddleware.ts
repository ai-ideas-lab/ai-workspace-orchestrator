/**
 * Global Error Handler - 全局错误处理中间件
 * 
 * 统一处理应用中所有未捕获的错误，提供结构化的错误响应和日志记录。
 */

import { Request, Response, NextFunction } from 'express';
import { AppError, isAppError, isErrorOperational, getStatusCode, getUserMessage } from './errors.js';
import { errorResponse, createRequestIdMiddleware } from './responseUtils.js';

// 请求ID生成器
export const requestIdMiddleware = createRequestIdMiddleware();

/**
 * 全局错误处理中间件
 */
export function globalErrorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // 生成或获取请求ID
  const requestId = req.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // 记录错误信息
  logError(err, req, requestId);

  // 如果响应已经发送，不再处理
  if (res.headersSent) {
    return next(err);
  }

  // 处理不同类型的错误
  if (isAppError(err)) {
    handleAppError(err, res, requestId);
  } else {
    handleGenericError(err, res, requestId);
  }
}

/**
 * 记录错误日志
 */
function logError(err: Error, req: Request, requestId: string): void {
  const errorInfo = {
    requestId,
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
      code: (err as any).code,
    },
    request: {
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      headers: {
        'content-type': req.get('Content-Type'),
        'content-length': req.get('Content-Length'),
      },
    },
    timestamp: new Date().toISOString(),
  };

  // 根据错误类型决定日志级别
  if (isErrorOperational(err)) {
    // 业务逻辑错误，记录为 warn
    console.warn('业务逻辑错误:', errorInfo);
  } else {
    // 系统错误，记录为 error
    console.error('系统错误:', errorInfo);
  }

  // 如果是未处理的Promise rejection，额外记录
  if (err instanceof UnhandledPromiseRejection) {
    console.error('未处理的Promise拒绝:', errorInfo);
  }
}

/**
 * 处理自定义应用错误
 */
function handleAppError(err: AppError, res: Response, requestId: string): void {
  const statusCode = err.statusCode;
  const response = {
    success: false,
    error: {
      code: err.errorCode,
      message: err.userMessage || err.message,
      details: err.details,
      requestId,
      timestamp: new Date().toISOString(),
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId,
    },
  };

  // 设置响应头
  res.setHeader('X-Error-Code', err.errorCode);
  res.setHeader('X-Request-ID', requestId);
  
  res.status(statusCode).json(response);
}

/**
 * 处理通用错误
 */
function handleGenericError(err: Error, res: Response, requestId: string): void {
  // 默认为500服务器错误
  const statusCode = 500;
  const isProduction = process.env.NODE_ENV === 'production';
  
  const response = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: isProduction ? '服务器内部错误' : err.message,
      details: isProduction ? undefined : {
        name: err.name,
        stack: err.stack,
        originalError: err.message,
      },
      requestId,
      timestamp: new Date().toISOString(),
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId,
    },
  };

  // 设置响应头
  res.setHeader('X-Error-Code', 'INTERNAL_ERROR');
  res.setHeader('X-Request-ID', requestId);
  
  res.status(statusCode).json(response);
}

/**
 * 404 Not Found 处理中间件
 */
export function notFoundHandler(req: Request, res: Response): void {
  const requestId = req.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const response = {
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `路径 ${req.method} ${req.originalUrl} 不存在`,
      details: {
        path: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString(),
      },
      requestId,
      timestamp: new Date().toISOString(),
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId,
    },
  };

  res.setHeader('X-Error-Code', 'NOT_FOUND');
  res.setHeader('X-Request-ID', requestId);
  
  res.status(404).json(response);
}

/**
 * 405 Method Not Allowed 处理中间件
 */
export function methodNotAllowedHandler(req: Request, res: Response): void {
  const requestId = req.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const response = {
    success: false,
    error: {
      code: 'METHOD_NOT_ALLOWED',
      message: `方法 ${req.method} 不允许用于 ${req.originalUrl}`,
      details: {
        allowedMethods: res.get('Allow'),
        path: req.originalUrl,
        method: req.method,
      },
      requestId,
      timestamp: new Date().toISOString(),
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId,
    },
  };

  res.setHeader('X-Error-Code', 'METHOD_NOT_ALLOWED');
  res.setHeader('X-Request-ID', requestId);
  
  res.status(405).json(response);
}

/**
 * 异步错误包装器
 */
export function asyncRouteHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next))
      .catch(next)
      .catch(err => {
        // 再次包装确保错误被正确处理
        if (!isAppError(err)) {
          err = new Error(err.message);
        }
        next(err);
      });
  };
}

/**
 * 监听未处理的Promise拒绝
 */
export function setupUnhandledRejectionListener(): void {
  process.on('unhandledRejection', (reason, promise) => {
    const err = new Error(`Unhandled Promise Rejection: ${String(reason)}`);
    // 标记为未处理拒绝
    (err as any).isUnhandledRejection = true;
    
    console.error('未处理的Promise拒绝:', {
      reason,
      promise,
      stack: err.stack,
    });

    // 如果不是生产环境，可以重新抛出以显示完整的错误堆栈
    if (process.env.NODE_ENV !== 'production') {
      throw err;
    }
  });
}

/**
 * 监听未捕获的异常
 */
export function setupUncaughtExceptionListener(): void {
  process.on('uncaughtException', (error) => {
    console.error('未捕获的异常:', error);
    
    // 关闭服务器并退出进程
    process.exit(1);
  });
}

/**
 * 监听警告事件
 */
export function setupWarningListener(): void {
  process.on('warning', (warning) => {
    console.warn('进程警告:', warning);
  });
}

/**
 * 设置全局错误监控
 */
export function setupGlobalErrorMonitoring(): void {
  // 设置未处理Promise拒绝监听
  setupUnhandledRejectionListener();
  
  // 设置未捕获异常监听
  setupUncaughtExceptionListener();
  
  // 设置警告监听
  setupWarningListener();
}

// 自定义错误类，用于标记未处理的Promise拒绝
class UnhandledPromiseRejection extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnhandledPromiseRejection';
  }
}