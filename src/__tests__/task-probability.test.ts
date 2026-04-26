/**
 * Task Probability Functions Unit Tests
 * 
 * 测试任务概率计算函数的准确性和边界条件：
 * - 基础概率计算
 * - 复杂度系数影响
 * - 参数验证
 * - 概率等级分类
 */

import { calculateCompletionProbability, getProbabilityLevel } from '../taskProbability';

// ── 测试数据 ──────────────────────────────────────────────

const validTestCases = [
  { taskWeight: 8, agentCapacity: 10, complexity: 1.0, expected: 1.0 },  // min(10/8,1.0)/1.0 = 1.0
  { taskWeight: 15, agentCapacity: 20, complexity: 1.5, expected: 0.66667 },  // min(20/15,1.0)/1.5 = 1.0/1.5 = 0.66667
  { taskWeight: 5, agentCapacity: 50, complexity: 0.8, expected: 1.0 },  // min(50/5,1.0)/0.8 = 1.0/0.8 = 1.25 → min(1.25,1.0) = 1.0
  { taskWeight: 10, agentCapacity: 5, complexity: 1.0, expected: 0.5 },
  { taskWeight: 20, agentCapacity: 100, complexity: 1.0, expected: 1.0 },
  { taskWeight: 1, agentCapacity: 1, complexity: 1.0, expected: 1.0 },
];

// ── calculateCompletionProbability 测试 ──────────────────────────────────────────────

describe('calculateCompletionProbability', () => {
  describe('基础功能测试', () => {
    validTestCases.forEach(({ taskWeight, agentCapacity, complexity, expected }) => {
      it(`任务权重=${taskWeight}, 代理容量=${agentCapacity}, 复杂度=${complexity} 应返回 ${typeof expected === 'number' ? expected.toFixed(5) : expected}`, () => {
        const result = calculateCompletionProbability(taskWeight, agentCapacity, complexity);
        if (typeof expected === 'number') {
          expect(result).toBeCloseTo(expected, 5);
        } else {
          expect(result).toBe(expected);
        }
      });
    });
  });

  describe('边界条件测试', () => {
    it('高复杂度应降低概率', () => {
      const normalProb = calculateCompletionProbability(10, 20, 1.0);
      const highComplexityProb = calculateCompletionProbability(10, 20, 2.0);
      expect(highComplexityProb).toBeLessThan(normalProb);
    });

    it('低复杂度应提高概率', () => {
      const normalProb = calculateCompletionProbability(10, 20, 1.0);
      const lowComplexityProb = calculateCompletionProbability(10, 20, 0.6);
      expect(lowComplexityProb).toBeGreaterThan(normalProb);
    });

    it('代理容量等于任务权重时应返回 1.0', () => {
      const result = calculateCompletionProbability(10, 10, 1.0);
      expect(result).toBe(1.0);
    });

    it('代理容量远低于任务权重应返回接近 0', () => {
      const result = calculateCompletionProbability(20, 1, 1.0);
      expect(result).toBeLessThan(0.1);
    });
  });

  describe('参数验证测试', () => {
    it('任务权重超出范围应抛出异常', () => {
      expect(() => calculateCompletionProbability(0, 10, 1.0)).toThrow('Task weight must be between 1 and 20');
      expect(() => calculateCompletionProbability(21, 10, 1.0)).toThrow('Task weight must be between 1 and 20');
    });

    it('代理容量超出范围应抛出异常', () => {
      expect(() => calculateCompletionProbability(10, 0, 1.0)).toThrow('Agent capacity must be between 1 and 100');
      expect(() => calculateCompletionProbability(10, 101, 1.0)).toThrow('Agent capacity must be between 1 and 100');
    });

    it('复杂度系数超出范围应抛出异常', () => {
      expect(() => calculateCompletionProbability(10, 10, 0.4)).toThrow('Complexity factor must be between 0.5 and 2.0');
      expect(() => calculateCompletionProbability(10, 10, 2.1)).toThrow('Complexity factor must be between 0.5 and 2.0');
    });

    it('默认复杂度参数应正常工作', () => {
      const result = calculateCompletionProbability(10, 20);
      const expected = calculateCompletionProbability(10, 20, 1.0);
      expect(result).toBe(expected);
    });
  });

  describe('极端值测试', () => {
    it('最小值组合应返回接近 0', () => {
      const result = calculateCompletionProbability(20, 1, 2.0);
      expect(result).toBeLessThan(0.1);
    });

    it('最大值组合应返回 1', () => {
      const result = calculateCompletionProbability(1, 100, 0.5);
      expect(result).toBe(1);
    });

    it('零除法保护：任务权重为零应被验证阻止', () => {
      // 零除法已被参数验证防止
      expect(() => calculateCompletionProbability(0, 10, 1.0)).toThrow();
    });
  });
});

