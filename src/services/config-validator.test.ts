/**
 * 配置验证器测试
 * 测试 WorkflowConfig 相关的验证功能
 */

import { validateConfig, validateConfigWithReport, WorkflowConfig } from './config-validator';

describe('validateConfig', () => {
  test('应该接受有效的工作流配置', () => {
    const validConfig: WorkflowConfig = {
      name: '测试工作流',
      steps: [
        { id: '1', name: '步骤1', taskType: 'text', payload: {}, dependsOn: [] },
        { id: '2', name: '步骤2', taskType: 'api', payload: { url: 'https://example.com' }, dependsOn: ['1'] }
      ],
      timeout: 30000,
      retryLimit: 3,
      environment: 'production'
    };
    
    const errors = validateConfig(validConfig);
    expect(errors).toHaveLength(0);
  });

  test('应该拒绝没有名称的配置', () => {
    const config: WorkflowConfig = {
      name: '',
      steps: [{ id: '1', name: '步骤1', taskType: 'text', payload: {}, dependsOn: [] }]
    };
    
    const errors = validateConfig(config);
    expect(errors).toContain('name must be a non-empty string');
  });

  test('应该拒绝数字类型的名称', () => {
    const config: WorkflowConfig = {
      name: 123 as any,
      steps: [{ id: '1', name: '步骤1', taskType: 'text', payload: {}, dependsOn: [] }]
    };
    
    const errors = validateConfig(config);
    expect(errors).toContain('name must be a non-empty string');
  });

  test('应该拒绝空的步骤数组', () => {
    const config: WorkflowConfig = {
      name: '测试工作流',
      steps: []
    };
    
    const errors = validateConfig(config);
    expect(errors).toContain('steps must be a non-empty array');
  });

  test('应该拒绝非数组的步骤', () => {
    const config: WorkflowConfig = {
      name: '测试工作流',
      steps: 'not-array' as any
    };
    
    const errors = validateConfig(config);
    expect(errors).toContain('steps must be a non-empty array');
  });

  test('应该检测无效的步骤对象', () => {
    const config: WorkflowConfig = {
      name: '测试工作流',
      steps: [
        { id: '', name: '步骤1', taskType: 'text', payload: {}, dependsOn: [] } as any,
        { id: '2', name: '', taskType: 'text', payload: {}, dependsOn: [] } as any,
        { id: '3', name: '步骤3', taskType: '', payload: {}, dependsOn: [] } as any
      ]
    };
    
    const errors = validateConfig(config);
    expect(errors).toContain('step 0: id must be a non-empty string');
    expect(errors).toContain('step 1: name must be a non-empty string');
    expect(errors).toContain('step 2: taskType must be a non-empty string');
  });

  test('应该验证超时设置', () => {
    const config1: WorkflowConfig = {
      name: '测试工作流',
      steps: [{ id: '1', name: '步骤1', taskType: 'text', payload: {}, dependsOn: [] }],
      timeout: -1
    };
    
    const errors1 = validateConfig(config1);
    expect(errors1).toContain('timeout must be a positive number');

    const config2: WorkflowConfig = {
      name: '测试工作流',
      steps: [{ id: '1', name: '步骤1', taskType: 'text', payload: {}, dependsOn: [] }],
      timeout: 30000
    };
    
    const errors2 = validateConfig(config2);
    expect(errors2).not.toContain('timeout must be a positive number');
  });

  test('应该验证重试限制', () => {
    const config1: WorkflowConfig = {
      name: '测试工作流',
      steps: [{ id: '1', name: '步骤1', taskType: 'text', payload: {}, dependsOn: [] }],
      retryLimit: -1
    };
    
    const errors1 = validateConfig(config1);
    expect(errors1).toContain('retryLimit must be between 0 and 10');

    const config2: WorkflowConfig = {
      name: '测试工作流',
      steps: [{ id: '1', name: '步骤1', taskType: 'text', payload: {}, dependsOn: [] }],
      retryLimit: 5
    };
    
    const errors2 = validateConfig(config2);
    expect(errors2).not.toContain('retryLimit must be between 0 and 10');

    const config3: WorkflowConfig = {
      name: '测试工作流',
      steps: [{ id: '1', name: '步骤1', taskType: 'text', payload: {}, dependsOn: [] }],
      retryLimit: 11
    };
    
    const errors3 = validateConfig(config3);
    expect(errors3).toContain('retryLimit must be between 0 and 10');
  });

  test('应该验证环境设置', () => {
    const config1: WorkflowConfig = {
      name: '测试工作流',
      steps: [{ id: '1', name: '步骤1', taskType: 'text', payload: {}, dependsOn: [] }],
      environment: 'invalid'
    };
    
    const errors1 = validateConfig(config1);
    expect(errors1).toContain('environment must be one of: development, staging, production');

    const config2: WorkflowConfig = {
      name: '测试工作流',
      steps: [{ id: '1', name: '步骤1', taskType: 'text', payload: {}, dependsOn: [] }],
      environment: 'production'
    };
    
    const errors2 = validateConfig(config2);
    expect(errors2).not.toContain('environment must be one of: development, staging, production');
  });
});

describe('validateConfigWithReport', () => {
  test('应该返回有效的验证报告', () => {
    const config: WorkflowConfig = {
      name: '测试工作流',
      steps: [
        { id: '1', name: '步骤1', taskType: 'text', payload: {}, dependsOn: [] },
        { id: '2', name: '步骤2', taskType: 'api', payload: { url: 'https://example.com' }, dependsOn: ['1'] }
      ],
      timeout: 30000,
      retryLimit: 3,
      environment: 'production'
    };
    
    const report = validateConfigWithReport(config);
    expect(report.valid).toBe(true);
    expect(report.errors).toHaveLength(0);
    expect(report.warnings).toHaveLength(0);
    expect(report.suggestions).toHaveLength(0);
  });

  test('应该为过长的名称生成警告', () => {
    const longName = '这是一个非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常长的工作流名称';
    const config: WorkflowConfig = {
      name: longName,
      steps: [{ id: '1', name: '步骤1', taskType: 'text', payload: {}, dependsOn: [] }]
    };
    
    const report = validateConfigWithReport(config);
    expect(report.valid).toBe(true);
    expect(report.warnings).toContain('name should be concise (max 50 characters)');
  });

  test('应该为大量步骤生成警告', () => {
    const steps = Array.from({ length: 25 }, (_, i) => ({
      id: `${i + 1}`,
      name: `步骤${i + 1}`,
      taskType: 'text',
      payload: {},
      dependsOn: []
    }));
    
    const config: WorkflowConfig = {
      name: '大型工作流',
      steps
    };
    
    const report = validateConfigWithReport(config);
    expect(report.valid).toBe(true);
    expect(report.warnings).toContain('workflow has many steps, consider breaking it into sub-workflows');
  });

  test('应该为少量步骤生成建议', () => {
    const config: WorkflowConfig = {
      name: '简单工作流',
      steps: [
        { id: '1', name: '步骤1', taskType: 'text', payload: {}, dependsOn: [] }
      ]
    };
    
    const report = validateConfigWithReport(config);
    expect(report.valid).toBe(true);
    expect(report.suggestions).toContain('consider adding more detailed steps for better error handling');
  });

  test('应该包含基础错误', () => {
    const config: WorkflowConfig = {
      name: '',
      steps: [{ id: '1', name: '步骤1', taskType: 'text', payload: {}, dependsOn: [] }]
    };
    
    const report = validateConfigWithReport(config);
    expect(report.valid).toBe(false);
    expect(report.errors).toContain('name must be a non-empty string');
  });
});