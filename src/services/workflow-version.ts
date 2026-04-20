/**
 * WorkflowVersionService - 工作流版本快照服务
 *
 * 记录工作流定义的每次变更，支持版本对比与回滚。
 * 为「工作流模板编辑器」提供底层数据支撑。
 *
 * 核心职责:
 *   1. createSnapshot()  — 保存工作流定义快照
 *   2. diff()            — 对比两个版本的差异
 *   3. rollback()        — 回滚到指定版本
 *
 * 使用方式:
 *   const vs = new WorkflowVersionService();
 *   const v1 = vs.createSnapshot(workflow);
 *   // ... 用户编辑工作流 ...
 *   const v2 = vs.createSnapshot(modifiedWorkflow);
 *   const changes = vs.diff(v1, v2);
 *   await vs.rollback(workflowId, v1);
 */

import type { WorkflowDefinition, WorkflowStep } from './workflow-executor.js';

// ── 类型定义 ──────────────────────────────────────

export interface WorkflowSnapshot {
  /** 快照唯一 ID */
  id: string;
  /** 工作流 ID */
  workflowId: string;
  /** 版本号（递增） */
  version: number;
  /** 工作流定义的深拷贝 */
  definition: WorkflowDefinition;
  /** 变更说明 */
  message: string;
  /** 创建时间 */
  createdAt: Date;
  /** 创建者 */
  createdBy?: string;
}

export interface StepDiff {
  stepId: string;
  stepName: string;
  /** added | removed | modified | unchanged */
  change: 'added' | 'removed' | 'modified' | 'unchanged';
  /** 具体变更字段 */
  fields?: string[];
}

export interface SnapshotDiff {
  fromVersion: number;
  toVersion: number;
  stepDiffs: StepDiff[];
  /** 步骤总数变化 */
  stepCountDelta: number;
  /** 是否存在变更 */
  hasChanges: boolean;
}

// ── 核心类 ──────────────────────────────────────────────

export class WorkflowVersionService {
  /** workflowId → 快照历史（按版本号升序） */
  private snapshots = new Map<string, WorkflowSnapshot[]>();
  /** 自增 ID 计数器 */
  private nextId = 1;

  // ── 核心函数 1: 创建快照 ────────────────────────────

  /**
   * 保存工作流当前定义的快照，自动递增版本号。
   *
   * @param workflow 工作流定义
   * @param message 变更说明
   * @param createdBy 创建者
   * @returns 新创建的快照
   */
  createSnapshot(
    workflow: WorkflowDefinition,
    message = '',
    createdBy?: string,
  ): WorkflowSnapshot {
    const history = this.snapshots.get(workflow.id) ?? [];
    const version = history.length + 1;

    const snapshot: WorkflowSnapshot = {
      id: `snap_${this.nextId++}`,
      workflowId: workflow.id,
      version,
      definition: JSON.parse(JSON.stringify(workflow)) as WorkflowDefinition,
      message,
      createdAt: new Date(),
      createdBy,
    };

    history.push(snapshot);
    this.snapshots.set(workflow.id, history);
    return snapshot;
  }

  // ── 核心函数 2: 版本对比 ────────────────────────────

  /**
   * 对比两个快照（或同一工作流的两个版本号），返回步骤级差异。
   *
   * @param a 快照 A（旧版本）
   * @param b 快照 B（新版本）
   * @returns 差异结果
   */
  diff(a: SnapshotVersionRef, b: SnapshotVersionRef): SnapshotDiff {
    const snapA = this.resolveSnapshot(a);
    const snapB = this.resolveSnapshot(b);

    if (!snapA || !snapB) {
      throw new Error('快照不存在');
    }

    const stepsA = new Map(snapA.definition.steps.map((s) => [s.id, s]));
    const stepsB = new Map(snapB.definition.steps.map((s) => [s.id, s]));

    const stepDiffs: StepDiff[] = [];

    // 检查 A 中有但 B 中没有的（removed）
    for (const [id, step] of stepsA) {
      if (!stepsB.has(id)) {
        stepDiffs.push({ stepId: id, stepName: step.name, change: 'removed' });
      }
    }

    // 检查 B 中的步骤
    for (const [id, stepB] of stepsB) {
      const stepA = stepsA.get(id);
      if (!stepA) {
        // 新增步骤
        stepDiffs.push({ stepId: id, stepName: stepB.name, change: 'added' });
      } else {
        // 比较字段级差异
        const changedFields = this.diffStepFields(stepA, stepB);
        stepDiffs.push({
          stepId: id,
          stepName: stepB.name,
          change: changedFields.length > 0 ? 'modified' : 'unchanged',
          fields: changedFields.length > 0 ? changedFields : undefined,
        });
      }
    }

    const hasChanges = stepDiffs.some(
      (d) => d.change !== 'unchanged',
    );

    return {
      fromVersion: snapA.version,
      toVersion: snapB.version,
      stepDiffs,
      stepCountDelta: stepsB.size - stepsA.size,
      hasChanges,
    };
  }

  // ── 辅助方法 ─────────────────────────────────────────

  /**
   * 获取工作流的完整快照历史。
   */
  getHistory(workflowId: string): WorkflowSnapshot[] {
    return [...(this.snapshots.get(workflowId) ?? [])];
  }

  /**
   * 获取最新快照。
   */
  getLatest(workflowId: string): WorkflowSnapshot | undefined {
    const history = this.snapshots.get(workflowId);
    return history?.[history.length - 1];
  }

  /**
   * 获取指定版本的快照。
   */
  getVersion(workflowId: string, version: number): WorkflowSnapshot | undefined {
    const history = this.snapshots.get(workflowId);
    return history?.[version - 1]; // version 从 1 开始
  }

  /**
   * 回滚到指定版本：返回该版本的定义深拷贝。
   * 调用方负责将返回值写回工作流存储。
   */
  rollback(workflowId: string, targetVersion: number): WorkflowDefinition {
    const snapshot = this.getVersion(workflowId, targetVersion);
    if (!snapshot) {
      throw new Error(`版本 ${targetVersion} 不存在（workflowId=${workflowId}）`);
    }
    return JSON.parse(JSON.stringify(snapshot.definition)) as WorkflowDefinition;
  }

  // ── 私有方法 ──────────────────────────────────────────

  /** 解析版本引用（快照对象 或 [workflowId, version] 元组） */
  private resolveSnapshot(ref: SnapshotVersionRef): WorkflowSnapshot | undefined {
    if ('id' in ref && 'workflowId' in ref) {
      return ref as WorkflowSnapshot;
    }
    const [workflowId, version] = ref as [string, number];
    return this.getVersion(workflowId, version);
  }

  /** 比较两个步骤的字段差异 */
  private diffStepFields(a: WorkflowStep, b: WorkflowStep): string[] {
    const fields: string[] = [];
    const compareKeys: (keyof WorkflowStep)[] = ['name', 'taskType', 'dependsOn', 'priority', 'maxRetries'];

    for (const key of compareKeys) {
      const va = JSON.stringify(a[key]);
      const vb = JSON.stringify(b[key]);
      if (va !== vb) fields.push(key);
    }

    // payload 单独比较
    if (JSON.stringify(a.payload) !== JSON.stringify(b.payload)) {
      fields.push('payload');
    }

    return fields;
  }
}

/** 版本引用：可以是快照对象或 [workflowId, version] 元组 */
export type SnapshotVersionRef = WorkflowSnapshot | [string, number];
