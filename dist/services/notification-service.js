"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const DEFAULT_RULES = [
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
function renderTemplate(template, data) {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
        const val = data[key];
        return val !== undefined ? String(val) : `{{${key}}}`;
    });
}
let notifCounter = 0;
class NotificationService {
    constructor(eventBus, options) {
        this.notifications = [];
        this.subscriptions = [];
        this.eventBus = eventBus;
        this.maxHistory = options?.maxHistory ?? 500;
        this.rules = [...DEFAULT_RULES];
    }
    start() {
        for (const rule of this.rules) {
            for (const eventType of rule.eventTypes) {
                const sub = this.eventBus.on(eventType, (event) => {
                    void this.createFromEvent(event, rule);
                });
                this.subscriptions.push(sub);
            }
        }
        const wildcardSub = this.eventBus.onAny((event) => {
            const level = this.inferLevel(event.type);
            if (level === 'error' || level === 'critical') {
                const alreadyHandled = this.rules.some((r) => r.eventTypes.includes(event.type));
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
    stop() {
        for (const sub of this.subscriptions) {
            sub.unsubscribe();
        }
        this.subscriptions = [];
    }
    notify(input) {
        const notification = {
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
        if (this.notifications.length > this.maxHistory) {
            this.notifications = this.notifications.slice(-this.maxHistory);
        }
        notification.status = 'delivered';
        return notification;
    }
    getNotifications(filter = {}) {
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
            results = results.filter((n) => n.createdAt >= filter.since);
        }
        results.sort((a, b) => {
            const timeDiff = b.createdAt.getTime() - a.createdAt.getTime();
            if (timeDiff !== 0)
                return timeDiff;
            return b.id.localeCompare(a.id);
        });
        const limit = filter.limit ?? 50;
        return results.slice(0, limit);
    }
    markAsRead(notificationId) {
        const n = this.notifications.find((n) => n.id === notificationId);
        if (!n)
            return false;
        n.status = 'read';
        n.readAt = new Date();
        return true;
    }
    getUnreadCount(userId) {
        return this.notifications.filter((n) => n.userId === userId && n.status === 'delivered').length;
    }
    getNotificationsByUserAndStatus(userId, status) {
        return this.notifications.filter((n) => n.userId === userId && n.status === status).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    addRule(rule) {
        this.rules.push(rule);
    }
    getRules() {
        return [...this.rules];
    }
    getStats() {
        const byLevel = {};
        const byStatus = {};
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
    createFromEvent(event, rule) {
        const data = event;
        const errorSummary = data.errorMessage ?? data.error ?? '未知错误';
        const action = event.type === 'engine.registered' ? '已注册' : '已注销';
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
    inferLevel(eventType) {
        if (eventType.includes('fail') ||
            eventType.includes('failure')) {
            return 'error';
        }
        if (eventType.includes('circuit') || eventType.includes('deregistered')) {
            return 'warning';
        }
        return 'info';
    }
}
exports.NotificationService = NotificationService;
//# sourceMappingURL=notification-service.js.map