"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isEmpty = exports.quickValidate = void 0;
exports.quickValidateRequest = quickValidateRequest;
const quickValidate = (input) => {
    return input && input.trim().length > 0;
};
exports.quickValidate = quickValidate;
const isEmpty = (str) => {
    return !str || str.trim() === '';
};
exports.isEmpty = isEmpty;
function quickValidateRequest(userRequest) {
    if (!userRequest || userRequest.trim().length === 0) {
        return { valid: false, message: "请求内容不能为空" };
    }
    if (userRequest.length > 500) {
        return { valid: false, message: "请求内容过长，请简化后重试" };
    }
    return { valid: true, message: "请求格式验证通过" };
}
//# sourceMappingURL=quick-validator.js.map