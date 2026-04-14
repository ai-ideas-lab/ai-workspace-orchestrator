/**
 * Environment Validator 单元测试
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { 
  validateEnvironmentVariables, 
  validateDatabaseEnvironment, 
  validateAIEnvironment 
} from '../utils/environment-validator';

describe('Environment Validator', () => {
  // 保存原始环境变量
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // 清理环境变量，确保测试隔离
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // 恢复原始环境变量
    process.env = { ...originalEnv };
  });

  describe('validateEnvironmentVariables()', () => {
    it('有效环境变量应返回空错误列表', () => {
      // 设置所有必需的环境变量
      process.env.NODE_ENV = 'production';
      process.env.PORT = '3000';
      process.env.JWT_SECRET = 'test-secret-key';

      const errors = validateEnvironmentVariables();
      expect(errors).toHaveLength(0);
    });

    it('开发环境应通过验证', () => {
      process.env.NODE_ENV = 'development';
      process.env.PORT = '3000';
      process.env.JWT_SECRET = 'test-secret-key';

      const errors = validateEnvironmentVariables();
      expect(errors).toHaveLength(0);
    });

    it('测试环境应通过验证', () => {
      process.env.NODE_ENV = 'test';
      process.env.PORT = '3001';
      process.env.JWT_SECRET = 'test-jwt-secret';

      const errors = validateEnvironmentVariables();
      expect(errors).toHaveLength(0);
    });

    it('缺失NODE_ENV时应报错', () => {
      process.env.PORT = '3000';
      process.env.JWT_SECRET = 'test-secret-key';

      const errors = validateEnvironmentVariables();
      expect(errors).toContain('NODE_ENV is required');
      expect(errors).toHaveLength(1);
    });

    it('缺失PORT时应报错', () => {
      process.env.NODE_ENV = 'production';
      process.env.JWT_SECRET = 'test-secret-key';

      const errors = validateEnvironmentVariables();
      expect(errors).toContain('PORT is required');
      expect(errors).toHaveLength(1);
    });

    it('缺失JWT_SECRET时应报错', () => {
      process.env.NODE_ENV = 'production';
      process.env.PORT = '3000';

      const errors = validateEnvironmentVariables();
      expect(errors).toContain('JWT_SECRET is required');
      expect(errors).toHaveLength(1);
    });

    it('缺失所有环境变量时应返回完整错误列表', () => {
      // 不设置任何必需的环境变量
      const errors = validateEnvironmentVariables();
      expect(errors).toHaveLength(3);
      expect(errors).toContain('NODE_ENV is required');
      expect(errors).toContain('PORT is required');
      expect(errors).toContain('JWT_SECRET is required');
    });

    it('空字符串环境变量应报错', () => {
      process.env.NODE_ENV = '';
      process.env.PORT = '3000';
      process.env.JWT_SECRET = 'test-secret-key';

      const errors = validateEnvironmentVariables();
      expect(errors).toContain('NODE_ENV is required');
      expect(errors).toHaveLength(1);
    });

    it('PORT为非数字值应能通过验证（不验证类型，只验证存在性）', () => {
      process.env.NODE_ENV = 'production';
      process.env.PORT = 'not-a-number';
      process.env.JWT_SECRET = 'test-secret-key';

      const errors = validateEnvironmentVariables();
      expect(errors).toHaveLength(0); // 当前实现只检查存在性，不验证类型
    });

    it('edge case: 仅设置NODE_ENV应报错', () => {
      process.env.NODE_ENV = 'production';

      const errors = validateEnvironmentVariables();
      expect(errors).toHaveLength(2);
      expect(errors).toContain('PORT is required');
      expect(errors).toContain('JWT_SECRET is required');
    });

    it('edge case: 仅设置PORT应报错', () => {
      process.env.PORT = '3000';

      const errors = validateEnvironmentVariables();
      expect(errors).toHaveLength(2);
      expect(errors).toContain('NODE_ENV is required');
      expect(errors).toContain('JWT_SECRET is required');
    });

    it('edge case: 仅设置JWT_SECRET应报错', () => {
      process.env.JWT_SECRET = 'test-secret-key';

      const errors = validateEnvironmentVariables();
      expect(errors).toHaveLength(2);
      expect(errors).toContain('NODE_ENV is required');
      expect(errors).toContain('PORT is required');
    });
  });

  describe('validateDatabaseEnvironment()', () => {
    it('有效的数据库环境变量应返回空错误列表', () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
      process.env.DATABASE_USERNAME = 'admin';
      process.env.DATABASE_PASSWORD = 'secure-password';

      const errors = validateDatabaseEnvironment();
      expect(errors).toHaveLength(0);
    });

    it('最小有效数据库配置应通过验证', () => {
      process.env.DATABASE_URL = 'sqlite:./database.db';

      const errors = validateDatabaseEnvironment();
      expect(errors).toHaveLength(0); // 当前实现只检查存在性
    });

    it('缺失DATABASE_URL时应报错', () => {
      process.env.DATABASE_USERNAME = 'admin';
      process.env.DATABASE_PASSWORD = 'secure-password';

      const errors = validateDatabaseEnvironment();
      expect(errors).toContain('DATABASE_URL is required for database connection');
      expect(errors).toHaveLength(1);
    });

    it('缺失DATABASE_USERNAME时应报错', () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
      process.env.DATABASE_PASSWORD = 'secure-password';

      const errors = validateDatabaseEnvironment();
      expect(errors).toContain('DATABASE_USERNAME is required for database connection');
      expect(errors).toHaveLength(1);
    });

    it('缺失DATABASE_PASSWORD时应报错', () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
      process.env.DATABASE_USERNAME = 'admin';

      const errors = validateDatabaseEnvironment();
      expect(errors).toContain('DATABASE_PASSWORD is required for database connection');
      expect(errors).toHaveLength(1);
    });

    it('缺失所有数据库变量时应返回完整错误列表', () => {
      const errors = validateDatabaseEnvironment();
      expect(errors).toHaveLength(3);
      expect(errors).toContain('DATABASE_URL is required for database connection');
      expect(errors).toContain('DATABASE_USERNAME is required for database connection');
      expect(errors).toContain('DATABASE_PASSWORD is required for database connection');
    });

    it('空字符串数据库变量应报错', () => {
      process.env.DATABASE_URL = '';
      process.env.DATABASE_USERNAME = 'admin';
      process.env.DATABASE_PASSWORD = 'secure-password';

      const errors = validateDatabaseEnvironment();
      expect(errors).toContain('DATABASE_URL is required for database connection');
      expect(errors).toHaveLength(1);
    });

    it('edge case: 仅设置DATABASE_URL应报错', () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';

      const errors = validateDatabaseEnvironment();
      expect(errors).toHaveLength(2);
      expect(errors).toContain('DATABASE_USERNAME is required for database connection');
      expect(errors).toContain('DATABASE_PASSWORD is required for database connection');
    });

    it('edge case: 仅设置DATABASE_USERNAME应报错', () => {
      process.env.DATABASE_USERNAME = 'admin';

      const errors = validateDatabaseEnvironment();
      expect(errors).toHaveLength(2);
      expect(errors).toContain('DATABASE_URL is required for database connection');
      expect(errors).toContain('DATABASE_PASSWORD is required for database connection');
    });

    it('edge case: 仅设置DATABASE_PASSWORD应报错', () => {
      process.env.DATABASE_PASSWORD = 'secure-password';

      const errors = validateDatabaseEnvironment();
      expect(errors).toHaveLength(2);
      expect(errors).toContain('DATABASE_URL is required for database connection');
      expect(errors).toContain('DATABASE_USERNAME is required for database connection');
    });
  });

  describe('validateAIEnvironment()', () => {
    it('有效的AI环境变量应返回空错误列表', () => {
      process.env.OPENAI_API_KEY = 'sk-test-key-123';
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key-456';
      process.env.AI_MODEL_TYPE = 'gpt-4';

      const errors = validateAIEnvironment();
      expect(errors).toHaveLength(0);
    });

    it('部分AI服务配置应返回相应警告', () => {
      process.env.OPENAI_API_KEY = 'sk-test-key-123';
      // 缺少 ANTHROPIC_API_KEY 和 AI_MODEL_TYPE

      const errors = validateAIEnvironment();
      expect(errors).toHaveLength(2);
      expect(errors).toContain('OpenAI service may not be available - ANTHROPIC_API_KEY is missing');
      expect(errors).toContain('Anthropic service may not be available - AI_MODEL_TYPE is missing');
    });

    it('仅OpenAI配置应返回Anthropic相关警告', () => {
      process.env.OPENAI_API_KEY = 'sk-test-key-123';
      process.env.AI_MODEL_TYPE = 'gpt-4';

      const errors = validateAIEnvironment();
      expect(errors).toHaveLength(1);
      expect(errors).toContain('Anthropic service may not be available - ANTHROPIC_API_KEY is missing');
    });

    it('仅Anthropic配置应返回OpenAI相关警告', () => {
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key-456';
      process.env.AI_MODEL_TYPE = 'claude-3';

      const errors = validateAIEnvironment();
      expect(errors).toHaveLength(1);
      expect(errors).toContain('OpenAI service may not be available - OPENAI_API_KEY is missing');
    });

    it('缺失AI_MODEL_TYPE时应报错', () => {
      process.env.OPENAI_API_KEY = 'sk-test-key-123';
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key-456';

      const errors = validateAIEnvironment();
      expect(errors).toContain('Anthropic service may not be available - AI_MODEL_TYPE is missing');
      expect(errors).toHaveLength(1);
    });

    it('缺失所有AI变量时应返回完整警告列表', () => {
      const errors = validateAIEnvironment();
      expect(errors).toHaveLength(3);
      expect(errors).toContain('OpenAI service may not be available - OPENAI_API_KEY is missing');
      expect(errors).toContain('Anthropic service may not be available - ANTHROPIC_API_KEY is missing');
      expect(errors).toContain('Anthropic service may not be available - AI_MODEL_TYPE is missing');
    });

    it('空字符串AI变量应报错', () => {
      process.env.OPENAI_API_KEY = '';
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key-456';
      process.env.AI_MODEL_TYPE = 'gpt-4';

      const errors = validateAIEnvironment();
      expect(errors).toContain('OpenAI service may not be available - OPENAI_API_KEY is missing');
      expect(errors).toHaveLength(1);
    });

    it('edge case: 仅设置AI_MODEL_TYPE应返回两个服务警告', () => {
      process.env.AI_MODEL_TYPE = 'gpt-4';

      const errors = validateAIEnvironment();
      expect(errors).toHaveLength(2);
      expect(errors).toContain('OpenAI service may not be available - OPENAI_API_KEY is missing');
      expect(errors).toContain('Anthropic service may not be available - ANTHROPIC_API_KEY is missing');
    });

    it('edge case: 空字符串AI_MODEL_TYPE应报错', () => {
      process.env.OPENAI_API_KEY = 'sk-test-key-123';
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key-456';
      process.env.AI_MODEL_TYPE = '';

      const errors = validateAIEnvironment();
      expect(errors).toContain('Anthropic service may not be available - AI_MODEL_TYPE is missing');
      expect(errors).toHaveLength(1);
    });

    it('edge case: AI_MODEL_TYPE为其他有效值应通过', () => {
      process.env.OPENAI_API_KEY = 'sk-test-key-123';
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key-456';
      process.env.AI_MODEL_TYPE = 'claude-3-haiku';

      const errors = validateAIEnvironment();
      expect(errors).toHaveLength(0);
    });
  });

  describe('组合环境验证', () => {
    it('所有环境验证组合应正常工作', () => {
      // 设置所有类型的环境变量
      process.env.NODE_ENV = 'production';
      process.env.PORT = '3000';
      process.env.JWT_SECRET = 'test-secret-key';
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
      process.env.DATABASE_USERNAME = 'admin';
      process.env.DATABASE_PASSWORD = 'secure-password';
      process.env.OPENAI_API_KEY = 'sk-test-key-123';
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key-456';
      process.env.AI_MODEL_TYPE = 'gpt-4';

      const envErrors = validateEnvironmentVariables();
      const dbErrors = validateDatabaseEnvironment();
      const aiErrors = validateAIEnvironment();

      expect(envErrors).toHaveLength(0);
      expect(dbErrors).toHaveLength(0);
      expect(aiErrors).toHaveLength(0);
    });

    it('部分配置缺失时应返回相应错误', () => {
      // 只设置基本环境变量
      process.env.NODE_ENV = 'production';
      process.env.PORT = '3000';
      process.env.JWT_SECRET = 'test-secret-key';

      const envErrors = validateEnvironmentVariables();
      const dbErrors = validateDatabaseEnvironment();
      const aiErrors = validateAIEnvironment();

      expect(envErrors).toHaveLength(0);
      expect(dbErrors).toHaveLength(3);
      expect(aiErrors).toHaveLength(3);
    });

    it('完全缺失配置时应返回所有错误', () => {
      // 不设置任何环境变量
      const envErrors = validateEnvironmentVariables();
      const dbErrors = validateDatabaseEnvironment();
      const aiErrors = validateAIEnvironment();

      expect(envErrors).toHaveLength(3);
      expect(dbErrors).toHaveLength(3);
      expect(aiErrors).toHaveLength(3);
      expect(envErrors.concat(dbErrors, aiErrors)).toHaveLength(9);
    });

    it('开发环境配置示例应通过验证', () => {
      // 开发环境典型配置
      process.env.NODE_ENV = 'development';
      process.env.PORT = '3001';
      process.env.JWT_SECRET = 'dev-jwt-secret';
      process.env.DATABASE_URL = 'sqlite:./dev.db';
      // 数据库用户名密码在开发环境可能不需要
      process.env.OPENAI_API_KEY = 'sk-dev-key';
      // AI服务配置可以部分缺失
      process.env.AI_MODEL_TYPE = 'gpt-3.5-turbo';

      const envErrors = validateEnvironmentVariables();
      const dbErrors = validateDatabaseEnvironment();
      const aiErrors = validateAIEnvironment();

      expect(envErrors).toHaveLength(0);
      expect(dbErrors).toHaveLength(0); // sqlite只需要URL
      expect(aiErrors).toHaveLength(1); // Anthropic API Key缺失
    });
  });

  describe('边界条件和特殊情况', () => {
    it('空环境对象应返回所有错误', () => {
      // 临时清空所有环境变量
      const originalEnv = process.env;
      process.env = {} as any;

      const envErrors = validateEnvironmentVariables();
      const dbErrors = validateDatabaseEnvironment();
      const aiErrors = validateAIEnvironment();

      expect(envErrors).toHaveLength(3);
      expect(dbErrors).toHaveLength(3);
      expect(aiErrors).toHaveLength(3);

      // 恢复环境变量
      process.env = originalEnv;
    });

    it('环境变量包含特殊字符应正常工作', () => {
      process.env.NODE_ENV = 'production!';
      process.env.PORT = '3000';
      process.env.JWT_SECRET = 'secret-key-with_special-chars_123';

      const errors = validateEnvironmentVariables();
      expect(errors).toHaveLength(0);
    });

    it('超长环境变量值应正常工作', () => {
      process.env.NODE_ENV = 'production';
      process.env.PORT = '3000';
      process.env.JWT_SECRET = 'a'.repeat(1000);

      const errors = validateEnvironmentVariables();
      expect(errors).toHaveLength(0);
    });

    it('数字类型环境变量值应正常工作', () => {
      process.env.NODE_ENV = 'production';
      process.env.PORT = '3000';
      process.env.JWT_SECRET = '1234567890';

      const errors = validateEnvironmentVariables();
      expect(errors).toHaveLength(0);
    });
  });
});