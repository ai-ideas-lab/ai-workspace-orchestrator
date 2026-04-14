"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const circuit_breaker_1 = require("../circuit-breaker");
describe('CircuitBreaker', () => {
    let breaker;
    beforeEach(() => {
        breaker = new circuit_breaker_1.CircuitBreaker();
    });
    describe('构造函数', () => {
        test('应该使用默认配置创建熔断器', () => {
            const defaultBreaker = new circuit_breaker_1.CircuitBreaker();
            expect(defaultBreaker.getState('engine-1')).toBe(circuit_breaker_1.CircuitState.CLOSED);
        });
        test('应该使用自定义配置创建熔断器', () => {
            const customBreaker = new circuit_breaker_1.CircuitBreaker({
                failureThreshold: 3,
                resetTimeoutMs: 1000,
                halfOpenMaxAttempts: 2
            });
            expect(customBreaker.getState('engine-1')).toBe(circuit_breaker_1.CircuitState.CLOSED);
        });
        test('应该处理部分配置（缺失字段）', () => {
            const partialConfigBreaker = new circuit_breaker_1.CircuitBreaker({
                failureThreshold: 10
            });
            expect(partialConfigBreaker.getState('engine-1')).toBe(circuit_breaker_1.CircuitState.CLOSED);
        });
    });
    describe('allowRequest - 请求控制', () => {
        test('初始状态应该是 CLOSED，应该允许请求', () => {
            const canRequest = breaker.allowRequest('engine-1');
            expect(canRequest).toBe(true);
        });
        test('CLOSED 状态应该允许请求', () => {
            expect(breaker.getState('engine-1')).toBe(circuit_breaker_1.CircuitState.CLOSED);
            const canRequest = breaker.allowRequest('engine-1');
            expect(canRequest).toBe(true);
        });
        test('OPEN 状态应该拒绝请求', () => {
            breaker.recordFailure('engine-1');
            breaker.recordFailure('engine-1');
            breaker.recordFailure('engine-1');
            breaker.recordFailure('engine-1');
            breaker.recordFailure('engine-1');
            expect(breaker.getState('engine-1')).toBe(circuit_breaker_1.CircuitState.OPEN);
            const canRequest = breaker.allowRequest('engine-1');
            expect(canRequest).toBe(false);
        });
        test('HALF_OPEN 状态应该允许有限数量的请求', () => {
            const circuit = breaker.getOrCreate('engine-1');
            circuit.state = circuit_breaker_1.CircuitState.HALF_OPEN;
            circuit.halfOpenAttempts = 0;
            expect(breaker.allowRequest('engine-1')).toBe(true);
            expect(circuit.halfOpenAttempts).toBe(1);
            expect(breaker.allowRequest('engine-1')).toBe(false);
        });
        test('HALF_OPEN 状态在自定义配置下允许多次请求', () => {
            const customBreaker = new circuit_breaker_1.CircuitBreaker({
                halfOpenMaxAttempts: 3
            });
            const circuit = customBreaker.getOrCreate('engine-1');
            circuit.state = circuit_breaker_1.CircuitState.HALF_OPEN;
            circuit.halfOpenAttempts = 0;
            expect(customBreaker.allowRequest('engine-1')).toBe(true);
            expect(customBreaker.allowRequest('engine-1')).toBe(true);
            expect(customBreaker.allowRequest('engine-1')).toBe(true);
            expect(customBreaker.allowRequest('engine-1')).toBe(false);
        });
        test('OPEN 状态超时后应该自动转换为 HALF_OPEN', () => {
            const circuit = breaker.getOrCreate('engine-1');
            circuit.state = circuit_breaker_1.CircuitState.OPEN;
            circuit.openedAt = Date.now();
            const shortTimeoutBreaker = new circuit_breaker_1.CircuitBreaker({
                resetTimeoutMs: 1
            });
            const shortCircuit = shortTimeoutBreaker.getOrCreate('engine-1');
            shortCircuit.state = circuit_breaker_1.CircuitState.OPEN;
            shortCircuit.openedAt = Date.now();
            setTimeout(() => {
                expect(shortTimeoutBreaker.allowRequest('engine-1')).toBe(true);
                expect(shortCircuit.state).toBe(circuit_breaker_1.CircuitState.HALF_OPEN);
            }, 10);
        });
    });
    describe('状态管理', () => {
        test('getState 应该返回正确的状态', () => {
            expect(breaker.getState('engine-1')).toBe(circuit_breaker_1.CircuitState.CLOSED);
            breaker.recordFailure('engine-1');
            breaker.recordFailure('engine-1');
            breaker.recordFailure('engine-1');
            breaker.recordFailure('engine-1');
            breaker.recordFailure('engine-1');
            expect(breaker.getState('engine-1')).toBe(circuit_breaker_1.CircuitState.OPEN);
        });
        test('多个引擎应该有独立的状态', () => {
            breaker.recordFailure('engine-1');
            breaker.recordFailure('engine-1');
            breaker.recordFailure('engine-1');
            breaker.recordFailure('engine-1');
            breaker.recordFailure('engine-1');
            expect(breaker.getState('engine-1')).toBe(circuit_breaker_1.CircuitState.OPEN);
            expect(breaker.getState('engine-2')).toBe(circuit_breaker_1.CircuitState.CLOSED);
        });
    });
    describe('成功/失败记录', () => {
        test('recordSuccess 应该重置状态和计数器', () => {
            breaker.recordFailure('engine-1');
            breaker.recordFailure('engine-1');
            breaker.recordFailure('engine-1');
            breaker.recordFailure('engine-1');
            breaker.recordFailure('engine-1');
            expect(breaker.getState('engine-1')).toBe(circuit_breaker_1.CircuitState.OPEN);
            breaker.recordSuccess('engine-1');
            expect(breaker.getState('engine-1')).toBe(circuit_breaker_1.CircuitState.CLOSED);
        });
        test('recordSuccess 应该重置失败计数器', () => {
            const circuit = breaker.getOrCreate('engine-1');
            breaker.recordFailure('engine-1');
            breaker.recordFailure('engine-1');
            expect(circuit.failureCount).toBe(2);
            breaker.recordSuccess('engine-1');
            expect(circuit.failureCount).toBe(0);
        });
        test('recordFailure 应该增加失败计数并可能触发熔断', () => {
            const circuit = breaker.getOrCreate('engine-1');
            breaker.recordFailure('engine-1');
            expect(circuit.failureCount).toBe(1);
            expect(breaker.getState('engine-1')).toBe(circuit_breaker_1.CircuitState.CLOSED);
            breaker.recordFailure('engine-1');
            expect(circuit.failureCount).toBe(2);
            expect(breaker.getState('engine-1')).toBe(circuit_breaker_1.CircuitState.CLOSED);
            breaker.recordFailure('engine-1');
            breaker.recordFailure('engine-1');
            breaker.recordFailure('engine-1');
            expect(circuit.failureCount).toBe(5);
            expect(breaker.getState('engine-1')).toBe(circuit_breaker_1.CircuitState.OPEN);
        });
        test('recordSuccess 应该清除半开尝试计数', () => {
            const circuit = breaker.getOrCreate('engine-1');
            circuit.state = circuit_breaker_1.CircuitState.HALF_OPEN;
            circuit.halfOpenAttempts = 3;
            breaker.recordSuccess('engine-1');
            expect(circuit.state).toBe(circuit_breaker_1.CircuitState.CLOSED);
            expect(circuit.halfOpenAttempts).toBe(0);
        });
    });
    describe('重置功能', () => {
        test('reset 应该重置单个引擎的状态', () => {
            breaker.recordFailure('engine-1');
            breaker.recordFailure('engine-1');
            breaker.recordFailure('engine-1');
            breaker.recordFailure('engine-1');
            breaker.recordFailure('engine-1');
            expect(breaker.getState('engine-1')).toBe(circuit_breaker_1.CircuitState.OPEN);
            breaker.reset('engine-1');
            expect(breaker.getState('engine-1')).toBe(circuit_breaker_1.CircuitState.CLOSED);
        });
        test('reset 应该不影响其他引擎', () => {
            breaker.recordFailure('engine-1');
            breaker.recordFailure('engine-1');
            breaker.recordFailure('engine-1');
            breaker.recordFailure('engine-1');
            breaker.recordFailure('engine-1');
            expect(breaker.getState('engine-1')).toBe(circuit_breaker_1.CircuitState.OPEN);
            expect(breaker.getState('engine-2')).toBe(circuit_breaker_1.CircuitState.CLOSED);
            breaker.reset('engine-1');
            expect(breaker.getState('engine-1')).toBe(circuit_breaker_1.CircuitState.CLOSED);
            expect(breaker.getState('engine-2')).toBe(circuit_breaker_1.CircuitState.CLOSED);
        });
        test('resetAll 应该重置所有引擎', () => {
            ['engine-1', 'engine-2', 'engine-3'].forEach(engineId => {
                for (let i = 0; i < 5; i++) {
                    breaker.recordFailure(engineId);
                }
            });
            expect(breaker.getState('engine-1')).toBe(circuit_breaker_1.CircuitState.OPEN);
            expect(breaker.getState('engine-2')).toBe(circuit_breaker_1.CircuitState.OPEN);
            expect(breaker.getState('engine-3')).toBe(circuit_breaker_1.CircuitState.OPEN);
            breaker.resetAll();
            expect(breaker.getState('engine-1')).toBe(circuit_breaker_1.CircuitState.CLOSED);
            expect(breaker.getState('engine-2')).toBe(circuit_breaker_1.CircuitState.CLOSED);
            expect(breaker.getState('engine-3')).toBe(circuit_breaker_1.CircuitState.CLOSED);
        });
    });
    describe('getAllStates', () => {
        test('getAllStates 应该返回所有引擎的状态', () => {
            let states = breaker.getAllStates();
            expect(states).toEqual({});
            breaker.recordFailure('engine-1');
            breaker.recordFailure('engine-1');
            breaker.recordSuccess('engine-2');
            breaker.recordFailure('engine-2');
            breaker.recordFailure('engine-2');
            states = breaker.getAllStates();
            expect(states).toEqual({
                'engine-1': {
                    state: circuit_breaker_1.CircuitState.CLOSED,
                    failures: 2,
                    successes: 0
                },
                'engine-2': {
                    state: circuit_breaker_1.CircuitState.CLOSED,
                    failures: 2,
                    successes: 1
                }
            });
        });
        test('getAllStates 应该包含 OPEN 状态的引擎', () => {
            breaker.recordFailure('engine-1');
            breaker.recordFailure('engine-1');
            breaker.recordFailure('engine-1');
            breaker.recordFailure('engine-1');
            breaker.recordFailure('engine-1');
            const states = breaker.getAllStates();
            expect(states).toEqual({
                'engine-1': {
                    state: circuit_breaker_1.CircuitState.OPEN,
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
                breaker.allowRequest(undefined);
                breaker.getState(undefined);
                breaker.recordSuccess(undefined);
                breaker.recordFailure(undefined);
                breaker.reset(undefined);
            }).not.toThrow();
        });
        test('连续多次失败和成功应该正确处理', () => {
            const circuit = breaker.getOrCreate('engine-1');
            for (let i = 0; i < 10; i++) {
                breaker.recordFailure('engine-1');
            }
            expect(breaker.getState('engine-1')).toBe(circuit_breaker_1.CircuitState.OPEN);
            expect(circuit.failureCount).toBe(10);
            for (let i = 0; i < 5; i++) {
                breaker.recordSuccess('engine-1');
            }
            expect(breaker.getState('engine-1')).toBe(circuit_breaker_1.CircuitState.CLOSED);
            expect(circuit.failureCount).toBe(0);
        });
        test('HALF_OPEN 状态下的成功应该重置为 CLOSED', () => {
            const circuit = breaker.getOrCreate('engine-1');
            circuit.state = circuit_breaker_1.CircuitState.HALF_OPEN;
            circuit.halfOpenAttempts = 1;
            breaker.recordSuccess('engine-1');
            expect(circuit.state).toBe(circuit_breaker_1.CircuitState.CLOSED);
            expect(circuit.halfOpenAttempts).toBe(0);
        });
        test('HALF_OPEN 状态下的失败应该重新进入 OPEN', () => {
            const circuit = breaker.getOrCreate('engine-1');
            circuit.state = circuit_breaker_1.CircuitState.HALF_OPEN;
            circuit.halfOpenAttempts = 1;
            circuit.failureCount = 3;
            breaker.recordFailure('engine-1');
            expect(circuit.state).toBe(circuit_breaker_1.CircuitState.OPEN);
            expect(circuit.failureCount).toBe(4);
        });
    });
    describe('性能和并发', () => {
        test('应该处理多个引擎的并发访问', () => {
            const engines = ['engine-1', 'engine-2', 'engine-3', 'engine-4', 'engine-5'];
            engines.forEach(engineId => {
                const canRequest = breaker.allowRequest(engineId);
                expect(canRequest).toBe(true);
            });
            engines.forEach(engineId => {
                expect(breaker.getState(engineId)).toBe(circuit_breaker_1.CircuitState.CLOSED);
            });
        });
        test('应该正确处理状态转换的边界情况', () => {
            const circuit = breaker.getOrCreate('engine-1');
            circuit.state = circuit_breaker_1.CircuitState.OPEN;
            circuit.openedAt = Date.now();
            circuit.failureCount = 5;
            circuit.halfOpenAttempts = 0;
            circuit.openedAt = Date.now() - 100000;
            expect(breaker.allowRequest('engine-1')).toBe(true);
            expect(circuit.state).toBe(circuit_breaker_1.CircuitState.HALF_OPEN);
            expect(circuit.failureCount).toBe(0);
            expect(circuit.halfOpenAttempts).toBe(1);
        });
    });
});
//# sourceMappingURL=circuit-breaker.test.js.map