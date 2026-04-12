/**
 * WorkflowContext 单元测试
 */
import { WorkflowContext } from '../services/workflow-context.js';
import { EventBus } from '../services/event-bus.js';

describe('WorkflowContext', () => {



// ── 步骤输出测试 ──────────────────────────────────────────

describe('步骤输出测试', () => {
  it('setStepOutput / getStepOutput — 存取步骤输出', () => {
  const ctx = new WorkflowContext('wf-1');
  ctx.setStepOutput('step-a', { score: 95, label: 'good' });
  const output = ctx.getStepOutput<{ score: number; label: string }>('step-a');
  assert(output !== undefined, 'output should exist');
  assertEqual(output!.score, 95);
  assertEqual(output!.label, 'good');
});

test('getStepOutput — 未设置的步骤返回 undefined', () => {
  const ctx = new WorkflowContext('wf-1');
  assert(ctx.getStepOutput('nonexistent') === undefined);
});

test('hasStepOutput — 正确判断步骤是否有输出', () => {
  const ctx = new WorkflowContext('wf-1');
  assert(!ctx.hasStepOutput('step-a'));
  ctx.setStepOutput('step-a', { data: 1 });
  assert(ctx.hasStepOutput('step-a'));
});

test('getCompletedStepIds — 返回所有已完成步骤ID', () => {
  const ctx = new WorkflowContext('wf-1');
  ctx.setStepOutput('a', 1);
  ctx.setStepOutput('b', 2);
  ctx.setStepOutput('c', 3);
  const ids = ctx.getCompletedStepIds();
  assertDeepEqual(ids.sort(), ['a', 'b', 'c'].sort());
});

test('getStepOutputs — 批量获取多个步骤输出', () => {
  const ctx = new WorkflowContext('wf-1');
  ctx.setStepOutput('a', { x: 1 });
  ctx.setStepOutput('b', { y: 2 });
  ctx.setStepOutput('c', { z: 3 });
  const outputs = ctx.getStepOutputs(['a', 'c']);
  assertDeepEqual(outputs, { a: { x: 1 }, c: { z: 3 } });
});

test('getStepOutputs — 忽略不存在的步骤', () => {
  const ctx = new WorkflowContext('wf-1');
  ctx.setStepOutput('a', 1);
  const outputs = ctx.getStepOutputs(['a', 'nonexistent']);
  assertDeepEqual(outputs, { a: 1 });
});

test('步骤输出可以被覆盖', () => {
  const ctx = new WorkflowContext('wf-1');
  ctx.setStepOutput('step-a', 'v1');
  ctx.setStepOutput('step-a', 'v2');
  assertEqual(ctx.getStepOutput('step-a'), 'v2');
});

// ── 全局变量测试 ──────────────────────────────────────────

test('setVariable / getVariable — 存取全局变量', () => {
  const ctx = new WorkflowContext('wf-1');
  ctx.setVariable('threshold', 80);
  ctx.setVariable('mode', 'strict');
  assertEqual(ctx.getVariable('threshold'), 80);
  assertEqual(ctx.getVariable('mode'), 'strict');
});

test('getVariableOrDefault — 有值时返回实际值', () => {
  const ctx = new WorkflowContext('wf-1');
  ctx.setVariable('key', 'actual');
  assertEqual(ctx.getVariableOrDefault('key', 'default'), 'actual');
});

test('getVariableOrDefault — 无值时返回默认值', () => {
  const ctx = new WorkflowContext('wf-1');
  assertEqual(ctx.getVariableOrDefault('missing', 42), 42);
});

test('deleteVariable — 删除变量', () => {
  const ctx = new WorkflowContext('wf-1');
  ctx.setVariable('temp', 'value');
  assert(ctx.hasVariable('temp'));
  const deleted = ctx.deleteVariable('temp');
  assert(deleted, 'should return true for existing key');
  assert(!ctx.hasVariable('temp'));
});

test('deleteVariable — 删除不存在的变量返回 false', () => {
  const ctx = new WorkflowContext('wf-1');
  assert(!ctx.deleteVariable('nonexistent'));
});

test('hasVariable — 正确判断变量是否存在', () => {
  const ctx = new WorkflowContext('wf-1');
  assert(!ctx.hasVariable('key'));
  ctx.setVariable('key', 'val');
  assert(ctx.hasVariable('key'));
});

test('变量支持各种类型', () => {
  const ctx = new WorkflowContext('wf-1');
  ctx.setVariable('num', 42);
  ctx.setVariable('bool', true);
  ctx.setVariable('arr', [1, 2, 3]);
  ctx.setVariable('obj', { nested: { deep: 'value' } });
  ctx.setVariable('null', null);
  assertEqual(ctx.getVariable('num'), 42);
  assertEqual(ctx.getVariable('bool'), true);
  assertDeepEqual(ctx.getVariable('arr'), [1, 2, 3]);
  assertDeepEqual(ctx.getVariable('obj'), { nested: { deep: 'value' } });
  assertEqual(ctx.getVariable('null'), null);
});

// ── 表达式求值测试 ────────────────────────────────────────

test('resolveExpression — 解析步骤输出引用', () => {
  const ctx = new WorkflowContext('wf-1');
  ctx.setStepOutput('step-a', { name: 'hello' });
  assertEqual(ctx.resolveExpression('${steps.step-a.name}'), 'hello');
});

test('resolveExpression — 解析完整步骤输出对象', () => {
  const ctx = new WorkflowContext('wf-1');
  ctx.setStepOutput('a', { x: 1, y: 2 });
  const result = ctx.resolveExpression('${steps.a}');
  assertDeepEqual(result, { x: 1, y: 2 });
});

test('resolveExpression — 解析全局变量引用', () => {
  const ctx = new WorkflowContext('wf-1');
  ctx.setVariable('threshold', 80);
  assertEqual(ctx.resolveExpression('${vars.threshold}'), '80');
});

test('resolveExpression — 解析元数据引用', () => {
  const ctx = new WorkflowContext('wf-1');
  ctx.setMetadata('env', 'production');
  assertEqual(ctx.resolveExpression('${meta.env}'), 'production');
});

test('resolveExpression — 混合文本中的占位符替换', () => {
  const ctx = new WorkflowContext('wf-1');
  ctx.setVariable('name', 'world');
  ctx.setVariable('count', 5);
  const result = ctx.resolveExpression('Hello ${vars.name}! Count: ${vars.count}');
  assertEqual(result, 'Hello world! Count: 5');
});

test('resolveExpression — 无占位符返回原字符串', () => {
  const ctx = new WorkflowContext('wf-1');
  assertEqual(ctx.resolveExpression('plain text'), 'plain text');
});

test('resolveExpression — 解析不存在的路径返回空字符串(混合模式) 或 undefined(纯占位符)', () => {
  const ctx = new WorkflowContext('wf-1');
  assertEqual(ctx.resolveExpression('value is ${vars.nonexistent}'), 'value is ');
  assertEqual(ctx.resolveExpression('${vars.nonexistent}'), undefined);
});

test('resolveExpression — 深层嵌套路径访问', () => {
  const ctx = new WorkflowContext('wf-1');
  ctx.setStepOutput('a', { result: { data: { items: [10, 20] } } });
  const items = ctx.resolveExpression('${steps.a.result.data.items}');
  assertDeepEqual(items, [10, 20]);
});

// ── resolveObject 测试 ───────────────────────────────────

test('resolveObject — 递归解析对象中所有表达式', () => {
  const ctx = new WorkflowContext('wf-1');
  ctx.setStepOutput('fetch', { users: ['Alice', 'Bob'] });
  ctx.setVariable('count', 2);

  const template = {
    message: 'Found ${vars.count} users',
    data: '${steps.fetch.users}',
    extra: {
      info: '${vars.count} items',
    },
  };

  const resolved = ctx.resolveObject(template);
  assertEqual((resolved as any).message, 'Found 2 users');
  assertDeepEqual((resolved as any).data, ['Alice', 'Bob']);
  assertEqual((resolved as any).extra.info, '2 items');
});

test('resolveObject — 数组中的表达式也被解析', () => {
  const ctx = new WorkflowContext('wf-1');
  ctx.setVariable('x', 'hello');

  const template = ['${vars.x}', 'static', '${vars.x} world'];
  const resolved = ctx.resolveObject(template);
  assertDeepEqual(resolved, ['hello', 'static', 'hello world']);
});

// ── 快照与恢复测试 ────────────────────────────────────────

test('snapshot / restore — 创建和恢复快照', () => {
  const ctx = new WorkflowContext('wf-1');
  ctx.setStepOutput('a', { data: 1 });
  ctx.setVariable('key', 'value');
  ctx.setMetadata('env', 'test');

  const snap = ctx.snapshot();
  assertEqual(snap.workflowId, 'wf-1');
  assertDeepEqual(snap.stepOutputs, { a: { data: 1 } });
  assertDeepEqual(snap.variables, { key: 'value' });
  assertDeepEqual(snap.metadata, { env: 'test' });
  assertEqual(snap.stepCount, 1);
  assert(snap.createdAt instanceof Date);

  // 修改后恢复
  ctx.setVariable('key', 'modified');
  assertEqual(ctx.getVariable('key'), 'modified');

  ctx.restore(snap);
  assertEqual(ctx.getVariable('key'), 'value');
});

test('clear — 清空所有数据', () => {
  const ctx = new WorkflowContext('wf-1');
  ctx.setStepOutput('a', 1);
  ctx.setVariable('b', 2);
  ctx.setMetadata('c', 3);

  ctx.clear();

  assert(!ctx.hasStepOutput('a'));
  assert(!ctx.hasVariable('b'));
  assert(ctx.getMetadata('c') === undefined);
});

// ── 变更历史测试 ──────────────────────────────────────────

test('getChangeLog — 记录所有变更事件', () => {
  const ctx = new WorkflowContext('wf-1');
  ctx.setStepOutput('a', 1);
  ctx.setVariable('x', 2);
  ctx.deleteVariable('x');
  ctx.clear();

  const log = ctx.getChangeLog();
  assertEqual(log.length, 4);
  assertEqual(log[0].type, 'step-output-set');
  assertEqual(log[0].key, 'a');
  assertEqual(log[1].type, 'variable-set');
  assertEqual(log[1].key, 'x');
  assertEqual(log[2].type, 'variable-deleted');
  assertEqual(log[2].key, 'x');
  assertEqual(log[3].type, 'cleared');
  assertEqual(log[3].key, '*');
});

test('getChangeCount — 统计特定 key 的变更次数', () => {
  const ctx = new WorkflowContext('wf-1');
  ctx.setVariable('x', 1);
  ctx.setVariable('x', 2);
  ctx.setVariable('x', 3);
  assertEqual(ctx.getChangeCount('x'), 3);
  assertEqual(ctx.getChangeCount('y'), 0);
});

test('变更记录包含时间戳和 workflowId', () => {
  const ctx = new WorkflowContext('wf-test-123');
  ctx.setVariable('k', 'v');
  const log = ctx.getChangeLog();
  assertEqual(log[0].workflowId, 'wf-test-123');
  assert(log[0].timestamp instanceof Date);
});

// ── 构造函数测试 ──────────────────────────────────────────

it('workflowId 存储正确', () => {
  const ctx = new WorkflowContext('my-workflow');
  expect(ctx.workflowId).toBe('my-workflow');
});

}); // end describe


