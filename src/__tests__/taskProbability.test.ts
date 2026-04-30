import { calculateCompletionProbability, getProbabilityLevel } from '../../src/taskProbability';

describe('taskProbability functions', () => {
  describe('calculateCompletionProbability', () => {
    it('should calculate probability correctly for basic case', () => {
      const probability = calculateCompletionProbability(8, 10, 1.0);
      expect(probability).toBeCloseTo(1.0, 2); // 100% probability (capped at max)
    });

    it('should handle high complexity tasks', () => {
      const probability = calculateCompletionProbability(15, 20, 1.5);
      expect(probability).toBeCloseTo(0.67, 2); // 67% probability (20/15/1.5 = 0.89 -> capped at 1.0, then divided by 1.5)
    });

    it('should handle high capacity agents with simple tasks', () => {
      const probability = calculateCompletionProbability(5, 50, 0.8);
      expect(probability).toBe(1.0); // 100% probability (50/5 = 10 -> capped at 1.0, divided by 0.8 = 1.25 -> capped at 1.0)
    });

    it('should throw error for invalid task weight', () => {
      expect(() => calculateCompletionProbability(0, 10, 1.0)).toThrow('Task weight must be between 1 and 20');
      expect(() => calculateCompletionProbability(21, 10, 1.0)).toThrow('Task weight must be between 1 and 20');
    });

    it('should throw error for invalid agent capacity', () => {
      expect(() => calculateCompletionProbability(8, 0, 1.0)).toThrow('Agent capacity must be between 1 and 100');
      expect(() => calculateCompletionProbability(8, 101, 1.0)).toThrow('Agent capacity must be between 1 and 100');
    });

    it('should throw error for invalid complexity factor', () => {
      expect(() => calculateCompletionProbability(8, 10, 0.4)).toThrow('Complexity factor must be between 0.5 and 2.0');
      expect(() => calculateCompletionProbability(8, 10, 2.1)).toThrow('Complexity factor must be between 0.5 and 2.0');
    });

    it('should cap probability at maximum of 1.0', () => {
      const probability = calculateCompletionProbability(2, 50, 0.5);
      expect(probability).toBe(1.0);
    });

    it('should ensure probability minimum of 0.0', () => {
      const probability = calculateCompletionProbability(20, 2, 2.0);
      expect(probability).toBeCloseTo(0.05, 2); // 2/20/2.0 = 0.05
    });
  });

  describe('getProbabilityLevel', () => {
    it('should return "极高" for probability >= 0.9', () => {
      expect(getProbabilityLevel(0.9)).toBe('极高');
      expect(getProbabilityLevel(1.0)).toBe('极高');
      expect(getProbabilityLevel(0.95)).toBe('极高');
    });

    it('should return "高" for probability >= 0.7', () => {
      expect(getProbabilityLevel(0.7)).toBe('高');
      expect(getProbabilityLevel(0.8)).toBe('高');
      expect(getProbabilityLevel(0.89)).toBe('高');
    });

    it('should return "中" for probability >= 0.5', () => {
      expect(getProbabilityLevel(0.5)).toBe('中');
      expect(getProbabilityLevel(0.6)).toBe('中');
      expect(getProbabilityLevel(0.69)).toBe('中');
    });

    it('should return "中低" for probability >= 0.3', () => {
      expect(getProbabilityLevel(0.3)).toBe('中低');
      expect(getProbabilityLevel(0.4)).toBe('中低');
      expect(getProbabilityLevel(0.49)).toBe('中低');
    });

    it('should return "低" for probability < 0.3', () => {
      expect(getProbabilityLevel(0.0)).toBe('低');
      expect(getProbabilityLevel(0.1)).toBe('低');
      expect(getProbabilityLevel(0.29)).toBe('低');
    });
  });
});