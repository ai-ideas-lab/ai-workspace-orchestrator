/**
 * HealthCheckService 单元测试
 *
 * 覆盖：Provider 注册/注销、同步/异步检查、聚合状态、超时保护、边界条件
 */

import { HealthCheckService, HealthReport } from '../services/health-check';

// ── 辅助 ──────────────────────────────────────────────

function makeService(opts?: { checkTimeoutMs?: number; version?: string }) {
  return new HealthCheckService({
    checkTimeoutMs: 200, // 测试用短超时
    version: 'test-1.0',
    ...opts,
  });
}

// ── 测试 ──────────────────────────────────────────────

describe('HealthCheckService', () => {
  describe('register / deregister', () => {
    it('应注册 Provider 并在 getRegisteredChecks 中列出', () => {
      const hc = makeService();
      hc.register('db', () => ({ status: 'healthy' }));
      expect(hc.getRegisteredChecks()).toEqual(['db']);
    });

    it('应支持多个 Provider', () => {
      const hc = makeService();
      hc.register('a', () => ({ status: 'healthy' }));
      hc.register('b', () => ({ status: 'degraded' }));
      expect(hc.getRegisteredChecks()).toEqual(['a', 'b']);
    });

    it('deregister 应移除指定 Provider', () => {
      const hc = makeService();
      hc.register('x', () => ({ status: 'healthy' }));
      expect(hc.deregister('x')).toBe(true);
      expect(hc.getRegisteredChecks()).toEqual([]);
    });

    it('deregister 不存在的名称应返回 false', () => {
      const hc = makeService();
      expect(hc.deregister('nope')).toBe(false);
    });

    it('重复 register 应覆盖旧 Provider', () => {
      const hc = makeService();
      hc.register('svc', () => ({ status: 'healthy' }));
      hc.register('svc', () => ({ status: 'unhealthy' }));
      expect(hc.getRegisteredChecks()).toEqual(['svc']);
      // 验证已覆盖
      return expect(
        hc.check().then((r) => r.checks['svc']!.status),
      ).resolves.toBe('unhealthy');
    });
  });

  describe('check() - 同步 Provider', () => {
    it('所有 healthy → 聚合状态为 healthy', async () => {
      const hc = makeService();
      hc.register('db', () => ({ status: 'healthy', message: 'PostgreSQL OK' }));
      hc.register('cache', () => ({ status: 'healthy' }));

      const report = await hc.check();

      expect(report.status).toBe('healthy');
      expect(report.summary).toEqual({ healthy: 2, degraded: 0, unhealthy: 0, total: 2 });
      expect(report.checks['db']!.message).toBe('PostgreSQL OK');
      expect(report.checks['db']!.durationMs).toBeGreaterThanOrEqual(0);
      expect(report.checks['db']!.checkedAt).toBeInstanceOf(Date);
    });

    it('单个 degraded → 聚合状态为 degraded', async () => {
      const hc = makeService();
      hc.register('db', () => ({ status: 'healthy' }));
      hc.register('redis', () => ({ status: 'degraded', message: 'High latency' }));

      const report = await hc.check();

      expect(report.status).toBe('degraded');
      expect(report.summary.degraded).toBe(1);
    });

    it('单个 unhealthy → 聚合状态为 unhealthy', async () => {
      const hc = makeService();
      hc.register('db', () => ({ status: 'healthy' }));
      hc.register('mq', () => ({ status: 'unhealthy', message: 'Connection refused' }));

      const report = await hc.check();

      expect(report.status).toBe('unhealthy');
      expect(report.summary.unhealthy).toBe(1);
    });

    it('degraded + unhealthy → 聚合为 unhealthy（取最差）', async () => {
      const hc = makeService();
      hc.register('a', () => ({ status: 'degraded' }));
      hc.register('b', () => ({ status: 'unhealthy' }));

      const report = await hc.check();

      expect(report.status).toBe('unhealthy');
    });
  });

  describe('check() - 异步 Provider', () => {
    it('应正确处理 Promise Provider', async () => {
      const hc = makeService();
      hc.register('api', async () => {
        await new Promise((r) => setTimeout(r, 10));
        return { status: 'healthy', message: 'API OK' };
      });

      const report = await hc.check();

      expect(report.status).toBe('healthy');
      expect(report.checks['api']!.durationMs).toBeGreaterThanOrEqual(10);
    });
  });

  describe('check() - 错误处理', () => {
    it('Provider 抛异常应标记为 unhealthy 并记录 error', async () => {
      const hc = makeService();
      hc.register('broken', () => {
        throw new Error('Something broke');
      });

      const report = await hc.check();

      expect(report.status).toBe('unhealthy');
      expect(report.checks['broken']!.error).toBe('Something broke');
      expect(report.summary.unhealthy).toBe(1);
    });

    it('异步 Provider reject 应标记为 unhealthy', async () => {
      const hc = makeService();
      hc.register('async-broken', async () => {
        throw new Error('Async fail');
      });

      const report = await hc.check();

      expect(report.status).toBe('unhealthy');
      expect(report.checks['async-broken']!.error).toBe('Async fail');
    });
  });

  describe('check() - 超时保护', () => {
    it('超时的 Provider 应标记为 unhealthy', async () => {
      const hc = makeService({ checkTimeoutMs: 50 });
      hc.register('slow', async () => {
        await new Promise((r) => setTimeout(r, 500));
        return { status: 'healthy' };
      });

      const report = await hc.check();

      expect(report.status).toBe('unhealthy');
      expect(report.checks['slow']!.error).toContain('timed out');
    });

    it('超时不影响其他正常 Provider', async () => {
      const hc = makeService({ checkTimeoutMs: 50 });
      hc.register('fast', () => ({ status: 'healthy' }));
      hc.register('slow', async () => {
        await new Promise((r) => setTimeout(r, 500));
        return { status: 'healthy' };
      });

      const report = await hc.check();

      expect(report.checks['fast']!.status).toBe('healthy');
      expect(report.checks['slow']!.status).toBe('unhealthy');
    });
  });

  describe('report 元数据', () => {
    it('应包含 version、timestamp 和 totalDurationMs', async () => {
      const hc = makeService({ version: 'v2.0-test' });
      hc.register('x', () => ({ status: 'healthy' }));

      const report = await hc.check();

      expect(report.version).toBe('v2.0-test');
      expect(report.timestamp).toBeInstanceOf(Date);
      expect(report.totalDurationMs).toBeGreaterThanOrEqual(0);
    });

    it('无 Provider 时应返回 healthy（空报告）', async () => {
      const hc = makeService();
      const report = await hc.check();

      expect(report.status).toBe('healthy');
      expect(report.summary).toEqual({ healthy: 0, degraded: 0, unhealthy: 0, total: 0 });
      expect(Object.keys(report.checks)).toHaveLength(0);
    });
  });

  describe('details 传递', () => {
    it('应正确传递 details 元数据', async () => {
      const hc = makeService();
      hc.register('db', () => ({
        status: 'healthy',
        details: { connections: 10, idle: 5, version: '15.2' },
      }));

      const report = await hc.check();

      expect(report.checks['db']!.details).toEqual({
        connections: 10,
        idle: 5,
        version: '15.2',
      });
    });
  });

  describe('并行执行', () => {
    it('多个 Provider 应并行执行而非串行', async () => {
      const hc = makeService();
      hc.register('a', async () => {
        await new Promise((r) => setTimeout(r, 50));
        return { status: 'healthy' };
      });
      hc.register('b', async () => {
        await new Promise((r) => setTimeout(r, 50));
        return { status: 'healthy' };
      });
      hc.register('c', async () => {
        await new Promise((r) => setTimeout(r, 50));
        return { status: 'healthy' };
      });

      const report = await hc.check();

      // 并行执行总耗时应远小于 150ms
      expect(report.totalDurationMs).toBeLessThan(150);
      expect(report.summary.healthy).toBe(3);
    });
  });
});
