/**
 * WorkflowVersionService 单元测试
 */
import { describe, it, expect, beforeEach } from '@jest/globals';
import { WorkflowVersionService } from '../services/workflow-version'';
import type { WorkflowDefinition, WorkflowStep } from '../services/workflow-executor'';

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

describe('WorkflowVersionService', () => {
  let service: WorkflowVersionService;

  beforeEach(() => {
    service = new WorkflowVersionService();
  });

  // ── createSnapshot ────────────────────────────────

  describe('createSnapshot()', () => {
    it('应创建快照并保留元信息', () => {
      const wf = makeWorkflow('wf1', [makeStep('s1', 'Step 1')]);
      const snap = service.createSnapshot(wf, '初始版本', 'alice');

      expect(snap.workflowId).toBe('wf1');
      expect(snap.version).toBe(1);
      expect(snap.message).toBe('初始版本');
      expect(snap.createdBy).toBe('alice');
      expect(snap.definition.steps).toHaveLength(1);
      expect(snap.id).toMatch(/^snap_/);
    });

    it('版本号应自动递增', () => {
      const wf = makeWorkflow('wf1', [makeStep('s1', 'Step 1')]);
      const v1 = service.createSnapshot(wf, 'v1');
      const v2 = service.createSnapshot(wf, 'v2');
      const v3 = service.createSnapshot(wf, 'v3');

      expect(v1.version).toBe(1);
      expect(v2.version).toBe(2);
      expect(v3.version).toBe(3);
    });

    it('快照应是深拷贝，不受后续修改影响', () => {
      const wf = makeWorkflow('wf1', [makeStep('s1', 'Step 1')]);
      service.createSnapshot(wf);

      wf.steps.push(makeStep('s2', 'Step 2'));
      wf.steps[0]!.name = 'Modified';

      const snap = service.getVersion('wf1', 1)!;
      expect(snap.definition.steps).toHaveLength(1);
      expect(snap.definition.steps[0]!.name).toBe('Step 1');
    });
  });

  // ── getHistory / getLatest ─────────────────────────

  describe('getHistory() & getLatest()', () => {
    it('getHistory 应返回所有版本历史', () => {
      const wf = makeWorkflow('wf1', [makeStep('s1', 'Step 1')]);
      service.createSnapshot(wf, 'v1');
      service.createSnapshot(wf, 'v2');

      const history = service.getHistory('wf1');
      expect(history).toHaveLength(2);
      expect(history[0].version).toBe(1);
      expect(history[1].version).toBe(2);
    });

    it('getLatest 应返回最新版本', () => {
      const wf = makeWorkflow('wf1', [makeStep('s1', 'Step 1')]);
      service.createSnapshot(wf, 'v1');
      service.createSnapshot(wf, 'v2');

      expect(service.getLatest('wf1')?.version).toBe(2);
      expect(service.getLatest('nonexistent')).toBeUndefined();
    });
  });

  // ── diff ───────────────────────────────────────────

  describe('diff()', () => {
    it('相同内容不应有变更', () => {
      const wf = makeWorkflow('wf1', [makeStep('s1', 'Step 1')]);
      const v1 = service.createSnapshot(wf, 'v1');
      const v2 = service.createSnapshot(wf, 'v2');

      const diff = service.diff(v1, v2);
      expect(diff.hasChanges).toBe(false);
      expect(diff.stepCountDelta).toBe(0);
    });

    it('应检测到新增步骤', () => {
      const wf = makeWorkflow('wf1', [makeStep('s1', 'Step 1')]);
      const v1 = service.createSnapshot(wf, 'v1');

      wf.steps.push(makeStep('s2', 'Step 2'));
      const v2 = service.createSnapshot(wf, 'v2');

      const diff = service.diff(v1, v2);
      expect(diff.hasChanges).toBe(true);
      expect(diff.stepCountDelta).toBe(1);
      const added = diff.stepDiffs.find((d) => d.change === 'added');
      expect(added?.stepId).toBe('s2');
    });

    it('应检测到删除步骤', () => {
      const wf = makeWorkflow('wf1', [makeStep('s1', 'Step 1'), makeStep('s2', 'Step 2')]);
      const v1 = service.createSnapshot(wf, 'v1');

      wf.steps.pop();
      const v2 = service.createSnapshot(wf, 'v2');

      const diff = service.diff(v1, v2);
      const removed = diff.stepDiffs.find((d) => d.change === 'removed');
      expect(removed?.stepId).toBe('s2');
      expect(diff.stepCountDelta).toBe(-1);
    });

    it('应检测到修改步骤', () => {
      const wf = makeWorkflow('wf1', [makeStep('s1', 'Step 1')]);
      const v1 = service.createSnapshot(wf, 'v1');

      wf.steps[0].name = 'Step 1 Updated';
      wf.steps[0].payload = { prompt: 'new-prompt' };
      const v2 = service.createSnapshot(wf, 'v2');

      const diff = service.diff(v1, v2);
      const modified = diff.stepDiffs.find((d) => d.change === 'modified');
      expect(modified?.stepId).toBe('s1');
      expect(modified?.fields).toContain('name');
      expect(modified?.fields).toContain('payload');
    });

    it('元组引用也能检测变更', () => {
      const wf = makeWorkflow('wf1', [makeStep('s1', 'Step 1')]);
      service.createSnapshot(wf, 'v1');

      wf.steps.push(makeStep('s2', 'Step 2'));
      service.createSnapshot(wf, 'v2');

      const diff = service.diff(['wf1', 1], ['wf1', 2]);
      expect(diff.hasChanges).toBe(true);
    });
  });

  // ── rollback ───────────────────────────────────────

  describe('rollback()', () => {
    it('应回滚到指定版本', () => {
      const wf = makeWorkflow('wf1', [makeStep('s1', 'Step 1')]);
      service.createSnapshot(wf, 'v1');

      wf.steps.push(makeStep('s2', 'Step 2'));
      wf.steps[0]!.name = 'Modified';
      service.createSnapshot(wf, 'v2');

      const restored = service.rollback('wf1', 1);
      expect(restored.steps).toHaveLength(1);
      expect(restored.steps[0].name).toBe('Step 1');
    });

    it('不存在的版本应抛错', () => {
      const wf = makeWorkflow('wf1', [makeStep('s1', 'Step 1')]);
      service.createSnapshot(wf, 'v1');

      expect(() => service.rollback('wf1', 99)).toThrow('99');
    });
  });

  // ── 多工作流隔离 ──────────────────────────────────

  it('多个工作流的历史应互相隔离', () => {
    const wf1 = makeWorkflow('wf1', [makeStep('s1', 'W1 Step')]);
    const wf2 = makeWorkflow('wf2', [makeStep('s1', 'W2 Step')]);

    service.createSnapshot(wf1, 'w1-v1');
    service.createSnapshot(wf2, 'w2-v1');

    const h1 = service.getHistory('wf1');
    const h2 = service.getHistory('wf2');
    expect(h1).toHaveLength(1);
    expect(h2).toHaveLength(1);
    expect(h1[0].definition.steps[0].name).toBe('W1 Step');
  });
});
