/**
 * Circuit Breaker Pattern - 熔断器模式
 * 
 * 提供服务熔断、降级和恢复机制，防止级联失败
 */

import { AppError, SystemError, ExternalServiceError } from './errors.js';
import { logger } from './enhanced-error-logger.js';

export interface CircuitBreakerOptions {
  timeoutMs?: number;
  errorThreshold?: number;
  resetTimeoutMs?: number;
  monitoringIntervalMs?: number;
  fallback?: (error: Error) => Promise<any>;
  onStateChange?: (state: CircuitBreakerState, key: string) => void;
}

export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export class CircuitBreaker {
  private static instance: CircuitBreaker;
  private circuits: Map<string, CircuitBreakerInstance> = new Map();
  private options: Required<CircuitBreakerOptions>;

  private constructor(options: CircuitBreakerOptions = {}) {
    this.options = {
      timeoutMs: options.timeoutMs || 5000,
      errorThreshold: options.errorThreshold || 5,
      resetTimeoutMs: options.resetTimeoutMs || 30000,
      monitoringIntervalMs: options.monitoringIntervalMs || 10000,
      fallback: options.fallback || this.defaultFallback,
      onStateChange: options.onStateChange || this.defaultStateChangeHandler,
    };

    // 启动监控任务
    this.startMonitoring();
  }

  static getInstance(options?: CircuitBreakerOptions): CircuitBreaker {
    if (!CircuitBreaker.instance) {
      CircuitBreaker.instance = new CircuitBreaker(options);
    }
    return CircuitBreaker.instance;
  }

  /**
   * 执行受保护的函数调用
   */
  async execute<T>(
    key: string,
    operation: () => Promise<T>,
    options: Partial<CircuitBreakerOptions> = {}
  ): Promise<T> {
    // 合并选项
    const finalOptions = { ...this.options, ...options };
    
    // 获取或创建熔断器实例
    let circuit = this.circuits.get(key);
    if (!circuit) {
      circuit = new CircuitBreakerInstance(key, finalOptions);
      this.circuits.set(key, circuit);
    }

    return circuit.execute(operation);
  }

  /**
   * 批量执行，部分失败继续
   */
  async executeBatch<T>(
    operations: Array<{
      key: string;
      operation: () => Promise<T>;
    }>,
    options: Partial<CircuitBreakerOptions> = {}
  ): Promise<Array<{ key: string; result?: T; error?: AppError }>> {
    const results: Array<{ key: string; result?: T; error?: AppError }> = [];

    const promises = operations.map(async ({ key, operation }) => {
      try {
        const result = await this.execute(key, operation, options);
        return { key, result };
      } catch (error) {
        return { key, error: error as AppError };
      }
    });

    const results_1 = await Promise.all(promises);
    return results_1;
  }

  /**
   * 获取所有熔断器状态
   */
  getCircuitStates(): Record<string, CircuitBreakerState> {
    const states: Record<string, CircuitBreakerState> = {};
    
    this.circuits.forEach((circuit, key) => {
      states[key] = circuit.getState();
    });

    return states;
  }

  /**
   * 重置指定熔断器
   */
  resetCircuit(key: string): void {
    const circuit = this.circuits.get(key);
    if (circuit) {
      circuit.reset();
      logger.info(`熔断器已重置: ${key}`);
    }
  }

  /**
   * 重置所有熔断器
   */
  resetAll(): void {
    this.circuits.forEach((circuit, key) => {
      circuit.reset();
      logger.info(`熔断器已重置: ${key}`);
    });
  }

  /**
   * 启动监控任务
   */
  private startMonitoring(): void {
    setInterval(() => {
      this.checkAndResetCircuits();
    }, this.options.monitoringIntervalMs);
  }

  /**
   * 检查并重置可恢复的熔断器
   */
  private checkAndResetCircuits(): void {
    this.circuits.forEach((circuit, key) => {
      if (circuit.shouldAttemptReset()) {
        circuit.reset();
        logger.info(`自动恢复熔断器: ${key}`);
      }
    });
  }

  /**
   * 默认降级函数
   */
  private defaultFallback = async (error: Error): Promise<any> => {
    logger.warn('使用默认降级函数:', error.message);
    throw new SystemError('服务暂时不可用，请稍后重试', 'circuit_breaker_fallback');
  };

  /**
   * 默认状态变化处理器
   */
  private defaultStateChangeHandler = (state: CircuitBreakerState, key: string): void => {
    logger.warn(`熔断器状态变化: ${key} -> ${state}`);
  };
}

/**
 * 熔断器实例
 */
class CircuitBreakerInstance {
  private key: string;
  private options: Required<CircuitBreakerOptions>;
  
  private state: CircuitBreakerState = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime = 0;
  private successCount = 0;
  private nextAttemptTime = 0;

  constructor(key: string, options: Required<CircuitBreakerOptions>) {
    this.key = key;
    this.options = options;
  }

