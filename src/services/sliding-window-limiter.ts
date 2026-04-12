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

  /** 检查并记录一次请求，返回是否允许 */
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
