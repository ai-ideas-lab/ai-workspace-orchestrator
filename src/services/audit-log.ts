/**
 * AuditLogService - 审计日志服务
 *
 * 记录 AI Workspace Orchestrator 中所有关键操作的审计轨迹，
 * 支持 API 调用、工作流操作、权限变更等事件的持久化记录。
 *
 * 核心职责:
 *   1. log()          — 记录一条审计日志
 *   2. query()        — 按条件查询审计日志（支持分页、过滤）
 *   3. getStats()     — 获取审计统计信息
 *   4. exportLogs()   — 导出审计日志（JSON/CSV）
 *
 * 使用方式:
 *   const audit = AuditLogService.getInstance();
 *   audit.log({ action: 'workflow.created', actor: 'user_123', resource: 'wf_001' });
 *   const results = audit.query({ action: 'workflow.created' });
 */

import { EventBus } from './event-bus.js';

// ── 类型定义 ──────────────────────────────────────────────

/** 审计日志严重级别 */
export type AuditSeverity = 'info' | 'warn' | 'error' | 'critical';

/** 审计日志记录 */
export interface AuditEntry {
  /** 唯一 ID */
  id: string;
  /** 操作动作（如 workflow.created, user.login, permission.granted） */
  action: string;
  /** 操作者 ID */
  actor: string;
  /** 操作者类型 */
  actorType: 'user' | 'system' | 'api-key' | 'service';
  /** 目标资源类型 */
  resourceType: 'workflow' | 'template' | 'engine' | 'user' | 'dashboard' | 'system';
  /** 目标资源 ID */
  resourceId: string;
  /** 严重级别 */
  severity: AuditSeverity;
  /** 操作结果 */
  result: 'success' | 'failure' | 'denied';
  /** 详细描述 */
  message: string;
  /** 变更详情（before/after） */
  metadata?: Record<string, unknown>;
  /** 客户端 IP */
  ipAddress?: string;
  /** 请求 ID（链路追踪） */
  traceId?: string;
  /** 创建时间 */
  timestamp: Date;
}

/** 审计日志查询参数 */
export interface AuditQuery {
  /** 按动作过滤（支持前缀匹配，如 'workflow.' 匹配所有工作流操作） */
  action?: string;
  /** 按操作者过滤 */
  actor?: string;
  /** 按资源类型过滤 */
  resourceType?: AuditEntry['resourceType'];
  /** 按资源 ID 过滤 */
  resourceId?: string;
  /** 按严重级别过滤 */
  severity?: AuditSeverity;
  /** 按结果过滤 */
  result?: AuditEntry['result'];
  /** 起始时间 */
  from?: Date;
  /** 结束时间 */
  to?: Date;
  /** 分页偏移 */
  offset?: number;
  /** 每页数量（默认 50，最大 200） */
  limit?: number;
}

/** 审计统计信息 */
export interface AuditStats {
  /** 总日志条数 */
  totalEntries: number;
  /** 按动作分组统计 */
  byAction: Record<string, number>;
  /** 按严重级别分组统计 */
  bySeverity: Record<AuditSeverity, number>;
  /** 按结果分组统计 */
  byResult: Record<string, number>;
  /** 按资源类型分组统计 */
  byResourceType: Record<string, number>;
  /** 失败操作数 */
  failureCount: number;
  /** 最早记录时间 */
  earliestEntry?: Date;
  /** 最近记录时间 */
  latestEntry?: Date;
}

/** 审计日志服务配置 */
export interface AuditLogOptions {
  /** 内存中最大保留条数（默认 10000） */
  maxEntries?: number;
  /** 是否自动记录 EventBus 事件 */
  captureEventBus?: boolean;
}

/** 创建审计日志的输入参数（省略自动生成字段） */
export interface CreateAuditEntry {
  action: string;
  actor: string;
  actorType?: AuditEntry['actorType'];
  resourceType: AuditEntry['resourceType'];
  resourceId: string;
  severity?: AuditSeverity;
  result?: AuditEntry['result'];
  message: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  traceId?: string;
  /** 可选，用于测试注入固定时间 */
  timestamp?: Date;
}