  /**
   * 执行受保护的函数调用
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    // 检查熔断器状态
    if (this.state === 'OPEN') {
      if (Date.now() >= this.nextAttemptTime) {
        this.state = 'HALF_OPEN';
        this.options.onStateChange?.('HALF_OPEN', this.key);
      } else {
        throw this.createCircuitBreakerError();
      }
    }

    // 设置超时
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('操作超时'));
      }, this.options.timeoutMs);
    });

    try {
      // 执行操作
      const result = await Promise.race([operation(), timeoutPromise]);
      
      // 成功处理
      this.onSuccess();
      return result;
    } catch (error) {
      // 失败处理
      this.onFailure(error);
      throw error;
    }
  }

  /**
   * 成功处理
   */
  private onSuccess(): void {
    this.failureCount = 0;
    this.successCount++;

    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
      this.options.onStateChange?.('CLOSED', this.key);
      logger.info(`熔断器已关闭: ${this.key}`);
    }
  }

  /**
   * 失败处理
   */
  private onFailure(error: unknown): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === 'HALF_OPEN') {
      // 半开状态下失败，重新打开熔断器
      this.state = 'OPEN';
      this.nextAttemptTime = Date.now() + this.options.resetTimeoutMs;
      this.options.onStateChange?.('OPEN', this.key);
    } else if (this.state === 'CLOSED' && this.failureCount >= this.options.errorThreshold) {
      // 闭关状态下达到错误阈值，打开熔断器
      this.state = 'OPEN';
      this.nextAttemptTime = Date.now() + this.options.resetTimeoutMs;
      this.options.onStateChange?.('OPEN', this.key);
    }

    // 记录失败
    logger.error(`熔断器失败: ${this.key}`, {
      error: error instanceof Error ? error.message : String(error),
      failureCount: this.failureCount,
      state: this.state,
    });
  }

  /**
   * 创建熔断器错误
   */
  private createCircuitBreakerError(): AppError {
    const timeUntilReset = Math.ceil((this.nextAttemptTime - Date.now()) / 1000);
    
    return new ExternalServiceError(
      this.key,
      `服务熔断中，将在 ${timeUntilReset} 秒后恢复`,
      503,
      {
        circuitKey: this.key,
        state: this.state,
        nextAttemptTime: this.nextAttemptTime,
        timeUntilReset,
        failureCount: this.failureCount,
      }
    );
  }

  /**
   * 获取当前状态
   */
  getState(): CircuitBreakerState {
    return this.state;
  }

  /**
   * 检查是否应该尝试重置
   */
  shouldAttemptReset(): boolean {
    return (
      this.state === 'OPEN' &&
      Date.now() >= this.nextAttemptTime &&
      this.failureCount > 0
    );
  }

  /**
   * 重置熔断器
   */
  reset(): void {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttemptTime = 0;
    this.lastFailureTime = 0;
    this.options.onStateChange?.('CLOSED', this.key);
  }

  /**
   * 获取熔断器统计信息
   */
  getStats(): {
    state: CircuitBreakerState;
    failureCount: number;
    successCount: number;
    lastFailureTime?: number;
    nextAttemptTime?: number;
  } {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.nextAttemptTime,
    };
  }
}

// 导出单例实例
export const circuitBreaker = CircuitBreaker.getInstance();

/**
 * 装饰器：为函数添加熔断器保护
 */
export function withCircuitBreaker(
  key: string,
  options: Partial<CircuitBreakerOptions> = {}
) {
  return function (
    target: any,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<any>
  ) {
    const method = descriptor.value!;

    descriptor.value = async function (
      this: any,
      ...args: any[]
    ): Promise<any> {
      return circuitBreaker.execute(
        key,
        () => method.apply(this, args),
        options
      );
    };

    return descriptor;
  };
}

/**
 * 装饰器：为API端点添加熔断器保护
 */
export function withApiCircuitBreaker(
  serviceKey: string,
  options: Partial<CircuitBreakerOptions> = {}
) {
  return function (
    target: any,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<any>
  ) {
    const method = descriptor.value!;

    descriptor.value = async function (
      this: any,
      req: any,
      res: any,
      next: any
    ): Promise<any> {
      try {
        const result = await circuitBreaker.execute(
          `${serviceKey}.${req.method}`,
          () => method.apply(this, [req, res, next]),
          {
            ...options,
            fallback: async (error: Error) => {
              // 设置适当的HTTP状态码
              const circuitError = error as AppError;
              if (!res.headersSent) {
                res.status(circuitError.statusCode || 503).json({
                  success: false,
                  error: {
                    code: 'SERVICE_UNAVAILABLE',
                    message: '服务暂时不可用，请稍后重试',
                    details: {
                      service: serviceKey,
                      retryAfter: options.resetTimeoutMs ? Math.ceil(options.resetTimeoutMs / 1000) : 30,
                    },
                    timestamp: new Date().toISOString(),
                  },
                  meta: {
                    timestamp: new Date().toISOString(),
                    service: serviceKey,
                  },
                });
              }
              return null;
            },
          }
        );

        return result;
      } catch (error) {
        if (!res.headersSent && next) {
          next(error);
        }
      }
    };

    return descriptor;
  };
}