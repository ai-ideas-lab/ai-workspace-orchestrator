/**
 * CircuitBreaker 测试文件
 * 
 * 测试熔断器的核心功能：状态管理、请求控制、失败计数、状态转换等
 */

import { CircuitBreaker, CircuitState } from '../circuit-breaker';

describe('CircuitBreaker', () => {
  let breaker: CircuitBreaker;

  beforeEach(() => {
    // 使用默认配置进行测试
    breaker = new CircuitBreaker();
  });

  describe('构造函数', () => {
    test('应该使用默认配置创建熔断器', () => {
      const defaultBreaker = new CircuitBreaker();
      expect(defaultBreaker.getState('engine-1')).toBe(CircuitState.CLOSED);
    });

    test('应该使用自定义配置创建熔断器', () => {
      const customBreaker = new CircuitBreaker({
        failureThreshold: 3,
        resetTimeoutMs: 1000,
        halfOpenMaxAttempts: 2
      });
      expect(customBreaker.getState('engine-1')).toBe(CircuitState.CLOSED);
    });

    test('应该处理部分配置（缺失字段）', () => {
      const partialConfigBreaker = new CircuitBreaker({
        failureThreshold: 10
      });
      expect(partialConfigBreaker.getState('engine-1')).toBe(CircuitState.CLOSED);
    });
  });

  describe('allowRequest - 请求控制', () => {
    test('初始状态应该是 CLOSED，应该允许请求', () => {
      const canRequest = breaker.allowRequest('engine-1');
      expect(canRequest).toBe(true);
    });

    test('CLOSED 状态应该允许请求', () => {
      // 确保是 CLOSED 状态
      expect(breaker.getState('engine-1')).toBe(CircuitState.CLOSED);
      
      const canRequest = breaker.allowRequest('engine-1');
      expect(canRequest).toBe(true);
    });

    test('OPEN 状态应该拒绝请求', () => {
      // 手动设置 OPEN 状态（通过多次失败）
      breaker.recordFailure('engine-1');
      breaker.recordFailure('engine-1');
      breaker.recordFailure('engine-1');
      breaker.recordFailure('engine-1');
      breaker.recordFailure('engine-1'); // 触发熔断

      expect(breaker.getState('engine-1')).toBe(CircuitState.OPEN);
      
      const canRequest = breaker.allowRequest('engine-1');
      expect(canRequest).toBe(false);
    });

    test('HALF_OPEN 状态应该允许有限数量的请求', () => {
      // 设置为 HALF_OPEN 状态
      const circuit = (breaker as any).getOrCreate('engine-1');
      circuit.state = CircuitState.HALF_OPEN;
      circuit.halfOpenAttempts = 0;

      // 第一次请求应该被允许
      expect(breaker.allowRequest('engine-1')).toBe(true);
      expect(circuit.halfOpenAttempts).toBe(1);

      // 第二次请求应该被拒绝（默认配置下只允许1次）
      expect(breaker.allowRequest('engine-1')).toBe(false);
    });

    test('HALF_OPEN 状态在自定义配置下允许多次请求', () => {
      const customBreaker = new CircuitBreaker({
        halfOpenMaxAttempts: 3
      });

      // 设置为 HALF_OPEN 状态
      const circuit = (customBreaker as any).getOrCreate('engine-1');
      circuit.state = CircuitState.HALF_OPEN;
      circuit.halfOpenAttempts = 0;

      // 应该允许3次请求
      expect(customBreaker.allowRequest('engine-1')).toBe(true);
      expect(customBreaker.allowRequest('engine-1')).toBe(true);
      expect(customBreaker.allowRequest('engine-1')).toBe(true);
      
      // 第四次请求应该被拒绝
      expect(customBreaker.allowRequest('engine-1')).toBe(false);
    });

    test('OPEN 状态超时后应该自动转换为 HALF_OPEN', () => {
      // 设置 OPEN 状态
      const circuit = (breaker as any).getOrCreate('engine-1');
      circuit.state = CircuitState.OPEN;
      circuit.openedAt = Date.now();

      // 快速超时测试（设置很短的超时时间）
      const shortTimeoutBreaker = new CircuitBreaker({
        resetTimeoutMs: 1 // 1ms
      });
      
      const shortCircuit = (shortTimeoutBreaker as any).getOrCreate('engine-1');
      shortCircuit.state = CircuitState.OPEN;
      shortCircuit.openedAt = Date.now();

      // 等待超时
      setTimeout(() => {
        expect(shortTimeoutBreaker.allowRequest('engine-1')).toBe(true);
        expect(shortCircuit.state).toBe(CircuitState.HALF_OPEN);
      }, 10);
    });
  });

  describe('状态管理', () => {
    test('getState 应该返回正确的状态', () => {
      expect(breaker.getState('engine-1')).toBe(CircuitState.CLOSED);
      
      // 记录失败触发熔断
      breaker.recordFailure('engine-1');
      breaker.recordFailure('engine-1');
      breaker.recordFailure('engine-1');
      breaker.recordFailure('engine-1');
      breaker.recordFailure('engine-1');

      expect(breaker.getState('engine-1')).toBe(CircuitState.OPEN);
    });

    test('多个引擎应该有独立的状态', () => {
      // engine-1 失败触发熔断
      breaker.recordFailure('engine-1');
      breaker.recordFailure('engine-1');
      breaker.recordFailure('engine-1');
      breaker.recordFailure('engine-1');
      breaker.recordFailure('engine-1');

      expect(breaker.getState('engine-1')).toBe(CircuitState.OPEN);
      expect(breaker.getState('engine-2')).toBe(CircuitState.CLOSED);
    });
  });

  describe('成功/失败记录', () => {
    test('recordSuccess 应该重置状态和计数器', () => {
      // 先让引擎进入 OPEN 状态
      breaker.recordFailure('engine-1');
      breaker.recordFailure('engine-1');
      breaker.recordFailure('engine-1');
      breaker.recordFailure('engine-1');
      breaker.recordFailure('engine-1');

      expect(breaker.getState('engine-1')).toBe(CircuitState.OPEN);

      // 记录成功应该重置状态
      breaker.recordSuccess('engine-1');
      
      expect(breaker.getState('engine-1')).toBe(CircuitState.CLOSED);
    });

    test('recordSuccess 应该重置失败计数器', () => {
      const circuit = (breaker as any).getOrCreate('engine-1');
      
      // 增加失败计数
      breaker.recordFailure('engine-1');
      breaker.recordFailure('engine-1');
      expect(circuit.failureCount).toBe(2);

      // 记录成功
      breaker.recordSuccess('engine-1');
      expect(circuit.failureCount).toBe(0);
    });

    test('recordFailure 应该增加失败计数并可能触发熔断', () => {
      const circuit = (breaker as any).getOrCreate('engine-1');
      
      // 前几次失败不应该触发熔断
      breaker.recordFailure('engine-1');
      expect(circuit.failureCount).toBe(1);
      expect(breaker.getState('engine-1')).toBe(CircuitState.CLOSED);

      breaker.recordFailure('engine-1');
      expect(circuit.failureCount).toBe(2);
      expect(breaker.getState('engine-1')).toBe(CircuitState.CLOSED);

      // 第5次失败应该触发熔断
      breaker.recordFailure('engine-1');
      breaker.recordFailure('engine-1');
      breaker.recordFailure('engine-1');
      
      expect(circuit.failureCount).toBe(5);
      expect(breaker.getState('engine-1')).toBe(CircuitState.OPEN);
    });

    test('recordSuccess 应该清除半开尝试计数', () => {
      const circuit = (breaker as any).getOrCreate('engine-1');
      circuit.state = CircuitState.HALF_OPEN;
      circuit.halfOpenAttempts = 3;

      breaker.recordSuccess('engine-1');
      
      expect(circuit.state).toBe(CircuitState.CLOSED);
      expect(circuit.halfOpenAttempts).toBe(0);
    });
  });

  describe('重置功能', () => {
    test('reset 应该重置单个引擎的状态', () => {
      // 让 engine-1 进入 OPEN 状态
      breaker.recordFailure('engine-1');
      breaker.recordFailure('engine-1');
      breaker.recordFailure('engine-1');
      breaker.recordFailure('engine-1');
      breaker.recordFailure('engine-1');

      expect(breaker.getState('engine-1')).toBe(CircuitState.OPEN);

      // 重置 engine-1
      breaker.reset('engine-1');

      expect(breaker.getState('engine-1')).toBe(CircuitState.CLOSED);
    });

    test('reset 应该不影响其他引擎', () => {
      // 让两个引擎都有不同状态
      breaker.recordFailure('engine-1');
      breaker.recordFailure('engine-1');
      breaker.recordFailure('engine-1');
      breaker.recordFailure('engine-1');
      breaker.recordFailure('engine-1');

      expect(breaker.getState('engine-1')).toBe(CircuitState.OPEN);
      expect(breaker.getState('engine-2')).toBe(CircuitState.CLOSED);

      // 重置 engine-1
      breaker.reset('engine-1');

      expect(breaker.getState('engine-1')).toBe(CircuitState.CLOSED);
      expect(breaker.getState('engine-2')).toBe(CircuitState.CLOSED);
    });

    test('resetAll 应该重置所有引擎', () => {
      // 让多个引擎都进入 OPEN 状态
      ['engine-1', 'engine-2', 'engine-3'].forEach(engineId => {
        for (let i = 0; i < 5; i++) {
          breaker.recordFailure(engineId);
        }
      });

      expect(breaker.getState('engine-1')).toBe(CircuitState.OPEN);
      expect(breaker.getState('engine-2')).toBe(CircuitState.OPEN);
      expect(breaker.getState('engine-3')).toBe(CircuitState.OPEN);

      // 重置所有
      breaker.resetAll();

      expect(breaker.getState('engine-1')).toBe(CircuitState.CLOSED);
      expect(breaker.getState('engine-2')).toBe(CircuitState.CLOSED);
      expect(breaker.getState('engine-3')).toBe(CircuitState.CLOSED);
    });
  });

  describe('getAllStates', () => {
    test('getAllStates 应该返回所有引擎的状态', () => {
      // 初始状态
      let states = breaker.getAllStates();
      expect(states).toEqual({});

      // 记录一些状态
      breaker.recordFailure('engine-1');
      breaker.recordFailure('engine-1');
      breaker.recordSuccess('engine-2');
      breaker.recordFailure('engine-2');
      breaker.recordFailure('engine-2');

      states = breaker.getAllStates();
      
      expect(states).toEqual({
        'engine-1': {
          state: CircuitState.CLOSED,
          failures: 2,
          successes: 0
        },
        'engine-2': {
          state: CircuitState.CLOSED,
          failures: 2,
          successes: 1
        }
      });
    });

    test('getAllStates 应该包含 OPEN 状态的引擎', () => {
      // 让 engine-1 进入 OPEN 状态
      breaker.recordFailure('engine-1');
      breaker.recordFailure('engine-1');
      breaker.recordFailure('engine-1');
      breaker.recordFailure('engine-1');
      breaker.recordFailure('engine-1');

      const states = breaker.getAllStates();
      
      expect(states).toEqual({
        'engine-1': {
          state: CircuitState.OPEN,
          failures: 5,
          successes: 0
        }
      });
    });
  });

  describe('边界条件和错误处理', () => {
    test('应该处理空字符串的引擎ID', () => {
      expect(() => {
        breaker.allowRequest('');
        breaker.getState('');
        breaker.recordSuccess('');
        breaker.recordFailure('');
        breaker.reset('');
      }).not.toThrow();
    });

    test('应该处理undefined的引擎ID', () => {
      expect(() => {
        breaker.allowRequest(undefined as any);
        breaker.getState(undefined as any);
        breaker.recordSuccess(undefined as any);
        breaker.recordFailure(undefined as any);
        breaker.reset(undefined as any);
      }).not.toThrow();
    });

    test('连续多次失败和成功应该正确处理', () => {
      const circuit = (breaker as any).getOrCreate('engine-1');
      
      // 多次失败
      for (let i = 0; i < 10; i++) {
        breaker.recordFailure('engine-1');
      }
      expect(breaker.getState('engine-1')).toBe(CircuitState.OPEN);
      expect(circuit.failureCount).toBe(10);

      // 多次成功
      for (let i = 0; i < 5; i++) {
        breaker.recordSuccess('engine-1');
      }
      expect(breaker.getState('engine-1')).toBe(CircuitState.CLOSED);
      expect(circuit.failureCount).toBe(0);
    });

    test('HALF_OPEN 状态下的成功应该重置为 CLOSED', () => {
      const circuit = (breaker as any).getOrCreate('engine-1');
      circuit.state = CircuitState.HALF_OPEN;
      circuit.halfOpenAttempts = 1;

      breaker.recordSuccess('engine-1');
      
      expect(circuit.state).toBe(CircuitState.CLOSED);
      expect(circuit.halfOpenAttempts).toBe(0);
    });

    test('HALF_OPEN 状态下的失败应该重新进入 OPEN', () => {
      const circuit = (breaker as any).getOrCreate('engine-1');
      circuit.state = CircuitState.HALF_OPEN;
      circuit.halfOpenAttempts = 1;
      circuit.failureCount = 3;

      // 记录失败
      breaker.recordFailure('engine-1');
      
      expect(circuit.state).toBe(CircuitState.OPEN);
      expect(circuit.failureCount).toBe(4);
    });
  });

  describe('性能和并发', () => {
    test('应该处理多个引擎的并发访问', () => {
      const engines = ['engine-1', 'engine-2', 'engine-3', 'engine-4', 'engine-5'];
      
      // 并发请求测试
      engines.forEach(engineId => {
        const canRequest = breaker.allowRequest(engineId);
        expect(canRequest).toBe(true);
      });

      // 检查所有引擎状态
      engines.forEach(engineId => {
        expect(breaker.getState(engineId)).toBe(CircuitState.CLOSED);
      });
    });

    test('应该正确处理状态转换的边界情况', () => {
      const circuit = (breaker as any).getOrCreate('engine-1');
      
      // 从 OPEN 到 HALF_OPEN 的转换
      circuit.state = CircuitState.OPEN;
      circuit.openedAt = Date.now();
      circuit.failureCount = 5;
      circuit.halfOpenAttempts = 0;

      // 模拟超时后的转换
      circuit.openedAt = Date.now() - 100000; // 模拟很久以前
  
      // 检查状态转换
      expect(breaker.allowRequest('engine-1')).toBe(true);
      expect(circuit.state).toBe(CircuitState.HALF_OPEN);
      expect(circuit.failureCount).toBe(0);
      expect(circuit.halfOpenAttempts).toBe(1);
    });
  });
});