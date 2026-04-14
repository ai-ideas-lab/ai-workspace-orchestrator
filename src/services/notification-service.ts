/**
 * NotificationService - 通知服务
 *
 * 订阅 EventBus 事件，根据用户配置的通知规则，
 * 将关键状态变更转化为结构化通知并记录历史。
 *
 * 核心职责:
 *   1. notify()        — 创建并存储一条通知，触发渠道投递
 *   2. getNotifications() — 按用户/类型/状态查询通知历史
 *
 * 使用方式:
 *   const ns = new NotificationService(eventBus);
 *   ns.start();                           // 自动订阅事件
 *   const notes = ns.getNotifications({ userId: 'u1' });
 */

import { EventBus, OrchestratorEvent, EventType } from './event-bus.js';

// ── 类型定义 ────────────────────────────────────────────

export type NotificationLevel = 'info' | 'warning' | 'error' | 'critical';
export type NotificationStatus = 'pending' | 'delivered' | 'read' | 'dismissed';
export type NotificationChannel = 'in-app' | 'webhook' | 'email';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  level: NotificationLevel;
  status: NotificationStatus;
  channel: NotificationChannel;
  sourceEventType: EventType;
  sourceEventId?: string;
  createdAt: Date;
  readAt?: Date;
  metadata: Record<string, unknown>;
}

export interface NotificationFilter {
  userId?: string;
  level?: NotificationLevel;
  status?: NotificationStatus;
  channel?: NotificationChannel;
  since?: Date;
  limit?: number;
}

export interface NotificationRule {
  eventTypes: EventType[];
  level: NotificationLevel;
  channel: NotificationChannel;
  titleTemplate: string;
  bodyTemplate: string;
}

// ── 默认通知规则 ─────────────────────────────────────────

const DEFAULT_RULES: NotificationRule[] = [
  {
    eventTypes: ['request.failed', 'engine.failure'],
    level: 'error',
    channel: 'in-app',
    titleTemplate: '任务执行失败',
    bodyTemplate: '事件 {{type}}：{{errorSummary}}',
  },
  {
    eventTypes: ['circuit.state_changed'],
    level: 'warning',
    channel: 'in-app',
    titleTemplate: '熔断器状态变更',
    bodyTemplate: '引擎 {{engineId}} 从 {{oldState}} 切换到 {{newState}}',
  },
  {
    eventTypes: ['engine.registered', 'engine.deregistered'],
    level: 'info',
    channel: 'in-app',
    titleTemplate: '引擎注册变更',
    bodyTemplate: '引擎 {{engineId}} {{action}}',
  },
];

// ── 简易模板引擎 ─────────────────────────────────────────

function renderTemplate(
  template: string,
  data: Record<string, unknown>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const val = data[key];
    return val !== undefined ? String(val) : `{{${key}}}`;
  });
}

// ── 主类 ────────────────────────────────────────────────

let notifCounter = 0;

export class NotificationService {
  private notifications: Notification[] = [];
  private rules: NotificationRule[];
  private subscriptions: Array<{ unsubscribe: () => void }> = [];
  private maxHistory: number;
  private eventBus: EventBus;

  constructor(eventBus: EventBus, options?: { maxHistory?: number }) {
    this.eventBus = eventBus;
    this.maxHistory = options?.maxHistory ?? 500;
    this.rules = [...DEFAULT_RULES];
  }

  // ── 生命周期 ────────────────────────────────────────────

  /** 订阅 EventBus 事件，开始自动生成通知 */
  start(): void {
    for (const rule of this.rules) {
      for (const eventType of rule.eventTypes) {
        const sub = this.eventBus.on(eventType, (event) => {
          void this.createFromEvent(event, rule);
        });
        this.subscriptions.push(sub);
      }
    }

    // 通配符监听：记录关键事件为通知
    const wildcardSub = this.eventBus.onAny((event) => {
      const level = this.inferLevel(event.type);
      if (level === 'error' || level === 'critical') {
        // 已通过规则处理的跳过
        const alreadyHandled = this.rules.some((r) =>
          r.eventTypes.includes(event.type),
        );
        if (!alreadyHandled) {
          void this.createFromEvent(event, {
            eventTypes: [event.type],
            level,
            channel: 'in-app',
            titleTemplate: '系统事件',
            bodyTemplate: '{{type}}',
          });
        }
      }
    });
    this.subscriptions.push(wildcardSub);
  }

  /** 停止订阅 */
  stop(): void {
    for (const sub of this.subscriptions) {
      sub.unsubscribe();
    }
    this.subscriptions = [];
  }

  // ── 核心方法 ────────────────────────────────────────────

