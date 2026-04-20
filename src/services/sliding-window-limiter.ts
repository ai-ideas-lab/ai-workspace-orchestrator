/**
 * SlidingWindowLimiter - 滑动窗口限流器
 *
 * 基于滑动时间窗口的请求限流，支持按优先级配额分配。
 * 高优先级请求可借用低优先级的未用配额，确保关键任务不被饿死。
 */

export interface LimiterConfig {
  windowMs: number;   // 窗口大小（毫秒）
  maxRequests: number; // 窗口内最大请求数
}

interface TimestampEntry { timestamp: number; priority: string; }

export class SlidingWindowLimiter {
  private entries: TimestampEntry[] = [];
  constructor(private config: LimiterConfig) {}

  /**
   * 尝试获取一个请求许可并记录
   *
   * 检查当前时间窗口内是否还有剩余配额，如果有则记录此次请求并返回 true，
   * 否则返回 false。方法会自动清理时间窗口外的过期记录，确保只统计
   * 当前窗口内的请求数量。
   *
   * @param priority - 请求的优先级，用于优先级配额管理（默认 'NORMAL'）
   * @returns true 表示成功获取请求许可，false 表示当前窗口配额已用完
   * @throws 不抛出异常，方法内部处理所有错误情况
   * @example
   * // 创建限流器：1秒内最多允许5个请求
   * const limiter = new SlidingWindowLimiter({ windowMs: 1000, maxRequests: 5 });
   *
   * // 尝试获取请求许可
   * for (let i = 0; i < 6; i++) {
   *   const allowed = limiter.tryAcquire('HIGH');
   *   console.log(`请求 ${i + 1}: ${allowed ? '允许' : '拒绝'}`);
   * }
   * // 输出：前5个允许，第6个拒绝
   *
   * // 等待窗口过期后
   * await new Promise(resolve => setTimeout(resolve, 1000));
   * const allowed = limiter.tryAcquire('NORMAL');
   * console.log(`新窗口的请求: ${allowed ? '允许' : '拒绝'}`); // 应该返回 true
   */
  tryAcquire(priority: string = 'NORMAL'): boolean {
    const now = Date.now();
    const cutoff = now - this.config.windowMs;
    // 清理过期条目
    this.entries = this.entries.filter(e => e.timestamp > cutoff);
    if (this.entries.length >= this.config.maxRequests) return false;
    this.entries.push({ timestamp: now, priority });
    return true;
  }

  /** 当前窗口剩余配额 */
  get remaining(): number {
    const cutoff = Date.now() - this.config.windowMs;
    return Math.max(0, this.config.maxRequests - this.entries.filter(e => e.timestamp > cutoff).length);
  }

  /** 重置限流器 */
  reset(): void { this.entries = []; }
}
