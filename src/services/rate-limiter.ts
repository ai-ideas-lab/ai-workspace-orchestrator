/**
 * RateLimiterService - 令牌桶速率限制器
 *
 * 为每个 AI 引擎提供独立的速率限制，防止引擎被过度调用。
 * 基于令牌桶算法，支持突发流量和稳态限流。
 *
 * 核心特性:
 *   1. 每引擎独立的令牌桶配置
 *   2. 支持全局默认限制 + 引擎级自定义
 *   3. 与 EventBus 集成，发布限流事件
 *   4. 运行时可动态调整限制
 *   5. 统计信息收集（通过/拒绝/等待）
 *
 * 使用方式:
 *   const limiter = new RateLimiterService(eventBus, {
 *     defaultRefillRate: 10,       // 每秒补充10个令牌
 *     defaultMaxTokens: 50,        // 桶容量50
 *   });
 *   limiter.setEngineLimit('gpt-4', { refillRate: 5, maxTokens: 20 });
 *   const allowed = limiter.tryAcquire('gpt-4'); // 尝试获取一个令牌
 */

import { EventBus } from './event-bus.js';

// ── 类型定义 ────────────────────────────────────────────

export interface TokenBucketConfig {
  /** 每秒补充的令牌数 */
  refillRate: number;
  /** 桶最大容量（允许的突发量） */
  maxTokens: number;
  /** 当前令牌数（初始化时默认为 maxTokens） */
  currentTokens?: number;
}

export interface RateLimiterOptions {
  /** 全局默认补充速率（令牌/秒），默认 10 */
  defaultRefillRate?: number;
  /** 全局默认桶容量，默认 50 */
  defaultMaxTokens?: number;
  /** 是否在限流时发布事件，默认 true */
  emitEvents?: boolean;
}

export interface AcquireResult {
  /** 是否获取成功 */
  allowed: boolean;
  /** 剩余令牌数 */
  remainingTokens: number;
  /** 如果被拒绝，需要等待的毫秒数 */
  waitTimeMs: number;
  /** 引擎 ID */
  engineId: string;
}

export interface EngineRateLimitStats {
  engineId: string;
  totalAcquired: number;
  totalRejected: number;
  totalWaitedMs: number;
  currentTokens: number;
  maxTokens: number;
  refillRate: number;
  lastRefillAt: Date;
  lastAcquireAt: Date | null;
  lastRejectAt: Date | null;
}

export interface RateLimiterStats {
  engines: Record<string, EngineRateLimitStats>;
  totalAcquired: number;
  totalRejected: number;
  configuredEngines: number;
}

// ── 令牌桶 ──────────────────────────────────────────────

class TokenBucket {
  tokens: number;
  readonly maxTokens: number;
  readonly refillRate: number;
  lastRefillAt: Date;

  constructor(config: TokenBucketConfig) {
    this.maxTokens = config.maxTokens;
    this.refillRate = config.refillRate;
    this.tokens = config.currentTokens ?? config.maxTokens;
    this.lastRefillAt = new Date();
  }

  /** 根据经过的时间补充令牌 */
  refill(): void {
    const now = new Date();
    const elapsedMs = now.getTime() - this.lastRefillAt.getTime();
    const tokensToAdd = (elapsedMs / 1000) * this.refillRate;
    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefillAt = now;
  }

  /** 尝试消费 n 个令牌 */
  tryConsume(n: number = 1): boolean {
    this.refill();
    if (this.tokens >= n) {
      this.tokens -= n;
      return true;
    }
    return false;
  }

  /** 计算等待 n 个令牌需要多少毫秒 */
  waitTimeFor(n: number = 1): number {
    this.refill();
    if (this.tokens >= n) return 0;
    const deficit = n - this.tokens;
    return (deficit / this.refillRate) * 1000;
  }
}

// ── 核心类 ──────────────────────────────────────────────

export class RateLimiterService {
  private eventBus: EventBus | null;
  private emitEvents: boolean;
  private defaultConfig: { refillRate: number; maxTokens: number };

