"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isEmpty = exports.quickValidate = void 0;
const quickValidate = (input) => {
    return input && input.trim().length > 0;
};
exports.quickValidate = quickValidate;
const isEmpty = (str) => {
    return !str || str.trim() === '';
};
exports.isEmpty = isEmpty;
//# sourceMappingURL=quick-validator.js.map