"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowVersionService = void 0;
class WorkflowVersionService {
    constructor() {
        this.snapshots = new Map();
        this.nextId = 1;
    }
    createSnapshot(workflow, message = '', createdBy) {
        const history = this.snapshots.get(workflow.id) ?? [];
        const version = history.length + 1;
        const snapshot = {
            id: `snap_${this.nextId++}`,
            workflowId: workflow.id,
            version,
            definition: JSON.parse(JSON.stringify(workflow)),
            message,
            createdAt: new Date(),
            createdBy,
        };
        history.push(snapshot);
        this.snapshots.set(workflow.id, history);
        return snapshot;
    }
    diff(a, b) {
        const snapA = this.resolveSnapshot(a);
        const snapB = this.resolveSnapshot(b);
        if (!snapA || !snapB) {
            throw new Error('快照不存在');
        }
        const stepsA = new Map(snapA.definition.steps.map((s) => [s.id, s]));
        const stepsB = new Map(snapB.definition.steps.map((s) => [s.id, s]));
        const stepDiffs = [];
        for (const [id, step] of stepsA) {
            if (!stepsB.has(id)) {
                stepDiffs.push({ stepId: id, stepName: step.name, change: 'removed' });
            }
        }
        for (const [id, stepB] of stepsB) {
            const stepA = stepsA.get(id);
            if (!stepA) {
                stepDiffs.push({ stepId: id, stepName: stepB.name, change: 'added' });
            }
            else {
                const changedFields = this.diffStepFields(stepA, stepB);
                stepDiffs.push({
                    stepId: id,
                    stepName: stepB.name,
                    change: changedFields.length > 0 ? 'modified' : 'unchanged',
                    fields: changedFields.length > 0 ? changedFields : undefined,
                });
            }
        }
        const hasChanges = stepDiffs.some((d) => d.change !== 'unchanged');
        return {
            fromVersion: snapA.version,
            toVersion: snapB.version,
            stepDiffs,
            stepCountDelta: stepsB.size - stepsA.size,
            hasChanges,
        };
    }
    getHistory(workflowId) {
        return [...(this.snapshots.get(workflowId) ?? [])];
    }
    getLatest(workflowId) {
        const history = this.snapshots.get(workflowId);
        return history?.[history.length - 1];
    }
    getVersion(workflowId, version) {
        const history = this.snapshots.get(workflowId);
        return history?.[version - 1];
    }
    rollback(workflowId, targetVersion) {
        const snapshot = this.getVersion(workflowId, targetVersion);
        if (!snapshot) {
            throw new Error(`版本 ${targetVersion} 不存在（workflowId=${workflowId}）`);
        }
        return JSON.parse(JSON.stringify(snapshot.definition));
    }
    resolveSnapshot(ref) {
        if ('id' in ref && 'workflowId' in ref) {
            return ref;
        }
        const [workflowId, version] = ref;
        return this.getVersion(workflowId, version);
    }
    diffStepFields(a, b) {
        const fields = [];
        const compareKeys = ['name', 'taskType', 'dependsOn', 'priority', 'maxRetries'];
        for (const key of compareKeys) {
            const va = JSON.stringify(a[key]);
            const vb = JSON.stringify(b[key]);
            if (va !== vb)
                fields.push(key);
        }
        if (JSON.stringify(a.payload) !== JSON.stringify(b.payload)) {
            fields.push('payload');
        }
        return fields;
    }
}
exports.WorkflowVersionService = WorkflowVersionService;
//# sourceMappingURL=workflow-version.js.map