/**
 * Unified Response Utils - 统一响应格式和错误处理
 * 
 * 提供标准化的API响应格式，确保错误处理的统一性和一致性。
 */

import { AppError, getStatusCode, getUserMessage, getErrorCode } from './errors.js';

/**
 * 标准化API响应格式
 */
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

/**
 * 成功响应
 */
export function successResponse<T>(
  res: any, // Express Response
  data: T,
  message: string = '操作成功',
  statusCode: number = 200,
  meta?: ApiResponse<T>['meta']
): void {
  const response: ApiResponse<T> = {
    success: true,
    data,
    error: undefined,
    meta: {
      timestamp: new Date().toISOString(),
      ...(meta || {}),
    },
  };

  res.status(statusCode).json(response);
}

/**
 * 错误响应
 */
export function errorResponse(
  res: any, // Express Response
  error: unknown,
  details?: Record<string, unknown>,
  statusCode?: number,
  requestId?: string
): void {
  // 获取错误信息
  const appError = error instanceof AppError ? error : new AppError(
    error instanceof Error ? error.message : String(error),
    statusCode
  );
  
  const finalStatusCode = statusCode || getStatusCode(error);
  const finalMessage = getUserMessage(error);
  const finalErrorCode = getErrorCode(error);

  const response: ApiResponse = {
    success: false,
    data: undefined,
    error: {
      code: finalErrorCode,
      message: finalMessage,
      details: appError.details ? { ...appError.details, ...details } : details,
      requestId,
      timestamp: new Date().toISOString(),
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId,
    },
  };

  // 记录错误日志（实际项目中应该集成到日志系统）
  console.error(`[${finalStatusCode}] ${finalErrorCode}: ${finalMessage}`, {
    error: appError,
    details: details,
    requestId,
  });

  res.status(finalStatusCode).json(response);
}

/**
 * 验证错误响应
 */
export function validationErrorResponse(
  res: any, // Express Response
  message: string,
  field?: string,
  details?: Record<string, unknown>,
  requestId?: string
): void {
  const error = new Error(message);
  errorResponse(res, error, { field, ...details }, 400, requestId);
}

/**
 * 认证错误响应
 */
export function authenticationErrorResponse(
  res: any, // Express Response
  message: string = '认证失败',
  details?: Record<string, unknown>,
  requestId?: string
): void {
  const error = new Error(message);
  errorResponse(res, error, details, 401, requestId);
}

/**
 * 授权错误响应
 */
export function authorizationErrorResponse(
  res: any, // Express Response
  message: string = '权限不足',
  details?: Record<string, unknown>,
  requestId?: string
): void {
  const error = new Error(message);
  errorResponse(res, error, details, 403, requestId);
}

/**
 * 资源未找到响应
 */
export function notFoundResponse(
  res: any, // Express Response
  resource: string,
  id?: string | number,
  requestId?: string
): void {
  const error = new Error(`${resource} ${id ? `"${id}"` : ''} 不存在`);
  errorResponse(res, error, { resource, id }, 404, requestId);
}

/**
 * 冲突响应
 */
export function conflictResponse(
  res: any, // Express Response
  message: string,
  details?: Record<string, unknown>,
  requestId?: string
): void {
  const error = new Error(message);
  errorResponse(res, error, details, 409, requestId);
}

/**
 * 系统错误响应
 */
export function systemErrorResponse(
  res: any, // Express Response,
  message: string = '系统错误',
  details?: Record<string, unknown>,
  requestId?: string
): void {
  const error = new Error(message);
  errorResponse(res, error, details, 500, requestId);
}

/**
 * 分页响应格式
 */
export function paginatedResponse<T>(
  res: any, // Express Response
  data: T[],
  total: number,
  page: number,
  limit: number,
  message: string = '查询成功'
): void {
  const hasNext = (page * limit) < total;
  const totalPages = Math.ceil(total / limit);

  successResponse(res, data, message, 200, {
    timestamp: new Date().toISOString(),
    pagination: {
      page,
      limit,
      total,
      hasNext,
    },
  });
}

/**
 * 流式响应（用于大文件或实时数据）
 */
export function streamResponse(
  res: any, // Express Response
  stream: NodeJS.ReadableStream,
  options?: {
    contentType?: string;
    filename?: string;
    status?: number;
  }
): void {
  const { contentType = 'application/octet-stream', filename, status = 200 } = options || {};
  
  res.status(status);
  
  if (contentType) {
    res.setHeader('Content-Type', contentType);
  }
  
  if (filename) {
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  }

  stream.pipe(res);
}

/**
 * 下载响应
 */
export function downloadResponse(
  res: any, // Express Response
  data: Buffer | string,
  filename: string,
  contentType: string = 'application/octet-stream'
): void {
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
  res.setHeader('Content-Length', Buffer.byteLength(data));
  res.send(data);
}

/**
 * 重定向响应
 */
export function redirectResponse(
  res: any, // Express Response
  url: string,
  statusCode: number = 302
): void {
  res.redirect(statusCode, url);
}

/**
 * 无内容响应
 */
export function noContentResponse(res: any): void {
  res.status(204).end();
}

/**
 * 创建中间件：请求ID生成器
 */
export function createRequestIdMiddleware() {
  return (req: any, res: any, next: any) => {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    req.requestId = requestId;
    res.setHeader('X-Request-ID', requestId);
    next();
  };
}

/**
 * 创建中间件：错误处理器
 */
export function createErrorHandlerMiddleware() {
  return (err: any, req: any, res: any, next: any) => {
    // 已经被其他错误处理器处理过的错误不再处理
    if (res.headersSent) {
      return next(err);
    }

    const requestId = req.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 记录未处理的错误
    console.error('未处理的错误:', {
      error: err,
      requestId,
      path: req.path,
      method: req.method,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
    });

    errorResponse(res, err, undefined, undefined, requestId);
  };
}

/**
 * 异步错误包装器
 */
export function asyncHandler(fn: Function) {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * API响应拦截器（用于统一响应格式）
 */
export function createResponseInterceptor() {
  return (req: any, res: any, next: any) => {
    // 重写json方法以确保响应格式一致
    const originalJson = res.json;
    res.json = function(data: any) {
      // 如果已经是标准格式，直接返回
      if (data && typeof data === 'object' && 'success' in data) {
        return originalJson.call(this, data);
      }
      
      // 如果是普通数据，包装成成功响应
      const wrappedResponse: ApiResponse = {
        success: true,
        data,
        error: undefined as any,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.requestId,
        },
      };
      
      return originalJson.call(this, wrappedResponse);
    };

    next();
  };
