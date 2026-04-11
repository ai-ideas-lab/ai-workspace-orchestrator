/**
 * WorkflowVersionService 单元测试
 */
import { WorkflowVersionService } from '../services/workflow-version.js';
import type { WorkflowDefinition, WorkflowStep } from '../services/workflow-executor.js';

// ── 测试辅助 ──────────────────────────────────────

function makeWorkflow(id: string, steps: WorkflowStep[]): WorkflowDefinition {
  return { id, name: `workflow-${id}`, steps };
}

function makeStep(id: string, name: string, dependsOn: string[] = []): WorkflowStep {
  return {
    id,
    name,
    taskType: 'text-generation',
    payload: { prompt: `test-${id}` },
    dependsOn,
  };
}

// ── 测试 ──────────────────────────────────────────

let service: WorkflowVersionService;

function beforeEach() {
  service = new WorkflowVersionService();
}

// ── createSnapshot ────────────────────────────────

function testCreateSnapshot() {
  beforeEach();
  const wf = makeWorkflow('wf1', [makeStep('s1', 'Step 1')]);

  const snap = service.createSnapshot(wf, '初始版本', 'alice');

  console.assert(snap.workflowId === 'wf1', 'workflowId 应该是 wf1');
  console.assert(snap.version === 1, '第一个快照版本应为 1');
  console.assert(snap.message === '初始版本', 'message 应该保留');
  console.assert(snap.createdBy === 'alice', 'createdBy 应该保留');
  console.assert(snap.definition.steps.length === 1, '快照应包含步骤');
  console.assert(snap.id.startsWith('snap_'), 'ID 应以 snap_ 开头');
  console.log('✅ createSnapshot 通过');
}

function testVersionAutoIncrement() {
  beforeEach();
  const wf = makeWorkflow('wf1', [makeStep('s1', 'Step 1')]);

  const v1 = service.createSnapshot(wf, 'v1');
  const v2 = service.createSnapshot(wf, 'v2');
  const v3 = service.createSnapshot(wf, 'v3');

  console.assert(v1.version === 1, 'v1');
  console.assert(v2.version === 2, 'v2');
  console.assert(v3.version === 3, 'v3');
  console.log('✅ version 自动递增 通过');
}

function testDeepCopy() {
  beforeEach();
  const wf = makeWorkflow('wf1', [makeStep('s1', 'Step 1')]);
  service.createSnapshot(wf);

  // 修改原始工作流
  wf.steps.push(makeStep('s2', 'Step 2'));
  wf.steps[0].name = 'Modified';

  const snap = service.getVersion('wf1', 1)!;
  console.assert(snap.definition.steps.length === 1, '快照不应受后续修改影响');
  console.assert(snap.definition.steps[0].name === 'Step 1', '步骤名称应为原始值');
  console.log('✅ 深拷贝隔离 通过');
}

// ── getHistory / getLatest ─────────────────────────

function testGetHistory() {
  beforeEach();
  const wf = makeWorkflow('wf1', [makeStep('s1', 'Step 1')]);
  service.createSnapshot(wf, 'v1');
  service.createSnapshot(wf, 'v2');

  const history = service.getHistory('wf1');
  console.assert(history.length === 2, '历史应有 2 条');
  console.assert(history[0].version === 1, '第一条是 v1');
  console.assert(history[1].version === 2, '第二条是 v2');
  console.log('✅ getHistory 通过');
}

function testGetLatest() {
  beforeEach();
  const wf = makeWorkflow('wf1', [makeStep('s1', 'Step 1')]);
  service.createSnapshot(wf, 'v1');
  service.createSnapshot(wf, 'v2');

  const latest = service.getLatest('wf1');
  console.assert(latest?.version === 2, '最新版本应为 2');

  const empty = service.getLatest('nonexistent');
  console.assert(empty === undefined, '不存在的工作流应返回 undefined');
  console.log('✅ getLatest 通过');
}

// ── diff ───────────────────────────────────────────

function testDiffNoChange() {
  beforeEach();
  const wf = makeWorkflow('wf1', [makeStep('s1', 'Step 1')]);
  const v1 = service.createSnapshot(wf, 'v1');
  const v2 = service.createSnapshot(wf, 'v2');

  const diff = service.diff(v1, v2);
  console.assert(diff.hasChanges === false, '相同内容不应有变更');
  console.assert(diff.stepCountDelta === 0, '步骤数应不变');
  console.log('✅ diff 无变更 通过');
}

function testDiffAddedStep() {
  beforeEach();
  const wf = makeWorkflow('wf1', [makeStep('s1', 'Step 1')]);
  const v1 = service.createSnapshot(wf, 'v1');

  wf.steps.push(makeStep('s2', 'Step 2'));
  const v2 = service.createSnapshot(wf, 'v2');

  const diff = service.diff(v1, v2);
  console.assert(diff.hasChanges === true, '应有变更');
  console.assert(diff.stepCountDelta === 1, '步骤数增加 1');
  const added = diff.stepDiffs.find((d) => d.change === 'added');
  console.assert(added?.stepId === 's2', '应检测到新增步骤 s2');
  console.log('✅ diff 新增步骤 通过');
}

