"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const config_validator_1 = require("../services/config-validator");
ts;
';;
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
});
//# sourceMappingURL=config-validator.test.js.map