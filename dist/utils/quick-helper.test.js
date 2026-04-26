"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const quick_helper_js_1 = require("./quick-helper.js");
describe('quick-helper', () => {
    describe('quickFormat', () => {
        test('should trim whitespace and normalize spaces', () => {
            expect((0, quick_helper_js_1.quickFormat)('  hello   world  ')).toBe('hello world');
            expect((0, quick_helper_js_1.quickFormat)('multiple   spaces   between   words')).toBe('multiple spaces between words');
            expect((0, quick_helper_js_1.quickFormat)('nospaces')).toBe('nospaces');
        });
        test('should handle empty string', () => {
            expect((0, quick_helper_js_1.quickFormat)('')).toBe('');
            expect((0, quick_helper_js_1.quickFormat)('   ')).toBe('');
        });
        test('should handle normal string', () => {
            expect((0, quick_helper_js_1.quickFormat)('Hello World')).toBe('Hello World');
            expect((0, quick_helper_js_1.quickFormat)(' singleword ')).toBe('singleword');
        });
    });
    describe('quickValidate', () => {
        test('should validate non-empty string within length limit', () => {
            expect((0, quick_helper_js_1.quickValidate)('valid')).toBe(true);
            expect((0, quick_helper_js_1.quickValidate)('a')).toBe(true);
            expect((0, quick_helper_js_1.quickValidate)('a'.repeat(999))).toBe(true);
        });
        test('should reject empty string', () => {
            expect((0, quick_helper_js_1.quickValidate)('')).toBe(false);
            expect((0, quick_helper_js_1.quickValidate)('   ')).toBe(false);
        });
        test('should reject string that is too long', () => {
            expect((0, quick_helper_js_1.quickValidate)('a'.repeat(1000))).toBe(false);
            expect((0, quick_helper_js_1.quickValidate)('a'.repeat(1001))).toBe(false);
        });
    });
    describe('quickSum', () => {
        test('should sum array of numbers', () => {
            expect((0, quick_helper_js_1.quickSum)([1, 2, 3])).toBe(6);
            expect((0, quick_helper_js_1.quickSum)([10, 20, 30])).toBe(60);
            expect((0, quick_helper_js_1.quickSum)([-1, 1, 0])).toBe(0);
        });
        test('should handle empty array', () => {
            expect((0, quick_helper_js_1.quickSum)([])).toBe(0);
        });
        test('should handle single number', () => {
            expect((0, quick_helper_js_1.quickSum)([5])).toBe(5);
            expect((0, quick_helper_js_1.quickSum)([0])).toBe(0);
        });
    });
    describe('quickMergeDedupe', () => {
        test('should merge arrays and remove duplicates', () => {
            const result = (0, quick_helper_js_1.quickMergeDedupe)([1, 2, 2], [3, 4, 4], [2, 5]);
            expect(result).toEqual([1, 2, 3, 4, 5]);
        });
        test('should handle arrays with different types', () => {
            const result = (0, quick_helper_js_1.quickMergeDedupe)(['a', 'b', 'c'], [1, 2, 'a'], ['b', 3]);
            expect(result).toEqual(['a', 'b', 'c', 1, 2, 3]);
        });
        test('should handle empty arrays', () => {
            expect((0, quick_helper_js_1.quickMergeDedupe)([])).toEqual([]);
            expect((0, quick_helper_js_1.quickMergeDedupe)([], [1, 2], [])).toEqual([1, 2]);
        });
        test('should preserve order - first occurrence wins', () => {
            const result = (0, quick_helper_js_1.quickMergeDedupe)([3, 2, 1], [2, 4, 1], [5]);
            expect(result).toEqual([3, 2, 1, 4, 5]);
        });
    });
});
//# sourceMappingURL=quick-helper.test.js.map