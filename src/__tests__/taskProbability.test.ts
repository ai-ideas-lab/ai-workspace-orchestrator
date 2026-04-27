import { calculateCompletionProbability, getProbabilityLevel } from '../taskProbability';

describe('calculateCompletionProbability', () => {
  test('should calculate basic probability correctly', () => {
    const probability = calculateCompletionProbability(8, 10, 1.0);
    expect(probability).toBe(1.0); // 10/8 = 1.25, capped at 1.0
  });

  test('should handle complex tasks', () => {
    const probability = calculateCompletionProbability(15, 20, 1.5);
    expect(probability).toBeCloseTo(0.667, 2); // (20/15)/1.5 = 0.667
  });

  test('should handle high capacity agent with simple task', () => {
    const probability = calculateCompletionProbability(5, 50, 0.8);
    expect(probability).toBeCloseTo(0.96, 1); // (50/5)/0.8 = 12.5, capped at 1.0 then divided by 0.8 = 1.25, capped at 1.0
  });

  test('should validate task weight range', () => {
    expect(() => calculateCompletionProbability(0, 10, 1.0)).toThrow('Task weight must be between 1 and 20');
    expect(() => calculateCompletionProbability(21, 10, 1.0)).toThrow('Task weight must be between 1 and 20');
  });

  test('should validate agent capacity range', () => {
    expect(() => calculateCompletionProbability(8, 0, 1.0)).toThrow('Agent capacity must be between 1 and 100');
    expect(() => calculateCompletionProbability(8, 101, 1.0)).toThrow('Agent capacity must be between 1 and 100');
  });

  test('should validate complexity range', () => {
    expect(() => calculateCompletionProbability(8, 10, 0.4)).toThrow('Complexity factor must be between 0.5 and 2.0');
    expect(() => calculateCompletionProbability(8, 10, 2.1)).toThrow('Complexity factor must be between 0.5 and 2.0');
  });

  test('should handle edge cases', () => {
    const lowProbability = calculateCompletionProbability(10, 1, 2.0);
    expect(lowProbability).toBeGreaterThanOrEqual(0);
    expect(lowProbability).toBeLessThanOrEqual(1);
  });
});

describe('getProbabilityLevel', () => {
  test('should classify probability levels correctly', () => {
    expect(getProbabilityLevel(0.95)).toBe('极高');
    expect(getProbabilityLevel(0.8)).toBe('高');
    expect(getProbabilityLevel(0.7)).toBe('高');
    expect(getProbabilityLevel(0.6)).toBe('中'); // 0.6 is between 0.5 and 0.7
    expect(getProbabilityLevel(0.5)).toBe('中');
    expect(getProbabilityLevel(0.4)).toBe('中');
    expect(getProbabilityLevel(0.3)).toBe('中低');
    expect(getProbabilityLevel(0.2)).toBe('低');
    expect(getProbabilityLevel(0.1)).toBe('低');
    expect(getProbabilityLevel(0)).toBe('低');
  });

  test('should handle extreme values', () => {
    expect(getProbabilityLevel(1.0)).toBe('极高');
    expect(getProbabilityLevel(0.9)).toBe('极高');
  });
});