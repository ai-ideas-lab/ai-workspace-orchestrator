"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatErrorMessage = formatErrorMessage;
exports.extractErrorMessage = extractErrorMessage;
exports.isErrorOfType = isErrorOfType;
exports.createStandardError = createStandardError;
exports.isRetryableError = isRetryableError;
const index_js_1 = require("../constants/index.js");
function formatErrorMessage(error, prefix = index_js_1.ERROR_PATTERNS.DEFAULT_ERROR_PREFIX) {
    try {
        if (typeof error === 'string') {
            return prefix + error;
        }
        if (error instanceof Error) {
            return prefix + error.message;
        }
        return prefix + String(error);
    }
    catch (formatError) {
        return String(error);
    }
}
function extractErrorMessage(error, defaultValue = 'Unknown error') {
    try {
        if (error instanceof Error) {
            return error.message;
        }
        if (typeof error === 'string') {
            return error;
        }
        return defaultValue;
    }
    catch (extractError) {
        return defaultValue;
    }
}
function isErrorOfType(error, errorType, property, propertyValue) {
    try {
        if (!error)
            return false;
        if (errorType && error.constructor && error.constructor.name === errorType) {
            return true;
        }
        if (property && typeof error[property] !== 'undefined') {
            if (propertyValue !== undefined) {
                return error[property] === propertyValue;
            }
            return true;
        }
        return false;
    }
    catch (checkError) {
        return false;
    }
}
function createStandardError(message, code = 'INTERNAL_ERROR', statusCode = 500, originalError) {
    const error = new Error(message);
    error.name = code;
    error.statusCode = statusCode;
    if (originalError) {
        error.originalError = originalError;
        error.stack = originalError.stack;
    }
    return error;
}
function isRetryableError(error) {
    try {
        if (!error)
            return false;
        const networkErrors = [
            'ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND',
            'Network Error', 'fetch failed', 'timeout', 'connection'
        ];
        const errorMessage = error.message || String(error);
        if (networkErrors.some(msg => errorMessage.toLowerCase().includes(msg.toLowerCase()))) {
            return true;
        }
        if (errorMessage.includes('database') || errorMessage.includes('connection')) {
            return true;
        }
        if (errorMessage.includes('timeout')) {
            return true;
        }
        const transientErrors = ['temporary', 'temporary unavailable', 'service unavailable'];
        if (transientErrors.some(msg => errorMessage.toLowerCase().includes(msg.toLowerCase()))) {
            return true;
        }
        return false;
    }
    catch (checkError) {
        return false;
    }
}
//# sourceMappingURL=error-helper.js.map