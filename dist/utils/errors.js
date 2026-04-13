"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileProcessingError = exports.TimeoutError = exports.AIEngineError = exports.WorkflowError = exports.RateLimitError = exports.DatabaseError = exports.NetworkError = exports.ExternalServiceError = exports.SystemError = exports.ConflictError = exports.BusinessError = exports.NotFoundError = exports.AuthorizationError = exports.AuthenticationError = exports.ValidationError = exports.AppError = void 0;
exports.isAppError = isAppError;
exports.isErrorOperational = isErrorOperational;
exports.getStatusCode = getStatusCode;
exports.getUserMessage = getUserMessage;
exports.getErrorCode = getErrorCode;
class AppError extends Error {
    constructor(message, statusCode = 500, errorCode = 'INTERNAL_ERROR', isOperational = true, details, userMessage) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.isOperational = isOperational;
        this.details = details;
        this.userMessage = userMessage;
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}
exports.AppError = AppError;
class ValidationError extends AppError {
    constructor(message, field, details) {
        super(message, 400, 'VALIDATION_ERROR', true, { field, ...details }, message);
    }
}
exports.ValidationError = ValidationError;
class AuthenticationError extends AppError {
    constructor(message = '认证失败', details) {
        super(message, 401, 'AUTHENTICATION_ERROR', true, details, '用户名或密码错误');
    }
}
exports.AuthenticationError = AuthenticationError;
class AuthorizationError extends AppError {
    constructor(message = '权限不足', details) {
        super(message, 403, 'AUTHORIZATION_ERROR', true, details, '您没有权限执行此操作');
    }
}
exports.AuthorizationError = AuthorizationError;
class NotFoundError extends AppError {
    constructor(resource, id, details) {
        const message = id ? `${resource} "${id}" 不存在` : `${resource} 不存在`;
        super(message, 404, 'NOT_FOUND', true, { resource, id, ...details }, `请求的${resource}不存在`);
    }
}
exports.NotFoundError = NotFoundError;
class BusinessError extends AppError {
    constructor(message, errorCode = 'BUSINESS_ERROR', details, userMessage) {
        super(message, 422, errorCode, true, details, userMessage || message);
    }
}
exports.BusinessError = BusinessError;
class ConflictError extends AppError {
    constructor(message, details) {
        super(message, 409, 'CONFLICT_ERROR', true, details, '操作冲突，请检查数据');
    }
}
exports.ConflictError = ConflictError;
class SystemError extends AppError {
    constructor(message, service, details) {
        const fullMessage = service ? `[${service}] ${message}` : message;
        super(fullMessage, 500, 'SYSTEM_ERROR', false, { service, ...details }, '系统暂时不可用，请稍后重试');
    }
}
exports.SystemError = SystemError;
class ExternalServiceError extends AppError {
    constructor(service, message, statusCode, details) {
        const fullMessage = `[${service}] ${message}`;
        super(fullMessage, statusCode || 502, 'EXTERNAL_SERVICE_ERROR', false, { service, ...details }, '外部服务暂时不可用，请稍后重试');
    }
}
exports.ExternalServiceError = ExternalServiceError;
class NetworkError extends AppError {
    constructor(message, details) {
        super(message, 503, 'NETWORK_ERROR', false, details, '网络连接失败，请检查网络设置');
    }
}
exports.NetworkError = NetworkError;
class DatabaseError extends AppError {
    constructor(message, details) {
        super(message, 500, 'DATABASE_ERROR', false, details, '数据库操作失败');
    }
}
exports.DatabaseError = DatabaseError;
class RateLimitError extends AppError {
    constructor(message, retryAfter, details) {
        const userMsg = retryAfter
            ? `请求过于频繁，请在 ${retryAfter} 秒后重试`
            : '请求过于频繁，请稍后重试';
        super(message, 429, 'RATE_LIMIT_ERROR', true, { retryAfter, ...details }, userMsg);
    }
}
exports.RateLimitError = RateLimitError;
class WorkflowError extends AppError {
    constructor(message, workflowId, stepId, details) {
        const fullMessage = stepId
            ? `[workflow:${workflowId}][step:${stepId}] ${message}`
            : `[workflow:${workflowId}] ${message}`;
        super(fullMessage, 400, 'WORKFLOW_ERROR', true, { workflowId, stepId, ...details }, '工作流执行失败');
    }
}
exports.WorkflowError = WorkflowError;
class AIEngineError extends AppError {
    constructor(engineId, message, details) {
        super(`[${engineId}] ${message}`, 502, 'AI_ENGINE_ERROR', false, { engineId, ...details }, 'AI服务暂时不可用');
    }
}
exports.AIEngineError = AIEngineError;
class TimeoutError extends AppError {
    constructor(message, operation, details) {
        const fullMessage = operation ? `[${operation}] ${message}` : message;
        super(fullMessage, 504, 'TIMEOUT_ERROR', true, { operation, ...details }, '操作超时，请重试');
    }
}
exports.TimeoutError = TimeoutError;
class FileProcessingError extends AppError {
    constructor(filename, message, details) {
        super(`[${filename}] ${message}`, 400, 'FILE_PROCESSING_ERROR', true, { filename, ...details }, '文件处理失败');
    }
}
exports.FileProcessingError = FileProcessingError;
function isAppError(error) {
    return error instanceof AppError;
}
function isErrorOperational(error) {
    return isAppError(error) && error.isOperational;
}
function getStatusCode(error) {
    if (isAppError(error)) {
        return error.statusCode;
    }
    return 500;
}
function getUserMessage(error) {
    if (isAppError(error)) {
        return error.userMessage || error.message;
    }
    return '系统错误，请稍后重试';
}
function getErrorCode(error) {
    if (isAppError(error)) {
        return error.errorCode;
    }
    return 'INTERNAL_ERROR';
}
//# sourceMappingURL=errors.js.map