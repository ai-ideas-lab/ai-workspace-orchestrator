/**
 * Error Handling Decorators - 错误处理装饰器
 * 
 * 提供统一的错误处理装饰器，确保所有控制器方法都有适当的错误处理
 */

import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError, NotFoundError, SystemError } from './errors.js';
import { logger } from './enhanced-error-logger.js';

/**
 * 装饰器：为控制器方法添加统一的错误处理
 * 
 * 自动捕获方法中的异常，转换为AppError并记录日志
 * 保持原有的业务逻辑不变，只增强错误处理
 */
export function withErrorHandling(
  options: {
    logErrors?: boolean;
    sanitizeUserError?: boolean;
    defaultErrorCode?: string;
    defaultStatusCode?: number;
  } = {}
) {
  const {
    logErrors = true,
    sanitizeUserError = true,
    defaultErrorCode = 'INTERNAL_ERROR',
    defaultStatusCode = 500,
  } = options;

  return function (
    target: any,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<any>
  ) {
    const method = descriptor.value!;

    descriptor.value = async function (
      this: any,
      req: Request,
      res: Response,
      next: NextFunction
    ): Promise<any> {
      try {
        // 调用原始方法
        const result = await method.apply(this, [req, res, next]);
        
        // 如果方法已经发送了响应，直接返回
        if (res.headersSent) {
          return result;
        }
        
        return result;
      } catch (error) {
        // 记录错误日志
        if (logErrors) {
          logger.error(`控制器方法错误: ${target.constructor.name}.${propertyName}`, {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            requestId: req.requestId,
            userId: req.user?.id,
            method: req.method,
            url: req.originalUrl,
          });
        }

        // 转换错误为AppError
        const appError = normalizeError(error, options);
        
        // 发送错误响应
        if (!res.headersSent) {
          sendErrorResponse(res, appError);
        }
        
        // 如果next被调用，继续传递错误
        if (!res.headersSent && next) {
          next(appError);
        }
      }
    };

    return descriptor;
  };
}

/**
 * 装饰器：为异步控制器方法添加重试逻辑
 */
export function withRetry(
  options: {
    maxRetries?: number;
    delayMs?: number;
    retryCondition?: (error: unknown) => boolean;
  } = {}
) {
  const {
    maxRetries = 2,
    delayMs = 100,
    retryCondition = (error) => 
      error instanceof SystemError || 
      error.message.includes('timeout') ||
      error.message.includes('network')
  } = options;

  return function (
    target: any,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<any>
  ) {
    const method = descriptor.value!;

    descriptor.value = async function (
      this: any,
      req: Request,
      res: Response,
      next: NextFunction
    ): Promise<any> {
      let lastError: unknown;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          return await method.apply(this, [req, res, next]);
        } catch (error) {
          lastError = error;
          
          // 检查是否应该重试
          if (!retryCondition(error) || attempt === maxRetries) {
            break;
          }
          
          // 等待重试
          await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
        }
      }
      
      // 所有重试失败，抛出最后一个错误
      throw normalizeError(lastError, options);
    };

    return descriptor;
  };
}

/**
 * 装饰器：为数据库操作添加事务和错误处理
 */
export function withTransactionErrorHandler(
  operationName: string = 'database operation'
) {
  return function (
    target: any,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<any>
  ) {
    const method = descriptor.value!;

    descriptor.value = async function (
      this: any,
      req: Request,
      res: Response,
      next: NextFunction
    ): Promise<any> {
      try {
        const result = await method.apply(this, [req, res, next]);
        return result;
      } catch (error) {
        // 记录数据库错误上下文
        logger.error(`${operationName} 失败:`, {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          requestId: req.requestId,
          userId: req.user?.id,
          operation: operationName,
        });

        // 转换数据库错误
        const appError = normalizeDatabaseError(error, operationName);
        sendErrorResponse(res, appError);
      }
    };

    return descriptor;
  };
}

/**
 * 标准化错误对象
 */
