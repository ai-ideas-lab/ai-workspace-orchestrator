/**
 * WorkflowDependencyAnalyzer — 工作流 DAG 依赖分析器
 *
 * 在执行前验证工作流定义的结构完整性：
 *   1. detectCycles()  — 检测循环依赖
 *   2. topologicalSort() — 计算拓扑执行顺序
 *   3. validate() — 综合验证（孤立节点 + 循环 + 引用完整性）
 *
 * 使用方式:
 *   const analyzer = new WorkflowDependencyAnalyzer();
 *   const report = analyzer.validate(workflow);
 *   if (!report.valid) { throw new Error(report.errors.join('; ')); }
 */

import type { WorkflowStep } from './workflow-executor.js';

export interface DependencyReport {
  valid: boolean;
  /** 拓扑执行顺序（分层，同层可并行） */
  executionLayers: string[][];
  /** 检测到的循环（每组为一个环路） */
  cycles: string[][];
  /** 孤立节点（无上游也无下游） */
  orphanSteps: string[];
  /** 未知依赖引用 */
  unknownDependencies: string[];
  /** 错误信息 */
  errors: string[];
  /** 统计 */
  stats: {
    totalSteps: number;
    maxDepth: number;
    criticalPathLength: number;
  };
}

export class WorkflowDependencyAnalyzer {
  /**
   * 综合验证工作流 DAG 结构。
   * 返回完整的分析报告，包含执行层次、循环、孤立节点等。
   */
  validate(steps: WorkflowStep[]): DependencyReport {
    const errors: string[] = [];
    const stepIds = new Set(steps.map((s) => s.id));

    // 1. 检测未知依赖引用
    const unknownDependencies = this.findUnknownDependencies(steps, stepIds);
    if (unknownDependencies.length > 0) {
      errors.push(`存在引用不存在步骤的依赖: ${unknownDependencies.join(', ')}`);
    }

    // 2. 检测循环
    const cycles = this.detectCycles(steps);
    if (cycles.length > 0) {
      errors.push(
        `检测到 ${cycles.length} 个循环依赖: ${cycles.map((c) => c.join(' → ')).join('; ')}`,
      );
    }

    // 3. 拓扑排序 → 执行层次
    const executionLayers = this.topologicalSort(steps);

    // 4. 孤立节点
    const orphanSteps = this.findOrphanSteps(steps);
    if (orphanSteps.length > 0) {
      // 孤立节点是警告，不算错误
    }

    // 5. 关键路径
    const criticalPathLength = this.computeCriticalPathLength(steps, executionLayers);

    return {
      valid: errors.length === 0,
      executionLayers,
      cycles,
      orphanSteps,
      unknownDependencies,
      errors,
      stats: {
        totalSteps: steps.length,
        maxDepth: executionLayers.length,
        criticalPathLength,
      },
    };
  }

  /**
   * 检测循环依赖（DFS 三色标记法）。
   * 返回所有检测到的环路，每个环路是一个 stepId 数组。
   */
  detectCycles(steps: WorkflowStep[]): string[][] {
    const adj = new Map<string, string[]>();
    for (const step of steps) {
      adj.set(step.id, step.dependsOn ?? []);
    }

    const WHITE = 0, GRAY = 1, BLACK = 2;
    const color = new Map<string, number>();
    for (const id of adj.keys()) color.set(id, WHITE);

    const cycles: string[][] = [];
    const path: string[] = [];

    const dfs = (node: string): void => {
      color.set(node, GRAY);
      path.push(node);

      const neighbors = adj.get(node) ?? [];
      for (const neighbor of neighbors) {
        if (!adj.has(neighbor)) continue; // 不存在的节点跳过
        const neighborColor = color.get(neighbor)!;
        if (neighborColor === GRAY) {
          // 找到环 — 从 neighbor 在 path 中的位置截取
          const cycleStart = path.indexOf(neighbor);
          cycles.push([...path.slice(cycleStart), neighbor]);
        } else if (neighborColor === WHITE) {
          dfs(neighbor);
        }
      }

      path.pop();
      color.set(node, BLACK);
    };

    for (const id of adj.keys()) {
      if (color.get(id) === WHITE) dfs(id);
    }

    return cycles;
  }