// ── 主类 ─────────────────────────────────────────────────

export class AuditLogService {
  private entries: AuditEntry[] = [];
  private maxEntries: number;
  private idCounter = 0;
  private static instance: AuditLogService | null = null;
  private eventBusSub: { unsubscribe: () => void } | null = null;

  constructor(options?: AuditLogOptions) {
    this.maxEntries = options?.maxEntries ?? 10000;
  }

  /** 获取全局单例 */
  static getInstance(options?: AuditLogOptions): AuditLogService {
    if (!AuditLogService.instance) {
      AuditLogService.instance = new AuditLogService(options);
    }
    return AuditLogService.instance;
  }

  /** 重置单例（仅用于测试） */
  static resetInstance(): void {
    if (AuditLogService.instance?.eventBusSub) {
      AuditLogService.instance.eventBusSub.unsubscribe();
    }
    AuditLogService.instance = null;
  }

  /** 生成唯一 ID */
  private nextId(): string {
    this.idCounter++;
    return `audit_${Date.now()}_${this.idCounter}`;
  }

  // ── 核心操作 ────────────────────────────────────────────

  /**
   * 记录一条审计日志。
   * @returns 创建的 AuditEntry
   */
  log(input: CreateAuditEntry): AuditEntry {
    const entry: AuditEntry = {
      id: this.nextId(),
      action: input.action,
      actor: input.actor,
      actorType: input.actorType ?? 'user',
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      severity: input.severity ?? 'info',
      result: input.result ?? 'success',
      message: input.message,
      metadata: input.metadata,
      ipAddress: input.ipAddress,
      traceId: input.traceId,
      timestamp: input.timestamp ?? new Date(),
    };

    this.entries.push(entry);

    // 超出最大容量时移除最旧的记录
    if (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }

    return entry;
  }

  /**
   * 批量记录审计日志。
   */
  logBatch(inputs: CreateAuditEntry[]): AuditEntry[] {
    return inputs.map((input) => this.log(input));
  }

  // ── 查询 ────────────────────────────────────────────────

  /**
   * 按条件查询审计日志，支持分页。
   */
  query(params: AuditQuery = {}): { entries: AuditEntry[]; total: number } {
    let filtered = [...this.entries];

    // 按动作过滤（支持前缀匹配）
    if (params.action) {
      if (params.action.endsWith('.')) {
        filtered = filtered.filter((e) => e.action.startsWith(params.action!));
      } else {
        filtered = filtered.filter((e) => e.action === params.action);
      }
    }

    // 按操作者
    if (params.actor) {
      filtered = filtered.filter((e) => e.actor === params.actor);
    }

    // 按资源类型
    if (params.resourceType) {
      filtered = filtered.filter((e) => e.resourceType === params.resourceType);
    }

    // 按资源 ID
    if (params.resourceId) {
      filtered = filtered.filter((e) => e.resourceId === params.resourceId);
    }

    // 按严重级别
    if (params.severity) {
      filtered = filtered.filter((e) => e.severity === params.severity);
    }

    // 按结果
    if (params.result) {
      filtered = filtered.filter((e) => e.result === params.result);
    }

    // 按时间范围
    if (params.from) {
      filtered = filtered.filter((e) => e.timestamp >= params.from!);
    }
    if (params.to) {
      filtered = filtered.filter((e) => e.timestamp <= params.to!);
    }

    const total = filtered.length;
    const offset = params.offset ?? 0;
    const limit = Math.min(params.limit ?? 50, 200);

    const entries = filtered.slice(offset, offset + limit);

    return { entries, total };
  }

  /**
   * 按 ID 获取单条审计日志。
   */
  getById(id: string): AuditEntry | undefined {
    return this.entries.find((e) => e.id === id);
  }

  // ── 统计 ────────────────────────────────────────────────