  /** 引擎 → 令牌桶 */
  private buckets = new Map<string, TokenBucket>();
  /** 引擎 → 统计信息 */
  private stats = new Map<string, EngineRateLimitStats>();
  /** 全局统计 */
  private globalAcquired = 0;
  private globalRejected = 0;

  constructor(eventBus?: EventBus, options?: RateLimiterOptions) {
    this.eventBus = eventBus ?? null;
    this.emitEvents = options?.emitEvents ?? true;
    this.defaultConfig = {
      refillRate: options?.defaultRefillRate ?? 10,
      maxTokens: options?.defaultMaxTokens ?? 50,
    };
  }

  // ── 配置接口 ──────────────────────────────────────────

  /**
   * 为指定引擎设置速率限制。
   * 如果已存在配置，会动态更新（保留当前令牌数，不超过新的 maxTokens）。
   */
  setEngineLimit(engineId: string, config: TokenBucketConfig): void {
    const existing = this.buckets.get(engineId);
    if (existing) {
      // 动态更新：保留当前状态
      const currentTokens = Math.min(existing.tokens, config.maxTokens);
      this.buckets.set(engineId, new TokenBucket({
        ...config,
        currentTokens,
      }));
    } else {
      this.buckets.set(engineId, new TokenBucket(config));
      this.initStats(engineId, config);
    }
  }

  /** 移除引擎的速率限制 */
  removeEngineLimit(engineId: string): boolean {
    return this.buckets.delete(engineId) && this.stats.delete(engineId);
  }

  /** 使用默认配置为引擎启用限流 */
  enableDefaultLimit(engineId: string): void {
    this.setEngineLimit(engineId, {
      refillRate: this.defaultConfig.refillRate,
      maxTokens: this.defaultConfig.maxTokens,
    });
  }

  // ── 核心操作 ──────────────────────────────────────────

  /**
   * 尝试获取 1 个令牌（非阻塞）。
   * 如果引擎没有配置限流，默认允许。
   */
  tryAcquire(engineId: string, tokens: number = 1): AcquireResult {
    const bucket = this.buckets.get(engineId);

    // 无配置 → 不限流
    if (!bucket) {
      return {
        allowed: true,
        remainingTokens: Infinity,
        waitTimeMs: 0,
        engineId,
      };
    }

    const allowed = bucket.tryConsume(tokens);
    const stats = this.stats.get(engineId)!;
    const now = new Date();

    if (allowed) {
      stats.totalAcquired++;
      stats.currentTokens = bucket.tokens;
      stats.lastAcquireAt = now;
      this.globalAcquired++;

      return {
        allowed: true,
        remainingTokens: bucket.tokens,
        waitTimeMs: 0,
        engineId,
      };
    } else {
      const waitTimeMs = bucket.waitTimeFor(tokens);
      stats.totalRejected++;
      stats.lastRejectAt = now;
      this.globalRejected++;

      this.emitRateLimited(engineId, waitTimeMs);

      return {
        allowed: false,
        remainingTokens: bucket.tokens,
        waitTimeMs,
        engineId,
      };
    }
  }

  /**
   * 等待并获取令牌（阻塞式）。
   * 如果令牌不足，会等待直到有足够的令牌。
   * @timeoutMs 最大等待时间（默认 30 秒），超时返回失败
   */
  async acquire(engineId: string, tokens: number = 1, timeoutMs: number = 30_000): Promise<AcquireResult> {
    const bucket = this.buckets.get(engineId);
    if (!bucket) {
      return { allowed: true, remainingTokens: Infinity, waitTimeMs: 0, engineId };
    }

    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const result = this.tryAcquire(engineId, tokens);
      if (result.allowed) {
        const stats = this.stats.get(engineId)!;
        stats.totalWaitedMs += Date.now() - startTime;
        return result;
      }

      // 等待一段时间再重试（取等待时间的一半，最少 10ms）
      const waitMs = Math.max(10, result.waitTimeMs / 2);
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }

    // 超时
    const stats = this.stats.get(engineId);
    if (stats) {
      stats.totalRejected++;
      this.globalRejected++;
    }

