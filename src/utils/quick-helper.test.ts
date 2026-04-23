import { quickFormat, quickValidate, quickSum, quickMergeDedupe } from './quick-helper.js';

describe('quick-helper', () => {
  describe('quickFormat', () => {
    test('should trim whitespace and normalize spaces', () => {
      expect(quickFormat('  hello   world  ')).toBe('hello world');
      expect(quickFormat('multiple   spaces   between   words')).toBe('multiple spaces between words');
      expect(quickFormat('nospaces')).toBe('nospaces');
    });

    test('should handle empty string', () => {
      expect(quickFormat('')).toBe('');
      expect(quickFormat('   ')).toBe('');
    });

    test('should handle normal string', () => {
      expect(quickFormat('Hello World')).toBe('Hello World');
      expect(quickFormat(' singleword ')).toBe('singleword');
    });
  });

  describe('quickValidate', () => {
    test('should validate non-empty string within length limit', () => {
      expect(quickValidate('valid')).toBe(true);
      expect(quickValidate('a')).toBe(true);
      expect(quickValidate('a'.repeat(999))).toBe(true);
    });

    test('should reject empty string', () => {
      expect(quickValidate('')).toBe(false);
      expect(quickValidate('   ')).toBe(false);
    });

    test('should reject string that is too long', () => {
      expect(quickValidate('a'.repeat(1000))).toBe(false);
      expect(quickValidate('a'.repeat(1001))).toBe(false);
    });
  });

  describe('quickSum', () => {
    test('should sum array of numbers', () => {
      expect(quickSum([1, 2, 3])).toBe(6);
      expect(quickSum([10, 20, 30])).toBe(60);
      expect(quickSum([-1, 1, 0])).toBe(0);
    });

    test('should handle empty array', () => {
      expect(quickSum([])).toBe(0);
    });

    test('should handle single number', () => {
      expect(quickSum([5])).toBe(5);
      expect(quickSum([0])).toBe(0);
    });
  });

  describe('quickMergeDedupe', () => {
    test('should merge arrays and remove duplicates', () => {
      const result = quickMergeDedupe([1, 2, 2], [3, 4, 4], [2, 5]);
      expect(result).toEqual([1, 2, 3, 4, 5]);
    });

    test('should handle arrays with different types', () => {
      const result = quickMergeDedupe(['a', 'b', 'c'], [1, 2, 'a'], ['b', 3]);
      expect(result).toEqual(['a', 'b', 'c', 1, 2, 3]);
    });

    test('should handle empty arrays', () => {
      expect(quickMergeDedupe([])).toEqual([]);
      expect(quickMergeDedupe([], [1, 2], [])).toEqual([1, 2]);
    });

    test('should preserve order - first occurrence wins', () => {
      const result = quickMergeDedupe([3, 2, 1], [2, 4, 1], [5]);
      expect(result).toEqual([3, 2, 1, 4, 5]);
    });
  });
});