  /**
   * 获取审计统计信息。
   */
  getStats(): AuditStats {
    const byAction: Record<string, number> = {};
    const bySeverity: Record<AuditSeverity, number> = { info: 0, warn: 0, error: 0, critical: 0 };
    const byResult: Record<string, number> = {};
    const byResourceType: Record<string, number> = {};
    let failureCount = 0;
    let earliest: Date | undefined;
    let latest: Date | undefined;

    for (const entry of this.entries) {
      // 按动作
      byAction[entry.action] = (byAction[entry.action] ?? 0) + 1;

      // 按严重级别
      bySeverity[entry.severity]++;

      // 按结果
      byResult[entry.result] = (byResult[entry.result] ?? 0) + 1;

      // 按资源类型
      byResourceType[entry.resourceType] = (byResourceType[entry.resourceType] ?? 0) + 1;

      // 失败数
      if (entry.result === 'failure' || entry.result === 'denied') {
        failureCount++;
      }

      // 时间范围
      if (!earliest || entry.timestamp < earliest) earliest = entry.timestamp;
      if (!latest || entry.timestamp > latest) latest = entry.timestamp;
    }

    return {
      totalEntries: this.entries.length,
      byAction,
      bySeverity,
      byResult,
      byResourceType,
      failureCount,
      earliestEntry: earliest,
      latestEntry: latest,
    };
  }

  // ── EventBus 集成 ──────────────────────────────────────

  /**
   * 自动将 EventBus 事件转化为审计日志。
   * 映射 EventBus 事件类型到审计动作。
   */
  startEventBusCapture(): void {
    const bus = EventBus.getInstance();
    const service = this;

    this.eventBusSub = bus.onAny((event) => {
      const actionMap: Record<string, string> = {
        'request.enqueued': 'request.enqueue',
        'request.dequeued': 'request.dequeue',
        'request.failed': 'request.fail',
        'engine.registered': 'engine.register',
        'engine.deregistered': 'engine.deregister',
        'engine.success': 'engine.call.success',
        'engine.failure': 'engine.call.failure',
        'circuit.state_changed': 'circuit.state_change',
        'circuit.reset': 'circuit.reset',
        'queue.cleared': 'queue.clear',
      };

      const action = actionMap[event.type] ?? `event.${event.type}`;

      const entry: CreateAuditEntry = {
        action,
        actor: (event as any).engineId ?? (event as any).requestId ?? 'system',
        actorType: 'system',
        resourceType: 'system',
        resourceId: (event as any).engineId ?? (event as any).requestId ?? 'unknown',
        severity: event.type.includes('failure') || event.type.includes('failed')
          ? 'error'
          : 'info',
        result: event.type.includes('failure') || event.type.includes('failed')
          ? 'failure'
          : 'success',
        message: `EventBus: ${event.type}`,
        metadata: { ...event },
      };

      service.log(entry);
    });
  }

  /**
   * 停止 EventBus 事件捕获。
   */
  stopEventBusCapture(): void {
    if (this.eventBusSub) {
      this.eventBusSub.unsubscribe();
      this.eventBusSub = null;
    }
  }

  // ── 导出 ────────────────────────────────────────────────

  /**
   * 导出审计日志为 JSON 字符串。
   */
  exportAsJson(params?: AuditQuery): string {
    const { entries } = params ? this.query(params) : { entries: this.entries };
    return JSON.stringify(entries, null, 2);
  }

  /**
   * 导出审计日志为 CSV 字符串。
   */
  exportAsCsv(params?: AuditQuery): string {
    const { entries } = params ? this.query(params) : { entries: this.entries };
    const headers = ['id', 'timestamp', 'action', 'actor', 'actorType', 'resourceType', 'resourceId', 'severity', 'result', 'message'];
    const rows = entries.map((e) =>
      [e.id, e.timestamp.toISOString(), e.action, e.actor, e.actorType, e.resourceType, e.resourceId, e.severity, e.result, `"${e.message.replace(/"/g, '""')}"`].join(',')
    );
    return [headers.join(','), ...rows].join('\n');
  }

  // ── 清理 ────────────────────────────────────────────────

  /** 清空所有审计日志 */
  clear(): void {
    this.entries = [];
    this.idCounter = 0;
  }

  /** 获取当前日志条数 */
  get size(): number {
    return this.entries.length;
  }
}
