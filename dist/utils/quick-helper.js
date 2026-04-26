"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.quickFormat = quickFormat;
exports.quickValidate = quickValidate;
exports.quickSum = quickSum;
exports.isValidIdentifier = isValidIdentifier;
function quickFormat(input) {
    return input.trim().replace(/\s+/g, ' ');
}
function quickValidate(input) {
    return input.length > 0 && input.length < 1000;
}
function quickSum(numbers) {
    return numbers.reduce((acc, num) => acc + num, 0);
}
function isValidIdentifier(input) {
    return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(input.trim());
}
//# sourceMappingURL=quick-helper.js.map