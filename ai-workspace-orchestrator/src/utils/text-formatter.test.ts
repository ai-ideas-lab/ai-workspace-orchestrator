/**
 * 文本格式化工具测试
 * 测试 formatText 和 analyzeText 函数的各种输入情况
 */

import { describe, it, expect } from 'vitest';
import { formatText, analyzeText } from './utils/text-formatter';

describe('text-formatter', () => {
  describe('formatText', () => {
    it('应该正确格式化简单文本', () => {
      const result = formatText('hello world');
      expect(result).toBe('Hello World');
    });

    it('应该正确处理前导和尾部空格', () => {
      const result = formatText('  hello   world  ');
      expect(result).toBe('Hello   World');
    });

    it('应该正确处理单个单词', () => {
      const result = formatText('javascript');
      expect(result).toBe('Javascript');
    });

    it('应该正确处理空字符串', () => {
      const result = formatText('');
      expect(result).toBe('');
    });

    it('应该正确处理只有空格的字符串', () => {
      const result = formatText('   ');
      expect(result).toBe('');
    });

    it('应该正确处理特殊字符', () => {
      const result = formatText('hello world! how are you?');
      expect(result).toBe('Hello World! How Are You?');
    });
  });

  describe('analyzeText', () => {
    it('应该正确识别短文本', () => {
      const result = analyzeText('Hello');
      expect(result).toBe('short');
    });

    it('应该正确识别中等文本', () => {
      const result = analyzeText('This is a medium length text that should be classified as medium');
      expect(result).toBe('medium');
    });

    it('应该正确识别长文本', () => {
      const result = analyzeText('This is a very long text that exceeds the medium threshold of 200 characters and should be classified as long due to its length');
      expect(result).toBe('long');
    });

    it('应该正确处理正好50个字符的文本', () => {
      const result = analyzeText('Exactly fifty characters long text here to test the boundary');
      expect(result).toBe('medium');
    });

    it('应该正确处理正好49个字符的文本', () => {
      const result = analyzeText('Forty nine characters long text here');
      expect(result).toBe('short');
    });

    it('应该正确处理空白字符', () => {
      const result = analyzeText('   ');
      expect(result).toBe('short');
    });

    it('应该正确处理只有换行符的文本', () => {
      const result = analyzeText('\n\n\n');
      expect(result).toBe('short');
    });
  });
});