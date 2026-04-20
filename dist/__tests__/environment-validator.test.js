"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const environment_validator_1 = require("../utils/environment-validator");
(0, globals_1.describe)('Environment Validator', () => {
    const originalEnv = { ...process.env };
    (0, globals_1.beforeEach)(() => {
        process.env = { ...originalEnv };
    });
    (0, globals_1.afterEach)(() => {
        process.env = { ...originalEnv };
    });
    (0, globals_1.describe)('validateEnvironmentVariables()', () => {
        (0, globals_1.it)('有效环境变量应返回空错误列表', () => {
            process.env.NODE_ENV = 'production';
            process.env.PORT = '3000';
            process.env.JWT_SECRET = 'test-secret-key';
            const errors = (0, environment_validator_1.validateEnvironmentVariables)();
            (0, globals_1.expect)(errors).toHaveLength(0);
        });
        (0, globals_1.it)('开发环境应通过验证', () => {
            process.env.NODE_ENV = 'development';
            process.env.PORT = '3000';
            process.env.JWT_SECRET = 'test-secret-key';
            const errors = (0, environment_validator_1.validateEnvironmentVariables)();
            (0, globals_1.expect)(errors).toHaveLength(0);
        });
        (0, globals_1.it)('测试环境应通过验证', () => {
            process.env.NODE_ENV = 'test';
            process.env.PORT = '3001';
            process.env.JWT_SECRET = 'test-jwt-secret';
            const errors = (0, environment_validator_1.validateEnvironmentVariables)();
            (0, globals_1.expect)(errors).toHaveLength(0);
        });
        (0, globals_1.it)('缺失NODE_ENV时应报错', () => {
            process.env.PORT = '3000';
            process.env.JWT_SECRET = 'test-secret-key';
            const errors = (0, environment_validator_1.validateEnvironmentVariables)();
            (0, globals_1.expect)(errors).toContain('NODE_ENV is required');
            (0, globals_1.expect)(errors).toHaveLength(1);
        });
        (0, globals_1.it)('缺失PORT时应报错', () => {
            process.env.NODE_ENV = 'production';
            process.env.JWT_SECRET = 'test-secret-key';
            const errors = (0, environment_validator_1.validateEnvironmentVariables)();
            (0, globals_1.expect)(errors).toContain('PORT is required');
            (0, globals_1.expect)(errors).toHaveLength(1);
        });
        (0, globals_1.it)('缺失JWT_SECRET时应报错', () => {
            process.env.NODE_ENV = 'production';
            process.env.PORT = '3000';
            const errors = (0, environment_validator_1.validateEnvironmentVariables)();
            (0, globals_1.expect)(errors).toContain('JWT_SECRET is required');
            (0, globals_1.expect)(errors).toHaveLength(1);
        });
        (0, globals_1.it)('缺失所有环境变量时应返回完整错误列表', () => {
            const errors = (0, environment_validator_1.validateEnvironmentVariables)();
            (0, globals_1.expect)(errors).toHaveLength(3);
            (0, globals_1.expect)(errors).toContain('NODE_ENV is required');
            (0, globals_1.expect)(errors).toContain('PORT is required');
            (0, globals_1.expect)(errors).toContain('JWT_SECRET is required');
        });
        (0, globals_1.it)('空字符串环境变量应报错', () => {
            process.env.NODE_ENV = '';
            process.env.PORT = '3000';
            process.env.JWT_SECRET = 'test-secret-key';
            const errors = (0, environment_validator_1.validateEnvironmentVariables)();
            (0, globals_1.expect)(errors).toContain('NODE_ENV is required');
            (0, globals_1.expect)(errors).toHaveLength(1);
        });
        (0, globals_1.it)('PORT为非数字值应能通过验证（不验证类型，只验证存在性）', () => {
            process.env.NODE_ENV = 'production';
            process.env.PORT = 'not-a-number';
            process.env.JWT_SECRET = 'test-secret-key';
            const errors = (0, environment_validator_1.validateEnvironmentVariables)();
            (0, globals_1.expect)(errors).toHaveLength(0);
        });
        (0, globals_1.it)('edge case: 仅设置NODE_ENV应报错', () => {
            process.env.NODE_ENV = 'production';
            const errors = (0, environment_validator_1.validateEnvironmentVariables)();
            (0, globals_1.expect)(errors).toHaveLength(2);
            (0, globals_1.expect)(errors).toContain('PORT is required');
            (0, globals_1.expect)(errors).toContain('JWT_SECRET is required');
        });
        (0, globals_1.it)('edge case: 仅设置PORT应报错', () => {
            process.env.PORT = '3000';
            const errors = (0, environment_validator_1.validateEnvironmentVariables)();
            (0, globals_1.expect)(errors).toHaveLength(2);
            (0, globals_1.expect)(errors).toContain('NODE_ENV is required');
            (0, globals_1.expect)(errors).toContain('JWT_SECRET is required');
        });
        (0, globals_1.it)('edge case: 仅设置JWT_SECRET应报错', () => {
            process.env.JWT_SECRET = 'test-secret-key';
            const errors = (0, environment_validator_1.validateEnvironmentVariables)();
            (0, globals_1.expect)(errors).toHaveLength(2);
            (0, globals_1.expect)(errors).toContain('NODE_ENV is required');
            (0, globals_1.expect)(errors).toContain('PORT is required');
        });
    });
    (0, globals_1.describe)('validateDatabaseEnvironment()', () => {
        (0, globals_1.it)('有效的数据库环境变量应返回空错误列表', () => {
            process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
            process.env.DATABASE_USERNAME = 'admin';
            process.env.DATABASE_PASSWORD = 'secure-password';
            const errors = (0, environment_validator_1.validateDatabaseEnvironment)();
            (0, globals_1.expect)(errors).toHaveLength(0);
        });
        (0, globals_1.it)('最小有效数据库配置应通过验证', () => {
            process.env.DATABASE_URL = 'sqlite:./database.db';
            const errors = (0, environment_validator_1.validateDatabaseEnvironment)();
            (0, globals_1.expect)(errors).toHaveLength(0);
        });
        (0, globals_1.it)('缺失DATABASE_URL时应报错', () => {
            process.env.DATABASE_USERNAME = 'admin';
            process.env.DATABASE_PASSWORD = 'secure-password';
            const errors = (0, environment_validator_1.validateDatabaseEnvironment)();
            (0, globals_1.expect)(errors).toContain('DATABASE_URL is required for database connection');
            (0, globals_1.expect)(errors).toHaveLength(1);
        });
        (0, globals_1.it)('缺失DATABASE_USERNAME时应报错', () => {
            process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
            process.env.DATABASE_PASSWORD = 'secure-password';
            const errors = (0, environment_validator_1.validateDatabaseEnvironment)();
            (0, globals_1.expect)(errors).toContain('DATABASE_USERNAME is required for database connection');
            (0, globals_1.expect)(errors).toHaveLength(1);
        });
        (0, globals_1.it)('缺失DATABASE_PASSWORD时应报错', () => {
            process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
            process.env.DATABASE_USERNAME = 'admin';
            const errors = (0, environment_validator_1.validateDatabaseEnvironment)();
            (0, globals_1.expect)(errors).toContain('DATABASE_PASSWORD is required for database connection');
            (0, globals_1.expect)(errors).toHaveLength(1);
        });
        (0, globals_1.it)('缺失所有数据库变量时应返回完整错误列表', () => {
            const errors = (0, environment_validator_1.validateDatabaseEnvironment)();
            (0, globals_1.expect)(errors).toHaveLength(3);
            (0, globals_1.expect)(errors).toContain('DATABASE_URL is required for database connection');
            (0, globals_1.expect)(errors).toContain('DATABASE_USERNAME is required for database connection');
            (0, globals_1.expect)(errors).toContain('DATABASE_PASSWORD is required for database connection');
        });
        (0, globals_1.it)('空字符串数据库变量应报错', () => {
            process.env.DATABASE_URL = '';
            process.env.DATABASE_USERNAME = 'admin';
            process.env.DATABASE_PASSWORD = 'secure-password';
            const errors = (0, environment_validator_1.validateDatabaseEnvironment)();
            (0, globals_1.expect)(errors).toContain('DATABASE_URL is required for database connection');
            (0, globals_1.expect)(errors).toHaveLength(1);
        });
        (0, globals_1.it)('edge case: 仅设置DATABASE_URL应报错', () => {
            process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
            const errors = (0, environment_validator_1.validateDatabaseEnvironment)();
            (0, globals_1.expect)(errors).toHaveLength(2);
            (0, globals_1.expect)(errors).toContain('DATABASE_USERNAME is required for database connection');
            (0, globals_1.expect)(errors).toContain('DATABASE_PASSWORD is required for database connection');
        });
        (0, globals_1.it)('edge case: 仅设置DATABASE_USERNAME应报错', () => {
            process.env.DATABASE_USERNAME = 'admin';
            const errors = (0, environment_validator_1.validateDatabaseEnvironment)();
            (0, globals_1.expect)(errors).toHaveLength(2);
            (0, globals_1.expect)(errors).toContain('DATABASE_URL is required for database connection');
            (0, globals_1.expect)(errors).toContain('DATABASE_PASSWORD is required for database connection');
        });
        (0, globals_1.it)('edge case: 仅设置DATABASE_PASSWORD应报错', () => {
            process.env.DATABASE_PASSWORD = 'secure-password';
            const errors = (0, environment_validator_1.validateDatabaseEnvironment)();
            (0, globals_1.expect)(errors).toHaveLength(2);
            (0, globals_1.expect)(errors).toContain('DATABASE_URL is required for database connection');
            (0, globals_1.expect)(errors).toContain('DATABASE_USERNAME is required for database connection');
        });
    });
    (0, globals_1.describe)('validateAIEnvironment()', () => {
        (0, globals_1.it)('有效的AI环境变量应返回空错误列表', () => {
            process.env.OPENAI_API_KEY = 'sk-test-key-123';
            process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key-456';
            process.env.AI_MODEL_TYPE = 'gpt-4';
            const errors = (0, environment_validator_1.validateAIEnvironment)();
            (0, globals_1.expect)(errors).toHaveLength(0);
        });
        (0, globals_1.it)('部分AI服务配置应返回相应警告', () => {
            process.env.OPENAI_API_KEY = 'sk-test-key-123';
            const errors = (0, environment_validator_1.validateAIEnvironment)();
            (0, globals_1.expect)(errors).toHaveLength(2);
            (0, globals_1.expect)(errors).toContain('OpenAI service may not be available - ANTHROPIC_API_KEY is missing');
            (0, globals_1.expect)(errors).toContain('Anthropic service may not be available - AI_MODEL_TYPE is missing');
        });
        (0, globals_1.it)('仅OpenAI配置应返回Anthropic相关警告', () => {
            process.env.OPENAI_API_KEY = 'sk-test-key-123';
            process.env.AI_MODEL_TYPE = 'gpt-4';
            const errors = (0, environment_validator_1.validateAIEnvironment)();
            (0, globals_1.expect)(errors).toHaveLength(1);
            (0, globals_1.expect)(errors).toContain('Anthropic service may not be available - ANTHROPIC_API_KEY is missing');
        });
        (0, globals_1.it)('仅Anthropic配置应返回OpenAI相关警告', () => {
            process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key-456';
            process.env.AI_MODEL_TYPE = 'claude-3';
            const errors = (0, environment_validator_1.validateAIEnvironment)();
            (0, globals_1.expect)(errors).toHaveLength(1);
            (0, globals_1.expect)(errors).toContain('OpenAI service may not be available - OPENAI_API_KEY is missing');
        });
        (0, globals_1.it)('缺失AI_MODEL_TYPE时应报错', () => {
            process.env.OPENAI_API_KEY = 'sk-test-key-123';
            process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key-456';
            const errors = (0, environment_validator_1.validateAIEnvironment)();
            (0, globals_1.expect)(errors).toContain('Anthropic service may not be available - AI_MODEL_TYPE is missing');
            (0, globals_1.expect)(errors).toHaveLength(1);
        });
        (0, globals_1.it)('缺失所有AI变量时应返回完整警告列表', () => {
            const errors = (0, environment_validator_1.validateAIEnvironment)();
            (0, globals_1.expect)(errors).toHaveLength(3);
            (0, globals_1.expect)(errors).toContain('OpenAI service may not be available - OPENAI_API_KEY is missing');
            (0, globals_1.expect)(errors).toContain('Anthropic service may not be available - ANTHROPIC_API_KEY is missing');
            (0, globals_1.expect)(errors).toContain('Anthropic service may not be available - AI_MODEL_TYPE is missing');
        });
        (0, globals_1.it)('空字符串AI变量应报错', () => {
            process.env.OPENAI_API_KEY = '';
            process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key-456';
            process.env.AI_MODEL_TYPE = 'gpt-4';
            const errors = (0, environment_validator_1.validateAIEnvironment)();
            (0, globals_1.expect)(errors).toContain('OpenAI service may not be available - OPENAI_API_KEY is missing');
            (0, globals_1.expect)(errors).toHaveLength(1);
        });
        (0, globals_1.it)('edge case: 仅设置AI_MODEL_TYPE应返回两个服务警告', () => {
            process.env.AI_MODEL_TYPE = 'gpt-4';
            const errors = (0, environment_validator_1.validateAIEnvironment)();
            (0, globals_1.expect)(errors).toHaveLength(2);
            (0, globals_1.expect)(errors).toContain('OpenAI service may not be available - OPENAI_API_KEY is missing');
            (0, globals_1.expect)(errors).toContain('Anthropic service may not be available - ANTHROPIC_API_KEY is missing');
        });
        (0, globals_1.it)('edge case: 空字符串AI_MODEL_TYPE应报错', () => {
            process.env.OPENAI_API_KEY = 'sk-test-key-123';
            process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key-456';
            process.env.AI_MODEL_TYPE = '';
            const errors = (0, environment_validator_1.validateAIEnvironment)();
            (0, globals_1.expect)(errors).toContain('Anthropic service may not be available - AI_MODEL_TYPE is missing');
            (0, globals_1.expect)(errors).toHaveLength(1);
        });
        (0, globals_1.it)('edge case: AI_MODEL_TYPE为其他有效值应通过', () => {
            process.env.OPENAI_API_KEY = 'sk-test-key-123';
            process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key-456';
            process.env.AI_MODEL_TYPE = 'claude-3-haiku';
            const errors = (0, environment_validator_1.validateAIEnvironment)();
            (0, globals_1.expect)(errors).toHaveLength(0);
        });
    });
    (0, globals_1.describe)('组合环境验证', () => {
        (0, globals_1.it)('所有环境验证组合应正常工作', () => {
            process.env.NODE_ENV = 'production';
            process.env.PORT = '3000';
            process.env.JWT_SECRET = 'test-secret-key';
            process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
            process.env.DATABASE_USERNAME = 'admin';
            process.env.DATABASE_PASSWORD = 'secure-password';
            process.env.OPENAI_API_KEY = 'sk-test-key-123';
            process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key-456';
            process.env.AI_MODEL_TYPE = 'gpt-4';
            const envErrors = (0, environment_validator_1.validateEnvironmentVariables)();
            const dbErrors = (0, environment_validator_1.validateDatabaseEnvironment)();
            const aiErrors = (0, environment_validator_1.validateAIEnvironment)();
            (0, globals_1.expect)(envErrors).toHaveLength(0);
            (0, globals_1.expect)(dbErrors).toHaveLength(0);
            (0, globals_1.expect)(aiErrors).toHaveLength(0);
        });
        (0, globals_1.it)('部分配置缺失时应返回相应错误', () => {
            process.env.NODE_ENV = 'production';
            process.env.PORT = '3000';
            process.env.JWT_SECRET = 'test-secret-key';
            const envErrors = (0, environment_validator_1.validateEnvironmentVariables)();
            const dbErrors = (0, environment_validator_1.validateDatabaseEnvironment)();
            const aiErrors = (0, environment_validator_1.validateAIEnvironment)();
            (0, globals_1.expect)(envErrors).toHaveLength(0);
            (0, globals_1.expect)(dbErrors).toHaveLength(3);
            (0, globals_1.expect)(aiErrors).toHaveLength(3);
        });
        (0, globals_1.it)('完全缺失配置时应返回所有错误', () => {
            const envErrors = (0, environment_validator_1.validateEnvironmentVariables)();
            const dbErrors = (0, environment_validator_1.validateDatabaseEnvironment)();
            const aiErrors = (0, environment_validator_1.validateAIEnvironment)();
            (0, globals_1.expect)(envErrors).toHaveLength(3);
            (0, globals_1.expect)(dbErrors).toHaveLength(3);
            (0, globals_1.expect)(aiErrors).toHaveLength(3);
            (0, globals_1.expect)(envErrors.concat(dbErrors, aiErrors)).toHaveLength(9);
        });
        (0, globals_1.it)('开发环境配置示例应通过验证', () => {
            process.env.NODE_ENV = 'development';
            process.env.PORT = '3001';
            process.env.JWT_SECRET = 'dev-jwt-secret';
            process.env.DATABASE_URL = 'sqlite:./dev.db';
            process.env.OPENAI_API_KEY = 'sk-dev-key';
            process.env.AI_MODEL_TYPE = 'gpt-3.5-turbo';
            const envErrors = (0, environment_validator_1.validateEnvironmentVariables)();
            const dbErrors = (0, environment_validator_1.validateDatabaseEnvironment)();
            const aiErrors = (0, environment_validator_1.validateAIEnvironment)();
            (0, globals_1.expect)(envErrors).toHaveLength(0);
            (0, globals_1.expect)(dbErrors).toHaveLength(0);
            (0, globals_1.expect)(aiErrors).toHaveLength(1);
        });
    });
    (0, globals_1.describe)('边界条件和特殊情况', () => {
        (0, globals_1.it)('空环境对象应返回所有错误', () => {
            const originalEnv = process.env;
            process.env = {};
            const envErrors = (0, environment_validator_1.validateEnvironmentVariables)();
            const dbErrors = (0, environment_validator_1.validateDatabaseEnvironment)();
            const aiErrors = (0, environment_validator_1.validateAIEnvironment)();
            (0, globals_1.expect)(envErrors).toHaveLength(3);
            (0, globals_1.expect)(dbErrors).toHaveLength(3);
            (0, globals_1.expect)(aiErrors).toHaveLength(3);
            process.env = originalEnv;
        });
        (0, globals_1.it)('环境变量包含特殊字符应正常工作', () => {
            process.env.NODE_ENV = 'production!';
            process.env.PORT = '3000';
            process.env.JWT_SECRET = 'secret-key-with_special-chars_123';
            const errors = (0, environment_validator_1.validateEnvironmentVariables)();
            (0, globals_1.expect)(errors).toHaveLength(0);
        });
        (0, globals_1.it)('超长环境变量值应正常工作', () => {
            process.env.NODE_ENV = 'production';
            process.env.PORT = '3000';
            process.env.JWT_SECRET = 'a'.repeat(1000);
            const errors = (0, environment_validator_1.validateEnvironmentVariables)();
            (0, globals_1.expect)(errors).toHaveLength(0);
        });
        (0, globals_1.it)('数字类型环境变量值应正常工作', () => {
            process.env.NODE_ENV = 'production';
            process.env.PORT = '3000';
            process.env.JWT_SECRET = '1234567890';
            const errors = (0, environment_validator_1.validateEnvironmentVariables)();
            (0, globals_1.expect)(errors).toHaveLength(0);
        });
    });
});
//# sourceMappingURL=environment-validator.test.js.map