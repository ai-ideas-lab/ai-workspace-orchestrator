/**
 * WorkflowContext — 工作流步骤间数据共享上下文
 *
 * 为工作流执行提供运行时数据共享机制：
 *   1. 步骤输出存储 — setStepOutput(stepId, data)
 *   2. 步骤输入获取 — getStepOutput(stepId) / getStepOutputs(stepIds)
 *   3. 全局变量读写 — setVariable(key, value) / getVariable(key)
 *   4. 表达式求值 — resolveExpression('${stepA.result.name}')
 *
 * 使用方式:
 *   const ctx = new WorkflowContext('wf-123');
 *   ctx.setStepOutput('step-a', { score: 95 });
 *   ctx.setVariable('threshold', 80);
 *   const score = ctx.getStepOutput<{ score: number }>('step-a')!.score;
 *   const threshold = ctx.getVariable<number>('threshold')!;
 */

import { EventBus } from './event-bus.js';

// ── 类型定义 ─────────────────────────────────────────────

export interface ContextSnapshot {
  workflowId: string;
  stepOutputs: Record<string, unknown>;
  variables: Record<string, unknown>;
  metadata: Record<string, unknown>;
  createdAt: Date;
  stepCount: number;
}

export interface ContextChangeEvent {
  type: 'step-output-set' | 'variable-set' | 'variable-deleted' | 'cleared';
  workflowId: string;
  key: string;
  value?: unknown;
  timestamp: Date;
}

// ── 核心类 ─────────────────────────────────────────────────

export class WorkflowContext {
  private stepOutputs = new Map<string, unknown>();
  private variables = new Map<string, unknown>();
  private metadata = new Map<string, unknown>();
  private changeLog: ContextChangeEvent[] = [];
  private eventBus: EventBus;

  constructor(
    public readonly workflowId: string,
    eventBus?: EventBus,
  ) {
    this.eventBus = eventBus ?? EventBus.getInstance();
  }

  // ── 步骤输出 ────────────────────────────────────────────

  /**
   * 存储步骤执行输出。后续步骤可通过 getStepOutput 获取。
   */
  setStepOutput<T = unknown>(stepId: string, output: T): void {
    this.stepOutputs.set(stepId, output);
    this.recordChange('step-output-set', stepId, output);
  }

  /**
   * 获取某个步骤的输出。如果步骤尚未执行，返回 undefined。
   */
  getStepOutput<T = unknown>(stepId: string): T | undefined {
    return this.stepOutputs.get(stepId) as T | undefined;
  }

  /**
   * 批量获取多个步骤的输出，合并为一个对象。
   * 用于依赖多个上游步骤的场景。
   */
  getStepOutputs<T = Record<string, unknown>>(stepIds: string[]): T {
    const result: Record<string, unknown> = {};
    for (const id of stepIds) {
      const output = this.stepOutputs.get(id);
      if (output !== undefined) {
        result[id] = output;
      }
    }
    return result as T;
  }

  /**
   * 检查某个步骤是否已有输出。
   */
  hasStepOutput(stepId: string): boolean {
    return this.stepOutputs.has(stepId);
  }

  /**
   * 获取所有已完成的步骤 ID 列表。
   */
  getCompletedStepIds(): string[] {
    return Array.from(this.stepOutputs.keys());
  }

  // ── 全局变量 ────────────────────────────────────────────

  /**
   * 设置全局变量。可在工作流定义中通过 ${vars.key} 引用。
   */
  setVariable<T = unknown>(key: string, value: T): void {
    this.variables.set(key, value);
    this.recordChange('variable-set', key, value);
  }

  /**
   * 获取全局变量。
   */
  getVariable<T = unknown>(key: string): T | undefined {
    return this.variables.get(key) as T | undefined;
  }

  /**
   * 获取全局变量，带默认值。
   */
  getVariableOrDefault<T = unknown>(key: string, defaultValue: T): T {
    return (this.variables.get(key) as T) ?? defaultValue;
  }

  /**
   * 删除全局变量。
   */
  deleteVariable(key: string): boolean {
    const deleted = this.variables.delete(key);
    if (deleted) {
      this.recordChange('variable-deleted', key);
    }
    return deleted;
  }

  /**
   * 检查变量是否存在。
   */
  hasVariable(key: string): boolean {
    return this.variables.has(key);
  }

  // ── 元数据 ──────────────────────────────────────────────

  /**
   * 存储元数据（如执行配置、环境信息等）。
   */
  setMetadata(key: string, value: unknown): void {
    this.metadata.set(key, value);
  }

  /**
   * 获取元数据。
   */
  getMetadata(key: string): unknown {
    return this.metadata.get(key);
  }

  // ── 表达式求值 ──────────────────────────────────────────

