/**
 * HealthCheckService - 统一健康检查服务
 *
 * 聚合各子系统（熔断器、限流器、事件总线、队列等）的健康状态，
 * 对外提供统一 /health 端点数据，为实时监控仪表板服务。
 *
 * 核心特性:
 *   1. 可插拔的 HealthCheckProvider 注册机制
 *   2. 支持同步和异步检查
 *   3. 分级状态：healthy / degraded / unhealthy
 *   4. 检查耗时统计 & 超时保护
 *   5. 整体状态由最差的子检查决定
 *
 * 使用方式:
 *   const hc = new HealthCheckService();
 *   hc.register('circuit-breakers', () => ({ status: 'healthy', ... }));
 *   const report = await hc.check();
 *   // → { status: 'healthy', checks: { 'circuit-breakers': {...} }, ... }
 */

// ── 类型定义 ────────────────────────────────────────────

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

export interface HealthCheckResult {
  /** 检查名称 */
  name: string;
  /** 当前状态 */
  status: HealthStatus;
  /** 状态描述（用于前端展示） */
  message?: string;
  /** 检查耗时 ms */
  durationMs: number;
  /** 额外元数据 */
  details?: Record<string, unknown>;
  /** 检查时间 */
  checkedAt: Date;
  /** 如检查失败或超时，记录错误信息 */
  error?: string;
}

export interface HealthReport {
  /** 聚合状态（由最差的子检查决定） */
  status: HealthStatus;
  /** 所有子检查结果 */
  checks: Record<string, HealthCheckResult>;
  /** 总检查耗时 ms */
  totalDurationMs: number;
  /** 报告生成时间 */
  timestamp: Date;
  /** 运行中的服务版本 / 构建 ID */
  version: string;
  /** 正常 / 总检查数 */
  summary: { healthy: number; degraded: number; unhealthy: number; total: number };
}

export type HealthCheckProvider = () => HealthCheckInput | Promise<HealthCheckInput>;

/** Provider 返回的简化结构（不含自动填充字段） */
export interface HealthCheckInput {
  status: HealthStatus;
  message?: string;
  details?: Record<string, unknown>;
  error?: string;
}

export interface HealthCheckOptions {
  /** 单个检查超时 ms（默认 5000） */
  checkTimeoutMs?: number;
  /** 服务版本标识 */
  version?: string;
}

// ── 状态优先级（越大越严重） ────────────────────────────

const STATUS_PRIORITY: Record<HealthStatus, number> = {
  healthy: 0,
  degraded: 1,
  unhealthy: 2,
};

/** 取两个状态中更差的那个 */
function worstOf(a: HealthStatus, b: HealthStatus): HealthStatus {
  return STATUS_PRIORITY[a] >= STATUS_PRIORITY[b] ? a : b;
}

// ── 核心类 ──────────────────────────────────────────────

export class HealthCheckService {
  private providers = new Map<string, HealthCheckProvider>();
  private checkTimeoutMs: number;
  private version: string;

  constructor(options?: HealthCheckOptions) {
    this.checkTimeoutMs = options?.checkTimeoutMs ?? 5000;
    this.version = options?.version ?? '1.0.0';
  }

  // ── 注册 / 注销 ────────────────────────────────────────

  /**
   * 注册一个健康检查 Provider。
   * 如果 name 已存在则覆盖。
   */
  register(name: string, provider: HealthCheckProvider): void {
    this.providers.set(name, provider);
  }

  /** 注销指定检查 */
  deregister(name: string): boolean {
    return this.providers.delete(name);
  }

  /** 获取所有已注册的检查名称 */
  getRegisteredChecks(): string[] {
    return [...this.providers.keys()];
  }

  // ── 核心检查 ──────────────────────────────────────────

  /**
   * 执行所有已注册的健康检查，返回聚合报告。
   * 单个检查失败或超时不影响其他检查。
   */
  async check(): Promise<HealthReport> {
    const startTime = Date.now();
    const checks: Record<string, HealthCheckResult> = {};
    let aggregateStatus: HealthStatus = 'healthy';

    const entries = [...this.providers.entries()];

    // 并行执行所有检查
    const results = await Promise.allSettled(
      entries.map(async ([name, provider]) => {
        const checkStart = Date.now();
        try {
          // 带超时的执行
          const result = await Promise.race([
            Promise.resolve(provider()),
            this.createTimeout(name),
          ]);
          const durationMs = Date.now() - checkStart;
          return { name, result, durationMs };
        } catch (err) {
          const durationMs = Date.now() - checkStart;
          return {
            name,
            result: {
              status: 'unhealthy' as HealthStatus,
              error: err instanceof Error ? err.message : String(err),
            } as HealthCheckInput,
            durationMs,
          };
        }
      }),
    );

    // 汇总结果
    let healthy = 0;
    let degraded = 0;
    let unhealthy = 0;

    for (const settled of results) {
      if (settled.status === 'fulfilled') {
        const { name, result, durationMs } = settled.value;
        const checkResult: HealthCheckResult = {
          name,
          status: result.status,
          message: result.message,
          durationMs,
          details: result.details,
          checkedAt: new Date(),
          error: result.error,
        };
        checks[name] = checkResult;
        aggregateStatus = worstOf(aggregateStatus, result.status);

        if (result.status === 'healthy') healthy++;
        else if (result.status === 'degraded') degraded++;
        else unhealthy++;
      }
      // settled.status === 'rejected' 不应发生（内部已 catch），但防御性处理
    }

    return {
      status: aggregateStatus,
      checks,
      totalDurationMs: Date.now() - startTime,
      timestamp: new Date(),
      version: this.version,
      summary: { healthy, degraded, unhealthy, total: entries.length },
    };
  }

  // ── 私有方法 ──────────────────────────────────────────

  private createTimeout(name: string): Promise<never> {
    return new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error(`Health check "${name}" timed out after ${this.checkTimeoutMs}ms`)),
        this.checkTimeoutMs,
      ),
    );
  }
}
