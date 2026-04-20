"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowContext = void 0;
const event_bus_js_1 = require("./event-bus.js");
class WorkflowContext {
    constructor(workflowId, eventBus) {
        this.workflowId = workflowId;
        this.stepOutputs = new Map();
        this.variables = new Map();
        this.metadata = new Map();
        this.changeLog = [];
        this.eventBus = eventBus ?? event_bus_js_1.EventBus.getInstance();
    }
    setStepOutput(stepId, output) {
        this.stepOutputs.set(stepId, output);
        this.recordChange('step-output-set', stepId, output);
    }
    getStepOutput(stepId) {
        return this.stepOutputs.get(stepId);
    }
    getStepOutputs(stepIds) {
        const result = {};
        for (const id of stepIds) {
            const output = this.stepOutputs.get(id);
            if (output !== undefined) {
                result[id] = output;
            }
        }
        return result;
    }
    hasStepOutput(stepId) {
        return this.stepOutputs.has(stepId);
    }
    getCompletedStepIds() {
        return Array.from(this.stepOutputs.keys());
    }
    setVariable(key, value) {
        this.variables.set(key, value);
        this.recordChange('variable-set', key, value);
    }
    getVariable(key) {
        return this.variables.get(key);
    }
    getVariableOrDefault(key, defaultValue) {
        return this.variables.get(key) ?? defaultValue;
    }
    deleteVariable(key) {
        const deleted = this.variables.delete(key);
        if (deleted) {
            this.recordChange('variable-deleted', key);
        }
        return deleted;
    }
    hasVariable(key) {
        return this.variables.has(key);
    }
    setMetadata(key, value) {
        this.metadata.set(key, value);
    }
    getMetadata(key) {
        return this.metadata.get(key);
    }
    resolveExpression(expr) {
        if (typeof expr !== 'string')
            return expr;
        const pattern = /\$\{([^}]+)\}/g;
        const matches = expr.match(pattern);
        if (!matches)
            return expr;
        if (matches.length === 1 && expr === matches[0]) {
            const path = matches[0].slice(2, -1);
            return this.resolvePath(path);
        }
        return expr.replace(pattern, (_, path) => {
            const value = this.resolvePath(path);
            return value !== undefined ? String(value) : '';
        });
    }
    resolveObject(obj) {
        if (typeof obj === 'string') {
            return this.resolveExpression(obj);
        }
        if (Array.isArray(obj)) {
            return obj.map((item) => this.resolveObject(item));
        }
        if (obj && typeof obj === 'object') {
            const result = {};
            for (const [key, value] of Object.entries(obj)) {
                result[key] = this.resolveObject(value);
            }
            return result;
        }
        return obj;
    }
    snapshot() {
        return {
            workflowId: this.workflowId,
            stepOutputs: Object.fromEntries(this.stepOutputs),
            variables: Object.fromEntries(this.variables),
            metadata: Object.fromEntries(this.metadata),
            createdAt: new Date(),
            stepCount: this.stepOutputs.size,
        };
    }
    restore(snapshot) {
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
    clear() {
        this.stepOutputs.clear();
        this.variables.clear();
        this.metadata.clear();
        this.recordChange('cleared', '*');
    }
    getChangeLog() {
        return [...this.changeLog];
    }
    getChangeCount(key) {
        return this.changeLog.filter((e) => e.key === key).length;
    }
    resolvePath(path) {
        const parts = path.split('.');
        const root = parts[0];
        const rest = parts.slice(1);
        let value;
        switch (root) {
            case 'steps':
                if (rest.length === 0)
                    return undefined;
                value = this.stepOutputs.get(rest[0]);
                return this.deepGet(value, rest.slice(1));
            case 'vars':
                if (rest.length === 0)
                    return undefined;
                value = this.variables.get(rest[0]);
                return rest.length > 1 ? this.deepGet(value, rest.slice(1)) : value;
            case 'meta':
                if (rest.length === 0)
                    return undefined;
                value = this.metadata.get(rest[0]);
                return rest.length > 1 ? this.deepGet(value, rest.slice(1)) : value;
            default:
                return undefined;
        }
    }
    deepGet(obj, path) {
        let current = obj;
        for (const key of path) {
            if (current === null || current === undefined)
                return undefined;
            if (typeof current === 'object') {
                current = current[key];
            }
            else {
                return undefined;
            }
        }
        return current;
    }
    recordChange(type, key, value) {
        const event = {
            type,
            workflowId: this.workflowId,
            key,
            value,
            timestamp: new Date(),
        };
        this.changeLog.push(event);
        this.eventBus.emit({
            ...event,
            type: `context.${type}`,
        });
    }
}
exports.WorkflowContext = WorkflowContext;
//# sourceMappingURL=workflow-context.js.map