/**
 * CircuitBreaker - 熔断器
 *
 * 保护故障引擎不被反复请求。当某个引擎连续失败超过阈值时自动"熔断"（OPEN），
 * 经过冷却期后进入半开状态（HALF_OPEN）允许探测请求，成功则恢复（CLOSED）。
 */

export enum CircuitState {
  CLOSED = 'CLOSED',     // 正常
  OPEN = 'OPEN',         // 熔断中
  HALF_OPEN = 'HALF_OPEN', // 半开（探测中）
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
  successCount: number;
  lastFailureAt: number | null;
  halfOpenAttempts: number;
}

export class CircuitBreaker {
  private config: Required<CircuitBreakerConfig>;
  private circuits = new Map<string, EngineCircuit>();

  constructor(config?: CircuitBreakerConfig) {
    this.config = {
      failureThreshold: config?.failureThreshold ?? 5,
      resetTimeoutMs: config?.resetTimeoutMs ?? 30_000,
      halfOpenMaxAttempts: config?.halfOpenMaxAttempts ?? 1,
    };
  }

  private getOrCreate(engineId: string): EngineCircuit {
    let circuit = this.circuits.get(engineId);
    if (!circuit) {
      circuit = {
        state: CircuitState.CLOSED,
        failureCount: 0,
        successCount: 0,
        lastFailureAt: null,
        halfOpenAttempts: 0,
      };
      this.circuits.set(engineId, circuit);
    }
    return circuit;
  }

  /** 检查该引擎是否允许请求 */
  allowRequest(engineId: string): boolean {
    const circuit = this.getOrCreate(engineId);

    switch (circuit.state) {
      case CircuitState.CLOSED:
        return true;

      case CircuitState.OPEN: {
        // 冷却期过后自动切 HALF_OPEN
        const elapsed = Date.now() - (circuit.lastFailureAt ?? 0);
        if (elapsed >= this.config.resetTimeoutMs) {
          circuit.state = CircuitState.HALF_OPEN;
          circuit.halfOpenAttempts = 0;
          return true; // 允许探测请求
        }
        return false;
      }

      case CircuitState.HALF_OPEN:
        // 半开状态下只允许有限探测请求
        return circuit.halfOpenAttempts < this.config.halfOpenMaxAttempts;

      default:
        return true;
    }
  }

  /** 记录成功 → CLOSED */
  recordSuccess(engineId: string): void {
    const circuit = this.getOrCreate(engineId);
    circuit.successCount++;
    circuit.failureCount = 0;
    circuit.state = CircuitState.CLOSED;
    circuit.halfOpenAttempts = 0;
  }

  /** 记录失败 → 可能触发熔断 */
  recordFailure(engineId: string): void {
    const circuit = this.getOrCreate(engineId);
    circuit.failureCount++;
    circuit.successCount = 0;
    circuit.lastFailureAt = Date.now();

    if (circuit.state === CircuitState.HALF_OPEN) {
      // 半开探测失败 → 重新熔断
      circuit.state = CircuitState.OPEN;
      circuit.halfOpenAttempts = 0;
    } else if (circuit.failureCount >= this.config.failureThreshold) {
      circuit.state = CircuitState.OPEN;
    }
  }

  /** 获取引擎当前熔断状态 */
  getState(engineId: string): CircuitState {
    const circuit = this.getOrCreate(engineId);
    // 惰性检查 OPEN → HALF_OPEN
    if (circuit.state === CircuitState.OPEN) {
      const elapsed = Date.now() - (circuit.lastFailureAt ?? 0);
      if (elapsed >= this.config.resetTimeoutMs) {
        circuit.state = CircuitState.HALF_OPEN;
        circuit.halfOpenAttempts = 0;
      }
    }
    return circuit.state;
  }

  /** 重置某个引擎的熔断状态 */
  reset(engineId: string): void {
    this.circuits.delete(engineId);
  }

  /** 重置所有 */
  resetAll(): void {
    this.circuits.clear();
  }

  /** 获取所有被追踪引擎的状态（调试用） */
  getAllStates(): Record<string, { state: CircuitState; failures: number; successes: number }> {
    const result: Record<string, { state: CircuitState; failures: number; successes: number }> = {};
    for (const [id, circuit] of this.circuits) {
      result[id] = {
        state: circuit.state,
        failures: circuit.failureCount,
        successes: circuit.successCount,
      };
    }
    return result;
  }
}
