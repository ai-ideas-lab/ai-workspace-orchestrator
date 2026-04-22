"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_helper_1 = require("./utils-helper");
describe('Utils Helper Functions', () => {
    describe('formatFileSize', () => {
        it('应该正确格式化字节数为可读格式', () => {
            expect((0, utils_helper_1.formatFileSize)(512)).toBe('512B');
            expect((0, utils_helper_1.formatFileSize)(1024)).toBe('1KB');
            expect((0, utils_helper_1.formatFileSize)(1536)).toBe('1.5KB');
            expect((0, utils_helper_1.formatFileSize)(1048576)).toBe('1MB');
            expect((0, utils_helper_1.formatFileSize)(1572864)).toBe('1.5MB');
            expect((0, utils_helper_1.formatFileSize)(1073741824)).toBe('1GB');
        });
        it('应该支持自定义小数位数', () => {
            expect((0, utils_helper_1.formatFileSize)(1234567, 3)).toBe('1.178MB');
            expect((0, utils_helper_1.formatFileSize)(1234567, 0)).toBe('1MB');
            expect((0, utils_helper_1.formatFileSize)(1234567, 1)).toBe('1.2MB');
        });
        it('应该处理边界情况', () => {
            expect((0, utils_helper_1.formatFileSize)(0)).toBe('0B');
            expect((0, utils_helper_1.formatFileSize)(1)).toBe('1B');
            expect((0, utils_helper_1.formatFileSize)(1023)).toBe('1023B');
        });
        it('应该对无效输入抛出异常', () => {
            expect(() => (0, utils_helper_1.formatFileSize)(NaN)).toThrow(TypeError);
            expect(() => (0, utils_helper_1.formatFileSize)('invalid')).toThrow(TypeError);
            expect(() => (0, utils_helper_1.formatFileSize)(null)).toThrow(TypeError);
            expect(() => (0, utils_helper_1.formatFileSize)(undefined)).toThrow(TypeError);
        });
    });
    describe('generateSimpleId', () => {
        it('应该生成指定长度的ID', () => {
            const id8 = (0, utils_helper_1.generateSimpleId)();
            expect(id8).toHaveLength(8);
            expect(id8).toMatch(/^[A-Za-z0-9]+$/);
            const id16 = (0, utils_helper_1.generateSimpleId)(16);
            expect(id16).toHaveLength(16);
            expect(id16).toMatch(/^[A-Za-z0-9]+$/);
        });
        it('应该生成唯一的ID', () => {
            const id1 = (0, utils_helper_1.generateSimpleId)();
            const id2 = (0, utils_helper_1.generateSimpleId)();
            const id3 = (0, utils_helper_1.generateSimpleId)();
            const ids = [id1, id2, id3];
            const uniqueIds = new Set(ids);
            expect(uniqueIds.size).toBe(3);
        });
        it('应该正确处理默认参数', () => {
            const id = (0, utils_helper_1.generateSimpleId)();
            expect(id).toHaveLength(8);
        });
        it('应该对无效输入抛出异常', () => {
            expect(() => (0, utils_helper_1.generateSimpleId)(0)).toThrow(TypeError);
            expect(() => (0, utils_helper_1.generateSimpleId)(-1)).toThrow(TypeError);
            expect(() => (0, utils_helper_1.generateSimpleId)(3.5)).toThrow(TypeError);
            expect(() => (0, utils_helper_1.generateSimpleId)('invalid')).toThrow(TypeError);
        });
    });
    describe('deepClone', () => {
        it('应该正确克隆基本类型', () => {
            expect((0, utils_helper_1.deepClone)(42)).toBe(42);
            expect((0, utils_helper_1.deepClone)('hello')).toBe('hello');
            expect((0, utils_helper_1.deepClone)(true)).toBe(true);
            expect((0, utils_helper_1.deepClone)(null)).toBe(null);
            expect((0, utils_helper_1.deepClone)(undefined)).toBe(undefined);
        });
        it('应该正确克隆数组', () => {
            const original = [1, 2, 3, { name: 'test' }];
            const cloned = (0, utils_helper_1.deepClone)(original);
            expect(cloned).toEqual(original);
            expect(cloned).not.toBe(original);
            expect(cloned[3]).not.toBe(original[3]);
        });
        it('应该正确克隆对象', () => {
            const original = {
                name: '张三',
                age: 25,
                address: { city: '北京', district: '海淀' },
                hobbies: ['reading', 'coding']
            };
            const cloned = (0, utils_helper_1.deepClone)(original);
            expect(cloned).toEqual(original);
            expect(cloned).not.toBe(original);
            expect(cloned.address).not.toBe(original.address);
            expect(cloned.hobbies).not.toBe(original.hobbies);
        });
        it('应该正确克隆日期对象', () => {
            const original = new Date('2023-01-01T00:00:00Z');
            const cloned = (0, utils_helper_1.deepClone)(original);
            expect(cloned).toEqual(original);
            expect(cloned).not.toBe(original);
            expect(cloned instanceof Date).toBe(true);
        });
        it('应该正确克隆正则表达式', () => {
            const original = /test/g;
            const cloned = (0, utils_helper_1.deepClone)(original);
            expect(cloned).toEqual(original);
            expect(cloned).not.toBe(original);
            expect(cloned instanceof RegExp).toBe(true);
        });
        it('应该处理null值', () => {
            expect((0, utils_helper_1.deepClone)(null)).toBe(null);
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
            const debouncedFn = (0, utils_helper_1.debounce)(mockFn, 100);
            debouncedFn('test');
            expect(mockFn).not.toHaveBeenCalled();
            jest.advanceTimersByTime(100);
            expect(mockFn).toHaveBeenCalledTimes(1);
            expect(mockFn).toHaveBeenCalledWith('test');
        });
        it('应该合并多次调用', () => {
            const mockFn = jest.fn();
            const debouncedFn = (0, utils_helper_1.debounce)(mockFn, 100);
            debouncedFn('call1');
            debouncedFn('call2');
            debouncedFn('call3');
            expect(mockFn).not.toHaveBeenCalled();
            jest.advanceTimersByTime(100);
            expect(mockFn).toHaveBeenCalledTimes(1);
            expect(mockFn).toHaveBeenCalledWith('call3');
        });
        it('应该保持函数参数', () => {
            const mockFn = jest.fn();
            const debouncedFn = (0, utils_helper_1.debounce)(mockFn, 100);
            debouncedFn('data', { param: 'value' });
            jest.advanceTimersByTime(100);
            expect(mockFn).toHaveBeenCalledTimes(1);
            expect(mockFn).toHaveBeenCalledWith('data', { param: 'value' });
        });
    });
});
//# sourceMappingURL=utils-helper.test.js.map