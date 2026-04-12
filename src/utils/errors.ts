/**
 * Custom Error Classes - 统一错误类型体系
 * 
 * 提供标准化的错误分类和处理，支持错误码、上下文信息和用户友好消息。
 */

/**
 * 基础自定义错误类
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, unknown>;
  public readonly userMessage?: string;

  constructor(
    message: string,
    statusCode: number = 500,
    errorCode: string = 'INTERNAL_ERROR',
    isOperational: boolean = true,
    details?: Record<string, unknown>,
    userMessage?: string
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;
    this.details = details;
    this.userMessage = userMessage;

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * 验证错误 - 请求参数或数据格式不正确
 */
export class ValidationError extends AppError {
  constructor(
    message: string,
    field?: string,
    details?: Record<string, unknown>
  ) {
    super(
      message,
      400,
      'VALIDATION_ERROR',
      true,
      { field, ...details },
      message
    );
  }
}

/**
 * 认证错误 - 用户身份验证失败
 */
export class AuthenticationError extends AppError {
  constructor(message: string = '认证失败', details?: Record<string, unknown>) {
    super(
      message,
      401,
      'AUTHENTICATION_ERROR',
      true,
      details,
      '用户名或密码错误'
    );
  }
}

/**
 * 授权错误 - 用户权限不足
 */
export class AuthorizationError extends AppError {
  constructor(message: string = '权限不足', details?: Record<string, unknown>) {
    super(
      message,
      403,
      'AUTHORIZATION_ERROR',
      true,
      details,
      '您没有权限执行此操作'
    );
  }
}

/**
 * 资源未找到错误
 */
export class NotFoundError extends AppError {
  constructor(resource: string, id?: string | number, details?: Record<string, unknown>) {
    const message = id ? `${resource} "${id}" 不存在` : `${resource} 不存在`;
    super(
      message,
      404,
      'NOT_FOUND',
      true,
      { resource, id, ...details },
      `请求的${resource}不存在`
    );
  }
}

/**
 * 业务逻辑错误 - 违反业务规则
 */
export class BusinessError extends AppError {
  constructor(
    message: string,
    errorCode: string = 'BUSINESS_ERROR',
    details?: Record<string, unknown>,
    userMessage?: string
  ) {
    super(
      message,
      422,
      errorCode,
      true,
      details,
      userMessage || message
    );
  }
}

/**
 * 冲突错误 - 资源冲突（如用户名已存在）
 */
export class ConflictError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(
      message,
      409,
      'CONFLICT_ERROR',
      true,
      details,
      '操作冲突，请检查数据'
    );
  }
}

/**
 * 系统错误 - 外部服务依赖或内部系统错误
 */
export class SystemError extends AppError {
  constructor(
    message: string,
    service?: string,
    details?: Record<string, unknown>
  ) {
    const fullMessage = service ? `[${service}] ${message}` : message;
    super(
      fullMessage,
      500,
      'SYSTEM_ERROR',
      false, // Operational errors are usually not marked as operational
      { service, ...details },
      '系统暂时不可用，请稍后重试'
    );
  }
}

/**
 * 外部服务错误 - 第三方API调用失败
 */
export class ExternalServiceError extends AppError {
  constructor(
    service: string,
    message: string,
    statusCode?: number,
    details?: Record<string, unknown>
  ) {
    const fullMessage = `[${service}] ${message}`;
    super(
      fullMessage,
      statusCode || 502,
      'EXTERNAL_SERVICE_ERROR',
      false,
      { service, ...details },
      '外部服务暂时不可用，请稍后重试'
    );
  }
}

/**
 * 网络错误 - 网络连接或超时问题
 */
export class NetworkError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(
      message,
      503,
      'NETWORK_ERROR',
      false,
      details,
      '网络连接失败，请检查网络设置'
    );
  }
}

/**
 * 数据库错误
 */
export class DatabaseError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(
      message,
      500,
      'DATABASE_ERROR',
      false,
      details,
      '数据库操作失败'
    );
  }
}

/**
 * 限流错误
 */
export class RateLimitError extends AppError {
  constructor(
    message: string,
    retryAfter?: number,
    details?: Record<string, unknown>
  ) {
    const userMsg = retryAfter 
      ? `请求过于频繁，请在 ${retryAfter} 秒后重试`
      : '请求过于频繁，请稍后重试';
    
    super(
      message,
      429,
      'RATE_LIMIT_ERROR',
      true,
      { retryAfter, ...details },
      userMsg
    );
  }
}

/**
 * 工作流特定错误
 */
export class WorkflowError extends AppError {
  constructor(
    message: string,
    workflowId?: string,
    stepId?: string,
    details?: Record<string, unknown>
  ) {
    const fullMessage = stepId 
      ? `[workflow:${workflowId}][step:${stepId}] ${message}`
      : `[workflow:${workflowId}] ${message}`;
    
    super(
      fullMessage,
      400,
      'WORKFLOW_ERROR',
      true,
      { workflowId, stepId, ...details },
      '工作流执行失败'
    );
  }
}

/**
 * AI引擎错误
 */
export class AIEngineError extends AppError {
  constructor(
    engineId: string,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(
      `[${engineId}] ${message}`,
      502,
      'AI_ENGINE_ERROR',
      false,
      { engineId, ...details },
      'AI服务暂时不可用'
    );
  }
}

/**
 * 异步操作超时错误
 */
export class TimeoutError extends AppError {
  constructor(message: string, operation?: string, details?: Record<string, unknown>) {
    const fullMessage = operation ? `[${operation}] ${message}` : message;
    super(
      fullMessage,
      504,
      'TIMEOUT_ERROR',
      true,
      { operation, ...details },
      '操作超时，请重试'
    );
  }
}

/**
 * 文件处理错误
 */
export class FileProcessingError extends AppError {
  constructor(
    filename: string,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(
      `[${filename}] ${message}`,
      400,
      'FILE_PROCESSING_ERROR',
      true,
      { filename, ...details },
      '文件处理失败'
    );
  }
}

// 错误助手函数
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function isErrorOperational(error: unknown): boolean {
  return isAppError(error) && error.isOperational;
}

export function getStatusCode(error: unknown): number {
  if (isAppError(error)) {
    return error.statusCode;
  }
  return 500; // 默认服务器错误
}

export function getUserMessage(error: unknown): string {
  if (isAppError(error)) {
    return error.userMessage || error.message;
  }
  return '系统错误，请稍后重试';
}

export function getErrorCode(error: unknown): string {
  if (isAppError(error)) {
    return error.errorCode;
  }
  return 'INTERNAL_ERROR';
}