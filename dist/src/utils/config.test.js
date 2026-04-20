import { describe, it, expect } from 'jest';
import { createConfig, validateConfig, getAIProviderConfig, isAIProviderAvailable, getAvailableAIProviders } from './config';
describe('Configuration Management', () => {
    beforeEach(() => {
        delete process.env.OPENAI_API_KEY;
        delete process.env.ANTHROPIC_API_KEY;
        delete process.env.GOOGLE_AI_API_KEY;
    });
    describe('createConfig', () => {
        it('should create configuration with default values', () => {
            const config = createConfig();
            expect(config.port).toBe(3000);
            expect(config.host).toBe('localhost');
            expect(config.database.provider).toBe('sqlite');
            expect(config.ai.openai.model).toBe('gpt-4');
            expect(config.auth.jwtExpiry).toBe('24h');
            expect(config.logging.level).toBe('info');
            expect(config.cache.provider).toBe('memory');
        });
        it('should override defaults with environment variables', () => {
            process.env.PORT = '8080';
            process.env.HOST = '0.0.0.0';
            process.env.OPENAI_API_KEY = 'test-key';
            process.env.LOG_LEVEL = 'debug';
            const config = createConfig();
            expect(config.port).toBe(8080);
            expect(config.host).toBe('0.0.0.0');
            expect(config.logging.level).toBe('debug');
            expect(isAIProviderAvailable('openai')).toBe(true);
        });
        it('should handle partial environment configuration', () => {
            process.env.OPENAI_API_KEY = 'test-key';
            process.env.LOG_LEVEL = 'error';
            const config = createConfig();
            expect(isAIProviderAvailable('openai')).toBe(true);
            expect(isAIProviderAvailable('anthropic')).toBe(false);
            expect(isAIProviderAvailable('google')).toBe(false);
            expect(config.logging.level).toBe('error');
        });
    });
    describe('validateConfig', () => {
        it('should validate correct configuration', () => {
            const config = createConfig();
            const validated = validateConfig(config);
            expect(validated).toEqual(config);
        });
        it('should reject invalid port number', () => {
            expect(() => {
                validateConfig({ port: 70000 });
            }).toThrow();
        });
        it('should reject invalid logging level', () => {
            expect(() => {
                validateConfig({ logging: { level: 'invalid' } });
            }).toThrow();
        });
        it('should reject invalid database provider', () => {
            expect(() => {
                validateConfig({ database: { provider: 'invalid', url: 'test-url', maxConnections: 5 } });
            }).toThrow();
        });
    });
    describe('AI Provider Management', () => {
        it('should return empty array when no AI providers are configured', () => {
            expect(getAvailableAIProviders()).toEqual([]);
        });
        it('should return available AI providers', () => {
            process.env.OPENAI_API_KEY = 'openai-key';
            process.env.ANTHROPIC_API_KEY = 'anthropic-key';
            const available = getAvailableAIProviders();
            expect(available).toContain('openai');
            expect(available).toContain('anthropic');
            expect(available).not.toContain('google');
        });
        it('should get AI provider configuration', () => {
            process.env.OPENAI_API_KEY = 'test-key';
            process.env.OPENAI_MODEL = 'gpt-3.5-turbo';
            const openaiConfig = getAIProviderConfig('openai');
            expect(openaiConfig.apiKey).toBe('test-key');
            expect(openaiConfig.model).toBe('gpt-3.5-turbo');
            expect(openaiConfig.maxTokens).toBe(2000);
        });
        it('should check AI provider availability', () => {
            expect(isAIProviderAvailable('openai')).toBe(false);
            expect(isAIProviderAvailable('anthropic')).toBe(false);
            expect(isAIProviderAvailable('google')).toBe(false);
            process.env.OPENAI_API_KEY = 'test-key';
            expect(isAIProviderAvailable('openai')).toBe(true);
        });
    });
    describe('Configuration Edge Cases', () => {
        it('should handle missing JWT secret gracefully', () => {
            process.env.JWT_SECRET = '';
            const config = createConfig();
            expect(config.auth.jwtSecret).toContain('your-secret-key');
        });
        it('should handle negative cache TTL gracefully', () => {
            process.env.CACHE_TTL = '-1';
            const config = createConfig();
            expect(config.cache.ttl).toBeGreaterThan(0);
        });
        it('should handle database URL properly', () => {
            process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
            const config = createConfig();
            expect(config.database.url).toBe('postgresql://user:pass@localhost:5432/db');
            expect(config.database.provider).toBe('postgresql');
        });
    });
});
//# sourceMappingURL=config.test.js.map