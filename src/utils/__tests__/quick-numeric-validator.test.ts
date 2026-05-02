import { validateNumberRange, validatePercentage } from '../quick-numeric-validator';

describe('quick-numeric-validator functions', () => {
  describe('validateNumberRange', () => {
    it('should return true for numbers within range', () => {
      expect(validateNumberRange(5, 1, 10)).toBe(true);
      expect(validateNumberRange(1, 1, 10)).toBe(true);
      expect(validateNumberRange(10, 1, 10)).toBe(true);
      expect(validateNumberRange(50, 0, 100)).toBe(true);
    });

    it('should return false for numbers below minimum', () => {
      expect(validateNumberRange(0, 1, 10)).toBe(false);
      expect(validateNumberRange(-5, 1, 10)).toBe(false);
      expect(validateNumberRange(1, 5, 10)).toBe(false);
    });

    it('should return false for numbers above maximum', () => {
      expect(validateNumberRange(15, 1, 10)).toBe(false);
      expect(validateNumberRange(100, 1, 10)).toBe(false);
      expect(validateNumberRange(11, 1, 10)).toBe(false);
    });
  });

  describe('validatePercentage', () => {
    it('should return true for valid percentages', () => {
      expect(validatePercentage(0)).toBe(true);
      expect(validatePercentage(50)).toBe(true);
      expect(validatePercentage(100)).toBe(true);
      expect(validatePercentage(25.5)).toBe(true);
    });

    it('should return false for percentages below 0', () => {
      expect(validatePercentage(-1)).toBe(false);
      expect(validatePercentage(-5)).toBe(false);
      expect(validatePercentage(-0.1)).toBe(false);
    });

    it('should return false for percentages above 100', () => {
      expect(validatePercentage(101)).toBe(false);
      expect(validatePercentage(150)).toBe(false);
      expect(validatePercentage(100.1)).toBe(false);
    });
  });
});
