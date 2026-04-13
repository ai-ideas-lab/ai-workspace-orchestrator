"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowTemplateService = void 0;
const crypto_1 = require("crypto");
const event_bus_js_1 = require("./event-bus.js");
class WorkflowTemplateService {
    constructor(eventBus) {
        this.templates = new Map();
        this.eventBus = eventBus ?? event_bus_js_1.EventBus.getInstance();
    }
    createTemplate(input) {
        if (!input.name.trim()) {
            throw new Error('Template name cannot be empty');
        }
        if (input.steps.length === 0) {
            throw new Error('Template must have at least one step');
        }
        const detectedVars = this.scanVariables(input.steps);
        const mergedVars = {};
        for (const [varName, info] of detectedVars) {
            mergedVars[varName] = input.variables?.[varName] ?? {
                description: `Auto-detected variable: ${varName}`,
                required: true,
            };
        }
        for (const [varName, def] of Object.entries(input.variables ?? {})) {
            if (!mergedVars[varName]) {
                mergedVars[varName] = def;
            }
        }
        const now = new Date();
        const template = {
            id: (0, crypto_1.randomUUID)(),
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
            type: 'template.created',
            templateId: template.id,
            templateName: template.name,
            variableCount: Object.keys(mergedVars).length,
            stepCount: template.steps.length,
            timestamp: new Date(),
        });
        return template;
    }
    instantiate(templateId, options) {
        const template = this.templates.get(templateId);
        if (!template) {
            throw new Error(`Template not found: ${templateId}`);
        }
        for (const [varName, def] of Object.entries(template.variables)) {
            if (def.required && !options.variables[varName] && !def.default) {
                throw new Error(`Missing required variable: ${varName} — ${def.description}`);
            }
        }
        const resolvedVars = {};
        for (const [varName, def] of Object.entries(template.variables)) {
            resolvedVars[varName] = options.variables[varName] ?? def.default ?? '';
        }
        const instanceId = (0, crypto_1.randomUUID)();
        const renderedSteps = template.steps.map((step) => ({
            ...step,
            id: `${step.id}_${instanceId.slice(0, 8)}`,
            payload: this.renderPayload(step.payload, resolvedVars),
        }));
        template.usageCount++;
        template.updatedAt = new Date();
        const workflow = {
            id: options.workflowId ?? (0, crypto_1.randomUUID)(),
            name: options.workflowName ?? `${template.name} #${template.usageCount}`,
            steps: renderedSteps,
        };
        this.eventBus.emit({
            type: 'template.instantiated',
            templateId,
            workflowId: workflow.id,
            variablesUsed: Object.keys(options.variables),
            timestamp: new Date(),
        });
        return workflow;
    }
    getTemplate(id) {
        return this.templates.get(id);
    }
    listTemplates(filter) {
        const all = Array.from(this.templates.values());
        if (filter?.tag) {
            return all.filter((t) => t.tags.includes(filter.tag));
        }
        return all;
    }
    deleteTemplate(id) {
        return this.templates.delete(id);
    }
    scanVariables(steps) {
        const varMap = new Map();
        const pattern = /\{\{(\w+)\}\}/g;
        for (const step of steps) {
            const payloadStr = JSON.stringify(step.payload);
            let match;
            while ((match = pattern.exec(payloadStr)) !== null) {
                const varName = match[1];
                const existing = varMap.get(varName);
                varMap.set(varName, { occurrences: (existing?.occurrences ?? 0) + 1 });
            }
        }
        return varMap;
    }
    renderPayload(payload, vars) {
        const rendered = {};
        for (const [key, value] of Object.entries(payload)) {
            rendered[key] = this.renderValue(value, vars);
        }
        return rendered;
    }
    renderValue(value, vars) {
        if (typeof value === 'string') {
            return value.replace(/\{\{(\w+)\}\}/g, (_, varName) => vars[varName] ?? `{{${varName}}}`);
        }
        if (Array.isArray(value)) {
            return value.map((item) => this.renderValue(item, vars));
        }
        if (value !== null && typeof value === 'object') {
            return this.renderPayload(value, vars);
        }
        return value;
    }
}
exports.WorkflowTemplateService = WorkflowTemplateService;
//# sourceMappingURL=workflow-template.js.map