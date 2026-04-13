/**
 * ConfigValidator 单元测试
 */

import { describe, it, expect } from '@jest/globals';
import { validateConfig, WorkflowConfig } from '../services/config-validator'.ts';

describe('ConfigValidator', () => {
  describe('validateConfig()', () => {
    it('有效配置应返回空错误列表', () => {
      const validConfig: WorkflowConfig = {
        name: 'test-workflow',
        steps: [{ id: 'step1', taskType: 'text', payload: {} }],
        timeout: 30000,
        retryLimit: 3,
        environment: 'production',
      };

      const errors = validateConfig(validConfig);
      expect(errors).toHaveLength(0);
    });

    it('最小有效配置应返回空错误列表', () => {
      const minimalConfig: WorkflowConfig = {
        name: 'minimal',
        steps: [{ id: 'step1', taskType: 'text', payload: {} }],
      };

      const errors = validateConfig(minimalConfig);
      expect(errors).toHaveLength(0);
    });

    it('缺失必要字段时应报错', () => {
      const invalidConfig: WorkflowConfig = {
        // name 缺失
        steps: [{ id: 'step1', taskType: 'text', payload: {} }],
      };

      const errors = validateConfig(invalidConfig);
      expect(errors).toContain('name must be a non-empty string');
    });

    it('name 为空字符串时应报错', () => {
      const invalidConfig: WorkflowConfig = {
        name: '',
        steps: [{ id: 'step1', taskType: 'text', payload: {} }],
      };

      const errors = validateConfig(invalidConfig);
      expect(errors).toContain('name must be a non-empty string');
    });

    it('steps 为空数组时应报错', () => {
      const invalidConfig: WorkflowConfig = {
        name: 'test',
        steps: [],
      };

      const errors = validateConfig(invalidConfig);
      expect(errors).toContain('steps must be a non-empty array');
    });

    it('steps 不是数组时应报错', () => {
      const invalidConfig: WorkflowConfig = {
        name: 'test',
        steps: 'not-an-array',
      };

      const errors = validateConfig(invalidConfig);
      expect(errors).toContain('steps must be a non-empty array');
    });

    it('timeout 为负数时应报错', () => {
      const invalidConfig: WorkflowConfig = {
        name: 'test',
        steps: [{ id: 'step1', taskType: 'text', payload: {} }],
        timeout: -1000,
      };

      const errors = validateConfig(invalidConfig);
      expect(errors).toContain('timeout must be a positive number');
    });

    it('timeout 为非数字时应报错', () => {
      const invalidConfig: WorkflowConfig = {
        name: 'test',
        steps: [{ id: 'step1', taskType: 'text', payload: {} }],
        timeout: '30000' as any,
      };

      const errors = validateConfig(invalidConfig);
      expect(errors).toContain('timeout must be a positive number');
    });

    it('retryLimit 超出范围时应报错', () => {
      const invalidConfig: WorkflowConfig = {
        name: 'test',
        steps: [{ id: 'step1', taskType: 'text', payload: {} }],
        retryLimit: 15, // > 10
      };

      const errors = validateConfig(invalidConfig);
      expect(errors).toContain('retryLimit must be between 0 and 10');
    });

    it('retryLimit 为负数时应报错', () => {
      const invalidConfig: WorkflowConfig = {
        name: 'test',
        steps: [{ id: 'step1', taskType: 'text', payload: {} }],
        retryLimit: -1,
      };

      const errors = validateConfig(invalidConfig);
      expect(errors).toContain('retryLimit must be between 0 and 10');
    });

    it('retryLimit 为非数字时应报错', () => {
      const invalidConfig: WorkflowConfig = {
        name: 'test',
        steps: [{ id: 'step1', taskType: 'text', payload: {} }],
        retryLimit: '3' as any,
      };

      const errors = validateConfig(invalidConfig);
      expect(errors).toContain('retryLimit must be between 0 and 10');
    });

    it('environment 为非字符串时应报错', () => {
      const invalidConfig: WorkflowConfig = {
        name: 'test',
        steps: [{ id: 'step1', taskType: 'text', payload: {} }],
        environment: 123 as any,
      };

      const errors = validateConfig(invalidConfig);
      expect(errors).toContain('environment must be a string');
    });

    it('多个错误应返回完整错误列表', () => {
      const invalidConfig: WorkflowConfig = {
        name: '', // 无效
        steps: [], // 无效
        timeout: -1000, // 无效
        retryLimit: 15, // 无效
        environment: 123 as any, // 无效
      };

      const errors = validateConfig(invalidConfig);
      expect(errors).toHaveLength(5);
      expect(errors).toContain('name must be a non-empty string');
      expect(errors).toContain('steps must be a non-empty array');
      expect(errors).toContain('timeout must be a positive number');
      expect(errors).toContain('retryLimit must be between 0 and 10');
      expect(errors).toContain('environment must be a string');
    });

    it('可选字段未提供时不报错', () => {
      const configWithoutOptional: WorkflowConfig = {
        name: 'test',
        steps: [{ id: 'step1', taskType: 'text', payload: {} }],
        // timeout, retryLimit, environment 都未提供
      };

      const errors = validateConfig(configWithoutOptional);
      expect(errors).toHaveLength(0);
    });

    it('edge case: timeout 为 0 应通过', () => {
      const validConfig: WorkflowConfig = {
        name: 'test',
        steps: [{ id: 'step1', taskType: 'text', payload: {} }],
        timeout: 0,
      };

      const errors = validateConfig(validConfig);
      expect(errors).toHaveLength(0);
    });

    it('edge case: retryLimit 为 0 应通过', () => {
      const validConfig: WorkflowConfig = {
        name: 'test',
        steps: [{ id: 'step1', taskType: 'text', payload: {} }],
        retryLimit: 0,
      };

      const errors = validateConfig(validConfig);
      expect(errors).toHaveLength(0);
    });

    it('edge case: retryLimit 为 10 应通过', () => {
      const validConfig: WorkflowConfig = {
        name: 'test',
        steps: [{ id: 'step1', taskType: 'text', payload: {} }],
        retryLimit: 10,
      };

      const errors = validateConfig(validConfig);
      expect(errors).toHaveLength(0);
    });
  });
});