  /**
   * 拓扑排序（Kahn 算法），返回分层结构。
   * 同一层的步骤互不依赖，可以并行执行。
   */
  topologicalSort(steps: WorkflowStep[]): string[][] {
    const adj = new Map<string, string[]>(); // step → downstream
    const inDegree = new Map<string, number>();
    const stepIds = new Set(steps.map((s) => s.id));

    for (const step of steps) {
      adj.set(step.id, []);
      inDegree.set(step.id, 0);
    }

    for (const step of steps) {
      for (const dep of step.dependsOn ?? []) {
        if (stepIds.has(dep)) {
          adj.get(dep)!.push(step.id);
          inDegree.set(step.id, (inDegree.get(step.id) ?? 0) + 1);
        }
      }
    }

    const layers: string[][] = [];
    let queue = [...stepIds].filter((id) => (inDegree.get(id) ?? 0) === 0);
    let visited = 0;

    while (queue.length > 0) {
      layers.push([...queue]);
      visited += queue.length;

      const nextQueue: string[] = [];
      for (const node of queue) {
        for (const downstream of adj.get(node) ?? []) {
          const newDeg = (inDegree.get(downstream) ?? 1) - 1;
          inDegree.set(downstream, newDeg);
          if (newDeg === 0) nextQueue.push(downstream);
        }
      }
      queue = nextQueue;
    }

    // 如果存在环，部分节点不会被访问
    // 这种情况下返回已排好的部分
    return layers;
  }

  // ── 私有辅助方法 ──────────────────────────────────────

  private findUnknownDependencies(
    steps: WorkflowStep[],
    stepIds: Set<string>,
  ): string[] {
    const unknown: string[] = [];
    for (const step of steps) {
      for (const dep of step.dependsOn ?? []) {
        if (!stepIds.has(dep)) unknown.push(dep);
      }
    }
    return [...new Set(unknown)];
  }

  private findOrphanSteps(steps: WorkflowStep[]): string[] {
    if (steps.length <= 1) return [];
    const hasUpstream = new Set<string>();
    const hasDownstream = new Set<string>();
    const stepIds = new Set(steps.map((s) => s.id));

    for (const step of steps) {
      for (const dep of step.dependsOn ?? []) {
        if (stepIds.has(dep)) {
          hasUpstream.add(step.id);
          hasDownstream.add(dep);
        }
      }
    }

    return steps
      .filter((s) => !hasUpstream.has(s.id) && !hasDownstream.has(s.id))
      .map((s) => s.id);
  }

  /**
   * 计算关键路径长度（DAG 最长路径）。
   * 关键路径决定了工作流的最短执行时间（串行瓶颈）。
   */
  private computeCriticalPathLength(
    steps: WorkflowStep[],
    layers: string[][],
  ): number {
    if (steps.length === 0) return 0;
    if (layers.length === 0) return 0;

    // BFS 计算每个节点的深度
    const depth = new Map<string, number>();
    const layerMap = new Map<string, number>();
    const stepIds = new Set(steps.map((s) => s.id));

    for (let i = 0; i < layers.length; i++) {
      if (layers[i]) {
        for (const id of layers[i]!) layerMap.set(id, i);
      }
    }

    // 动态规划: depth(node) = max(depth(dep)) + 1 for all deps
    for (const step of steps) {
      const deps = (step.dependsOn ?? []).filter((d) => stepIds.has(d));
      if (deps.length === 0) {
        depth.set(step.id, 1);
      } else {
        depth.set(
          step.id,
          Math.max(...deps.map((d) => depth.get(d) ?? 0)) + 1,
        );
      }
    }

    return Math.max(0, ...Array.from(depth.values()));
  }
}
