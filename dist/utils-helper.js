"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatFileSize = formatFileSize;
exports.debounce = debounce;
exports.generateSimpleId = generateSimpleId;
exports.deepClone = deepClone;
function formatFileSize(bytes, decimals = 2) {
    if (typeof bytes !== 'number' || isNaN(bytes)) {
        throw new TypeError('Bytes must be a valid number');
    }
    if (bytes === 0) {
        return '0B';
    }
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
    const dm = i === 0 ? 0 : Math.max(0, decimals);
    return `${(bytes / Math.pow(k, i)).toFixed(dm)}${sizes[i]}`;
}
function debounce(func, wait = 300) {
    let timeout;
    return ((...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func(...args);
        }, wait);
    });
}
function generateSimpleId(length = 8) {
    if (typeof length !== 'number' || length <= 0 || !Number.isInteger(length)) {
        throw new TypeError('Length must be a positive integer');
    }
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    if (obj instanceof Date) {
        return new Date(obj.getTime());
    }
    if (obj instanceof RegExp) {
        return new RegExp(obj.source, obj.flags);
    }
    if (Array.isArray(obj)) {
        return obj.map(item => deepClone(item));
    }
    const clonedObj = {};
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            clonedObj[key] = deepClone(obj[key]);
        }
    }
    return clonedObj;
}
//# sourceMappingURL=utils-helper.js.map