  /**
   * 创建一条通知并存储。
   * 返回创建的 Notification 对象。
   */
  notify(input: {
    userId: string;
    title: string;
    body: string;
    level: NotificationLevel;
    channel?: NotificationChannel;
    sourceEventType: EventType;
    metadata?: Record<string, unknown>;
  }): Notification {
    const notification: Notification = {
      id: `notif_${++notifCounter}_${Date.now()}`,
      userId: input.userId,
      title: input.title,
      body: input.body,
      level: input.level,
      status: 'pending',
      channel: input.channel ?? 'in-app',
      sourceEventType: input.sourceEventType,
      createdAt: new Date(),
      metadata: input.metadata ?? {},
    };

    this.notifications.push(notification);

    // 裁剪历史
    if (this.notifications.length > this.maxHistory) {
      this.notifications = this.notifications.slice(-this.maxHistory);
    }

    // 标记投递（简化：同步标记为 delivered）
    notification.status = 'delivered';

    return notification;
  }

  /**
   * 按条件查询通知历史，支持分页。
   * 默认按 createdAt 降序返回最近的记录。
   */
  getNotifications(filter: NotificationFilter = {}): Notification[] {
    let results = [...this.notifications];

    if (filter.userId) {
      results = results.filter((n) => n.userId === filter.userId);
    }
    if (filter.level) {
      results = results.filter((n) => n.level === filter.level);
    }
    if (filter.status) {
      results = results.filter((n) => n.status === filter.status);
    }
    if (filter.channel) {
      results = results.filter((n) => n.channel === filter.channel);
    }
    if (filter.since) {
      results = results.filter((n) => n.createdAt >= filter.since!);
    }

    // 按时间降序；时间相同时按 ID 降序（ID 含自增计数器，保证稳定排序）
    results.sort((a, b) => {
      const timeDiff = b.createdAt.getTime() - a.createdAt.getTime();
      if (timeDiff !== 0) return timeDiff;
      return b.id.localeCompare(a.id);
    });

    const limit = filter.limit ?? 50;
    return results.slice(0, limit);
  }

  /** 标记通知为已读 */
  markAsRead(notificationId: string): boolean {
    const n = this.notifications.find((n) => n.id === notificationId);
    if (!n) return false;
    n.status = 'read';
    n.readAt = new Date();
    return true;
  }

  /** 获取未读通知数量 */
  getUnreadCount(userId: string): number {
    return this.notifications.filter(
      (n) => n.userId === userId && n.status === 'delivered',
    ).length;
  }

  /** 按用户和状态组合查询通知（优化版） */
  getNotificationsByUserAndStatus(userId: string, status: NotificationStatus): Notification[] {
    return this.notifications.filter(
      (n) => n.userId === userId && n.status === status
    ).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // ── 规则管理 ────────────────────────────────────────────

  /** 添加自定义通知规则 */
  addRule(rule: NotificationRule): void {
    this.rules.push(rule);
  }

  /** 获取当前生效的规则列表 */
  getRules(): NotificationRule[] {
    return [...this.rules];
  }

  // ── 统计 ────────────────────────────────────────────────

  /** 获取通知统计数据 */
  getStats(): {
    total: number;
    byLevel: Record<string, number>;
    byStatus: Record<string, number>;
  } {
    const byLevel: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    for (const n of this.notifications) {
      byLevel[n.level] = (byLevel[n.level] ?? 0) + 1;
      byStatus[n.status] = (byStatus[n.status] ?? 0) + 1;
    }

    return {
      total: this.notifications.length,
      byLevel,
      byStatus,
    };
  }

  // ── 内部方法 ────────────────────────────────────────────

  private createFromEvent(
    event: OrchestratorEvent,
    rule: NotificationRule,
  ): Notification {
    const data = event as unknown as Record<string, unknown>;
    const errorSummary = data.errorMessage ?? data.error ?? '未知错误';
    const action =
      event.type === 'engine.registered' ? '已注册' : '已注销';

    return this.notify({
      userId: 'system',
      title: renderTemplate(rule.titleTemplate, {
        ...data,
        action,
        errorSummary,
      }),
      body: renderTemplate(rule.bodyTemplate, {
        ...data,
        action,
        errorSummary,
      }),
      level: rule.level,
      channel: rule.channel,
      sourceEventType: event.type,
      metadata: { eventTimestamp: event.timestamp },
    });
  }

  private inferLevel(eventType: EventType): NotificationLevel {
    if (
      eventType.includes('fail') ||
      eventType.includes('failure')
    ) {
      return 'error';
    }
    if (eventType.includes('circuit') || eventType.includes('deregistered')) {
      return 'warning';
    }
    return 'info';
  }
}