function testDiffRemovedStep() {
  beforeEach();
  const wf = makeWorkflow('wf1', [makeStep('s1', 'Step 1'), makeStep('s2', 'Step 2')]);
  const v1 = service.createSnapshot(wf, 'v1');

  wf.steps.pop();
  const v2 = service.createSnapshot(wf, 'v2');

  const diff = service.diff(v1, v2);
  const removed = diff.stepDiffs.find((d) => d.change === 'removed');
  console.assert(removed?.stepId === 's2', '应检测到删除步骤 s2');
  console.assert(diff.stepCountDelta === -1, '步骤数减少 1');
  console.log('✅ diff 删除步骤 通过');
}

function testDiffModifiedStep() {
  beforeEach();
  const wf = makeWorkflow('wf1', [makeStep('s1', 'Step 1')]);
  const v1 = service.createSnapshot(wf, 'v1');

  wf.steps[0].name = 'Step 1 Updated';
  wf.steps[0].payload = { prompt: 'new-prompt' };
  const v2 = service.createSnapshot(wf, 'v2');

  const diff = service.diff(v1, v2);
  const modified = diff.stepDiffs.find((d) => d.change === 'modified');
  console.assert(modified?.stepId === 's1', '应检测到修改步骤 s1');
  console.assert(modified?.fields?.includes('name'), '应检测到 name 变更');
  console.assert(modified?.fields?.includes('payload'), '应检测到 payload 变更');
  console.log('✅ diff 修改步骤 通过');
}

function testDiffWithTupleRef() {
  beforeEach();
  const wf = makeWorkflow('wf1', [makeStep('s1', 'Step 1')]);
  service.createSnapshot(wf, 'v1');

  wf.steps.push(makeStep('s2', 'Step 2'));
  service.createSnapshot(wf, 'v2');

  // 使用元组引用
  const diff = service.diff(['wf1', 1], ['wf1', 2]);
  console.assert(diff.hasChanges === true, '元组引用也能检测变更');
  console.log('✅ diff 元组引用 通过');
}

// ── rollback ───────────────────────────────────────

function testRollback() {
  beforeEach();
  const wf = makeWorkflow('wf1', [makeStep('s1', 'Step 1')]);
  service.createSnapshot(wf, 'v1');

  wf.steps.push(makeStep('s2', 'Step 2'));
  wf.steps[0].name = 'Modified';
  service.createSnapshot(wf, 'v2');

  const restored = service.rollback('wf1', 1);
  console.assert(restored.steps.length === 1, '回滚后步骤数应为 1');
  console.assert(restored.steps[0].name === 'Step 1', '步骤名应恢复原始值');
  console.log('✅ rollback 通过');
}

function testRollbackInvalidVersion() {
  beforeEach();
  const wf = makeWorkflow('wf1', [makeStep('s1', 'Step 1')]);
  service.createSnapshot(wf, 'v1');

  let error: Error | undefined;
  try {
    service.rollback('wf1', 99);
  } catch (e) {
    error = e as Error;
  }
  console.assert(error !== undefined, '不存在的版本应抛错');
  console.assert(error?.message.includes('99'), '错误信息应包含版本号');
  console.log('✅ rollback 无效版本 通过');
}

// ── 多工作流隔离 ──────────────────────────────────

function testMultiWorkflowIsolation() {
  beforeEach();
  const wf1 = makeWorkflow('wf1', [makeStep('s1', 'W1 Step')]);
  const wf2 = makeWorkflow('wf2', [makeStep('s1', 'W2 Step')]);

  service.createSnapshot(wf1, 'w1-v1');
  service.createSnapshot(wf2, 'w2-v1');

  const h1 = service.getHistory('wf1');
  const h2 = service.getHistory('wf2');
  console.assert(h1.length === 1, 'wf1 应有 1 条历史');
  console.assert(h2.length === 1, 'wf2 应有 1 条历史');
  console.assert(h1[0].definition.steps[0].name === 'W1 Step', 'wf1 步骤隔离');
  console.log('✅ 多工作流隔离 通过');
}

// ── 运行所有测试 ──────────────────────────────────

const tests = [
  testCreateSnapshot,
  testVersionAutoIncrement,
  testDeepCopy,
  testGetHistory,
  testGetLatest,
  testDiffNoChange,
  testDiffAddedStep,
  testDiffRemovedStep,
  testDiffModifiedStep,
  testDiffWithTupleRef,
  testRollback,
  testRollbackInvalidVersion,
  testMultiWorkflowIsolation,
];

let passed = 0;
let failed = 0;

for (const test of tests) {
  try {
    test();
    passed++;
  } catch (err) {
    failed++;
    console.error(`❌ ${test.name} 失败:`, err);
  }
}

console.log(`\n📊 WorkflowVersionService: ${passed} passed, ${failed} failed, ${tests.length} total`);

if (failed > 0) {
  process.exit(1);
}
