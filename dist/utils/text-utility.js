"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanText = cleanText;
exports.truncateText = truncateText;
exports.isValidEmail = isValidEmail;
exports.extractActionVerbs = extractActionVerbs;
exports.capitalizeText = capitalizeText;
exports.generateTimestampId = generateTimestampId;
exports.toSnakeCase = toSnakeCase;
function cleanText(text) {
    return text.trim().replace(/\s+/g, ' ');
}
function truncateText(text, maxLength, suffix = '...') {
    if (text.length <= maxLength)
        return text;
    return text.substring(0, maxLength - suffix.length) + suffix;
}
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
function extractActionVerbs(text) {
    const actionVerbs = ['创建', '执行', '更新', '删除', '获取', '设置', '验证', '发送', '接收', '分析', '处理', '转换', '同步', '备份', '恢复'];
    const words = cleanText(text).split(' ');
    return words.filter(word => actionVerbs.includes(word));
}
function capitalizeText(text) {
    if (!text)
        return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}
function generateTimestampId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
function toSnakeCase(text) {
    if (!text)
        return '';
    const cleaned = cleanText(text).toLowerCase();
    const result = cleaned
        .replace(/([A-Z])/g, '_$1')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
    return result;
}
//# sourceMappingURL=text-utility.js.map