"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const event_bus_1 = require("../services/event-bus");
const notification_service_1 = require("../services/notification-service");
(0, globals_1.describe)('NotificationService', () => {
    let bus;
    let service;
    (0, globals_1.beforeEach)(() => {
        event_bus_1.EventBus.resetInstance();
        bus = event_bus_1.EventBus.getInstance();
        service = new notification_service_1.NotificationService(bus, { maxHistory: 100 });
    });
    (0, globals_1.describe)('notify()', () => {
        (0, globals_1.it)('应创建通知并标记为 delivered', () => {
            const n = service.notify({
                userId: 'user_1',
                title: '测试通知',
                body: '这是一条测试通知',
                level: 'info',
                sourceEventType: 'engine.registered',
            });
            (0, globals_1.expect)(n.id).toMatch(/^notif_/);
            (0, globals_1.expect)(n.userId).toBe('user_1');
            (0, globals_1.expect)(n.title).toBe('测试通知');
            (0, globals_1.expect)(n.status).toBe('delivered');
            (0, globals_1.expect)(n.createdAt).toBeInstanceOf(Date);
        });
        (0, globals_1.it)('应使用默认 channel=in-app', () => {
            const n = service.notify({
                userId: 'user_1',
                title: 'test',
                body: 'body',
                level: 'warning',
                sourceEventType: 'circuit.state_changed',
            });
            (0, globals_1.expect)(n.channel).toBe('in-app');
        });
        (0, globals_1.it)('应在超过 maxHistory 时自动裁剪', () => {
            const small = new notification_service_1.NotificationService(bus, { maxHistory: 3 });
            for (let i = 0; i < 5; i++) {
                small.notify({
                    userId: 'u',
                    title: `n${i}`,
                    body: '',
                    level: 'info',
                    sourceEventType: 'engine.registered',
                });
            }
            const all = small.getNotifications({ limit: 10 });
            (0, globals_1.expect)(all).toHaveLength(3);
            (0, globals_1.expect)(all[0].title).toBe('n4');
        });
    });
    (0, globals_1.describe)('getNotifications()', () => {
        (0, globals_1.beforeEach)(() => {
            service.notify({
                userId: 'alice',
                title: 't1',
                body: 'b1',
                level: 'info',
                sourceEventType: 'engine.registered',
            });
            service.notify({
                userId: 'bob',
                title: 't2',
                body: 'b2',
                level: 'error',
                sourceEventType: 'request.failed',
            });
            service.notify({
                userId: 'alice',
                title: 't3',
                body: 'b3',
                level: 'warning',
                sourceEventType: 'circuit.state_changed',
            });
        });
        (0, globals_1.it)('按 userId 过滤', () => {
            const alice = service.getNotifications({ userId: 'alice' });
            (0, globals_1.expect)(alice).toHaveLength(2);
            (0, globals_1.expect)(alice.every((n) => n.userId === 'alice')).toBe(true);
        });
        (0, globals_1.it)('按 level 过滤', () => {
            const errors = service.getNotifications({ level: 'error' });
            (0, globals_1.expect)(errors).toHaveLength(1);
            (0, globals_1.expect)(errors[0].title).toBe('t2');
        });
        (0, globals_1.it)('按 status 过滤', () => {
            const delivered = service.getNotifications({ status: 'delivered' });
            (0, globals_1.expect)(delivered).toHaveLength(3);
        });
        (0, globals_1.it)('支持 limit 分页', () => {
            const limited = service.getNotifications({ limit: 2 });
            (0, globals_1.expect)(limited).toHaveLength(2);
        });
        (0, globals_1.it)('按时间降序排列', () => {
            const all = service.getNotifications();
            (0, globals_1.expect)(all[0].title).toBe('t3');
            (0, globals_1.expect)(all[2].title).toBe('t1');
        });
        (0, globals_1.it)('支持 since 时间过滤', () => {
            const future = new Date(Date.now() + 100000);
            const none = service.getNotifications({ since: future });
            (0, globals_1.expect)(none).toHaveLength(0);
        });
        (0, globals_1.it)('空过滤返回所有（上限 50）', () => {
            const all = service.getNotifications();
            (0, globals_1.expect)(all).toHaveLength(3);
        });
    });
    (0, globals_1.describe)('markAsRead()', () => {
        (0, globals_1.it)('应标记已读并更新 unreadCount', () => {
            const n = service.notify({
                userId: 'u1',
                title: 'test',
                body: '',
                level: 'info',
                sourceEventType: 'engine.registered',
            });
            (0, globals_1.expect)(service.getUnreadCount('u1')).toBe(1);
            const ok = service.markAsRead(n.id);
            (0, globals_1.expect)(ok).toBe(true);
            (0, globals_1.expect)(service.getUnreadCount('u1')).toBe(0);
        });
        (0, globals_1.it)('对不存在的 ID 返回 false', () => {
            (0, globals_1.expect)(service.markAsRead('nonexistent')).toBe(false);
        });
    });
    (0, globals_1.describe)('event-driven notifications', () => {
        (0, globals_1.it)('订阅 EventBus 事件后自动生成通知', () => {
            service.start();
            bus.emit({
                type: 'request.failed',
                requestId: 'req_1',
                engineId: 'gpt-4',
                error: 'timeout',
            });
            const notes = service.getNotifications();
            (0, globals_1.expect)(notes.length).toBeGreaterThanOrEqual(1);
            const failed = notes.find((n) => n.sourceEventType === 'request.failed');
            (0, globals_1.expect)(failed).toBeDefined();
            (0, globals_1.expect)(failed.level).toBe('error');
            service.stop();
        });
        (0, globals_1.it)('熔断器事件生成 warning 通知', () => {
            service.start();
            bus.emit({
                type: 'circuit.state_changed',
                engineId: 'engine_a',
                oldState: 'closed',
                newState: 'open',
            });
            const notes = service.getNotifications();
            const circuit = notes.find((n) => n.sourceEventType === 'circuit.state_changed');
            (0, globals_1.expect)(circuit).toBeDefined();
            (0, globals_1.expect)(circuit.level).toBe('warning');
            (0, globals_1.expect)(circuit.body).toContain('engine_a');
            service.stop();
        });
        (0, globals_1.it)('stop() 后不再接收事件', () => {
            service.start();
            service.stop();
            bus.emit({
                type: 'engine.registered',
                engineId: 'e1',
                weight: 100,
            });
            (0, globals_1.expect)(service.getNotifications()).toHaveLength(0);
        });
    });
    (0, globals_1.describe)('规则管理', () => {
        (0, globals_1.it)('addRule 添加自定义规则', () => {
            service.addRule({
                eventTypes: ['engine.success'],
                level: 'info',
                channel: 'webhook',
                titleTemplate: '引擎成功',
                bodyTemplate: '{{engineId}} 响应 {{responseTimeMs}}ms',
            });
            const rules = service.getRules();
            (0, globals_1.expect)(rules.length).toBeGreaterThan(3);
            const custom = rules.find((r) => r.eventTypes.includes('engine.success'));
            (0, globals_1.expect)(custom).toBeDefined();
            (0, globals_1.expect)(custom.channel).toBe('webhook');
        });
    });
    (0, globals_1.describe)('getStats()', () => {
        (0, globals_1.it)('返回正确的统计数据', () => {
            service.notify({
                userId: 'u1',
                title: 'a',
                body: '',
                level: 'info',
                sourceEventType: 'engine.registered',
            });
            service.notify({
                userId: 'u1',
                title: 'b',
                body: '',
                level: 'error',
                sourceEventType: 'request.failed',
            });
            const stats = service.getStats();
            (0, globals_1.expect)(stats.total).toBe(2);
            (0, globals_1.expect)(stats.byLevel.info).toBe(1);
            (0, globals_1.expect)(stats.byLevel.error).toBe(1);
            (0, globals_1.expect)(stats.byStatus.delivered).toBe(2);
        });
    });
});
//# sourceMappingURL=notification-service.test.js.map