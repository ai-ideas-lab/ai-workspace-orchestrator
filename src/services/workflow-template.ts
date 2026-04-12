/**
 * WorkflowTemplateService - 工作流模板引擎
 *
 * 支持创建带有变量占位符的工作流模板，然后用实际参数实例化为
 * 可执行的 WorkflowDefinition。用户可以保存常用工作流为模板，
 * 一键复用，减少重复配置。
 *
 * 核心职责:
 *   1. createTemplate()  — 创建模板（步骤 payload 中可用 {{var}} 占位）
 *   2. instantiate()     — 传入参数，渲染为完整 WorkflowDefinition
 *
 * 使用方式:
 *   const svc = new WorkflowTemplateService();
 *   const tpl = svc.createTemplate({
 *     name: '内容生成流水线',
 *     description: '先生成大纲，再逐段扩展',
 *     steps: [
 *       { id: 'outline', name: '生成大纲', taskType: 'text-generation',
 *         payload: { prompt: '为 {{topic}} 生成大纲，{{style}} 风格' },
 *         dependsOn: [] },
 *       { id: 'draft', name: '扩展草稿', taskType: 'text-generation',
 *         payload: { prompt: '根据大纲扩展 {{topic}} 的完整文章' },
 *         dependsOn: ['outline'] },
 *     ],
 *     variables: { topic: { description: '文章主题', required: true },
 *                   style: { description: '写作风格', default: '专业' } },
 *   });
 *
 *   const workflow = svc.instantiate(tpl.id, { topic: 'AI教育', style: '轻松' });
 */

import { randomUUID } from 'crypto';
import { EventBus } from './event-bus.js';
import type { WorkflowDefinition, WorkflowStep } from './workflow-executor.js';

// ── 模板类型定义 ────────────────────────────────────────

export interface VariableDef {
  /** 变量说明 */
  description: string;
  /** 是否必填（默认 false） */
  required?: boolean;
  /** 默认值 */
  default?: string;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  /** 模板版本号 */
  version: number;
  /** 步骤模板（payload 中可用 {{var}} 占位） */
  steps: WorkflowStep[];
  /** 变量定义 */
  variables: Record<string, VariableDef>;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
  /** 使用次数 */
  usageCount: number;
  /** 标签 */
  tags: string[];
}

export interface CreateTemplateInput {
  name: string;
  description: string;
  steps: WorkflowStep[];
  variables?: Record<string, VariableDef>;
  tags?: string[];
}

export interface InstantiateOptions {
  /** 变量值映射 */
  variables: Record<string, string>;
  /** 实例化后的工作流 ID（默认自动生成） */
  workflowId?: string;
  /** 覆盖工作流名称 */
  workflowName?: string;
}

// ── 核心类 ──────────────────────────────────────────────

export class WorkflowTemplateService {
  private templates = new Map<string, WorkflowTemplate>();
  private eventBus: EventBus;

  constructor(eventBus?: EventBus) {
    this.eventBus = eventBus ?? EventBus.getInstance();
  }

  // ── 核心函数 1: 创建模板 ──────────────────────────────

  /**
   * 创建工作流模板。自动从步骤 payload 中扫描 {{var}} 占位符，
   * 与显式变量定义合并，补全缺失的 variable 定义。
   *
   * @throws 如果名称为空或步骤为空
   */
  createTemplate(input: CreateTemplateInput): WorkflowTemplate {
    if (!input.name.trim()) {
      throw new Error('Template name cannot be empty');
    }
    if (input.steps.length === 0) {
      throw new Error('Template must have at least one step');
    }

    // 从 payload 中自动扫描 {{var}} 占位符
    const detectedVars = this.scanVariables(input.steps);

    // 合并：显式定义优先，未定义的用检测到的补全
    const mergedVars: Record<string, VariableDef> = {};
    for (const [varName, info] of detectedVars) {
      mergedVars[varName] = input.variables?.[varName] ?? {
        description: `Auto-detected variable: ${varName}`,
        required: true,
      };
    }
    // 加入显式定义但 payload 未使用的变量（可能有用途）
    for (const [varName, def] of Object.entries(input.variables ?? {})) {
      if (!mergedVars[varName]) {
        mergedVars[varName] = def;
      }
    }

    const now = new Date();
    const template: WorkflowTemplate = {
      id: randomUUID(),
      name: input.name,
      description: input.description,
      version: 1,
      steps: structuredClone(input.steps),
      variables: mergedVars,
      createdAt: now,
      updatedAt: now,
      usageCount: 0,
      tags: input.tags ?? [],
    };

    this.templates.set(template.id, template);

    this.eventBus.emit({
      type: 'template.created' as any,
      templateId: template.id,
      templateName: template.name,
      variableCount: Object.keys(mergedVars).length,
      stepCount: template.steps.length,
      timestamp: new Date(),
    } as any);

    return template;
  }

