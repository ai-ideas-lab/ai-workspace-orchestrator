/**
 * Global Error Handler - 全局错误处理中间件
 * 
 * 统一处理应用中所有未捕获的错误，提供结构化的错误响应和日志记录。
 */

import { Request, Response, NextFunction } from 'express';
import { AppError, isAppError, isErrorOperational, getStatusCode, getUserMessage } from '../utils/errors.js';
import { errorResponse, createRequestIdMiddleware } from '../utils/responseUtils.js';
import { ErrorAggregator } from '../utils/error-aggregator.js';

// 请求ID生成器
export const requestIdMiddleware = createRequestIdMiddleware();

/**
 * 全局错误处理中间件
 */
// 错误聚合器实例
const errorAggregator = ErrorAggregator.getInstance();

export function globalErrorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // 生成或获取请求ID
  const requestId = req.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // 记录错误到聚合器
  const context = {
    path: req.path,
    method: req.method,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: req.user?.id,
    sessionId: req.session?.id,
    requestId,
  };
  
  // 确定错误严重程度
  let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
  if (isAppError(err) && !err.isOperational) {
    severity = 'high';
  } else if (err.message.includes('critical') || err.message.includes('fatal')) {
    severity = 'critical';
  }
  
  const errorId = errorAggregator.recordError(err, context, severity);
  
  // 添加错误ID到响应头
  res.setHeader('X-Error-ID', errorId);
  
  // 记录错误信息
  logError(err, req, requestId, errorId);

  // 如果响应已经发送，不再处理
  if (res.headersSent) {
    return next(err);
  }

  // 处理不同类型的错误
  if (isAppError(err)) {
    handleAppError(err, res, requestId, errorId);
  } else {
    handleGenericError(err, res, requestId, errorId);
  }
}

/**
 * 记录错误日志
 */
function logError(err: Error, req: Request, requestId: string, errorId?: string): void {
  const errorInfo = {
    requestId,
    errorId,
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
function handleAppError(err: AppError, res: Response, requestId: string, errorId: string): void {
  const statusCode = err.statusCode;
  const response = {
    success: false,
    error: {
      code: err.errorCode,
      message: err.userMessage || err.message,
      details: err.details,
      requestId,
      errorId,
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
  res.setHeader('X-Error-ID', errorId);
  
  res.status(statusCode).json(response);
}

/**
 * 处理通用错误
 */
function handleGenericError(err: Error, res: Response, requestId: string, errorId: string): void {
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
      errorId,
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
  res.setHeader('X-Error-ID', errorId);
  
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
 * 异步路由处理器包装器
 * 
 * 为异步路由处理函数提供统一的错误处理机制。该函数包装原始的路由处理函数，
 * 自动捕获异步操作中可能出现的错误，并确保错误被正确传递到错误处理中间件。
 * 支持 Promise 和 async/await 两种异步编程模式，避免未处理的 Promise 拒绝
 * 导致的应用崩溃问题。
 * 
 * @param {Function} fn - 原始的路由处理函数，接收(req, res, next)三个参数
 * @returns {Function} 包装后的路由处理函数，具有错误处理能力
 * @throws {Error} 当原始函数抛出错误时，会经过包装后再传递给错误处理器
 * @example
 * // 基本用法：包装异步路由处理器
 * * @example
 * // 基本用法：包装异步路由处理器
 * router.get('/api/data', asyncRouteHandler(async (req, res) => {
 *   const data = await someAsyncOperation();
 *   res.json({ success: true, data });
 * }));
 * 
 * // 处理数据库操作错误
 * router.post('/api/users', asyncRouteHandler(async (req, res) => {
 *   const user = await prisma.user.create({ data: req.body });
 *   res.status(201).json({ success: true, user });
 * }));
 * 
 * // 处理外部API调用错误
 * router.get('/api/external', asyncRouteHandler(async (req, res) => {
 *   const response = await fetch('https://api.example.com/data');
 *   if (!response.ok) throw new Error('External API failed');
 *   const data = await response.json();
 *   res.json(data);
 * }));
 * 
 * // 注意事项：
 * // 1. 被包装的函数必须是异步的（返回Promise）
 * // 2. 错误会被自动捕获并传递给错误处理中间件
 * // 3. 不需要手动调用 next()，包装器会处理
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
 * 监听未处理的异步操作错误
 */
export function setupUnhandledAsyncErrorListener(): void {
  // 监听未处理的Promise拒绝（备用）
  process.on('unhandledRejection', (reason, promise) => {
    const err = new Error(`Unhandled Promise Rejection: ${String(reason)}`);
    (err as any).isUnhandledRejection = true;
    (err as any).promise = promise;
    
    console.error('未处理的Promise拒绝:', {
      reason,
      promise,
      stack: err.stack,
      timestamp: new Date().toISOString(),
    });

    // 如果不是生产环境，可以重新抛出以显示完整的错误堆栈
    if (process.env.NODE_ENV !== 'production') {
      throw err;
    }
  });

  // 监听async函数中的未捕获错误
  process.on('uncaughtException', (error) => {
    console.error('未捕获的异常:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });

    // 关闭服务器并退出进程
    process.exit(1);
  });
}

/**
 * 设置全局错误监控和异常处理
 * 
 * 为Node.js应用建立全面的错误监控体系，包括未处理的Promise拒绝、
 * 未捕获的异常、进程警告和未处理的异步错误。该函数应该在应用
 * 启动时尽早调用，确保所有错误都能被捕获和记录，避免未处理的
 * 错误导致应用崩溃或静默失败。
 * 
 * @returns {void} 该函数没有返回值，直接设置进程级别的错误监听器
 * @throws {Error} 当监听器设置过程中出现问题时抛出异常
 * @example
 * // 在应用启动时设置全局错误监控
 * import express from 'express';
 * import { setupGlobalErrorMonitoring } from './middleware/errorMiddleware';
 * 
 * const app = express();
 * 
 * // 设置全局错误监控
 * setupGlobalErrorMonitoring();
 * 
 * // 正常的路由配置
 * app.get('/', (req, res) => {
 *   res.send('Hello World');
 * });
 * 
 * // 启动服务器
 * app.listen(3000, () => {
 *   console.log('Server running on port 3000');
 * });
 * 
 * // 测试各种错误情况：
 * // 1. 未处理的Promise拒绝： Promise.reject('test');
 * // 2. 未捕获的异常： throw new Error('test error');
 * // 3. 进程警告： process.emitWarning('test warning');
 * // 4. 异步错误： setTimeout(() => { throw new Error('async error'); }, 1000);
 * 
 * // 注意事项：
 * // 1. 该函数应该在应用启动尽早调用
 * // 2. 监听器设置后不能移除，应用重启才能重置
 * // 3. 在生产环境中，未捕获异常会导致进程退出
 * // 4. 开发环境中，未处理的Promise拒绝会重新抛出以便调试
 */
export function setupGlobalErrorMonitoring(): void {
  // 设置未处理Promise拒绝监听
  setupUnhandledRejectionListener();
  
  // 设置未捕获异常监听
  setupUncaughtExceptionListener();
  
  // 设置警告监听
  setupWarningListener();
  
  // 设置未处理的异步操作错误监听
  setupUnhandledAsyncErrorListener();
}

// 自定义错误类，用于标记未处理的Promise拒绝
class UnhandledPromiseRejection extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnhandledPromiseRejection';
  }
}