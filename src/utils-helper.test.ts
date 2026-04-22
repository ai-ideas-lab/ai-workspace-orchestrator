/**
 * 测试工具辅助函数的功能
 * 验证 formatFileSize, debounce, generateSimpleId, deepClone 等核心工具函数
 */

import { formatFileSize, debounce, generateSimpleId, deepClone } from './utils-helper';

describe('Utils Helper Functions', () => {
  describe('formatFileSize', () => {
    it('应该正确格式化字节数为可读格式', () => {
      expect(formatFileSize(512)).toBe('512B');
      expect(formatFileSize(1024)).toBe('1KB');
      expect(formatFileSize(1536)).toBe('1.5KB');
      expect(formatFileSize(1048576)).toBe('1MB');
      expect(formatFileSize(1572864)).toBe('1.5MB');
      expect(formatFileSize(1073741824)).toBe('1GB');
    });

    it('应该支持自定义小数位数', () => {
      expect(formatFileSize(1234567, 3)).toBe('1.178MB');
      expect(formatFileSize(1234567, 0)).toBe('1MB');
      expect(formatFileSize(1234567, 1)).toBe('1.2MB');
    });

    it('应该处理边界情况', () => {
      expect(formatFileSize(0)).toBe('0B');
      expect(formatFileSize(1)).toBe('1B');
      expect(formatFileSize(1023)).toBe('1023B');
    });

    it('应该对无效输入抛出异常', () => {
      expect(() => formatFileSize(NaN as any)).toThrow(TypeError);
      expect(() => formatFileSize('invalid' as any)).toThrow(TypeError);
      expect(() => formatFileSize(null as any)).toThrow(TypeError);
      expect(() => formatFileSize(undefined as any)).toThrow(TypeError);
    });
  });

  describe('generateSimpleId', () => {
    it('应该生成指定长度的ID', () => {
      const id8 = generateSimpleId();
      expect(id8).toHaveLength(8);
      expect(id8).toMatch(/^[A-Za-z0-9]+$/);

      const id16 = generateSimpleId(16);
      expect(id16).toHaveLength(16);
      expect(id16).toMatch(/^[A-Za-z0-9]+$/);
    });

    it('应该生成唯一的ID', () => {
      const id1 = generateSimpleId();
      const id2 = generateSimpleId();
      const id3 = generateSimpleId();
      
      // 多次生成的ID应该不同（概率上）
      const ids = [id1, id2, id3];
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(3);
    });

    it('应该正确处理默认参数', () => {
      const id = generateSimpleId();
      expect(id).toHaveLength(8);
    });

    it('应该对无效输入抛出异常', () => {
      expect(() => generateSimpleId(0)).toThrow(TypeError);
      expect(() => generateSimpleId(-1)).toThrow(TypeError);
      expect(() => generateSimpleId(3.5)).toThrow(TypeError);
      expect(() => generateSimpleId('invalid' as any)).toThrow(TypeError);
    });
  });

  describe('deepClone', () => {
    it('应该正确克隆基本类型', () => {
      expect(deepClone(42)).toBe(42);
      expect(deepClone('hello')).toBe('hello');
      expect(deepClone(true)).toBe(true);
      expect(deepClone(null)).toBe(null);
      expect(deepClone(undefined)).toBe(undefined);
    });

    it('应该正确克隆数组', () => {
      const original = [1, 2, 3, { name: 'test' }];
      const cloned = deepClone(original);
      
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original); // 不同引用
      expect(cloned[3]).not.toBe(original[3]); // 嵌套对象也不同引用
    });

    it('应该正确克隆对象', () => {
      const original = {
        name: '张三',
        age: 25,
        address: { city: '北京', district: '海淀' },
        hobbies: ['reading', 'coding']
      };
      
      const cloned = deepClone(original);
      
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.address).not.toBe(original.address);
      expect(cloned.hobbies).not.toBe(original.hobbies);
    });

    it('应该正确克隆日期对象', () => {
      const original = new Date('2023-01-01T00:00:00Z');
      const cloned = deepClone(original);
      
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned instanceof Date).toBe(true);
    });

    it('应该正确克隆正则表达式', () => {
      const original = /test/g;
      const cloned = deepClone(original);
      
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned instanceof RegExp).toBe(true);
    });

    it('应该处理null值', () => {
      expect(deepClone(null)).toBe(null);
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('应该在指定时间后执行函数', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);
      
      debouncedFn('test');
      
      expect(mockFn).not.toHaveBeenCalled();
      
      // 快进时间
      jest.advanceTimersByTime(100);
      
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('test');
    });

    it('应该合并多次调用', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);
      
      debouncedFn('call1');
      debouncedFn('call2');
      debouncedFn('call3');
      
      expect(mockFn).not.toHaveBeenCalled();
      
      // 快进时间
      jest.advanceTimersByTime(100);
      
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('call3');
    });

    it('应该保持函数参数', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);
      
      debouncedFn('data', { param: 'value' });
      
      jest.advanceTimersByTime(100);
      
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('data', { param: 'value' });
    });
  });
});