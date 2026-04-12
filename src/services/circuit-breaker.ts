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

  /**
   * 检查是否允许向指定引擎发送请求
   *
   * 根据熔断器状态决定是否允许请求通过。当引擎处于 CLOSED 状态时正常允许，
   * HALF_OPEN 状态下允许有限数量的探测请求，OPEN 状态拒绝所有请求。
   * 超过重置时间后，OPEN 状态会自动转换为 HALF_OPEN 进行恢复。
   *
   * @param engineId - 引擎的唯一标识符
   * @returns true 表示允许发送请求，false 表示被熔断拒绝
   * @throws 不抛出异常，方法内部处理所有错误情况
   * @example
   * // 允许请求的情况
   * const canRequest = breaker.allowRequest('engine-1');
   * if (canRequest) {
   *   // 发送请求到 engine-1
   * }
   *
   * // 引擎被熔断的情况
   * const canRequest = breaker.allowRequest('engine-1');
   * if (!canRequest) {
   *   console.log('引擎正在熔断中，请求被拒绝');
   * }
   */
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

  /**
   * 记录引擎执行成功的状态
   *
   * 当引擎成功处理请求后调用此方法。会重置失败计数，
   * 将熔断状态设置为 CLOSED（正常），并清除半开尝试计数。
   * 成功记录有助于熔断器自动恢复正常运行状态。
   *
   * @param engineId - 引擎的唯一标识符
   * @returns 不返回值
   * @throws 不抛出异常，方法内部处理所有错误情况
   * @example
   * // 记录引擎成功执行
   * breaker.recordSuccess('engine-1');
   * // 熔断器状态会重置为 CLOSED，失败计数归零
   *
   * // 在请求处理成功后调用
   * try {
   *   const result = await callEngine('engine-1', request);
   *   breaker.recordSuccess('engine-1');
   *   return result;
   * } catch (error) {
   *   breaker.recordFailure('engine-1');
   *   throw error;
   * }
   */
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