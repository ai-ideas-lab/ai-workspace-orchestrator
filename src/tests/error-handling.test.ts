/**
 * Error Handling Integration Tests - 错误处理集成测试
 * 
 * 测试全局错误处理、数据库错误、异步错误处理等核心功能
 */

import request from 'supertest';
import { app } from '../server.js';
import { DatabaseErrorHandler } from '../utils/database-error-handler.js';
import { AsyncErrorHandler } from '../utils/async-error-handler.js';
import { AppError, ValidationError, DatabaseError, SystemError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

describe('Error Handling Integration Tests', () => {
  describe('Global Error Handler', () => {
    test('should handle synchronous errors', async () => {
      const router = require('express').Router();
      
      router.get('/sync-error', (req, res) => {
        throw new Error('同步错误测试');
      });

      app.use('/test', router);

      const response = await request(app)
        .get('/test/sync-error')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INTERNAL_ERROR');
      expect(response.body.error.message).toBe('服务器内部错误');
      expect(response.body.error.requestId).toBeDefined();
    });

    test('should handle async errors', async () => {
      const router = require('express').Router();
      
      router.get('/async-error', async (req, res) => {
        await new Promise((_, reject) => {
          setTimeout(() => reject(new Error('异步错误测试')), 100);
        });
      });

      app.use('/test', router);

      const response = await request(app)
        .get('/test/async-error')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INTERNAL_ERROR');
      expect(response.body.error.requestId).toBeDefined();
    });

    test('should handle 404 errors', async () => {
      const response = await request(app)
        .get('/nonexistent-route')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
      expect(response.body.error.message).toContain('不存在');
      expect(response.body.error.requestId).toBeDefined();
    });
  });

  describe('Custom Error Classes', () => {
    test('should handle ValidationError', async () => {
      const router = require('express').Router();
      
      router.get('/validation-error', (req, res) => {
        throw new ValidationError('验证失败', 'email', { provided: 'invalid-email' });
      });

      app.use('/test', router);

      const response = await request(app)
        .get('/test/validation-error')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toBe('验证失败');
      expect(response.body.error.details).toEqual({
        field: 'email',
        provided: 'invalid-email'
      });
    });

    test('should handle DatabaseError', async () => {
      const router = require('express').Router();
      
      router.get('/database-error', (req, res) => {
        throw new DatabaseError('数据库连接失败', { table: 'users' });
      });

      app.use('/test', router);

      const response = await request(app)
        .get('/test/database-error')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('DATABASE_ERROR');
      expect(response.body.error.message).toBe('数据库连接失败');
      expect(response.body.error.details).toEqual({ table: 'users' });
    });

    test('should handle SystemError', async () => {
      const router = require('express').Router();
      
      router.get('/system-error', (req, res) => {
        throw new SystemError('系统服务不可用', 'external-api');
      });

      app.use('/test', router);

      const response = await request(app)
        .get('/test/system-error')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SYSTEM_ERROR');
      expect(response.body.error.message).toBe('[external-api] 系统服务不可用');
    });
  });

  describe('Request ID Tracking', () => {
    test('should include request ID in responses', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.requestId).toBeDefined();
      expect(typeof response.body.requestId).toBe('string');
      expect(response.body.requestId.length).toBeGreaterThan(0);
    });

    test('should include request ID in error responses', async () => {
      const response = await request(app)
        .get('/nonexistent-route')
        .expect(404);

      expect(response.body.error.requestId).toBeDefined();
      expect(typeof response.body.error.requestId).toBe('string');
    });
  });

  describe('Database Error Handler', () => {
    test('should handle Prisma unique constraint violation', () => {
      const mockError = {
        code: 'P2002',
        meta: { target: ['email'] },
        message: 'Unique constraint failed'
      };

      const context = {
        operation: 'createUser',
        table: 'users',
        userId: 'user123'
      };

      const error = DatabaseErrorHandler.handlePrismaError(mockError, context);
      
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.statusCode).toBe(400);
      expect(error.errorCode).toBe('VALIDATION_ERROR');
      expect(error.message).toBe('email已存在，请使用其他值');
      expect(error.details).toEqual({
        code: 'P2002',
        table: 'users',
        target: ['email']
      });
    });

    test('should handle Prisma foreign key constraint violation', () => {
      const mockError = {
        code: 'P2003',
        meta: { field_name: 'authorId' },
        message: 'Foreign key constraint failed'
      };

      const context = {
        operation: 'createPost',
        table: 'posts',
        userId: 'user123'
      };

      const error = DatabaseErrorHandler.handlePrismaError(mockError, context);
      
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.statusCode).toBe(400);
      expect(error.errorCode).toBe('VALIDATION_ERROR');
      expect(error.message).toBe('关联的authorId不存在');
    });

    test('should handle Prisma record not found', () => {
      const mockError = {
        code: 'P2025',
        meta: { model_name: 'User' },
        message: 'Record not found'
      };

      const context = {
        operation: 'getUser',
        table: 'users',
        userId: 'user123'
      };

      const error = DatabaseErrorHandler.handlePrismaError(mockError, context);
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(404);
      expect(error.errorCode).toBe('RECORD_NOT_FOUND');
      expect(error.message).toBe('User不存在');
    });

    test('should handle unknown database errors', () => {
      const mockError = new Error('Unknown database error');
      
      const context = {
        operation: 'unknownOperation',
        table: 'unknown_table',
        userId: 'user123'
      };

      const error = DatabaseErrorHandler.handlePrismaError(mockError, context);
      
      expect(error).toBeInstanceOf(DatabaseError);
      expect(error.statusCode).toBe(500);
      expect(error.errorCode).toBe('DATABASE_ERROR');
      expect(error.message).toBe('数据库操作失败: Unknown database error');
    });
  });

  describe('Async Error Handler', () => {
    test('should handle async operation with retry', async () => {
      let attemptCount = 0;
      
      const mockAsyncOperation = async () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Temporary failure');
        }
        return 'success';
      };

      const context = {
        operation: 'testRetry',
        userId: 'user123'
      };

      const errorHandler = new AsyncErrorHandler();
      
      const result = await errorHandler.executeWithRetry(
        mockAsyncOperation,
        context,
        {
          maxRetries: 5,
          retryCondition: (error) => error.message === 'Temporary failure'
        }
      );

      expect(result).toBe('success');
      expect(attemptCount).toBe(3);
    });

    test('should handle async operation timeout', async () => {
      const slowOperation = async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
        return 'too slow';
      };

      const context = {
        operation: 'testTimeout',
        userId: 'user123'
      };

      const errorHandler = new AsyncErrorHandler();
      
      await expect(
        errorHandler.executeWithTimeout(slowOperation, 100, context)
      ).rejects.toThrow('操作超时');
    });

    test('should handle async operation partial failure', async () => {
      const operations = [
        { id: '1', operation: async () => 'success1' },
        { id: '2', operation: async () => { throw new Error('failure2'); } },
        { id: '3', operation: async () => 'success3' },
        { id: '4', operation: async () => { throw new Error('failure4'); } },
      ];

      const context = {
        operation: 'testPartialFailure',
        userId: 'user123'
      };

      const errorHandler = new AsyncErrorHandler();
      
      const result = await errorHandler.executeBatchWithPartialFailure(
        operations,
        context
      );

      expect(result.successes).toHaveLength(2);
      expect(result.failures).toHaveLength(2);
      expect(result.successes.map(s => s.id)).toEqual(['1', '3']);
      expect(result.failures.map(f => f.id)).toEqual(['2', '4']);
    });
  });

  describe('Error Logging', () => {
    test('should log errors with proper context', async () => {
      // 重写logger.error来捕获日志
      let loggedErrors: any[] = [];
      const originalError = logger.error;
      
      logger.error = (...args: any[]) => {
        loggedErrors.push(args);
      };

      try {
        const router = require('express').Router();
        
        router.get('/log-error', (req, res) => {
          throw new Error('测试日志记录');
        });

        app.use('/test', router);

        await request(app)
          .get('/test/log-error')
          .expect(500);

        expect(loggedErrors.length).toBeGreaterThan(0);
        expect(loggedErrors[0]).toContain('业务逻辑错误:' || '系统错误:');
      } finally {
        logger.error = originalError;
      }
    });

    test('should include request context in error logs', async () => {
      // 重写logger.error来捕获日志
      let loggedErrors: any[] = [];
      const originalError = logger.error;
      
      logger.error = (...args: any[]) => {
        loggedErrors.push(args);
      };

      try {
        const response = await request(app)
          .get('/nonexistent-route')
          .expect(404);

        expect(loggedErrors.length).toBeGreaterThan(0);
        
        // 检查日志中是否包含请求上下文
        const logString = loggedErrors[0].join(' ');
        expect(logString).toContain('/nonexistent-route');
        expect(logString).toContain('GET');
      } finally {
        logger.error = originalError;
      }
    });
  });

  describe('Performance', () => {
    test('should handle concurrent error requests without performance degradation', async () => {
      const startTime = Date.now();
      const concurrentRequests = 10;

      // 创建一个会抛出错误的端点
      const router = require('express').Router();
      
      router.get('/concurrent-error', (req, res) => {
        throw new Error('并发错误测试');
      });

      app.use('/test', router);

      // 发送并发请求
      const requests = Array(concurrentRequests).fill(null).map(() =>
        request(app).get('/test/concurrent-error').expect(500)
      );

      await Promise.all(requests);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // 所有请求应该在1秒内完成
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Edge Cases', () => {
    test('should handle JSON parsing errors', async () => {
      const response = await request(app)
        .post('/api/workflows')
        .set('Content-Type', 'application/json')
        .send('invalid json {')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('should handle large payload errors', async () => {
      const largePayload = { data: 'x'.repeat(11 * 1024 * 1024) }; // 11MB
        
      const response = await request(app)
        .post('/api/workflows')
        .set('Content-Type', 'application/json')
        .send(largePayload)
        .expect(413);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PAYLOAD_TOO_LARGE');
    });

    test('should handle rate limiting errors', async () => {
      // 测试速率限制（如果有配置的话）
      // 这里假设有一个需要速率限制的端点
      const response = await request(app)
        .get('/api/workflows')
        .set('X-Forwarded-For', '192.168.1.1')
        .expect(429);

      if (response.statusCode === 429) {
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('RATE_LIMIT_ERROR');
      }
    });
  });
});