"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.successResponse = successResponse;
exports.errorResponse = errorResponse;
exports.validationErrorResponse = validationErrorResponse;
exports.authenticationErrorResponse = authenticationErrorResponse;
exports.authorizationErrorResponse = authorizationErrorResponse;
exports.notFoundResponse = notFoundResponse;
exports.conflictResponse = conflictResponse;
exports.systemErrorResponse = systemErrorResponse;
exports.paginatedResponse = paginatedResponse;
exports.streamResponse = streamResponse;
exports.downloadResponse = downloadResponse;
exports.redirectResponse = redirectResponse;
exports.noContentResponse = noContentResponse;
exports.createRequestIdMiddleware = createRequestIdMiddleware;
exports.createErrorHandlerMiddleware = createErrorHandlerMiddleware;
exports.asyncHandler = asyncHandler;
exports.createResponseInterceptor = createResponseInterceptor;
const errors_js_1 = require("./errors.js");
function successResponse(res, data, message = '操作成功', statusCode = 200, meta) {
    const response = {
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
function errorResponse(res, error, details, statusCode, requestId) {
    const appError = error instanceof errors_js_1.AppError ? error : new errors_js_1.AppError(error instanceof Error ? error.message : String(error), statusCode);
    const finalStatusCode = statusCode || (0, errors_js_1.getStatusCode)(error);
    const finalMessage = (0, errors_js_1.getUserMessage)(error);
    const finalErrorCode = (0, errors_js_1.getErrorCode)(error);
    const response = {
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
    console.error(`[${finalStatusCode}] ${finalErrorCode}: ${finalMessage}`, {
        error: appError,
        details: details,
        requestId,
    });
    res.status(finalStatusCode).json(response);
}
function validationErrorResponse(res, message, field, details, requestId) {
    const error = new Error(message);
    errorResponse(res, error, { field, ...details }, 400, requestId);
}
function authenticationErrorResponse(res, message = '认证失败', details, requestId) {
    const error = new Error(message);
    errorResponse(res, error, details, 401, requestId);
}
function authorizationErrorResponse(res, message = '权限不足', details, requestId) {
    const error = new Error(message);
    errorResponse(res, error, details, 403, requestId);
}
function notFoundResponse(res, resource, id, requestId) {
    const error = new Error(`${resource} ${id ? `"${id}"` : ''} 不存在`);
    errorResponse(res, error, { resource, id }, 404, requestId);
}
function conflictResponse(res, message, details, requestId) {
    const error = new Error(message);
    errorResponse(res, error, details, 409, requestId);
}
function systemErrorResponse(res, message = '系统错误', details, requestId) {
    const error = new Error(message);
    errorResponse(res, error, details, 500, requestId);
}
function paginatedResponse(res, data, total, page, limit, message = '查询成功') {
    const hasNext = (page * limit) < total;
    const totalPages = Math.ceil(total / limit);
    successResponse(res, data, message, 200, {
        timestamp: new Date().toISOString(),
        pagination: {
            page,
            limit,
            total,
            hasNext,
            totalPages,
        },
    });
}
function streamResponse(res, stream, options) {
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
function downloadResponse(res, data, filename, contentType = 'application/octet-stream') {
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.setHeader('Content-Length', Buffer.byteLength(data));
    res.send(data);
}
function redirectResponse(res, url, statusCode = 302) {
    res.redirect(statusCode, url);
}
function noContentResponse(res) {
    res.status(204).end();
}
function createRequestIdMiddleware() {
    return (req, res, next) => {
        const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        req.requestId = requestId;
        res.setHeader('X-Request-ID', requestId);
        next();
    };
}
function createErrorHandlerMiddleware() {
    return (err, req, res, next) => {
        if (res.headersSent) {
            return next(err);
        }
        const requestId = req.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
function createResponseInterceptor() {
    return (req, res, next) => {
        const originalJson = res.json;
        res.json = function (data) {
            if (data && typeof data === 'object' && 'success' in data) {
                return originalJson.call(this, data);
            }
            const wrappedResponse = {
                success: true,
                data,
                error: undefined,
                meta: {
                    timestamp: new Date().toISOString(),
                    requestId: req.requestId,
                },
            };
            return originalJson.call(this, wrappedResponse);
        };
        next();
    };
}
//# sourceMappingURL=responseUtils.js.map