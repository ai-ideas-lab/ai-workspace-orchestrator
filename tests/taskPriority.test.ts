import { calculateTaskPriority, needsImmediateAttention } from '../src/taskPriority';

describe('Task Priority Calculator', () => {
  describe('calculateTaskPriority', () => {
    it('should return "紧急高优" for urgent tasks with high importance', () => {
      const result = calculateTaskPriority('修复生产bug', true, 8);
      expect(result).toBe('紧急高优');
    });

    it('should return "紧急" for urgent tasks with low importance', () => {
      const result = calculateTaskPriority('更新文档', true, 4);
      expect(result).toBe('紧急');
    });

    it('should return "高优" for non-urgent tasks with high importance', () => {
      const result = calculateTaskPriority('季度报告', false, 9);
      expect(result).toBe('高优');
    });

    it('should return "中优" for tasks with medium importance', () => {
      const result = calculateTaskPriority('代码重构', false, 6);
      expect(result).toBe('中优');
    });

    it('should return "普通" for tasks with low importance', () => {
      const result = calculateTaskPriority('整理桌面', false, 3);
      expect(result).toBe('普通');
    });
  });

  describe('needsImmediateAttention', () => {
    it('should return true for urgent tasks regardless of importance', () => {
      expect(needsImmediateAttention('紧急修复', true, 2)).toBe(true);
      expect(needsImmediateAttention('紧急修复', true, 5)).toBe(true);
      expect(needsImmediateAttention('紧急修复', true, 9)).toBe(true);
    });

    it('should return true for non-urgent tasks with high importance (8+)', () => {
      expect(needsImmediateAttention('重要功能开发', false, 8)).toBe(true);
      expect(needsImmediateAttention('架构优化', false, 10)).toBe(true);
    });

    it('should return false for non-urgent tasks with low importance', () => {
      expect(needsImmediateAttention('日常维护', false, 4)).toBe(false);
      expect(needsImmediateAttention('文档整理', false, 7)).toBe(false);
    });

    it('should throw TypeError for invalid importance values', () => {
      expect(() => needsImmediateAttention('测试', false, 0)).toThrow('importance must be between 1 and 10');
      expect(() => needsImmediateAttention('测试', false, 11)).toThrow('importance must be between 1 and 10');
      expect(() => needsImmediateAttention('测试', false, -1)).toThrow('importance must be between 1 and 10');
    });

    it('should not throw for valid importance values', () => {
      expect(() => {
        needsImmediateAttention('测试', false, 1);
        needsImmediateAttention('测试', false, 10);
        needsImmediateAttention('测试', true, 5);
      }).not.toThrow();
    });
  });
});