    return {
      allowed: false,
      remainingTokens: bucket.tokens,
      waitTimeMs: Date.now() - startTime,
      engineId,
    };
  }

  // ── 查询接口 ──────────────────────────────────────────

  /** 获取引擎当前的剩余令牌数 */
  getRemainingTokens(engineId: string): number {
    const bucket = this.buckets.get(engineId);
    if (!bucket) return Infinity;
    bucket.refill();
    return bucket.tokens;
  }

  /** 获取引擎的速率限制配置 */
  getEngineConfig(engineId: string): TokenBucketConfig | null {
    const bucket = this.buckets.get(engineId);
    if (!bucket) return null;
    return {
      refillRate: bucket.refillRate,
      maxTokens: bucket.maxTokens,
      currentTokens: bucket.tokens,
    };
  }

  /** 获取单个引擎的统计信息 */
  getEngineStats(engineId: string): EngineRateLimitStats | null {
    return this.stats.get(engineId) ?? null;
  }

  /** 获取全局统计信息 */
  getStats(): RateLimiterStats {
    const engines: Record<string, EngineRateLimitStats> = {};
    for (const [id, s] of this.stats) {
      const bucket = this.buckets.get(id);
      engines[id] = {
        ...s,
        currentTokens: bucket?.tokens ?? s.currentTokens,
      };
    }
    return {
      engines,
      totalAcquired: this.globalAcquired,
      totalRejected: this.globalRejected,
      configuredEngines: this.buckets.size,
    };
  }

  /** 引擎是否已配置限流 */
  isConfigured(engineId: string): boolean {
    return this.buckets.has(engineId);
  }

  /** 获取所有已配置限流的引擎 ID */
  getConfiguredEngines(): string[] {
    return [...this.buckets.keys()];
  }

  // ── 管理操作 ──────────────────────────────────────────

  /** 按拒绝次数降序返回引擎排名（运维快速定位瓶颈） */
  getTopRejectedEngines(limit: number = 5): EngineRateLimitStats[] {
    return [...this.stats.values()]
      .sort((a, b) => b.totalRejected - a.totalRejected)
      .slice(0, limit);
  }

  /** 重置指定引擎的令牌桶（填满令牌） */
  resetBucket(engineId: string): boolean {
    const bucket = this.buckets.get(engineId);
    if (!bucket) return false;
    bucket.tokens = bucket.maxTokens;
    bucket.lastRefillAt = new Date();
    return true;
  }

  /** 重置所有令牌桶 */
  resetAll(): void {
    for (const bucket of this.buckets.values()) {
      bucket.tokens = bucket.maxTokens;
      bucket.lastRefillAt = new Date();
    }
  }

  /** 重置统计信息（不重置令牌） */
  resetStats(): void {
    for (const stats of this.stats.values()) {
      stats.totalAcquired = 0;
      stats.totalRejected = 0;
      stats.totalWaitedMs = 0;
      stats.lastAcquireAt = null;
      stats.lastRejectAt = null;
    }
    this.globalAcquired = 0;
    this.globalRejected = 0;
  }

  // ── 私有方法 ──────────────────────────────────────────

  private initStats(engineId: string, config: TokenBucketConfig): void {
    this.stats.set(engineId, {
      engineId,
      totalAcquired: 0,
      totalRejected: 0,
      totalWaitedMs: 0,
      currentTokens: config.currentTokens ?? config.maxTokens,
      maxTokens: config.maxTokens,
      refillRate: config.refillRate,
      lastRefillAt: new Date(),
      lastAcquireAt: null,
      lastRejectAt: null,
    });
  }

  private emitRateLimited(engineId: string, waitTimeMs: number): void {
    if (!this.emitEvents || !this.eventBus) return;

    this.eventBus.emit({
      type: 'request.failed' as any,
      requestId: `rate-limit-${engineId}-${Date.now()}`,
      engineId,
      error: `Rate limited: engine ${engineId} exceeded rate limit, wait ${Math.ceil(waitTimeMs)}ms`,
      timestamp: new Date(),
    } as any);
  }
}
