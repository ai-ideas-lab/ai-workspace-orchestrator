"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowValidator = void 0;
const workflow_dependency_analyzer_js_1 = require("./workflow-dependency-analyzer.js");
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
class WorkflowValidator {
    constructor(options) {
        const taskTypes = options?.allowedTaskTypes ?? DEFAULT_TASK_TYPES;
        this.allowedTaskTypes = new Set(taskTypes);
        this.maxSteps = options?.maxSteps ?? 500;
        this.maxPayloadBytes = options?.maxPayloadBytes ?? 1024 * 1024;
        this.stepIdPattern = options?.stepIdPattern ?? STEP_ID_REGEX;
        this.customRules = options?.customRules ?? [];
        this.dependencyAnalyzer = new workflow_dependency_analyzer_js_1.WorkflowDependencyAnalyzer();
    }
    validate(definition) {
        const errors = [];
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
        }
        else if (definition.name.length > 200) {
            errors.push({
                level: 'error',
                path: 'name',
                message: `工作流名称过长（${definition.name.length}/200）`,
            });
        }
        if (!Array.isArray(definition.steps)) {
            errors.push({
                level: 'error',
                path: 'steps',
                message: '步骤列表必须为数组',
            });
        }
        else if (definition.steps.length === 0) {
            errors.push({
                level: 'error',
                path: 'steps',
                message: '工作流至少需要一个步骤',
            });
        }
        else if (definition.steps.length > this.maxSteps) {
            errors.push({
                level: 'error',
                path: 'steps',
                message: `步骤数量超过上限（${definition.steps.length}/${this.maxSteps}）`,
            });
        }
        else {
            const stepIds = new Set();
            for (let i = 0; i < definition.steps.length; i++) {
                const stepErrors = this.validateStep(definition.steps[i], i, stepIds);
                errors.push(...stepErrors);
            }
        }
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
            if (depReport.orphanSteps.length > 0 && definition.steps.length > 1) {
                errors.push({
                    level: 'warning',
                    path: 'steps',
                    message: `存在孤立步骤（无上下游连接）: ${depReport.orphanSteps.join(', ')}，这些步骤将并行执行但与其他步骤无关联`,
                });
            }
        }
        for (const rule of this.customRules) {
            try {
                const customErrors = rule(definition);
                errors.push(...customErrors);
            }
            catch {
            }
        }
        const errorsOnly = errors.filter((e) => e.level === 'error');
        const warnings = errors.filter((e) => e.level === 'warning');
        return {
            valid: errorsOnly.length === 0,
            errors,
            errorsOnly,
            warnings,
        };
    }
    validateStep(step, index, seenIds) {
        const errors = [];
        const prefix = `steps[${index}]`;
        const idSet = seenIds ?? new Set();
        if (!step.id || typeof step.id !== 'string' || step.id.trim() === '') {
            errors.push({
                level: 'error',
                path: `${prefix}.id`,
                message: `步骤索引 ${index} 缺少有效 ID`,
            });
        }
        else {
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
        if (!step.name || typeof step.name !== 'string' || step.name.trim() === '') {
            errors.push({
                level: 'error',
                path: `${prefix}.name`,
                message: `步骤 "${step.id || index}" 缺少名称`,
            });
        }
        else if (step.name.length > 200) {
            errors.push({
                level: 'warning',
                path: `${prefix}.name`,
                message: `步骤名称过长（${step.name.length}/200）`,
            });
        }
        if (!step.taskType || typeof step.taskType !== 'string') {
            errors.push({
                level: 'error',
                path: `${prefix}.taskType`,
                message: `步骤 "${step.id || index}" 缺少任务类型`,
            });
        }
        else if (!this.allowedTaskTypes.has(step.taskType)) {
            errors.push({
                level: 'warning',
                path: `${prefix}.taskType`,
                message: `步骤 "${step.id}" 使用了非标准任务类型 "${step.taskType}"，允许的类型: ${Array.from(this.allowedTaskTypes).slice(0, 5).join(', ')}...`,
            });
        }
        if (step.payload === undefined || step.payload === null) {
            errors.push({
                level: 'error',
                path: `${prefix}.payload`,
                message: `步骤 "${step.id || index}" 缺少 payload`,
            });
        }
        else if (typeof step.payload !== 'object' || Array.isArray(step.payload)) {
            errors.push({
                level: 'error',
                path: `${prefix}.payload`,
                message: `步骤 "${step.id || index}" 的 payload 必须为对象（不能是数组）`,
            });
        }
        else {
            try {
                const size = Buffer.byteLength(JSON.stringify(step.payload), 'utf-8');
                if (size > this.maxPayloadBytes) {
                    errors.push({
                        level: 'error',
                        path: `${prefix}.payload`,
                        message: `步骤 "${step.id}" payload 过大（${(size / 1024).toFixed(1)}KB/${(this.maxPayloadBytes / 1024).toFixed(0)}KB）`,
                    });
                }
            }
            catch {
                errors.push({
                    level: 'error',
                    path: `${prefix}.payload`,
                    message: `步骤 "${step.id}" payload 序列化失败（可能包含循环引用）`,
                });
            }
        }
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
exports.WorkflowValidator = WorkflowValidator;
//# sourceMappingURL=workflow-validator.js.map