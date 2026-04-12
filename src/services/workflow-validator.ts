/**
 * WorkflowValidator — 工作流定义业务规则验证器
 *
 * 在 WorkflowDependencyAnalyzer（拓扑结构验证）之上，
 * 提供业务层面的工作流定义校验：
 *   1. validate()     — 校验完整 WorkflowDefinition
 *   2. validateStep()  — 校验单个步骤配置
 *
 * 校验规则:
 *   - 工作流名称：非空、长度 ≤ 200
 *   - 步骤列表：≥ 1 且 ≤ 500
 *   - 步骤 ID：唯一、非空、格式合规
 *   - 步骤名称：非空、长度 ≤ 200
 *   - 任务类型：必须在允许列表内
 *   - Payload：必须为对象，序列化后 ≤ 1MB
 *   - 自定义规则：支持注入额外校验函数
 *
 * 使用方式:
 *   const validator = new WorkflowValidator();
 *   const report = validator.validate(definition);
 *   if (!report.valid) console.error(report.errors);
 */

import type { WorkflowDefinition, WorkflowStep } from './workflow-executor.js';
import { WorkflowDependencyAnalyzer } from './workflow-dependency-analyzer.js';

// ── 类型定义 ─────────────────────────────────────────────

export interface ValidationError {
  /** 错误级别 */
  level: 'error' | 'warning';
  /** 关联字段路径，如 "steps[2].taskType" */
  path: string;
  /** 错误消息 */
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  /** 错误列表（含 warning 级别） */
  errors: ValidationError[];
  /** 仅 error 级别的错误 */
  errorsOnly: ValidationError[];
  /** 仅 warning 级别的建议 */
  warnings: ValidationError[];
}

export interface ValidatorOptions {
  /** 允许的任务类型列表，默认为常用 AI 任务 */
  allowedTaskTypes?: string[];
  /** 最大步骤数，默认 500 */
  maxSteps?: number;
  /** 最大 payload 序列化大小（字节），默认 1MB */
  maxPayloadBytes?: number;
  /** 步骤 ID 正则（默认: 字母数字 + 短横线 + 下划线） */
  stepIdPattern?: RegExp;
  /** 额外自定义校验规则 */
  customRules?: Array<(def: WorkflowDefinition) => ValidationError[]>;
}

// ── 默认配置 ─────────────────────────────────────────────

const DEFAULT_TASK_TYPES = [
  'text-generation',
  'text-completion',
  'text-translation',
  'text-summarization',
  'text-classification',
  'image-generation',
  'image-analysis',
  'image-editing',
  'audio-transcription',
  'audio-generation',
  'video-generation',
  'video-analysis',
  'code-generation',
  'code-review',
  'data-analysis',
  'data-extraction',
  'data-transformation',
  'embedding',
  'sentiment-analysis',
  'ner',
  'custom',
];

const STEP_ID_REGEX = /^[a-zA-Z0-9_-]+$/;

// ── 核心类 ──────────────────────────────────────────────

export class WorkflowValidator {
  private readonly allowedTaskTypes: Set<string>;
  private readonly maxSteps: number;
  private readonly maxPayloadBytes: number;
  private readonly stepIdPattern: RegExp;
  private readonly customRules: Array<(def: WorkflowDefinition) => ValidationError[]>;
  private readonly dependencyAnalyzer: WorkflowDependencyAnalyzer;

  constructor(options?: ValidatorOptions) {
    const taskTypes = options?.allowedTaskTypes ?? DEFAULT_TASK_TYPES;
    this.allowedTaskTypes = new Set(taskTypes);
    this.maxSteps = options?.maxSteps ?? 500;
    this.maxPayloadBytes = options?.maxPayloadBytes ?? 1024 * 1024; // 1MB
    this.stepIdPattern = options?.stepIdPattern ?? STEP_ID_REGEX;
    this.customRules = options?.customRules ?? [];
    this.dependencyAnalyzer = new WorkflowDependencyAnalyzer();
  }

  // ── 核心函数 1: 验证完整工作流 ────────────────────────

