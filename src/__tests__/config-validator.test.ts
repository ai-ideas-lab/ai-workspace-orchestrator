/**
 * ConfigValidator 单元测试
 */

import { describe, it, expect } from '@jest/globals';
import { validateConfig, validateStep, validateConfigWithReport, WorkflowConfig, WorkflowStep } from '../services/config-validator';

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

  describe('validateStep()', () => {
    it('有效步骤应返回空错误列表', () => {
      const validStep: WorkflowStep = {
        id: 'step1',
        name: 'First Step',
        taskType: 'text',
        payload: {},
        dependsOn: []
      };

      const errors = validateStep(validStep, 0);
      expect(errors).toHaveLength(0);
    });

    it('最小有效步骤应返回空错误列表', () => {
      const minimalStep: WorkflowStep = {
        id: 'step1',
        name: 'Step',
        taskType: 'text'
      };

      const errors = validateStep(minimalStep, 0);
      expect(errors).toHaveLength(0);
    });

    it('step 为 null 或 undefined 应报错', () => {
      expect(validateStep(null, 0)).toContain('step 0: must be an object');
      expect(validateStep(undefined, 1)).toContain('step 1: must be an object');
    });

    it('step 不是对象应报错', () => {
      expect(validateStep('not-an-object', 0)).toContain('step 0: must be an object');
      expect(validateStep(123, 1)).toContain('step 1: must be an object');
    });

    it('id 为空字符串应报错', () => {
      const invalidStep: WorkflowStep = {
        id: '',
        name: 'Step',
        taskType: 'text'
      };

      const errors = validateStep(invalidStep, 0);
      expect(errors).toContain('step 0: id must be a non-empty string');
    });

    it('name 为空字符串应报错', () => {
      const invalidStep: WorkflowStep = {
        id: 'step1',
        name: '',
        taskType: 'text'
      };

      const errors = validateStep(invalidStep, 0);
      expect(errors).toContain('step 0: name must be a non-empty string');
    });

    it('taskType 为空字符串应报错', () => {
      const invalidStep: WorkflowStep = {
        id: 'step1',
        name: 'Step',
        taskType: ''
      };

      const errors = validateStep(invalidStep, 0);
      expect(errors).toContain('step 0: taskType must be a non-empty string');
    });

    it('payload 不是对象应报错', () => {
      const invalidStep: WorkflowStep = {
        id: 'step1',
        name: 'Step',
        taskType: 'text',
        payload: 'not-an-object'
      };

      const errors = validateStep(invalidStep, 0);
      expect(errors).toContain('step 0: payload must be an object');
    });

    it('dependsOn 不是数组应报错', () => {
      const invalidStep: WorkflowStep = {
        id: 'step1',
        name: 'Step',
        taskType: 'text',
        dependsOn: 'not-an-array'
      };

      const errors = validateStep(invalidStep, 0);
      expect(errors).toContain('step 0: dependsOn must be an array');
    });

    it('多个错误应返回完整错误列表', () => {
      const invalidStep: WorkflowStep = {
        id: '',
        name: '',
        taskType: '',
        payload: 'invalid',
        dependsOn: 'invalid'
      };

      const errors = validateStep(invalidStep, 2);
      expect(errors).toHaveLength(5);
      expect(errors).toContain('step 2: id must be a non-empty string');
      expect(errors).toContain('step 2: name must be a non-empty string');
      expect(errors).toContain('step 2: taskType must be a non-empty string');
      expect(errors).toContain('step 2: payload must be an object');
      expect(errors).toContain('step 2: dependsOn must be an array');
    });

    it('可选字段未提供不应报错', () => {
      const minimalStep = {
        id: 'step1',
        name: 'Step',
        taskType: 'text'
      };

      const errors = validateStep(minimalStep, 0);
      expect(errors).toHaveLength(0);
    });
  });

  describe('validateConfigWithReport()', () => {
    it('有效配置应返回有效的报告', () => {
      const validConfig: WorkflowConfig = {
        name: 'test-workflow',
        steps: [{ id: 'step1', taskType: 'text', payload: {} }],
        timeout: 30000,
        retryLimit: 3,
        environment: 'production'
      };

      const report = validateConfigWithReport(validConfig);
      expect(report.valid).toBe(true);
      expect(report.errors).toHaveLength(0);
      expect(report.warnings).toHaveLength(0);
      expect(report.suggestions).toHaveLength(0);
    });

    it('name 过长应产生警告', () => {
      const longNameConfig: WorkflowConfig = {
        name: 'a'.repeat(51),
        steps: [{ id: 'step1', taskType: 'text', payload: {} }]
      };

      const report = validateConfigWithReport(longNameConfig);
      expect(report.valid).toBe(true);
      expect(report.warnings).toContain('name should be concise (max 50 characters)');
    });

    it('步骤过多应产生警告', () => {
      const manyStepsConfig: WorkflowConfig = {
        name: 'test',
        steps: Array(21).fill(null).map((_, i) => ({
          id: `step${i}`,
          name: `Step ${i}`,
          taskType: 'text',
          payload: {}
        }))
      };

      const report = validateConfigWithReport(manyStepsConfig);
      expect(report.valid).toBe(true);
      expect(report.warnings).toContain('workflow has many steps, consider breaking it into sub-workflows');
    });

    it('步骤过少应产生建议', () => {
      const fewStepsConfig: WorkflowConfig = {
        name: 'test',
        steps: [{ id: 'step1', taskType: 'text', payload: {} }]
      };

      const report = validateConfigWithReport(fewStepsConfig);
      expect(report.valid).toBe(true);
      expect(report.suggestions).toContain('consider adding more detailed steps for better error handling');
    });

    it('无效配置应返回无效报告和错误', () => {
      const invalidConfig: WorkflowConfig = {
        name: '',
        steps: []
      };

      const report = validateConfigWithReport(invalidConfig);
      expect(report.valid).toBe(false);
      expect(report.errors).toContain('name must be a non-empty string');
      expect(report.errors).toContain('steps must be a non-empty array');
    });

    it('组合警告和建议', () => {
      const config: WorkflowConfig = {
        name: 'a'.repeat(51), // 长名称警告
        steps: Array(21).fill(null).map((_, i) => ({ // 多步骤警告
          id: `step${i}`,
          name: `Step ${i}`,
          taskType: 'text',
          payload: {}
        }))
      };

      const report = validateConfigWithReport(config);
      expect(report.valid).toBe(true);
      expect(report.warnings.length).toBeGreaterThan(0);
      expect(report.suggestions).toHaveLength(0); // 没有建议因为步骤很多
    });
  });
});