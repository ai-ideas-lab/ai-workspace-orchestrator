"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isEmptyOrWhitespace = isEmptyOrWhitespace;
exports.generateRandomId = generateRandomId;
function isEmptyOrWhitespace(text) {
    return !text || text.trim().length === 0;
}
function generateRandomId(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
//# sourceMappingURL=stringHelper.js.map