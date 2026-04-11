/**
 * WorkflowDependencyAnalyzer 单元测试
 */

import { describe, it, expect } from '@jest/globals';
import { WorkflowDependencyAnalyzer } from '../services/workflow-dependency-analyzer.js';
import type { WorkflowStep } from '../services/workflow-executor.js';

describe('WorkflowDependencyAnalyzer', () => {
  const analyzer = new WorkflowDependencyAnalyzer();

  // ── 辅助函数 ──────────────────────────────────────
  const step = (id: string, deps: string[] = []): WorkflowStep => ({
    id,
    name: id,
    taskType: 'test',
    payload: {},
    dependsOn: deps,
  });

  // ── detectCycles ─────────────────────────────────

  describe('detectCycles', () => {
    it('应返回空数组当没有循环依赖时', () => {
      const steps = [step('a'), step('b', ['a']), step('c', ['b'])];
      expect(analyzer.detectCycles(steps)).toEqual([]);
    });

    it('应检测到简单循环 A → B → C → A', () => {
      const steps = [step('a', ['c']), step('b', ['a']), step('c', ['b'])];
      const cycles = analyzer.detectCycles(steps);
      expect(cycles.length).toBeGreaterThan(0);
      // 环路应包含 c → a → b → c（或等效排列）
      const flat = cycles.flat();
      expect(flat).toContain('a');
      expect(flat).toContain('b');
      expect(flat).toContain('c');
    });

    it('应检测到自循环', () => {
      const steps = [step('a', ['a']), step('b')];
      const cycles = analyzer.detectCycles(steps);
      expect(cycles.length).toBe(1);
      expect(cycles[0]).toEqual(['a', 'a']);
    });

    it('空步骤列表应返回空', () => {
      expect(analyzer.detectCycles([])).toEqual([]);
    });
  });

  // ── topologicalSort ─────────────────────────────

  describe('topologicalSort', () => {
    it('应正确排序线性依赖链', () => {
      const steps = [step('c', ['b']), step('a'), step('b', ['a'])];
      const layers = analyzer.topologicalSort(steps);
      expect(layers[0]).toEqual(['a']);
      expect(layers[1]).toEqual(['b']);
      expect(layers[2]).toEqual(['c']);
    });

    it('无依赖步骤应在同一层（可并行）', () => {
      const steps = [step('a'), step('b'), step('c')];
      const layers = analyzer.topologicalSort(steps);
      expect(layers.length).toBe(1);
      expect(new Set(layers[0])).toEqual(new Set(['a', 'b', 'c']));
    });

    it('菱形依赖应正确分层', () => {
      //     a
      //    / \
      //   b   c
      //    \ /
      //     d
      const steps = [step('a'), step('b', ['a']), step('c', ['a']), step('d', ['b', 'c'])];
      const layers = analyzer.topologicalSort(steps);
      expect(layers[0]).toEqual(['a']);
      expect(new Set(layers[1])).toEqual(new Set(['b', 'c']));
      expect(layers[2]).toEqual(['d']);
    });
  });

  // ── validate（综合验证）──────────────────────────

  describe('validate', () => {
    it('有效 DAG 应通过验证', () => {
      const steps = [step('a'), step('b', ['a']), step('c', ['a']), step('d', ['b', 'c'])];
      const report = analyzer.validate(steps);
      expect(report.valid).toBe(true);
      expect(report.errors).toEqual([]);
      expect(report.cycles).toEqual([]);
      expect(report.stats.totalSteps).toBe(4);
      expect(report.stats.maxDepth).toBe(3);
      expect(report.stats.criticalPathLength).toBe(3); // a→b→d 或 a→c→d
    });

    it('包含循环依赖时应标记为无效', () => {
      const steps = [step('a', ['b']), step('b', ['a'])];
      const report = analyzer.validate(steps);
      expect(report.valid).toBe(false);
      expect(report.cycles.length).toBeGreaterThan(0);
    });

    it('引用不存在的步骤应标记为无效', () => {
      const steps = [step('a', ['nonexistent'])];
      const report = analyzer.validate(steps);
      expect(report.valid).toBe(false);
      expect(report.unknownDependencies).toContain('nonexistent');
    });

    it('孤立节点应被检测但不算错误', () => {
      const steps = [step('a'), step('b'), step('c', ['a'])];
      const report = analyzer.validate(steps);
      // b 无上游也无下游 → 孤立
      expect(report.orphanSteps).toContain('b');
      expect(report.valid).toBe(true); // 孤立不算错误
    });

    it('空工作流应通过验证', () => {
      const report = analyzer.validate([]);
      expect(report.valid).toBe(true);
      expect(report.stats.totalSteps).toBe(0);
    });
  });
});
