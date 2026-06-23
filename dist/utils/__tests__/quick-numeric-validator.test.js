"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const quick_numeric_validator_1 = require("../quick-numeric-validator");
describe('quick-numeric-validator functions', () => {
    describe('validateNumberRange', () => {
        it('should return true for numbers within range', () => {
            expect((0, quick_numeric_validator_1.validateNumberRange)(5, 1, 10)).toBe(true);
            expect((0, quick_numeric_validator_1.validateNumberRange)(1, 1, 10)).toBe(true);
            expect((0, quick_numeric_validator_1.validateNumberRange)(10, 1, 10)).toBe(true);
            expect((0, quick_numeric_validator_1.validateNumberRange)(50, 0, 100)).toBe(true);
        });
        it('should return false for numbers below minimum', () => {
            expect((0, quick_numeric_validator_1.validateNumberRange)(0, 1, 10)).toBe(false);
            expect((0, quick_numeric_validator_1.validateNumberRange)(-5, 1, 10)).toBe(false);
            expect((0, quick_numeric_validator_1.validateNumberRange)(1, 5, 10)).toBe(false);
        });
        it('should return false for numbers above maximum', () => {
            expect((0, quick_numeric_validator_1.validateNumberRange)(15, 1, 10)).toBe(false);
            expect((0, quick_numeric_validator_1.validateNumberRange)(100, 1, 10)).toBe(false);
            expect((0, quick_numeric_validator_1.validateNumberRange)(11, 1, 10)).toBe(false);
        });
    });
    describe('validatePercentage', () => {
        it('should return true for valid percentages', () => {
            expect((0, quick_numeric_validator_1.validatePercentage)(0)).toBe(true);
            expect((0, quick_numeric_validator_1.validatePercentage)(50)).toBe(true);
            expect((0, quick_numeric_validator_1.validatePercentage)(100)).toBe(true);
            expect((0, quick_numeric_validator_1.validatePercentage)(25.5)).toBe(true);
        });
        it('should return false for percentages below 0', () => {
            expect((0, quick_numeric_validator_1.validatePercentage)(-1)).toBe(false);
            expect((0, quick_numeric_validator_1.validatePercentage)(-5)).toBe(false);
            expect((0, quick_numeric_validator_1.validatePercentage)(-0.1)).toBe(false);
        });
        it('should return false for percentages above 100', () => {
            expect((0, quick_numeric_validator_1.validatePercentage)(101)).toBe(false);
            expect((0, quick_numeric_validator_1.validatePercentage)(150)).toBe(false);
            expect((0, quick_numeric_validator_1.validatePercentage)(100.1)).toBe(false);
        });
    });
});
//# sourceMappingURL=quick-numeric-validator.test.js.map