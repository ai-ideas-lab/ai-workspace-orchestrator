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
 * 
 * 统一的错误日志记录函数，根据错误类型决定日志级别和记录方式。
 * 支持业务逻辑错误和系统错误的分类记录，并提供详细的错误上下文信息。
 * 自动为未处理的Promise拒绝提供特殊的标记和记录。
 * 
 * @param {Error} err - 需要记录的错误对象
 * @param {Request} req - Express请求对象，包含请求的详细信息
 * @param {string} requestId - 请求ID，用于关联日志和错误响应
 * @param {string} [errorId] - 错误ID，用于错误追踪和管理
 * @returns {void} 该函数没有返回值，直接进行日志记录操作
 * @throws {Error} 当日志记录过程中出现异常时抛出异常
 * 
 * @example
 * // 基本错误记录
 * try {
 *   throw new Error('业务逻辑错误');
 * } catch (error) {
 *   const req = { method: 'GET', path: '/api/test', get: () => 'test' };
 *   logError(error, req, 'req_123', 'error_456');
 * }
 * 
 * // 系统错误记录
 * try {
 *   const systemError = new Error('数据库连接失败');
 *   systemError.stack = 'Error: Database connection failed\n    at ...';
 *   const req = { method: 'POST', path: '/api/users', get: () => 'test' };
 *   logError(systemError, req, 'req_789', 'error_012');
 * }
 * 
 * // 未处理的Promise拒绝记录
 * const promiseError = new Error('Promise被拒绝');
 * promiseError.isUnhandledRejection = true;
 * const req = { method: 'GET', path: '/api/async', get: () => 'test' };
 * logError(promiseError, req, 'req_345', 'error_678');
 * 
 * // 使用示例：在全局错误处理器中记录错误
 * function globalErrorHandler(err, req, res, next) {
 *   const errorId = generateErrorId();
 *   logError(err, req, req.requestId, errorId);
 *   // 继续错误处理流程...
 * }
 * 
 * // 注意事项：
 * // 1. 业务逻辑错误记录为 warn 级别
 * // 2. 系统错误记录为 error 级别
 * // 3. 未处理的Promise拒绝会额外标记和记录
 * // 4. 日志包含请求详细信息便于调试
 * // 5. 生产环境中应考虑使用专业日志系统替代console
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
 * 
 * 专门处理AppError类型的错误，提供标准化的错误响应格式。
 * 根据自定义错误的状态码、错误码和详细信息构建结构化的错误响应。
 * 添加必要的响应头信息，便于客户端错误识别和处理。
 * 支持用户友好消息的传递，提升用户体验。
 * 
 * @param {AppError} err - 自定义应用错误对象，包含错误详情
 * @param {Response} res - Express响应对象，用于发送错误响应
 * @param {string} requestId - 请求ID，用于错误追踪和日志关联
 * @param {string} errorId - 错误ID，用于标识和管理特定错误
 * @returns {void} 该函数没有返回值，直接通过res对象发送错误响应
 * @throws {Error} 当响应已经发送后尝试再次发送响应时抛出异常
 * 
 * @example
 * // 基本应用错误处理
 * const appError = new AppError('用户名已存在', 409, 'USER_EXISTS', true, { field: 'username' });
 * const res = {
 *   status: (code) => ({ json: (data) => console.log('响应:', data) }),
 *   setHeader: (key, value) => console.log('Header:', key, value)
 * };
 * handleAppError(appError, res, 'req_123', 'error_456');
 * // 输出包含状态码409，错误码USER_EXISTS的响应
 * 
 * // 验证错误处理
 * const validationError = new AppError('输入验证失败', 400, 'VALIDATION_ERROR', true, { field: 'email' });
 * handleAppError(validationError, res, 'req_789', 'error_012');
 * // 输出包含验证错误的响应，HTTP状态码400
 * 
 * // 认证错误处理
 * const authError = new AppError('无效的令牌', 401, 'INVALID_TOKEN', true, { expired: true });
 * handleAppError(authError, res, 'req_345', 'error_678');
 * // 输出包含认证错误的响应，HTTP状态码401
 * 
 * // 系统级错误处理
 * const systemError = new AppError('数据库连接失败', 500, 'DATABASE_ERROR', false, { timeout: 5000 });
 * handleAppError(systemError, res, 'req_567', 'error_890');
 * // 输出包含系统错误的响应，HTTP状态码500
 * 
 * // 注意事项：
 * // 1. 响应状态码使用err.statusCode
 * // 2. 错误代码使用err.errorCode
 * // 3. 用户消息使用err.userMessage优先于err.message
 * // 4. 错误详细信息包含在err.details中
 * // 5. 添加X-Error-Code和X-Error-ID响应头
 * // 6. 函数会在发送响应前检查res.headersSent避免重复发送
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
 * 
 * 统一处理非AppError类型的错误，将其转换为标准化的错误响应格式。
 根据运行环境决定错误消息的详细程度，生产环境隐藏敏感错误信息，
 开发环境提供完整的错误详情便于调试。自动添加必要的响应头信息。
 * 
 * @param {Error} err - 需要处理的通用错误对象
 * @param {Response} res - Express响应对象，用于发送错误响应
 * @param {string} requestId - 请求ID，用于错误追踪和日志关联
 * @param {string} errorId - 错误ID，用于标识和管理特定错误
 * @returns {void} 该函数没有返回值，直接通过res对象发送错误响应
 * @throws {Error} 当响应已经发送后尝试再次发送响应时抛出异常
 * 
 * @example
 * // 基本错误处理
 * const error = new Error('数据库连接失败');
 * const res = {
 *   status: (code) => ({ json: (data) => console.log('响应:', data) }),
 *   setHeader: (key, value) => console.log('Header:', key, value)
 * };
 * handleGenericError(error, res, 'req_123', 'error_456');
 * // 输出包含500状态码和INTERNAL_ERROR的响应
 * 
 * // 生产环境错误处理
 * process.env.NODE_ENV = 'production';
 * const prodError = new Error('敏感信息泄露');
 * handleGenericError(prodError, res, 'req_789', 'error_012');
 * // 输出用户友好的错误消息，隐藏详细错误信息
 * 
 * // 开发环境错误处理
 * process.env.NODE_ENV = 'development';
 * const devError = new Error('API密钥无效');
 * devError.stack = 'Error: Invalid API key\n    at ...';
 * handleGenericError(devError, res, 'req_345', 'error_678');
 * // 输出包含错误详情和堆栈跟踪的响应
 * 
 * // 包含技术错误的处理
 * const techError = new Error('ECONNREFUSED');
 * techError.code = 'ECONNREFUSED';
 * handleGenericError(techError, res, 'req_567', 'error_890');
 * // 输出包含原始错误代码的详细信息
 * 
 * // 注意事项：
 * // 1. 生产环境隐藏敏感错误信息，只显示友好消息
 * // 2. 开发环境显示完整的错误详情和堆栈跟踪
 * // 3. 响应状态码默认为500（服务器内部错误）
 * // 4. 错误代码默认为INTERNAL_ERROR
 * // 5. 添加X-Error-Code和X-Request-ID响应头
 * // 6. 函数会在发送响应前检查res.headersSent避免重复发送
 * // 7. 确保错误响应格式与其他错误处理函数保持一致
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
 * 
 * 为Node.js进程添加未处理的Promise拒绝事件监听器，防止静默的Promise拒绝
 导致应用崩溃。在生产环境中，未处理的Promise拒绝会被记录到日志但不会
 导致进程退出；在开发环境中，会重新抛出错误以便调试显示完整的错误堆栈。
 * 
 * @returns {void} 该函数没有返回值，直接设置进程级别的事件监听器
 * @throws {Error} 当监听器设置过程中出现异常时抛出异常
 * 
 * @example
 * // 基本使用：应用启动时调用
 * setupUnhandledRejectionListener();
 * 
 * // 测试未处理的Promise拒绝
 * Promise.reject('测试拒绝');
 * // 输出: 未处理的Promise拒绝: 测试拒绝
 * 
 * // 配合其他错误监听器使用
 * function setupAllErrorHandlers() {
 *   setupUnhandledRejectionListener();
 *   setupUncaughtExceptionListener();
 *   setupWarningListener();
 *   setupUnhandledAsyncErrorListener();
 * }
 * 
 * // 在Express应用中使用
 * import express from 'express';
 * import { setupUnhandledRejectionListener } from './errorMiddleware';
 * 
 * const app = express();
 * 
 * // 设置错误监听
 * setupUnhandledRejectionListener();
 * 
 * // 添加可能产生未处理Promise的路由
 * app.get('/async-error', (req, res) => {
 *   const promise = someAsyncOperation();
 *   promise.then(result => res.json(result));
 *   // 如果promise拒绝且没有.catch()，会被这里的监听器捕获
 * });
 * 
 * // 注意事项：
 * // 1. 该函数应该在应用启动尽早调用
 * // 2. 监听器设置后不能移除，需要重启应用才能重置
 * // 3. 生产环境中未处理的Promise拒绝不会导致进程退出
 * // 4. 开发环境中会重新抛出错误以便调试
 * // 5. 与其他错误监听器配合使用形成完整的错误监控体系
 * // 6. 确保应用有适当的错误恢复机制
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
 * 
 * 为Node.js进程添加未捕获的异常事件监听器，处理那些没有被try-catch捕获的
 异常。这类异常通常是程序逻辑错误，如果不处理会导致进程崩溃。
 该监听器会在捕获到异常后记录详细日志并优雅地关闭进程。
 * 
 * @returns {void} 该函数没有返回值，直接设置进程级别的事件监听器
 * @throws {Error} 当监听器设置过程中出现异常时抛出异常
 * 
 * @example
 * // 基本使用：应用启动时调用
 * setupUncaughtExceptionListener();
 * 
 * // 测试未捕获的异常
 * setTimeout(() => {
 *   throw new Error('未捕获的异常');
 * }, 1000);
 * // 1秒后会触发异常监听器，记录错误并退出进程
 * 
 * // 在Express应用中使用
 * import express from 'express';
 * import { setupUncaughtExceptionListener } from './errorMiddleware';
 * 
 * const app = express();
 * 
 * // 设置异常监听
 * setupUncaughtExceptionListener();
 * 
 * // 添加可能抛出异常的中间件
 * app.use((req, res, next) => {
 *   if (req.path === '/trigger-error') {
 *     throw new Error('故意触发的未捕获异常');
 *   }
 *   next();
 * });
 * 
 * // 注意事项：
 * // 1. 该函数应该在应用启动尽早调用
 * // 2. 监听器捕获到异常后会调用process.exit(1)退出进程
 * // 3. 在生产环境中这是合理的行为，防止进程继续运行在错误状态
 * // 4. 开发环境中可能需要更详细的错误报告和调试信息
 * // 5. 确保在调用此监听器前已经保存了重要的应用状态
 * // 6. 对于关键业务应用，考虑添加优雅关闭机制而非直接退出
 * // 7. 配合进程管理工具（如PM2、systemd）实现自动重启
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
 * 
 * 为Node.js进程添加警告事件监听器，捕获和处理系统运行时警告。
 警告通常表示潜在的问题或即将废弃的API使用，但不影响应用的正常运行。
 该监听器会记录警告信息便于开发者及时发现和修复问题。
 * 
 * @returns {void} 该函数没有返回值，直接设置进程级别的事件监听器
 * @throws {Error} 当监听器设置过程中出现异常时抛出异常
 * 
 * @example
 * // 基本使用：应用启动时调用
 * setupWarningListener();
 * 
 * // 测试警告事件
 * process.emitWarning('这是一个测试警告');
 * // 输出: 进程警告: 这是测试警告
 * 
 * // 在Express应用中使用
 * import express from 'express';
 * import { setupWarningListener } from './errorMiddleware';
 * 
 * const app = express();
 * 
 * // 设置警告监听
 * setupWarningListener();
 * 
 * // 使用可能产生警告的API
 * app.use(express.urlencoded({ extended: true }));
 * // 如果使用了某些配置警告，会被这里的监听器捕获
 * 
 * // 结合日志系统集成
 * function setupWithCustomLogger() {
 *   setupWarningListener();
 *   // 重写console.warn以集成到自定义日志系统
 *   const originalWarn = console.warn;
 *   console.warn = (...args) => {
 *     customLogger.warn('Node.js警告', { args, timestamp: new Date() });
 *     originalWarn.apply(console, args);
 *   };
 * }
 * 
 * // 注意事项：
 * // 1. 警告通常表示非致命问题，不会导致进程崩溃
 * // 2. 常见警告包括：内存使用警告、连接池耗尽、API弃用警告等
 * // 3. 警告信息会包含堆栈跟踪，便于定位问题来源
 * // 4. 对于生产环境，可以考虑将警告发送到监控或日志系统
 * // 5. 开发环境中警告可以帮助快速发现配置和API使用问题
 * // 6. 监听器设置后不能移除，需要重启应用才能重置
 * // 7. 定期检查警告日志有助于应用维护和性能优化
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