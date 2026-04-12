/**
 * CircuitBreaker - 熔断器
 *
 * 保护引擎免受级联故障。当某个引擎连续失败次数超过阈值时自动熔断，
 * 进入 OPEN 状态拒绝所有请求；经过 resetTimeout 后进入 HALF_OPEN 尝试恢复。
 */

export enum CircuitState {
  CLOSED = 'CLOSED',     // 正常
  OPEN = 'OPEN',         // 熔断中
  HALF_OPEN = 'HALF_OPEN', // 半开（试探恢复）
}

interface CircuitBreakerConfig {
  /** 连续失败多少次触发熔断（默认 5） */
  failureThreshold?: number;
  /** 熔断后冷却时间 ms（默认 30 000） */
  resetTimeoutMs?: number;
  /** 半开状态下允许的探测请求数（默认 1） */
  halfOpenMaxAttempts?: number;
}

interface EngineCircuit {
  state: CircuitState;
  failureCount: number;
  openedAt: number | null; // Date.now() when OPEN started
  successCount: number;
  halfOpenAttempts: number;
}

export class CircuitBreaker {
  private failureThreshold: number;
  private resetTimeoutMs: number;
  private halfOpenMaxAttempts: number;
  private engines = new Map<string, EngineCircuit>();

  constructor(config: CircuitBreakerConfig = {}) {
    this.failureThreshold = config.failureThreshold ?? 5;
    this.resetTimeoutMs = config.resetTimeoutMs ?? 30_000;
    this.halfOpenMaxAttempts = config.halfOpenMaxAttempts ?? 1;
  }

  private getOrCreate(engineId: string): EngineCircuit {
    if (!this.engines.has(engineId)) {
      this.engines.set(engineId, {
        state: CircuitState.CLOSED,
        failureCount: 0,
        openedAt: null,
        successCount: 0,
        halfOpenAttempts: 0,
      });
    }
    return this.engines.get(engineId)!;
  }

  /** 是否允许向该引擎发送请求 */
  allowRequest(engineId: string): boolean {
    const circuit = this.getOrCreate(engineId);

    if (circuit.state === CircuitState.CLOSED) {
      return true;
    }

    if (circuit.state === CircuitState.HALF_OPEN) {
      return circuit.halfOpenAttempts < this.halfOpenMaxAttempts;
    }

    // OPEN → 检查是否该进入 HALF_OPEN
    if (circuit.openedAt && Date.now() - circuit.openedAt >= this.resetTimeoutMs) {
      circuit.state = CircuitState.HALF_OPEN;
      circuit.failureCount = 0;
      circuit.halfOpenAttempts = 0;
      return true;
    }

    return false; // 仍在熔断中
  }

  /** 获取引擎当前熔断状态 */
  getState(engineId: string): CircuitState {
    return this.getOrCreate(engineId).state;
  }

  /** 报告执行成功 */
  recordSuccess(engineId: string): void {
    const circuit = this.getOrCreate(engineId);
    circuit.successCount++;
    circuit.failureCount = 0;
    circuit.state = CircuitState.CLOSED;
    circuit.openedAt = null;
    circuit.halfOpenAttempts = 0;
  }

  /** 报告执行失败 */
  recordFailure(engineId: string): void {
    const circuit = this.getOrCreate(engineId);
    circuit.failureCount++;
    circuit.successCount = 0;

    if (circuit.failureCount >= this.failureThreshold) {
      circuit.state = CircuitState.OPEN;
      circuit.openedAt = Date.now();
    }
  }

  /** 重置某个引擎的熔断状态 */
  reset(engineId: string): void {
    this.engines.delete(engineId);
  }

  /** 重置所有 */
  resetAll(): void {
    this.engines.clear();
  }

  /** 获取所有被追踪引擎的状态（调试用） */
  getAllStates(): Record<string, { state: CircuitState; failures: number; successes: number }> {
    const result: Record<string, { state: CircuitState; failures: number; successes: number }> = {};
    for (const [id, circuit] of this.engines) {
      result[id] = {
        state: circuit.state,
        failures: circuit.failureCount,
        successes: circuit.successCount,
      };
    }
    return result;
  }
}