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

interface CircuitBreakerOptions {
  /** 连续失败多少次触发熔断，默认 5 */
  failureThreshold?: number;
  /** 熔断后多久尝试恢复（ms），默认 30000 */
  resetTimeoutMs?: number;
}

interface EngineCircuit {
  state: CircuitState;
  failureCount: number;
  openedAt: number | null; // Date.now() when OPEN started
}

export class CircuitBreaker {
  private failureThreshold: number;
  private resetTimeoutMs: number;
  private engines = new Map<string, EngineCircuit>();

  constructor(opts: CircuitBreakerOptions = {}) {
    this.failureThreshold = opts.failureThreshold ?? 5;
    this.resetTimeoutMs = opts.resetTimeoutMs ?? 30_000;
  }

  private getOrCreate(engineId: string): EngineCircuit {
    if (!this.engines.has(engineId)) {
      this.engines.set(engineId, {
        state: CircuitState.CLOSED,
        failureCount: 0,
        openedAt: null,
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
      return true; // 允许一次试探请求
    }

    // OPEN → 检查是否该进入 HALF_OPEN
    if (circuit.openedAt && Date.now() - circuit.openedAt >= this.resetTimeoutMs) {
      circuit.state = CircuitState.HALF_OPEN;
      circuit.failureCount = 0;
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
    circuit.failureCount = 0;
    circuit.state = CircuitState.CLOSED;
    circuit.openedAt = null;
  }

  /** 报告执行失败 */
  recordFailure(engineId: string): void {
    const circuit = this.getOrCreate(engineId);
    circuit.failureCount++;

    if (circuit.failureCount >= this.failureThreshold) {
      circuit.state = CircuitState.OPEN;
      circuit.openedAt = Date.now();
    }
  }

  /** 重置某个引擎的熔断状态 */
  reset(engineId: string): void {
    this.engines.delete(engineId);
  }
}
