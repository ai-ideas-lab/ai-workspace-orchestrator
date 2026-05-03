"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateConfig = validateConfig;
exports.validateRequiredFields = validateRequiredFields;
function validateConfig(config) {
    if (!config || typeof config !== 'object') {
        return false;
    }
    try {
        if (!('version' in config) || typeof config.version !== 'string') {
            return false;
        }
        const versionPattern = /^\d+\.\d+\.\d+(-[\w-]+)?(\+[\w-]+)?$/;
        if (!versionPattern.test(config.version)) {
            return false;
        }
        return true;
    }
    catch (error) {
        if (process.env.NODE_ENV === 'development') {
            console.error('Configuration validation error:', error);
        }
        return false;
    }
}
function validateRequiredFields(obj, requiredFields) {
    try {
        if (!obj || typeof obj !== 'object') {
            return false;
        }
        for (const field of requiredFields) {
            if (!(field in obj)) {
                return false;
            }
            if (obj[field] === null || obj[field] === undefined || (typeof obj[field] === 'string' && obj[field].trim() === '')) {
                return false;
            }
        }
        return true;
    }
    catch (error) {
        if (process.env.NODE_ENV === 'development') {
            console.error('Required fields validation error:', error);
        }
        return false;
    }
}
//# sourceMappingURL=validation.js.map