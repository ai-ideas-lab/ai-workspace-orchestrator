/**
 * NotificationService 单元测试
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { EventBus } from '../services/event-bus'';
import { NotificationService } from '../services/notification-service'';

describe('NotificationService', () => {
  let bus: EventBus;
  let service: NotificationService;

  beforeEach(() => {
    EventBus.resetInstance();
    bus = EventBus.getInstance();
    service = new NotificationService(bus, { maxHistory: 100 });
  });

  // ── notify() ────────────────────────────────────────────

  describe('notify()', () => {
    it('应创建通知并标记为 delivered', () => {
      const n = service.notify({
        userId: 'user_1',
        title: '测试通知',
        body: '这是一条测试通知',
        level: 'info',
        sourceEventType: 'engine.registered',
      });

      expect(n.id).toMatch(/^notif_/);
      expect(n.userId).toBe('user_1');
      expect(n.title).toBe('测试通知');
      expect(n.status).toBe('delivered');
      expect(n.createdAt).toBeInstanceOf(Date);
    });

    it('应使用默认 channel=in-app', () => {
      const n = service.notify({
        userId: 'user_1',
        title: 'test',
        body: 'body',
        level: 'warning',
        sourceEventType: 'circuit.state_changed',
      });

      expect(n.channel).toBe('in-app');
    });

    it('应在超过 maxHistory 时自动裁剪', () => {
      const small = new NotificationService(bus, { maxHistory: 3 });
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
      expect(all).toHaveLength(3);
      // 应保留最新的
      expect(all[0].title).toBe('n4');
    });
  });

  // ── getNotifications() ──────────────────────────────────

  describe('getNotifications()', () => {
    beforeEach(() => {
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

    it('按 userId 过滤', () => {
      const alice = service.getNotifications({ userId: 'alice' });
      expect(alice).toHaveLength(2);
      expect(alice.every((n) => n.userId === 'alice')).toBe(true);
    });

    it('按 level 过滤', () => {
      const errors = service.getNotifications({ level: 'error' });
      expect(errors).toHaveLength(1);
      expect(errors[0].title).toBe('t2');
    });

    it('按 status 过滤', () => {
      const delivered = service.getNotifications({ status: 'delivered' });
      expect(delivered).toHaveLength(3);
    });

    it('支持 limit 分页', () => {
      const limited = service.getNotifications({ limit: 2 });
      expect(limited).toHaveLength(2);
    });

    it('按时间降序排列', () => {
      const all = service.getNotifications();
      expect(all[0].title).toBe('t3'); // 最新的在前
      expect(all[2].title).toBe('t1');
    });

    it('支持 since 时间过滤', () => {
      const future = new Date(Date.now() + 100000);
      const none = service.getNotifications({ since: future });
      expect(none).toHaveLength(0);
    });

    it('空过滤返回所有（上限 50）', () => {
      const all = service.getNotifications();
      expect(all).toHaveLength(3);
    });
  });

  // ── markAsRead() & getUnreadCount() ─────────────────────

  describe('markAsRead()', () => {
    it('应标记已读并更新 unreadCount', () => {
      const n = service.notify({
        userId: 'u1',
        title: 'test',
        body: '',
        level: 'info',
        sourceEventType: 'engine.registered',
      });

      expect(service.getUnreadCount('u1')).toBe(1);
      const ok = service.markAsRead(n.id);
      expect(ok).toBe(true);
      expect(service.getUnreadCount('u1')).toBe(0);
    });

    it('对不存在的 ID 返回 false', () => {
      expect(service.markAsRead('nonexistent')).toBe(false);
    });
  });

  // ── 事件驱动通知 ────────────────────────────────────────

  describe('event-driven notifications', () => {
    it('订阅 EventBus 事件后自动生成通知', () => {
      service.start();

      bus.emit({
        type: 'request.failed',
        requestId: 'req_1',
        engineId: 'gpt-4',
        error: 'timeout',
      });

      const notes = service.getNotifications();
      expect(notes.length).toBeGreaterThanOrEqual(1);
      const failed = notes.find((n) =>
        n.sourceEventType === 'request.failed',
      );
      expect(failed).toBeDefined();
      expect(failed!.level).toBe('error');

      service.stop();
    });

    it('熔断器事件生成 warning 通知', () => {
      service.start();

      bus.emit({
        type: 'circuit.state_changed',
        engineId: 'engine_a',
        oldState: 'closed',
        newState: 'open',
      });

      const notes = service.getNotifications();
      const circuit = notes.find((n) =>
        n.sourceEventType === 'circuit.state_changed',
      );
      expect(circuit).toBeDefined();
      expect(circuit!.level).toBe('warning');
      expect(circuit!.body).toContain('engine_a');

      service.stop();
    });

    it('stop() 后不再接收事件', () => {
      service.start();
      service.stop();

      bus.emit({
        type: 'engine.registered',
        engineId: 'e1',
        weight: 100,
      });

      expect(service.getNotifications()).toHaveLength(0);
    });
  });

  // ── 规则管理 ─────────────────────────────────────────────

  describe('规则管理', () => {
    it('addRule 添加自定义规则', () => {
      service.addRule({
        eventTypes: ['engine.success'],
        level: 'info',
        channel: 'webhook',
        titleTemplate: '引擎成功',
        bodyTemplate: '{{engineId}} 响应 {{responseTimeMs}}ms',
      });

      const rules = service.getRules();
      expect(rules.length).toBeGreaterThan(3); // 3 default + 1 custom
      const custom = rules.find((r) =>
        r.eventTypes.includes('engine.success'),
      );
      expect(custom).toBeDefined();
      expect(custom!.channel).toBe('webhook');
    });
  });

  // ── 统计 ────────────────────────────────────────────────

  describe('getStats()', () => {
    it('返回正确的统计数据', () => {
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
      expect(stats.total).toBe(2);
      expect(stats.byLevel.info).toBe(1);
      expect(stats.byLevel.error).toBe(1);
      expect(stats.byStatus.delivered).toBe(2);
    });
  });
});
