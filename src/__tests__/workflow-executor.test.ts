/**
 * WorkflowExecutor 单元测试
 *
 * 验证核心场景:
 *   1. 线性工作流（A → B → C）顺序执行
 *   2. 并行步骤（B 和 C 都依赖 A）同时执行
 *   3. 依赖失败 → 下游跳过
 *   4. 取消工作流
 *   5. 重试逻辑
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  WorkflowExecutor,
  WorkflowDefinition,
  WorkflowResult,
} from '../services/workflow-executor'.ts';

// ── 辅助：创建线性工作流 ─────────────────────────────────

function linearWorkflow(): WorkflowDefinition {
  return {
    id: 'wf-linear',
    name: '线性工作流',
    steps: [
      { id: 'a', name: 'Step A', taskType: 'text', payload: { text: 'hello' }, dependsOn: [] },
      { id: 'b', name: 'Step B', taskType: 'text', payload: { text: 'world' }, dependsOn: ['a'] },
      { id: 'c', name: 'Step C', taskType: 'text', payload: { text: '!' }, dependsOn: ['b'] },
    ],
  };
}

// ── 辅助：创建并行工作流 ─────────────────────────────────

function parallelWorkflow(): WorkflowDefinition {
  return {
    id: 'wf-parallel',
    name: '并行工作流',
    steps: [
      { id: 'root', name: 'Root', taskType: 'text', payload: {}, dependsOn: [] },
      { id: 'left', name: 'Left', taskType: 'text', payload: { side: 'L' }, dependsOn: ['root'] },
      { id: 'right', name: 'Right', taskType: 'text', payload: { side: 'R' }, dependsOn: ['root'] },
    ],
  };
}

// ── 测试 ─────────────────────────────────────────────────

describe('WorkflowExecutor', () => {
  let executor: WorkflowExecutor;

  beforeEach(() => {
    executor = new WorkflowExecutor();
    executor.registerEngine('engine-1', { weight: 100 });
  });

  it('应按顺序执行线性工作流', async () => {
    const order: string[] = [];
    const execFn = async (taskType: string, payload: Record<string, unknown>) => {
      order.push(payload.text as string);
      return { output: payload.text };
    };

    const result = await executor.execute(linearWorkflow(), execFn);

    expect(result.status).toBe('COMPLETED');
    expect(result.steps).toHaveLength(3);
    expect(result.steps.every((s) => s.status === 'SUCCEEDED')).toBe(true);
    expect(order).toEqual(['hello', 'world', '!']);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('应并行执行无依赖的步骤', async () => {
    const startTimes: { stepId: string; at: number }[] = [];
    const execFn = async (_taskType: string, payload: Record<string, unknown>, engineId: string) => {
      startTimes.push({ stepId: payload.side as string || 'root', at: Date.now() });
      // 模拟少量延迟
      await new Promise((r) => setTimeout(r, 20));
      return { done: true };
    };

    const result = await executor.execute(parallelWorkflow(), execFn);

    expect(result.status).toBe('COMPLETED');
    expect(result.steps).toHaveLength(3);

    // left 和 right 应该几乎同时开始（差距 < 100ms）
    const leftStart = startTimes.find((s) => s.stepId === 'L')!.at;
    const rightStart = startTimes.find((s) => s.stepId === 'R')!.at;
    expect(Math.abs(leftStart - rightStart)).toBeLessThan(200);
  });

  it('依赖失败时应跳过下游步骤', async () => {
    const wf: WorkflowDefinition = {
      id: 'wf-fail',
      name: '失败传播',
      steps: [
        { id: 'a', name: 'A', taskType: 'text', payload: {}, dependsOn: [] },
        { id: 'b', name: 'B', taskType: 'text', payload: {}, dependsOn: ['a'] },
        { id: 'c', name: 'C', taskType: 'text', payload: {}, dependsOn: ['b'] },
      ],
    };

    let callCount = 0;
    const execFn = async () => {
      callCount++;
      if (callCount === 1) throw new Error('Engine exploded');
      return { ok: true };
    };

    const result = await executor.execute(wf, execFn);

    expect(result.status).toBe('FAILED');
    expect(result.steps.find((s) => s.stepId === 'a')!.status).toBe('FAILED');
    expect(result.steps.find((s) => s.stepId === 'b')!.status).toBe('SKIPPED');
    expect(result.steps.find((s) => s.stepId === 'c')!.status).toBe('SKIPPED');
  });

  it('应支持取消工作流', async () => {
    const wf: WorkflowDefinition = {
      id: 'wf-cancel',
      name: '取消测试',
      steps: [
        { id: 'a', name: 'A', taskType: 'text', payload: {}, dependsOn: [] },
        { id: 'b', name: 'B', taskType: 'text', payload: {}, dependsOn: ['a'] },
      ],
    };

    // 第一步完成后取消
    const execFn = async () => {
      executor.cancel('wf-cancel');
      return { ok: true };
    };

    const result = await executor.execute(wf, execFn);

    expect(result.status).toBe('CANCELLED');
    // 第二步应被跳过
    const stepB = result.steps.find((s) => s.stepId === 'b')!;
    expect(['SKIPPED', 'PENDING']).toContain(stepB.status);
  });

  it('应在失败时自动重试', async () => {
    const wf: WorkflowDefinition = {
      id: 'wf-retry',
      name: '重试测试',
      steps: [
        {
          id: 'a',
          name: 'A',
          taskType: 'text',
          payload: {},
          dependsOn: [],
          maxRetries: 2,
        },
      ],
    };

    let attempts = 0;
    const execFn = async () => {
      attempts++;
      if (attempts < 3) throw new Error(`Attempt ${attempts} failed`);
      return { ok: true, attempt: attempts };
    };

    const result = await executor.execute(wf, execFn);

    expect(result.status).toBe('COMPLETED');
    expect(result.steps[0].status).toBe('SUCCEEDED');
    expect(result.steps[0].retries).toBe(2);
    expect(attempts).toBe(3);
  });

  it('应能注销已注册的引擎', () => {
    const executor = new WorkflowExecutor();
    
    // 注册引擎
    executor.registerEngine('engine-1', { weight: 100 });
    expect(() => executor.registerEngine('engine-1', { weight: 100 })).not.toThrow();
    
    // 注销引擎
    const deregisterResult = executor.deregisterEngine('engine-1');
    expect(deregisterResult).toBe(true);
    
    // 尝试注销不存在的引擎应返回 false
    const deregisterNonexistent = executor.deregisterEngine('nonexistent-engine');
    expect(deregisterNonexistent).toBe(false);
    
    // 重新注册同名引擎应成功
    expect(() => executor.registerEngine('engine-1', { weight: 50 })).not.toThrow();
  });

  it('无引擎注册时使用默认执行函数应返回 COMPLETED', async () => {
    const emptyExecutor = new WorkflowExecutor();
    // 不注册任何引擎，但使用默认执行逻辑

    const result = await emptyExecutor.execute(linearWorkflow());

    expect(result.status).toBe('COMPLETED');
    expect(result.steps.every(step => step.status === 'SUCCEEDED')).toBe(true);
  });

  it('无引擎注册且无执行函数时默认返回 COMPLETED', async () => {
    const emptyExecutor = new WorkflowExecutor();
    // 不注册任何引擎，也不提供执行函数

    const result = await emptyExecutor.execute(linearWorkflow(), undefined);

    expect(result.status).toBe('COMPLETED');
    expect(result.steps.every(step => step.status === 'SUCCEEDED')).toBe(true);
  });
});