// ── getProbabilityLevel 测试 ──────────────────────────────────────────────

describe('getProbabilityLevel', () => {
  describe('等级分类测试', () => {
    it('概率 ≥ 0.9 应返回 "极高"', () => {
      expect(getProbabilityLevel(0.9)).toBe('极高');
      expect(getProbabilityLevel(1.0)).toBe('极高');
      expect(getProbabilityLevel(0.95)).toBe('极高');
    });

    it('概率 ≥ 0.7 应返回 "高"', () => {
      expect(getProbabilityLevel(0.7)).toBe('高');
      expect(getProbabilityLevel(0.8)).toBe('高');
      expect(getProbabilityLevel(0.89)).toBe('高');
    });

    it('概率 ≥ 0.5 应返回 "中"', () => {
      expect(getProbabilityLevel(0.5)).toBe('中');
      expect(getProbabilityLevel(0.6)).toBe('中');
      expect(getProbabilityLevel(0.69)).toBe('中');
    });

    it('概率 ≥ 0.3 应返回 "中低"', () => {
      expect(getProbabilityLevel(0.3)).toBe('中低');
      expect(getProbabilityLevel(0.4)).toBe('中低');
      expect(getProbabilityLevel(0.49)).toBe('中低');
    });

    it('概率 < 0.3 应返回 "低"', () => {
      expect(getProbabilityLevel(0.2)).toBe('低');
      expect(getProbabilityLevel(0.0)).toBe('低');
      expect(getProbabilityLevel(0.29)).toBe('低');
    });
  });

  describe('边界值测试', () => {
    it('边界值应正确分类', () => {
      expect(getProbabilityLevel(0.899)).toBe('高');
      expect(getProbabilityLevel(0.699)).toBe('中');
      expect(getProbabilityLevel(0.499)).toBe('中低');
      expect(getProbabilityLevel(0.299)).toBe('低');
    });

    it('极端值应正确分类', () => {
      expect(getProbabilityLevel(0)).toBe('低');
      expect(getProbabilityLevel(0.5)).toBe('中');
      expect(getProbabilityLevel(1)).toBe('极高');
    });
  });
});

// ── 集成测试 ──────────────────────────────────────────────

describe('Task Probability Functions Integration', () => {
  it('概率计算和等级分类应该一致', () => {
    const testCases = [
      { taskWeight: 5, agentCapacity: 15, complexity: 1.0 },
      { taskWeight: 12, agentCapacity: 8, complexity: 1.2 },
      { taskWeight: 8, agentCapacity: 25, complexity: 0.8 },
    ];

    testCases.forEach(({ taskWeight, agentCapacity, complexity }) => {
      const probability = calculateCompletionProbability(taskWeight, agentCapacity, complexity);
      const level = getProbabilityLevel(probability);
      
      // 验证概率值在有效范围内
      expect(probability).toBeGreaterThanOrEqual(0);
      expect(probability).toBeLessThanOrEqual(1);
      
      // 验证等级字符串有效
      expect(['低', '中低', '中', '高', '极高']).toContain(level);
    });
  });
});