function normalizeError(
  error: unknown,
  options: {
    sanitizeUserError?: boolean;
    defaultErrorCode?: string;
    defaultStatusCode?: number;
  }
): AppError {
  const {
    sanitizeUserError = true,
    defaultErrorCode = 'INTERNAL_ERROR',
    defaultStatusCode = 500,
  } = options;

  // 如果已经是AppError，直接返回
  if (error instanceof AppError) {
    return error;
  }

  // 如果是Error实例，转换为AppError
  if (error instanceof Error) {
    let userMessage = error.message;
    
    // 用户端错误净化
    if (sanitizeUserError) {
      userMessage = sanitizeErrorMessage(error.message);
    }

    // 根据错误类型分类
    if (error.message.includes('validation')) {
      return new ValidationError(error.message, undefined, { originalError: error.message });
    } else if (error.message.includes('not found') || error.message.includes('不存在')) {
      return new NotFoundError('Resource', undefined, { originalError: error.message });
    } else if (error.message.includes('network') || error.message.includes('timeout')) {
      return new SystemError(error.message, 'network', { originalError: error.message });
    }

    // 默认转换为系统错误
    return new SystemError(
      userMessage,
      'controller',
      { originalError: error.message, stack: error.stack }
    );
  }

  // 其他类型的错误
  const message = String(error);
  return new SystemError(
    sanitizeUserError ? sanitizeErrorMessage(message) : message,
    'controller',
    { originalError: message }
  );
}

/**
 * 处理数据库特定错误
 */
function normalizeDatabaseError(error: unknown, operation: string): AppError {
  // 这里可以根据具体的数据库错误类型进行更精细的处理
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('unique constraint') || message.includes('duplicate')) {
      return new ValidationError('数据已存在，请使用其他值', undefined, { 
        operation, 
        originalError: error.message 
      });
    } else if (message.includes('foreign key') || message.includes('constraint')) {
      return new ValidationError('关联数据不存在', undefined, { 
        operation, 
        originalError: error.message 
      });
    } else if (message.includes('not found')) {
      return new NotFoundError('记录', undefined, { 
        operation, 
        originalError: error.message 
      });
    }
  }

  return new SystemError(
    '数据库操作失败',
    'database',
    { operation, originalError: error instanceof Error ? error.message : String(error) }
  );
}

/**
 * 发送错误响应
 */
function sendErrorResponse(res: Response, error: AppError): void {
  // 设置响应头
  res.setHeader('X-Error-Code', error.errorCode);
  res.setHeader('X-Request-ID', res.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  
  // 发送JSON响应
  res.status(error.statusCode).json({
    success: false,
    error: {
      code: error.errorCode,
      message: error.userMessage || error.message,
      details: error.details,
      requestId: res.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: res.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    },
  });
}

/**
 * 净化用户端错误消息
 */
function sanitizeErrorMessage(message: string): string {
  // 移除敏感信息
  const sensitivePatterns = [
    /password/i,
    /token/i,
    /secret/i,
    /key/i,
    /api[_-]?key/i,
    /authorization/i,
    /bearer/i,
  ];

  let sanitized = message;
  
  sensitivePatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  });

  // 移除技术堆栈信息
  sanitized = sanitized.split('\n')[0]; // 只保留第一行
  sanitized = sanitized.replace(/at .+$/gm, ''); // 移除堆栈跟踪
  sanitized = sanitized.replace(/\(node:.+?\)/g, ''); // 移除节点路径

  return sanitized.trim();
}

/**
 * 装饰器：为API端点添加输入验证
 */
export function withInputValidation(
  validator: (req: Request) => { isValid: boolean; errors?: string[] }
) {
  return function (
    target: any,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<any>
  ) {
    const method = descriptor.value!;

    descriptor.value = async function (
      this: any,
      req: Request,
      res: Response,
      next: NextFunction
    ): Promise<any> {
      // 验证输入
      const validation = validator(req);
      
      if (!validation.isValid) {
        const validationError = new ValidationError(
          '输入数据验证失败',
          undefined,
          { errors: validation.errors }
        );
        
        sendErrorResponse(res, validationError);
        return;
      }

      // 继续执行原始方法
      return method.apply(this, [req, res, next]);
    };

    return descriptor;
  };
}

/**
 * 装饰器：为API端点添加性能监控
 */
export function withPerformanceMonitoring() {
  return function (
    target: any,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<any>
  ) {
    const method = descriptor.value!;

    descriptor.value = async function (
      this: any,
      req: Request,
      res: Response,
      next: NextFunction
    ): Promise<any> {
      const startTime = Date.now();
      
      try {
        const result = await method.apply(this, [req, res, next]);
        
        // 记录成功性能指标
        const duration = Date.now() - startTime;
        logger.info(`API端点性能: ${target.constructor.name}.${propertyName}`, {
          duration,
          method: req.method,
          url: req.originalUrl,
          requestId: req.requestId,
          statusCode: res.statusCode,
        });
        
        return result;
      } catch (error) {
        // 记录失败性能指标
        const duration = Date.now() - startTime;
        logger.warn(`API端点性能异常: ${target.constructor.name}.${propertyName}`, {
          duration,
          method: req.method,
          url: req.originalUrl,
          requestId: req.requestId,
          error: error instanceof Error ? error.message : String(error),
        });
        
        throw error;
      }
    };

    return descriptor;
  };
}