  // ── 核心函数 2: 从模板实例化工作流 ────────────────────

  /**
   * 将模板渲染为可执行的 WorkflowDefinition。
   * 用 variables 映射替换步骤 payload 中的 {{var}} 占位符。
   *
   * @throws 如果模板不存在、必填变量缺失
   */
  instantiate(templateId: string, options: InstantiateOptions): WorkflowDefinition {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // 验证必填变量
    for (const [varName, def] of Object.entries(template.variables)) {
      if (def.required && !options.variables[varName] && !def.default) {
        throw new Error(`Missing required variable: ${varName} — ${def.description}`);
      }
    }

    // 合并变量：用户传入 > 默认值
    const resolvedVars: Record<string, string> = {};
    for (const [varName, def] of Object.entries(template.variables)) {
      resolvedVars[varName] = options.variables[varName] ?? def.default ?? '';
    }

    // 渲染步骤 payload
    const instanceId = randomUUID(); // 为每个实例生成唯一ID
    const renderedSteps: WorkflowStep[] = template.steps.map((step) => ({
      ...step,
      id: `${step.id}_${instanceId.slice(0, 8)}`, // 使用UUID前8位确保唯一性
      payload: this.renderPayload(step.payload, resolvedVars),
    }));

    // 更新模板使用计数
    template.usageCount++;
    template.updatedAt = new Date();

    const workflow: WorkflowDefinition = {
      id: options.workflowId ?? randomUUID(),
      name: options.workflowName ?? `${template.name} #${template.usageCount}`,
      steps: renderedSteps,
    };

    this.eventBus.emit({
      type: 'template.instantiated' as any,
      templateId,
      workflowId: workflow.id,
      variablesUsed: Object.keys(options.variables),
      timestamp: new Date(),
    } as any);

    return workflow;
  }

  // ── 辅助方法 ──────────────────────────────────────────

  /** 获取模板 */
  getTemplate(id: string): WorkflowTemplate | undefined {
    return this.templates.get(id);
  }

  /** 列出所有模板 */
  listTemplates(filter?: { tag?: string }): WorkflowTemplate[] {
    const all = Array.from(this.templates.values());
    if (filter?.tag) {
      return all.filter((t) => t.tags.includes(filter.tag!));
    }
    return all;
  }

  /** 删除模板 */
  deleteTemplate(id: string): boolean {
    return this.templates.delete(id);
  }

  // ── 私有方法 ──────────────────────────────────────────

  /** 从步骤 payload 中扫描所有 {{varName}} 占位符 */
  private scanVariables(steps: WorkflowStep[]): Map<string, { occurrences: number }> {
    const varMap = new Map<string, { occurrences: number }>();
    const pattern = /\{\{(\w+)\}\}/g;

    for (const step of steps) {
      const payloadStr = JSON.stringify(step.payload);
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(payloadStr)) !== null) {
        const varName = match[1];
        const existing = varMap.get(varName);
        varMap.set(varName, { occurrences: (existing?.occurrences ?? 0) + 1 });
      }
    }

    return varMap;
  }

  /** 递归渲染 payload 中的 {{var}} 占位符 */
  private renderPayload(
    payload: Record<string, unknown>,
    vars: Record<string, string>,
  ): Record<string, unknown> {
    const rendered: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(payload)) {
      rendered[key] = this.renderValue(value, vars);
    }
    return rendered;
  }

  /** 渲染单个值（支持字符串、嵌套对象、数组） */
  private renderValue(value: unknown, vars: Record<string, string>): unknown {
    if (typeof value === 'string') {
      return value.replace(/\{\{(\w+)\}\}/g, (_, varName) => vars[varName] ?? `{{${varName}}}`);
    }
    if (Array.isArray(value)) {
      return value.map((item) => this.renderValue(item, vars));
    }
    if (value !== null && typeof value === 'object') {
      return this.renderPayload(value as Record<string, unknown>, vars);
    }
    return value;
  }
}
