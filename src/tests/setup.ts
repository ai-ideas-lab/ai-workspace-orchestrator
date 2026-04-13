/**
 * Jest Test Setup - Jest测试配置文件
 * 
 * 提供统一的测试环境配置和工具函数
 */

import { jest } from '@jest/globals';
import { EventEmitter } from 'events';

// 模拟环境变量
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';

// 模拟数据库连接
jest.mock('../database/index', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    workflow: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    workflowExecution: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $transaction: jest.fn(),
  }
}));

// 模拟事件总线
jest.mock('../services/event-bus.ts', () => ({
  EventBus: jest.fn().mockImplementation(() => ({
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    once: jest.fn(),
    removeAllListeners: jest.fn(),
    shutdown: jest.fn(),
  }))
}));

// 模拟日志器
jest.mock('../utils/logger.ts', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  }
}));

// 全局测试工具
export const TestUtils = {
  /**
   * 创建模拟的用户数据
   */
  createUser: (overrides = {}) => ({
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  /**
   * 创建模拟的工作流数据
   */
  createWorkflow: (overrides = {}) => ({
    id: 'workflow-123',
    name: 'Test Workflow',
    description: 'Test workflow description',
    config: { steps: [] },
    status: 'ACTIVE',
    variables: {},
    userId: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  /**
   * 创建模拟的执行数据
   */
  createExecution: (overrides = {}) => ({
    id: 'execution-123',
    workflowId: 'workflow-123',
    status: 'PENDING',
    inputVariables: {},
    outputVariables: {},
    startTime: new Date(),
    endTime: null,
    duration: null,
    ...overrides,
  }),

  /**
   * 创建模拟的请求对象
   */
  createMockRequest: (overrides = {}) => ({
    method: 'GET',
    url: '/test',
    originalUrl: '/test',
    path: '/test',
    params: {},
    query: {},
    body: {},
    headers: {
      'content-type': 'application/json',
      'user-agent': 'test-agent',
    },
    ip: '127.0.0.1',
    get: jest.fn((header) => {
      const headers: Record<string, string> = {
        'content-type': 'application/json',
        'user-agent': 'test-agent',
        'authorization': 'Bearer token',
      };
      return headers[header] || '';
    }),
    ...overrides,
  }),

  /**
   * 创建模拟的响应对象
   */
  createMockResponse: (overrides = {}) => {
    const response: any = {
      statusCode: 200,
      locals: {},
      headers: {},
      getHeader: jest.fn(() => null),
      setHeader: jest.fn(),
      status: jest.fn(function(this: any, code) {
        this.statusCode = code;
        return this;
      }),
      json: jest.fn(),
      send: jest.fn(),
      end: jest.fn(),
      ...overrides,
    };
    return response;
  },

  /**
   * 创建模拟的Next函数
   */
  createMockNext = () => jest.fn(),

  /**
   * 等待指定毫秒
   */
  wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

  /**
   * 生成测试UUID
   */
  generateTestUuid: () => `test-uuid-${Math.random().toString(36).substr(2, 9)}`,

  /**
   * 创建模拟的数据库错误
   */
  createDatabaseError: (code: string, meta: any = {}) => ({
    code,
    meta,
    message: `Database error with code ${code}`,
    stack: 'Error: Database error\n    at test',
  }),

  /**
   * 创建模拟的异步函数
   */
  createAsyncFunction: (shouldFail = false, delay = 100) => 
    async (...args: any[]) => {
      await TestUtils.wait(delay);
      if (shouldFail) {
        throw new Error('Async function failed');
      }
      return { success: true, args };
    },
};

// 全局测试beforeEach和afterEach
beforeEach(() => {
  // 重置所有模拟函数
  jest.clearAllMocks();
});

afterEach(() => {
  // 清理定时器
  jest.useFakeTimers().clearAllTimers();
});

// 全局测试超时设置
jest.setTimeout(30000);

// 导出全局的jest匹配器
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveStatusCode(expected: number): R;
      toHaveErrorCode(expected: string): R;
      toHaveUserMessage(expected: string): R;
      toBeOperationalError(): R;
      toBeSystemError(): R;
    }
  }
}

// 扩展Jest匹配器
expect.extend({
  toHaveStatusCode(received, expected) {
    const pass = received.statusCode === expected;
    return {
      pass,
      message: () => `Expected status code ${received.statusCode} to be ${expected}`,
    };
  },
  toHaveErrorCode(received, expected) {
    const pass = received.body?.error?.code === expected;
    return {
      pass,
      message: () => `Expected error code ${received.body?.error?.code} to be ${expected}`,
    };
  },
  toHaveUserMessage(received, expected) {
    const pass = received.body?.error?.message === expected;
    return {
      pass,
      message: () => `Expected user message ${received.body?.error?.message} to be ${expected}`,
    };
  },
  toBeOperationalError(received) {
    const pass = received.body?.error?.isOperational === true;
    return {
      pass,
      message: () => `Expected error to be operational`,
    };
  },
  toBeSystemError(received) {
    const pass = received.body?.error?.isOperational === false;
    return {
      pass,
      message: () => `Expected error to be system error`,
    };
  },
});