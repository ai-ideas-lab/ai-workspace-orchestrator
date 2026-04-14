"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const config_validator_1 = require("../services/config-validator");
(0, globals_1.describe)('ConfigValidator', () => {
    (0, globals_1.describe)('validateConfig()', () => {
        (0, globals_1.it)('有效配置应返回空错误列表', () => {
            const validConfig = {
                name: 'test-workflow',
                steps: [{ id: 'step1', taskType: 'text', payload: {} }],
                timeout: 30000,
                retryLimit: 3,
                environment: 'production',
            };
            const errors = (0, config_validator_1.validateConfig)(validConfig);
            (0, globals_1.expect)(errors).toHaveLength(0);
        });
        (0, globals_1.it)('最小有效配置应返回空错误列表', () => {
            const minimalConfig = {
                name: 'minimal',
                steps: [{ id: 'step1', taskType: 'text', payload: {} }],
            };
            const errors = (0, config_validator_1.validateConfig)(minimalConfig);
            (0, globals_1.expect)(errors).toHaveLength(0);
        });
        (0, globals_1.it)('缺失必要字段时应报错', () => {
            const invalidConfig = {
                steps: [{ id: 'step1', taskType: 'text', payload: {} }],
            };
            const errors = (0, config_validator_1.validateConfig)(invalidConfig);
            (0, globals_1.expect)(errors).toContain('name must be a non-empty string');
        });
        (0, globals_1.it)('name 为空字符串时应报错', () => {
            const invalidConfig = {
                name: '',
                steps: [{ id: 'step1', taskType: 'text', payload: {} }],
            };
            const errors = (0, config_validator_1.validateConfig)(invalidConfig);
            (0, globals_1.expect)(errors).toContain('name must be a non-empty string');
        });
        (0, globals_1.it)('steps 为空数组时应报错', () => {
            const invalidConfig = {
                name: 'test',
                steps: [],
            };
            const errors = (0, config_validator_1.validateConfig)(invalidConfig);
            (0, globals_1.expect)(errors).toContain('steps must be a non-empty array');
        });
        (0, globals_1.it)('steps 不是数组时应报错', () => {
            const invalidConfig = {
                name: 'test',
                steps: 'not-an-array',
            };
            const errors = (0, config_validator_1.validateConfig)(invalidConfig);
            (0, globals_1.expect)(errors).toContain('steps must be a non-empty array');
        });
        (0, globals_1.it)('timeout 为负数时应报错', () => {
            const invalidConfig = {
                name: 'test',
                steps: [{ id: 'step1', taskType: 'text', payload: {} }],
                timeout: -1000,
            };
            const errors = (0, config_validator_1.validateConfig)(invalidConfig);
            (0, globals_1.expect)(errors).toContain('timeout must be a positive number');
        });
        (0, globals_1.it)('timeout 为非数字时应报错', () => {
            const invalidConfig = {
                name: 'test',
                steps: [{ id: 'step1', taskType: 'text', payload: {} }],
                timeout: '30000',
            };
            const errors = (0, config_validator_1.validateConfig)(invalidConfig);
            (0, globals_1.expect)(errors).toContain('timeout must be a positive number');
        });
        (0, globals_1.it)('retryLimit 超出范围时应报错', () => {
            const invalidConfig = {
                name: 'test',
                steps: [{ id: 'step1', taskType: 'text', payload: {} }],
                retryLimit: 15,
            };
            const errors = (0, config_validator_1.validateConfig)(invalidConfig);
            (0, globals_1.expect)(errors).toContain('retryLimit must be between 0 and 10');
        });
        (0, globals_1.it)('retryLimit 为负数时应报错', () => {
            const invalidConfig = {
                name: 'test',
                steps: [{ id: 'step1', taskType: 'text', payload: {} }],
                retryLimit: -1,
            };
            const errors = (0, config_validator_1.validateConfig)(invalidConfig);
            (0, globals_1.expect)(errors).toContain('retryLimit must be between 0 and 10');
        });
        (0, globals_1.it)('retryLimit 为非数字时应报错', () => {
            const invalidConfig = {
                name: 'test',
                steps: [{ id: 'step1', taskType: 'text', payload: {} }],
                retryLimit: '3',
            };
            const errors = (0, config_validator_1.validateConfig)(invalidConfig);
            (0, globals_1.expect)(errors).toContain('retryLimit must be between 0 and 10');
        });
        (0, globals_1.it)('environment 为非字符串时应报错', () => {
            const invalidConfig = {
                name: 'test',
                steps: [{ id: 'step1', taskType: 'text', payload: {} }],
                environment: 123,
            };
            const errors = (0, config_validator_1.validateConfig)(invalidConfig);
            (0, globals_1.expect)(errors).toContain('environment must be a string');
        });
        (0, globals_1.it)('多个错误应返回完整错误列表', () => {
            const invalidConfig = {
                name: '',
                steps: [],
                timeout: -1000,
                retryLimit: 15,
                environment: 123,
            };
            const errors = (0, config_validator_1.validateConfig)(invalidConfig);
            (0, globals_1.expect)(errors).toHaveLength(5);
            (0, globals_1.expect)(errors).toContain('name must be a non-empty string');
            (0, globals_1.expect)(errors).toContain('steps must be a non-empty array');
            (0, globals_1.expect)(errors).toContain('timeout must be a positive number');
            (0, globals_1.expect)(errors).toContain('retryLimit must be between 0 and 10');
            (0, globals_1.expect)(errors).toContain('environment must be a string');
        });
        (0, globals_1.it)('可选字段未提供时不报错', () => {
            const configWithoutOptional = {
                name: 'test',
                steps: [{ id: 'step1', taskType: 'text', payload: {} }],
            };
            const errors = (0, config_validator_1.validateConfig)(configWithoutOptional);
            (0, globals_1.expect)(errors).toHaveLength(0);
        });
        (0, globals_1.it)('edge case: timeout 为 0 应通过', () => {
            const validConfig = {
                name: 'test',
                steps: [{ id: 'step1', taskType: 'text', payload: {} }],
                timeout: 0,
            };
            const errors = (0, config_validator_1.validateConfig)(validConfig);
            (0, globals_1.expect)(errors).toHaveLength(0);
        });
        (0, globals_1.it)('edge case: retryLimit 为 0 应通过', () => {
            const validConfig = {
                name: 'test',
                steps: [{ id: 'step1', taskType: 'text', payload: {} }],
                retryLimit: 0,
            };
            const errors = (0, config_validator_1.validateConfig)(validConfig);
            (0, globals_1.expect)(errors).toHaveLength(0);
        });
        (0, globals_1.it)('edge case: retryLimit 为 10 应通过', () => {
            const validConfig = {
                name: 'test',
                steps: [{ id: 'step1', taskType: 'text', payload: {} }],
                retryLimit: 10,
            };
            const errors = (0, config_validator_1.validateConfig)(validConfig);
            (0, globals_1.expect)(errors).toHaveLength(0);
        });
    });
    (0, globals_1.describe)('validateStep()', () => {
        (0, globals_1.it)('有效步骤应返回空错误列表', () => {
            const validStep = {
                id: 'step1',
                name: 'First Step',
                taskType: 'text',
                payload: {},
                dependsOn: []
            };
            const errors = (0, config_validator_1.validateStep)(validStep, 0);
            (0, globals_1.expect)(errors).toHaveLength(0);
        });
        (0, globals_1.it)('最小有效步骤应返回空错误列表', () => {
            const minimalStep = {
                id: 'step1',
                name: 'Step',
                taskType: 'text'
            };
            const errors = (0, config_validator_1.validateStep)(minimalStep, 0);
            (0, globals_1.expect)(errors).toHaveLength(0);
        });
        (0, globals_1.it)('step 为 null 或 undefined 应报错', () => {
            (0, globals_1.expect)((0, config_validator_1.validateStep)(null, 0)).toContain('step 0: must be an object');
            (0, globals_1.expect)((0, config_validator_1.validateStep)(undefined, 1)).toContain('step 1: must be an object');
        });
        (0, globals_1.it)('step 不是对象应报错', () => {
            (0, globals_1.expect)((0, config_validator_1.validateStep)('not-an-object', 0)).toContain('step 0: must be an object');
            (0, globals_1.expect)((0, config_validator_1.validateStep)(123, 1)).toContain('step 1: must be an object');
        });
        (0, globals_1.it)('id 为空字符串应报错', () => {
            const invalidStep = {
                id: '',
                name: 'Step',
                taskType: 'text'
            };
            const errors = (0, config_validator_1.validateStep)(invalidStep, 0);
            (0, globals_1.expect)(errors).toContain('step 0: id must be a non-empty string');
        });
        (0, globals_1.it)('name 为空字符串应报错', () => {
            const invalidStep = {
                id: 'step1',
                name: '',
                taskType: 'text'
            };
            const errors = (0, config_validator_1.validateStep)(invalidStep, 0);
            (0, globals_1.expect)(errors).toContain('step 0: name must be a non-empty string');
        });
        (0, globals_1.it)('taskType 为空字符串应报错', () => {
            const invalidStep = {
                id: 'step1',
                name: 'Step',
                taskType: ''
            };
            const errors = (0, config_validator_1.validateStep)(invalidStep, 0);
            (0, globals_1.expect)(errors).toContain('step 0: taskType must be a non-empty string');
        });
        (0, globals_1.it)('payload 不是对象应报错', () => {
            const invalidStep = {
                id: 'step1',
                name: 'Step',
                taskType: 'text',
                payload: 'not-an-object'
            };
            const errors = (0, config_validator_1.validateStep)(invalidStep, 0);
            (0, globals_1.expect)(errors).toContain('step 0: payload must be an object');
        });
        (0, globals_1.it)('dependsOn 不是数组应报错', () => {
            const invalidStep = {
                id: 'step1',
                name: 'Step',
                taskType: 'text',
                dependsOn: 'not-an-array'
            };
            const errors = (0, config_validator_1.validateStep)(invalidStep, 0);
            (0, globals_1.expect)(errors).toContain('step 0: dependsOn must be an array');
        });
        (0, globals_1.it)('多个错误应返回完整错误列表', () => {
            const invalidStep = {
                id: '',
                name: '',
                taskType: '',
                payload: 'invalid',
                dependsOn: 'invalid'
            };
            const errors = (0, config_validator_1.validateStep)(invalidStep, 2);
            (0, globals_1.expect)(errors).toHaveLength(5);
            (0, globals_1.expect)(errors).toContain('step 2: id must be a non-empty string');
            (0, globals_1.expect)(errors).toContain('step 2: name must be a non-empty string');
            (0, globals_1.expect)(errors).toContain('step 2: taskType must be a non-empty string');
            (0, globals_1.expect)(errors).toContain('step 2: payload must be an object');
            (0, globals_1.expect)(errors).toContain('step 2: dependsOn must be an array');
        });
        (0, globals_1.it)('可选字段未提供不应报错', () => {
            const minimalStep = {
                id: 'step1',
                name: 'Step',
                taskType: 'text'
            };
            const errors = (0, config_validator_1.validateStep)(minimalStep, 0);
            (0, globals_1.expect)(errors).toHaveLength(0);
        });
    });
    (0, globals_1.describe)('validateConfigWithReport()', () => {
        (0, globals_1.it)('有效配置应返回有效的报告', () => {
            const validConfig = {
                name: 'test-workflow',
                steps: [{ id: 'step1', taskType: 'text', payload: {} }],
                timeout: 30000,
                retryLimit: 3,
                environment: 'production'
            };
            const report = (0, config_validator_1.validateConfigWithReport)(validConfig);
            (0, globals_1.expect)(report.valid).toBe(true);
            (0, globals_1.expect)(report.errors).toHaveLength(0);
            (0, globals_1.expect)(report.warnings).toHaveLength(0);
            (0, globals_1.expect)(report.suggestions).toHaveLength(0);
        });
        (0, globals_1.it)('name 过长应产生警告', () => {
            const longNameConfig = {
                name: 'a'.repeat(51),
                steps: [{ id: 'step1', taskType: 'text', payload: {} }]
            };
            const report = (0, config_validator_1.validateConfigWithReport)(longNameConfig);
            (0, globals_1.expect)(report.valid).toBe(true);
            (0, globals_1.expect)(report.warnings).toContain('name should be concise (max 50 characters)');
        });
        (0, globals_1.it)('步骤过多应产生警告', () => {
            const manyStepsConfig = {
                name: 'test',
                steps: Array(21).fill(null).map((_, i) => ({
                    id: `step${i}`,
                    name: `Step ${i}`,
                    taskType: 'text',
                    payload: {}
                }))
            };
            const report = (0, config_validator_1.validateConfigWithReport)(manyStepsConfig);
            (0, globals_1.expect)(report.valid).toBe(true);
            (0, globals_1.expect)(report.warnings).toContain('workflow has many steps, consider breaking it into sub-workflows');
        });
        (0, globals_1.it)('步骤过少应产生建议', () => {
            const fewStepsConfig = {
                name: 'test',
                steps: [{ id: 'step1', taskType: 'text', payload: {} }]
            };
            const report = (0, config_validator_1.validateConfigWithReport)(fewStepsConfig);
            (0, globals_1.expect)(report.valid).toBe(true);
            (0, globals_1.expect)(report.suggestions).toContain('consider adding more detailed steps for better error handling');
        });
        (0, globals_1.it)('无效配置应返回无效报告和错误', () => {
            const invalidConfig = {
                name: '',
                steps: []
            };
            const report = (0, config_validator_1.validateConfigWithReport)(invalidConfig);
            (0, globals_1.expect)(report.valid).toBe(false);
            (0, globals_1.expect)(report.errors).toContain('name must be a non-empty string');
            (0, globals_1.expect)(report.errors).toContain('steps must be a non-empty array');
        });
        (0, globals_1.it)('组合警告和建议', () => {
            const config = {
                name: 'a'.repeat(51),
                steps: Array(21).fill(null).map((_, i) => ({
                    id: `step${i}`,
                    name: `Step ${i}`,
                    taskType: 'text',
                    payload: {}
                }))
            };
            const report = (0, config_validator_1.validateConfigWithReport)(config);
            (0, globals_1.expect)(report.valid).toBe(true);
            (0, globals_1.expect)(report.warnings.length).toBeGreaterThan(0);
            (0, globals_1.expect)(report.suggestions).toHaveLength(0);
        });
    });
});
//# sourceMappingURL=config-validator.test.js.map