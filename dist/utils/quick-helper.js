"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.quickFormat = quickFormat;
exports.quickValidate = quickValidate;
function quickFormat(input) {
    return input.trim().replace(/\s+/g, ' ');
}
function quickValidate(input) {
    return input.length > 0 && input.length < 1000;
}
//# sourceMappingURL=quick-helper.js.map