  /**
   * 解析字符串中的表达式占位符。
   *
   * 支持格式:
   *   ${steps.stepId}          → 整个步骤输出
   *   ${steps.stepId.field}    → 步骤输出的某个字段
   *   ${vars.key}              → 全局变量
   *   ${meta.key}              → 元数据
   *
   * 示例:
   *   ctx.setStepOutput('a', { name: 'hello' });
   *   ctx.resolveExpression('${steps.a.name}') // → 'hello'
   */
  resolveExpression(expr: string): unknown {
    if (typeof expr !== 'string') return expr;

    // 匹配 ${...} 占位符
    const pattern = /\$\{([^}]+)\}/g;
    const matches = expr.match(pattern);

    if (!matches) return expr;

    // 如果整个字符串就是一个占位符，返回原始类型（对象、数字等）
    if (matches.length === 1 && expr === matches[0]) {
      const path = matches[0].slice(2, -1);
      return this.resolvePath(path);
    }

    // 多个占位符或混合文本 → 替换为字符串
    return expr.replace(pattern, (_, path: string) => {
      const value = this.resolvePath(path);
      return value !== undefined ? String(value) : '';
    });
  }

  /**
   * 递归解析对象中所有字符串值里的表达式。
   */
  resolveObject<T = unknown>(obj: T): T {
    if (typeof obj === 'string') {
      return this.resolveExpression(obj) as T;
    }
    if (Array.isArray(obj)) {
      return obj.map((item) => this.resolveObject(item)) as T;
    }
    if (obj && typeof obj === 'object') {
      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
        result[key] = this.resolveObject(value);
      }
      return result as T;
    }
    return obj;
  }

  // ── 快照与恢复 ──────────────────────────────────────────

  /**
   * 创建当前上下文的快照。可用于断点恢复或调试。
   */
  snapshot(): ContextSnapshot {
    return {
      workflowId: this.workflowId,
      stepOutputs: Object.fromEntries(this.stepOutputs),
      variables: Object.fromEntries(this.variables),
      metadata: Object.fromEntries(this.metadata),
      createdAt: new Date(),
      stepCount: this.stepOutputs.size,
    };
  }

  /**
   * 从快照恢复上下文状态。
   */
  restore(snapshot: ContextSnapshot): void {
    this.stepOutputs.clear();
    this.variables.clear();
    this.metadata.clear();

    for (const [k, v] of Object.entries(snapshot.stepOutputs)) {
      this.stepOutputs.set(k, v);
    }
    for (const [k, v] of Object.entries(snapshot.variables)) {
      this.variables.set(k, v);
    }
    for (const [k, v] of Object.entries(snapshot.metadata)) {
      this.metadata.set(k, v);
    }
  }

  /**
   * 清空所有数据。
   */
  clear(): void {
    this.stepOutputs.clear();
    this.variables.clear();
    this.metadata.clear();
    this.recordChange('cleared', '*');
  }

  // ── 变更历史 ────────────────────────────────────────────

  /**
   * 获取变更历史记录。
   */
  getChangeLog(): ContextChangeEvent[] {
    return [...this.changeLog];
  }

  /**
   * 获取某个 key 的变更次数。
   */
  getChangeCount(key: string): number {
    return this.changeLog.filter(
      (e) => e.key === key,
    ).length;
  }

  // ── 私有方法 ────────────────────────────────────────────

  private resolvePath(path: string): unknown {
    const parts = path.split('.');
    const root = parts[0];
    const rest = parts.slice(1);

    let value: unknown;
    switch (root) {
      case 'steps':
        if (rest.length === 0) return undefined;
        value = this.stepOutputs.get(rest[0]);
        return this.deepGet(value, rest.slice(1));
      case 'vars':
        if (rest.length === 0) return undefined;
        value = this.variables.get(rest[0]);
        return rest.length > 1 ? this.deepGet(value, rest.slice(1)) : value;
      case 'meta':
        if (rest.length === 0) return undefined;
        value = this.metadata.get(rest[0]);
        return rest.length > 1 ? this.deepGet(value, rest.slice(1)) : value;
      default:
        return undefined;
    }
  }

  /** 深层属性访问 (obj.a.b.c) */
  private deepGet(obj: unknown, path: string[]): unknown {
    let current = obj;
    for (const key of path) {
      if (current === null || current === undefined) return undefined;
      if (typeof current === 'object') {
        current = (current as Record<string, unknown>)[key];
      } else {
        return undefined;
      }
    }
    return current;
  }

  private recordChange(
    type: ContextChangeEvent['type'],
    key: string,
    value?: unknown,
  ): void {
    const event: ContextChangeEvent = {
      type,
      workflowId: this.workflowId,
      key,
      value,
      timestamp: new Date(),
    };
    this.changeLog.push(event);

    this.eventBus.emit({
      ...event,
      type: `context.${type}` as any,
    } as any);
  }
}
