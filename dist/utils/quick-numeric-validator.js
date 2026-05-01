"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePercentage = exports.validateNumberRange = void 0;
const validateNumberRange = (value, min, max) => {
    return value >= min && value <= max;
};
exports.validateNumberRange = validateNumberRange;
const validatePercentage = (value) => {
    return (0, exports.validateNumberRange)(value, 0, 100);
};
exports.validatePercentage = validatePercentage;
//# sourceMappingURL=quick-numeric-validator.js.map