  /**
   * 验证工作流定义的完整性和合规性。
   * 包含结构校验 + DAG 拓扑校验 + 自定义规则。
   */
  validate(definition: WorkflowDefinition): ValidationResult {
    const errors: ValidationError[] = [];

    // ── 工作流基础校验 ──
    if (!definition.id || typeof definition.id !== 'string' || definition.id.trim() === '') {
      errors.push({
        level: 'error',
        path: 'id',
        message: '工作流 ID 不能为空',
      });
    }

    if (!definition.name || typeof definition.name !== 'string' || definition.name.trim() === '') {
      errors.push({
        level: 'error',
        path: 'name',
        message: '工作流名称不能为空',
      });
    } else if (definition.name.length > 200) {
      errors.push({
        level: 'error',
        path: 'name',
        message: `工作流名称过长（${definition.name.length}/200）`,
      });
    }

    // ── 步骤列表校验 ──
    if (!Array.isArray(definition.steps)) {
      errors.push({
        level: 'error',
        path: 'steps',
        message: '步骤列表必须为数组',
      });
    } else if (definition.steps.length === 0) {
      errors.push({
        level: 'error',
        path: 'steps',
        message: '工作流至少需要一个步骤',
      });
    } else if (definition.steps.length > this.maxSteps) {
      errors.push({
        level: 'error',
        path: 'steps',
        message: `步骤数量超过上限（${definition.steps.length}/${this.maxSteps}）`,
      });
    } else {
      // 逐步骤校验
      const stepIds = new Set<string>();
      for (let i = 0; i < definition.steps.length; i++) {
        const stepErrors = this.validateStep(definition.steps[i], i, stepIds);
        errors.push(...stepErrors);
      }
    }

    // ── DAG 拓扑校验 ──
    if (Array.isArray(definition.steps) && definition.steps.length > 0) {
      const depReport = this.dependencyAnalyzer.validate(definition.steps);
      if (!depReport.valid) {
        for (const depError of depReport.errors) {
          errors.push({
            level: 'error',
            path: 'steps',
            message: depError,
          });
        }
      }
      // 孤立节点作为警告
      if (depReport.orphanSteps.length > 0 && definition.steps.length > 1) {
        errors.push({
          level: 'warning',
          path: 'steps',
          message: `存在孤立步骤（无上下游连接）: ${depReport.orphanSteps.join(', ')}，这些步骤将并行执行但与其他步骤无关联`,
        });
      }
    }

    // ── 自定义规则 ──
    for (const rule of this.customRules) {
      try {
        const customErrors = rule(definition);
        errors.push(...customErrors);
      } catch {
        // 自定义规则出错不应阻断校验流程
      }
    }

    // ── 汇总结果 ──
    const errorsOnly = errors.filter((e) => e.level === 'error');
    const warnings = errors.filter((e) => e.level === 'warning');

    return {
      valid: errorsOnly.length === 0,
      errors,
      errorsOnly,
      warnings,
    };
  }

  // ── 核心函数 2: 验证单个步骤 ────────────────────────

  /**
   * 验证单个工作流步骤的配置。
   * @param step     待校验步骤
   * @param index    步骤在列表中的索引（用于错误定位）
   * @param seenIds  已见 ID 集合（用于唯一性检测）
   */
  validateStep(
    step: WorkflowStep,
    index: number,
    seenIds?: Set<string>,
  ): ValidationError[] {
    const errors: ValidationError[] = [];
    const prefix = `steps[${index}]`;
    const idSet = seenIds ?? new Set<string>();

    // ID 校验
    if (!step.id || typeof step.id !== 'string' || step.id.trim() === '') {
      errors.push({
        level: 'error',
        path: `${prefix}.id`,
        message: `步骤索引 ${index} 缺少有效 ID`,
      });
    } else {
      if (!this.stepIdPattern.test(step.id)) {
        errors.push({
          level: 'error',
          path: `${prefix}.id`,
          message: `步骤 ID "${step.id}" 格式不合规，仅允许字母、数字、短横线和下划线`,
        });
      }
      if (idSet.has(step.id)) {
        errors.push({
          level: 'error',
          path: `${prefix}.id`,
          message: `步骤 ID "${step.id}" 重复`,
        });
      }
      idSet.add(step.id);
    }

    // 名称校验
    if (!step.name || typeof step.name !== 'string' || step.name.trim() === '') {
      errors.push({
        level: 'error',
        path: `${prefix}.name`,
        message: `步骤 "${step.id || index}" 缺少名称`,
      });
    } else if (step.name.length > 200) {
      errors.push({
        level: 'warning',
        path: `${prefix}.name`,
        message: `步骤名称过长（${step.name.length}/200）`,
      });
    }

    // 任务类型校验
    if (!step.taskType || typeof step.taskType !== 'string') {
      errors.push({
        level: 'error',
        path: `${prefix}.taskType`,
        message: `步骤 "${step.id || index}" 缺少任务类型`,
      });
    } else if (!this.allowedTaskTypes.has(step.taskType)) {
      errors.push({
        level: 'warning',
        path: `${prefix}.taskType`,
        message: `步骤 "${step.id}" 使用了非标准任务类型 "${step.taskType}"，允许的类型: ${Array.from(this.allowedTaskTypes).slice(0, 5).join(', ')}...`,
      });
    }

    // Payload 校验
    if (step.payload === undefined || step.payload === null) {
      errors.push({
        level: 'error',
        path: `${prefix}.payload`,
        message: `步骤 "${step.id || index}" 缺少 payload`,
      });
    } else if (typeof step.payload !== 'object' || Array.isArray(step.payload)) {
      errors.push({
        level: 'error',
        path: `${prefix}.payload`,
        message: `步骤 "${step.id || index}" 的 payload 必须为对象（不能是数组）`,
      });
    } else {
      // Payload 大小校验
      try {
        const size = Buffer.byteLength(JSON.stringify(step.payload), 'utf-8');
        if (size > this.maxPayloadBytes) {
          errors.push({
            level: 'error',
            path: `${prefix}.payload`,
            message: `步骤 "${step.id}" payload 过大（${(size / 1024).toFixed(1)}KB/${(this.maxPayloadBytes / 1024).toFixed(0)}KB）`,
          });
        }
      } catch {
        errors.push({
          level: 'error',
          path: `${prefix}.payload`,
          message: `步骤 "${step.id}" payload 序列化失败（可能包含循环引用）`,
        });
      }
    }

    // dependsOn 校验
    if (step.dependsOn !== undefined && !Array.isArray(step.dependsOn)) {
      errors.push({
        level: 'error',
        path: `${prefix}.dependsOn`,
        message: `步骤 "${step.id}" 的 dependsOn 必须为数组`,
      });
    }

    return errors;
  }
}
