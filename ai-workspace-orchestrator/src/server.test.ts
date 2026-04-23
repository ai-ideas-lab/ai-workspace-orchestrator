/**
 * 格式化服务器运行时间测试
 * 测试 formatUptime 函数的各种输入情况
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { formatUptime } from './server.js';

describe('formatUptime', () => {
  describe('小时级格式化', () => {
    it('应该正确格式化1小时以上时间', () => {
      const result = formatUptime(5432); // 1小时30分32秒
      expect(result).toBe('1h 30m 32s');
    });

    it('应该正确格式化2小时时间', () => {
      const result = formatUptime(7200); // 2小时0分0秒
      expect(result).toBe('2h 0m 0s');
    });

    it('应该正确格式化3小时15分时间', () => {
      const result = formatUptime(12300); // 3小时25分0秒
      expect(result).toBe('3h 25m 0s');
    });
  });

  describe('分钟级格式化', () => {
    it('应该正确格式化5分钟以上时间', () => {
      const result = formatUptime(185); // 3分5秒
      expect(result).toBe('3m 5s');
    });

    it('应该正确格式化30分钟时间', () => {
      const result = formatUptime(1800); // 30分0秒
      expect(result).toBe('30m 0s');
    });

    it('应该正确格式化45分30秒时间', () => {
      const result = formatUptime(2730); // 45分30秒
      expect(result).toBe('45m 30s');
    });
  });

  describe('秒级格式化', () => {
    it('应该正确格式化30秒', () => {
      const result = formatUptime(30);
      expect(result).toBe('30s');
    });

    it('应该正确格式化60秒', () => {
      const result = formatUptime(60);
      expect(result).toBe('1m 0s');
    });

    it('应该正确格式化0秒', () => {
      const result = formatUptime(0);
      expect(result).toBe('0s');
    });
  });

  describe('边界情况', () => {
    it('应该正确处理非常大的数值', () => {
      const result = formatUptime(99999); // 27小时46分39秒
      expect(result).toBe('27h 46m 39s');
    });

    it('应该正确处理1秒', () => {
      const result = formatUptime(1);
      expect(result).toBe('1s');
    });

    it('应该正确处理59秒', () => {
      const result = formatUptime(59);
      expect(result).toBe('59s');
    });
  });

  describe('输入验证', () => {
    it('应该正确处理小数输入', () => {
      const result = formatUptime(3661.5); // 1小时1分1.5秒
      expect(result).toBe('1h 1m 1s');
    });

    it('应该正确处理负数输入', () => {
      const result = formatUptime(-100);
      expect(result).toBe('0s');
    });
  });
});