"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.add = add;
exports.validateEmail = validateEmail;
exports.formatFileSize = formatFileSize;
exports.getRandomInt = getRandomInt;
exports.debounce = debounce;
exports.throttle = throttle;
function add(num1, num2) {
    if (typeof num1 !== 'number' || typeof num2 !== 'number') {
        throw new TypeError('参数必须是数字类型');
    }
    return num1 + num2;
}
function validateEmail(email, requireTLD = true) {
    if (typeof email !== 'string') {
        throw new TypeError('email参数必须是字符串类型');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (requireTLD) {
        return emailRegex.test(email);
    }
    else {
        const localEmailRegex = /^[^\s@]+@[^\s@]+$/;
        return localEmailRegex.test(email);
    }
}
function formatFileSize(bytes, decimals = 2) {
    if (typeof bytes !== 'number') {
        throw new TypeError('bytes参数必须是数字类型');
    }
    if (bytes < 0) {
        throw new RangeError('bytes参数不能为负数');
    }
    if (bytes === 0)
        return '0B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + sizes[i];
}
function getRandomInt(min, max) {
    if (typeof min !== 'number' || typeof max !== 'number') {
        throw new TypeError('参数必须是数字类型');
    }
    if (min > max) {
        throw new RangeError('min参数不能大于max参数');
    }
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function debounce(func, wait = 500, immediate = false) {
    if (typeof func !== 'function') {
        throw new TypeError('func参数必须是函数类型');
    }
    let timeout = null;
    return function (...args) {
        const context = this;
        const later = () => {
            timeout = null;
            if (!immediate) {
                func.apply(context, args);
            }
        };
        const callNow = immediate && !timeout;
        if (timeout !== null) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(later, wait);
        if (callNow) {
            func.apply(context, args);
        }
    };
}
function throttle(func, limit = 1000) {
    if (typeof func !== 'function') {
        throw new TypeError('func参数必须是函数类型');
    }
    let inThrottle = false;
    return function (...args) {
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => {
                inThrottle = false;
            }, limit);
        }
    };
}
//# sourceMappingURL=jsdoc-enhancement-demo.js.map