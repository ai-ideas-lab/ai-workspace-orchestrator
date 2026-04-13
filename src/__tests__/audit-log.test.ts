/**
 * AuditLogService 单元测试
 *
 * 验证审计日志的记录、查询、统计、EventBus 集成和导出功能。
 */

import { AuditLogService, AuditEntry, CreateAuditEntry } from '../services/audit-log'.ts';
import { EventBus } from '../services/event-bus'.ts';

// ── 测试辅助 ──────────────────────────────────────────────

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(`ASSERT FAIL: ${msg}`);
}

function assertEqual<T>(actual: T, expected: T, label: string) {
  if (actual !== expected) {
    throw new Error(`ASSERT FAIL [${label}]: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function createService(options?: { maxEntries?: number }): AuditLogService {
  AuditLogService.resetInstance();
  return new AuditLogService({ maxEntries: options?.maxEntries ?? 100 });
}

/** 创建一条测试审计日志 */
function sampleEntry(overrides: Partial<CreateAuditEntry> = {}): CreateAuditEntry {
  return {
    action: 'workflow.created',
    actor: 'user_001',
    actorType: 'user',
    resourceType: 'workflow',
    resourceId: 'wf_001',
    severity: 'info',
    result: 'success',
    message: '创建工作流',
    ...overrides,
  };
}

// ── 测试 1: log 基本记录 ──────────────────────────────────

function testLogBasic() {
  const service = createService();

  const entry = service.log(sampleEntry());

  assertEqual(entry.action, 'workflow.created', 'action');
  assertEqual(entry.actor, 'user_001', 'actor');
  assertEqual(entry.actorType, 'user', 'actorType');
  assertEqual(entry.resourceType, 'workflow', 'resourceType');
  assertEqual(entry.resourceId, 'wf_001', 'resourceId');
  assertEqual(entry.severity, 'info', 'severity');
  assertEqual(entry.result, 'success', 'result');
  assert(entry.id.startsWith('audit_'), 'id format');
  assert(entry.timestamp instanceof Date, 'timestamp is Date');
  assertEqual(service.size, 1, 'size after log');
  console.log('  ✅ testLogBasic passed');
}

// ── 测试 2: logBatch 批量记录 ─────────────────────────────

function testLogBatch() {
  const service = createService();

  const entries = service.logBatch([
    sampleEntry({ action: 'workflow.created', resourceId: 'wf_001' }),
    sampleEntry({ action: 'workflow.updated', resourceId: 'wf_002' }),
    sampleEntry({ action: 'workflow.deleted', resourceId: 'wf_003', severity: 'warn' }),
  ]);

  assertEqual(entries.length, 3, 'batch count');
  assertEqual(service.size, 3, 'size after batch');
  assertEqual(entries[0].action, 'workflow.created', 'batch[0] action');
  assertEqual(entries[2].severity, 'warn', 'batch[2] severity');
  console.log('  ✅ testLogBatch passed');
}

// ── 测试 3: 默认值填充 ────────────────────────────────────

function testDefaults() {
  const service = createService();

  const entry = service.log({
    action: 'user.login',
    actor: 'user_002',
    resourceType: 'user',
    resourceId: 'user_002',
    message: '用户登录',
  });

  assertEqual(entry.actorType, 'user', 'default actorType');
  assertEqual(entry.severity, 'info', 'default severity');
  assertEqual(entry.result, 'success', 'default result');
  console.log('  ✅ testDefaults passed');
}

// ── 测试 4: query 精确匹配过滤 ────────────────────────────

function testQueryExactMatch() {
  const service = createService();

  service.logBatch([
    sampleEntry({ action: 'workflow.created', actor: 'user_001', resourceId: 'wf_001' }),
    sampleEntry({ action: 'workflow.updated', actor: 'user_002', resourceId: 'wf_002' }),
    sampleEntry({ action: 'workflow.deleted', actor: 'user_001', resourceId: 'wf_003', result: 'failure' }),
    sampleEntry({ action: 'template.created', actor: 'user_003', resourceType: 'template', resourceId: 'tpl_001' }),
  ]);

  // 按动作精确匹配
  const r1 = service.query({ action: 'workflow.created' });
  assertEqual(r1.total, 1, 'query by action');
  assertEqual(r1.entries[0].action, 'workflow.created', 'entry action');

  // 按操作者
  const r2 = service.query({ actor: 'user_001' });
  assertEqual(r2.total, 2, 'query by actor');

  // 按结果
  const r3 = service.query({ result: 'failure' });
  assertEqual(r3.total, 1, 'query by result');
  assertEqual(r3.entries[0].action, 'workflow.deleted', 'failure action');

  // 按资源类型
  const r4 = service.query({ resourceType: 'template' });
  assertEqual(r4.total, 1, 'query by resourceType');

  console.log('  ✅ testQueryExactMatch passed');
}

// ── 测试 5: query 前缀匹配（action 以 '.' 结尾） ─────────

function testQueryPrefixMatch() {
  const service = createService();

  service.logBatch([
    sampleEntry({ action: 'workflow.created' }),
    sampleEntry({ action: 'workflow.updated' }),
    sampleEntry({ action: 'workflow.deleted' }),
    sampleEntry({ action: 'template.created', resourceType: 'template' }),
  ]);

  // 前缀匹配 "workflow."
  const r = service.query({ action: 'workflow.' });
  assertEqual(r.total, 3, 'prefix match count');

  console.log('  ✅ testQueryPrefixMatch passed');
}

// ── 测试 6: query 分页 ────────────────────────────────────

function testQueryPagination() {
  const service = createService();

  for (let i = 0; i < 10; i++) {
    service.log(sampleEntry({ action: 'workflow.created', resourceId: `wf_${i}` }));
  }

  // 第1页
  const page1 = service.query({ action: 'workflow.created', offset: 0, limit: 3 });
  assertEqual(page1.total, 10, 'total count');
  assertEqual(page1.entries.length, 3, 'page1 entries');

  // 第2页
  const page2 = service.query({ action: 'workflow.created', offset: 3, limit: 3 });
  assertEqual(page2.entries.length, 3, 'page2 entries');
  assert(page2.entries[0].resourceId !== page1.entries[0].resourceId, 'different entries');

  // 最后一页
  const last = service.query({ action: 'workflow.created', offset: 9, limit: 3 });
  assertEqual(last.entries.length, 1, 'last page entries');
  assertEqual(last.total, 10, 'total still 10');

  console.log('  ✅ testQueryPagination passed');
}

// ── 测试 7: query 时间范围过滤 ────────────────────────────

function testQueryTimeRange() {
  const service = createService();

  const t1 = new Date('2026-01-01T10:00:00Z');
  const t2 = new Date('2026-02-01T10:00:00Z');
  const t3 = new Date('2026-03-01T10:00:00Z');

  service.log(sampleEntry({ resourceId: 'wf_jan', timestamp: t1 }));
  service.log(sampleEntry({ resourceId: 'wf_feb', timestamp: t2 }));
  service.log(sampleEntry({ resourceId: 'wf_mar', timestamp: t3 }));

  // from 过滤
  const r1 = service.query({ from: new Date('2026-02-01T00:00:00Z') });
  assertEqual(r1.total, 2, 'from filter');

  // to 过滤
  const r2 = service.query({ to: new Date('2026-02-01T20:00:00Z') });
  assertEqual(r2.total, 2, 'to filter');

  // 范围
  const r3 = service.query({
    from: new Date('2026-01-15T00:00:00Z'),
    to: new Date('2026-02-15T00:00:00Z'),
  });
  assertEqual(r3.total, 1, 'range filter');
  assertEqual(r3.entries[0].resourceId, 'wf_feb', 'range entry');

  console.log('  ✅ testQueryTimeRange passed');
}

// ── 测试 8: getById ───────────────────────────────────────

function testGetById() {
  const service = createService();

  const entry = service.log(sampleEntry());

  const found = service.getById(entry.id);
  assert(found !== undefined, 'entry found');
  assertEqual(found!.id, entry.id, 'id match');

  const notFound = service.getById('nonexistent');
  assertEqual(notFound, undefined, 'not found');

  console.log('  ✅ testGetById passed');
}

// ── 测试 9: getStats 统计信息 ─────────────────────────────

function testGetStats() {
  const service = createService();

  service.logBatch([
    sampleEntry({ action: 'workflow.created', severity: 'info', result: 'success', resourceType: 'workflow' }),
    sampleEntry({ action: 'workflow.updated', severity: 'info', result: 'success', resourceType: 'workflow' }),
    sampleEntry({ action: 'workflow.deleted', severity: 'warn', result: 'failure', resourceType: 'workflow' }),
    sampleEntry({ action: 'permission.granted', severity: 'critical', result: 'success', resourceType: 'user' }),
    sampleEntry({ action: 'engine.registered', severity: 'info', result: 'success', resourceType: 'engine' }),
  ]);

  const stats = service.getStats();

  assertEqual(stats.totalEntries, 5, 'total entries');
  assertEqual(stats.byAction['workflow.created'], 1, 'by action workflow.created');
  assertEqual(stats.byAction['workflow.updated'], 1, 'by action workflow.updated');
  assertEqual(stats.bySeverity.info, 3, 'severity info count');
  assertEqual(stats.bySeverity.warn, 1, 'severity warn count');
  assertEqual(stats.bySeverity.critical, 1, 'severity critical count');
  assertEqual(stats.byResult.success, 4, 'result success');
  assertEqual(stats.byResult.failure, 1, 'result failure');
  assertEqual(stats.failureCount, 1, 'failure count');
  assertEqual(stats.byResourceType.workflow, 3, 'by resourceType workflow');
  assert(stats.earliestEntry instanceof Date, 'earliestEntry is Date');
  assert(stats.latestEntry instanceof Date, 'latestEntry is Date');

  console.log('  ✅ testGetStats passed');
}

// ── 测试 10: 最大容量限制（FIFO 驱逐） ───────────────────

function testMaxEntries() {
  const service = createService({ maxEntries: 5 });

  for (let i = 0; i < 8; i++) {
    service.log(sampleEntry({ resourceId: `wf_${i}` }));
  }

  assertEqual(service.size, 5, 'size capped at maxEntries');
  // 最早3条被驱逐，保留 wf_3 ~ wf_7
  const all = service.query();
  assertEqual(all.entries[0].resourceId, 'wf_3', 'oldest retained');
  assertEqual(all.entries[4].resourceId, 'wf_7', 'newest retained');

  console.log('  ✅ testMaxEntries passed');
}

// ── 测试 11: EventBus 集成捕获 ────────────────────────────

function testEventBusCapture() {
  const service = createService();
  EventBus.resetInstance();

  // 启动 EventBus 捕获
  service.startEventBusCapture();

  // 通过单例发布事件（startEventBusCapture 内部订阅的就是单例）
  const bus = EventBus.getInstance();

  bus.emit({ type: 'request.enqueued', requestId: 'req_001', taskType: 'text', priority: 'HIGH' });
  bus.emit({ type: 'engine.failure', engineId: 'gpt-4', errorMessage: 'timeout' });
  bus.emit({ type: 'circuit.state_changed', engineId: 'gpt-4', oldState: 'CLOSED', newState: 'OPEN' });

  // 停止捕获
  service.stopEventBusCapture();

  // 再发一个事件，不应被记录
  bus.emit({ type: 'engine.registered', engineId: 'claude-3', weight: 1 });

  assertEqual(service.size, 3, 'captured 3 events');

  // 验证失败事件被标记为 error severity
  const failures = service.query({ severity: 'error' });
  assertEqual(failures.total, 1, 'one error severity entry');
  assertEqual(failures.entries[0].result, 'failure', 'failure result');

  // 验证正常事件是 info severity
  const infos = service.query({ severity: 'info' });
  assertEqual(infos.total, 2, 'two info severity entries');

  console.log('  ✅ testEventBusCapture passed');
}

// ── 测试 12: 导出 JSON ────────────────────────────────────

function testExportJson() {
  const service = createService();

  service.log(sampleEntry({ action: 'workflow.created' }));

  const json = service.exportAsJson();
  const parsed = JSON.parse(json);

  assert(Array.isArray(parsed), 'parsed is array');
  assertEqual(parsed.length, 1, 'json array length');
  assertEqual(parsed[0].action, 'workflow.created', 'json entry action');

  console.log('  ✅ testExportJson passed');
}

// ── 测试 13: 导出 CSV ─────────────────────────────────────

function testExportCsv() {
  const service = createService();

  service.logBatch([
    sampleEntry({ action: 'workflow.created', message: '创建工作流' }),
    sampleEntry({ action: 'workflow.deleted', message: '删除工作流 "test"' }),
  ]);

  const csv = service.exportAsCsv();
  const lines = csv.split('\n');

  assertEqual(lines[0], 'id,timestamp,action,actor,actorType,resourceType,resourceId,severity,result,message', 'csv headers');
  assertEqual(lines.length, 3, 'csv lines (header + 2 data)');
  assert(lines[1].includes('workflow.created'), 'csv line 1 action');
  // 验证含有双引号的消息正确转义
  assert(lines[2].includes('""test""'), 'csv escaped quotes');

  console.log('  ✅ testExportCsv passed');
}

// ── 测试 14: clear 清空 ───────────────────────────────────

function testClear() {
  const service = createService();

  service.log(sampleEntry());
  service.log(sampleEntry());
  assertEqual(service.size, 2, 'size before clear');

  service.clear();
  assertEqual(service.size, 0, 'size after clear');

  const all = service.query();
  assertEqual(all.total, 0, 'no entries after clear');

  console.log('  ✅ testClear passed');
}

// ── 测试 15: 组合查询条件 ─────────────────────────────────

function testCompoundQuery() {
  const service = createService();

  service.logBatch([
    sampleEntry({ action: 'workflow.created', actor: 'user_001', resourceType: 'workflow', resourceId: 'wf_001', severity: 'info', result: 'success' }),
    sampleEntry({ action: 'workflow.created', actor: 'user_002', resourceType: 'workflow', resourceId: 'wf_002', severity: 'info', result: 'success' }),
    sampleEntry({ action: 'workflow.created', actor: 'user_001', resourceType: 'workflow', resourceId: 'wf_003', severity: 'warn', result: 'failure' }),
    sampleEntry({ action: 'template.created', actor: 'user_001', resourceType: 'template', resourceId: 'tpl_001', severity: 'info', result: 'success' }),
  ]);

  // user_001 的成功操作
  const r1 = service.query({ actor: 'user_001', result: 'success' });
  assertEqual(r1.total, 2, 'user_001 success count');

  // workflow 类型的 info 级别
  const r2 = service.query({ resourceType: 'workflow', severity: 'info' });
  assertEqual(r2.total, 2, 'workflow info count');

  // user_001 在 workflow 上的操作
  const r3 = service.query({ actor: 'user_001', resourceType: 'workflow' });
  assertEqual(r3.total, 2, 'user_001 workflow operations');

  console.log('  ✅ testCompoundQuery passed');
}

// ── 运行所有测试 ──────────────────────────────────────────

const tests = [
  testLogBasic,
  testLogBatch,
  testDefaults,
  testQueryExactMatch,
  testQueryPrefixMatch,
  testQueryPagination,
  testQueryTimeRange,
  testGetById,
  testGetStats,
  testMaxEntries,
  testEventBusCapture,
  testExportJson,
  testExportCsv,
  testClear,
  testCompoundQuery,
];

let passed = 0;
let failed = 0;

console.log('\n🧪 AuditLogService 单元测试\n');

for (const test of tests) {
  try {
    test();
    passed++;
  } catch (err: any) {
    console.error(`  ❌ ${test.name} FAILED: ${err.message}`);
    failed++;
  }
}

console.log(`\n📊 结果: ${passed} passed, ${failed} failed, ${tests.length} total\n`);

if (failed > 0) {
  process.exit(1);
}
