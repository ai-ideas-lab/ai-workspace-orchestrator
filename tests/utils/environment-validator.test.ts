import { validateEnvironmentVariables, validateDatabaseEnvironment, validateAIEnvironment } from '../src/utils/environment-validator';

describe('EnvironmentValidator', () => {
  describe('validateEnvironmentVariables', () => {
    beforeEach(() => {
      // 清理环境变量
      delete process.env.NODE_ENV;
      delete process.env.PORT;
      delete process.env.JWT_SECRET;
    });

    it('应该返回空数组当所有必需环境变量都存在时', () => {
      process.env.NODE_ENV = 'test';
      process.env.PORT = '3000';
      process.env.JWT_SECRET = 'secret-key';
      
      const errors = validateEnvironmentVariables();
      expect(errors).toEqual([]);
    });

    it('应该检测缺少的 NODE_ENV 环境变量', () => {
      process.env.PORT = '3000';
      process.env.JWT_SECRET = 'secret-key';
      
      const errors = validateEnvironmentVariables();
      expect(errors).toContain('NODE_ENV is required');
    });

    it('应该检测缺少的 PORT 环境变量', () => {
      process.env.NODE_ENV = 'test';
      process.env.JWT_SECRET = 'secret-key';
      
      const errors = validateEnvironmentVariables();
      expect(errors).toContain('PORT is required');
    });

    it('应该检测缺少的 JWT_SECRET 环境变量', () => {
      process.env.NODE_ENV = 'test';
      process.env.PORT = '3000';
      
      const errors = validateEnvironmentVariables();
      expect(errors).toContain('JWT_SECRET is required');
    });

    it('应该检测所有缺少的环境变量', () => {
      const errors = validateEnvironmentVariables();
      expect(errors).toEqual([
        'NODE_ENV is required',
        'PORT is required',
        'JWT_SECRET is required'
      ]);
    });

    it('应该正确处理空字符串环境变量', () => {
      process.env.NODE_ENV = '';
      process.env.PORT = '3000';
      process.env.JWT_SECRET = 'secret-key';
      
      const errors = validateEnvironmentVariables();
      expect(errors).toContain('NODE_ENV is required');
    });

    it('应该正确处理只有空格的环境变量', () => {
      process.env.NODE_ENV = '   ';
      process.env.PORT = '3000';
      process.env.JWT_SECRET = 'secret-key';
      
      const errors = validateEnvironmentVariables();
      expect(errors).toContain('NODE_ENV is required');
    });
  });

  describe('validateDatabaseEnvironment', () => {
    beforeEach(() => {
      // 清理数据库环境变量
      delete process.env.DATABASE_URL;
      delete process.env.DATABASE_USERNAME;
      delete process.env.DATABASE_PASSWORD;
    });

    it('应该返回空数组当所有数据库环境变量都存在时', () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
      process.env.DATABASE_USERNAME = 'user';
      process.env.DATABASE_PASSWORD = 'password';
      
      const errors = validateDatabaseEnvironment();
      expect(errors).toEqual([]);
    });

    it('应该检测缺少的 DATABASE_URL 环境变量', () => {
      process.env.DATABASE_USERNAME = 'user';
      process.env.DATABASE_PASSWORD = 'password';
      
      const errors = validateDatabaseEnvironment();
      expect(errors).toContain('DATABASE_URL is required for database connection');
    });

    it('应该检测缺少的 DATABASE_USERNAME 环境变量', () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
      process.env.DATABASE_PASSWORD = 'password';
      
      const errors = validateDatabaseEnvironment();
      expect(errors).toContain('DATABASE_USERNAME is required for database connection');
    });

    it('应该检测缺少的 DATABASE_PASSWORD 环境变量', () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
      process.env.DATABASE_USERNAME = 'user';
      
      const errors = validateDatabaseEnvironment();
      expect(errors).toContain('DATABASE_PASSWORD is required for database connection');
    });

    it('应该检测所有缺少的数据库环境变量', () => {
      const errors = validateDatabaseEnvironment();
      expect(errors).toEqual([
        'DATABASE_URL is required for database connection',
        'DATABASE_USERNAME is required for database connection',
        'DATABASE_PASSWORD is required for database connection'
      ]);
    });
  });

  describe('validateAIEnvironment', () => {
    beforeEach(() => {
      // 清理AI环境变量
      delete process.env.OPENAI_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;
      delete process.env.AI_MODEL_TYPE;
    });

    it('应该返回空数组当所有AI环境变量都存在时', () => {
      process.env.OPENAI_API_KEY = 'sk-test';
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
      process.env.AI_MODEL_TYPE = 'gpt-4';
      
      const errors = validateAIEnvironment();
      expect(errors).toEqual([]);
    });

    it('应该温和地提示OpenAI服务不可用当缺少OPENAI_API_KEY时', () => {
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
      process.env.AI_MODEL_TYPE = 'claude-3';
      
      const errors = validateAIEnvironment();
      expect(errors).toContain('OpenAI service may not be available - OPENAI_API_KEY is missing');
    });

    it('应该温和地提示Anthropic服务不可用当缺少ANTHROPIC_API_KEY时', () => {
      process.env.OPENAI_API_KEY = 'sk-test';
      process.env.AI_MODEL_TYPE = 'gpt-4';
      
      const errors = validateAIEnvironment();
      expect(errors).toContain('Anthropic service may not be available - ANTHROPIC_API_KEY is missing');
    });

    it('应该检测缺少的 AI_MODEL_TYPE 环境变量', () => {
      process.env.OPENAI_API_KEY = 'sk-test';
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
      
      const errors = validateAIEnvironment();
      expect(errors).toContain('AI service may not be available - AI_MODEL_TYPE is missing');
    });

    it('应该检测所有缺少的AI环境变量', () => {
      const errors = validateAIEnvironment();
      expect(errors).toEqual([
        'OpenAI service may not be available - OPENAI_API_KEY is missing',
        'Anthropic service may not be available - ANTHROPIC_API_KEY is missing',
        'AI service may not be available - AI_MODEL_TYPE is missing'
      ]);
    });

    it('应该正确处理部分AI服务配置缺失的情况', () => {
      process.env.OPENAI_API_KEY = 'sk-test';
      
      const errors = validateAIEnvironment();
      expect(errors).toEqual([
        'Anthropic service may not be available - ANTHROPIC_API_KEY is missing',
        'AI service may not be available - AI_MODEL_TYPE is missing'
      ]);
    });
  });

  describe('集成测试 - 所有验证函数组合', () => {
    it('应该正确组合所有环境变量验证结果', () => {
      // 设置正确的环境变量
      process.env.NODE_ENV = 'test';
      process.env.PORT = '3000';
      process.env.JWT_SECRET = 'secret-key';
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
      process.env.DATABASE_USERNAME = 'user';
      process.env.DATABASE_PASSWORD = 'password';
      process.env.OPENAI_API_KEY = 'sk-test';
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
      process.env.AI_MODEL_TYPE = 'gpt-4';
      
      const envErrors = validateEnvironmentVariables();
      const dbErrors = validateDatabaseEnvironment();
      const aiErrors = validateAIEnvironment();
      
      expect(envErrors).toEqual([]);
      expect(dbErrors).toEqual([]);
      expect(aiErrors).toEqual([]);
    });

    it('应该正确识别所有类型的环境变量错误', () => {
      // 清理所有环境变量
      delete process.env.NODE_ENV;
      delete process.env.PORT;
      delete process.env.JWT_SECRET;
      delete process.env.DATABASE_URL;
      delete process.env.DATABASE_USERNAME;
      delete process.env.DATABASE_PASSWORD;
      delete process.env.OPENAI_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;
      delete process.env.AI_MODEL_TYPE;
      
      const envErrors = validateEnvironmentVariables();
      const dbErrors = validateDatabaseEnvironment();
      const aiErrors = validateAIEnvironment();
      
      expect(envErrors.length).toBe(3);
      expect(dbErrors.length).toBe(3);
      expect(aiErrors.length).toBe(3);
    });
  });
});