"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const workflow_version_1 = require("../services/workflow-version");
function makeWorkflow(id, steps) {
    return { id, name: `workflow-${id}`, steps };
}
function makeStep(id, name, dependsOn = []) {
    return {
        id,
        name,
        taskType: 'text-generation',
        payload: { prompt: `test-${id}` },
        dependsOn,
    };
}
(0, globals_1.describe)('WorkflowVersionService', () => {
    let service;
    (0, globals_1.beforeEach)(() => {
        service = new workflow_version_1.WorkflowVersionService();
    });
    (0, globals_1.describe)('createSnapshot()', () => {
        (0, globals_1.it)('应创建快照并保留元信息', () => {
            const wf = makeWorkflow('wf1', [makeStep('s1', 'Step 1')]);
            const snap = service.createSnapshot(wf, '初始版本', 'alice');
            (0, globals_1.expect)(snap.workflowId).toBe('wf1');
            (0, globals_1.expect)(snap.version).toBe(1);
            (0, globals_1.expect)(snap.message).toBe('初始版本');
            (0, globals_1.expect)(snap.createdBy).toBe('alice');
            (0, globals_1.expect)(snap.definition.steps).toHaveLength(1);
            (0, globals_1.expect)(snap.id).toMatch(/^snap_/);
        });
        (0, globals_1.it)('版本号应自动递增', () => {
            const wf = makeWorkflow('wf1', [makeStep('s1', 'Step 1')]);
            const v1 = service.createSnapshot(wf, 'v1');
            const v2 = service.createSnapshot(wf, 'v2');
            const v3 = service.createSnapshot(wf, 'v3');
            (0, globals_1.expect)(v1.version).toBe(1);
            (0, globals_1.expect)(v2.version).toBe(2);
            (0, globals_1.expect)(v3.version).toBe(3);
        });
        (0, globals_1.it)('快照应是深拷贝，不受后续修改影响', () => {
            const wf = makeWorkflow('wf1', [makeStep('s1', 'Step 1')]);
            service.createSnapshot(wf);
            wf.steps.push(makeStep('s2', 'Step 2'));
            wf.steps[0].name = 'Modified';
            const snap = service.getVersion('wf1', 1);
            (0, globals_1.expect)(snap.definition.steps).toHaveLength(1);
            (0, globals_1.expect)(snap.definition.steps[0].name).toBe('Step 1');
        });
    });
    (0, globals_1.describe)('getHistory() & getLatest()', () => {
        (0, globals_1.it)('getHistory 应返回所有版本历史', () => {
            const wf = makeWorkflow('wf1', [makeStep('s1', 'Step 1')]);
            service.createSnapshot(wf, 'v1');
            service.createSnapshot(wf, 'v2');
            const history = service.getHistory('wf1');
            (0, globals_1.expect)(history).toHaveLength(2);
            (0, globals_1.expect)(history[0].version).toBe(1);
            (0, globals_1.expect)(history[1].version).toBe(2);
        });
        (0, globals_1.it)('getLatest 应返回最新版本', () => {
            const wf = makeWorkflow('wf1', [makeStep('s1', 'Step 1')]);
            service.createSnapshot(wf, 'v1');
            service.createSnapshot(wf, 'v2');
            (0, globals_1.expect)(service.getLatest('wf1')?.version).toBe(2);
            (0, globals_1.expect)(service.getLatest('nonexistent')).toBeUndefined();
        });
    });
    (0, globals_1.describe)('diff()', () => {
        (0, globals_1.it)('相同内容不应有变更', () => {
            const wf = makeWorkflow('wf1', [makeStep('s1', 'Step 1')]);
            const v1 = service.createSnapshot(wf, 'v1');
            const v2 = service.createSnapshot(wf, 'v2');
            const diff = service.diff(v1, v2);
            (0, globals_1.expect)(diff.hasChanges).toBe(false);
            (0, globals_1.expect)(diff.stepCountDelta).toBe(0);
        });
        (0, globals_1.it)('应检测到新增步骤', () => {
            const wf = makeWorkflow('wf1', [makeStep('s1', 'Step 1')]);
            const v1 = service.createSnapshot(wf, 'v1');
            wf.steps.push(makeStep('s2', 'Step 2'));
            const v2 = service.createSnapshot(wf, 'v2');
            const diff = service.diff(v1, v2);
            (0, globals_1.expect)(diff.hasChanges).toBe(true);
            (0, globals_1.expect)(diff.stepCountDelta).toBe(1);
            const added = diff.stepDiffs.find((d) => d.change === 'added');
            (0, globals_1.expect)(added?.stepId).toBe('s2');
        });
        (0, globals_1.it)('应检测到删除步骤', () => {
            const wf = makeWorkflow('wf1', [makeStep('s1', 'Step 1'), makeStep('s2', 'Step 2')]);
            const v1 = service.createSnapshot(wf, 'v1');
            wf.steps.pop();
            const v2 = service.createSnapshot(wf, 'v2');
            const diff = service.diff(v1, v2);
            const removed = diff.stepDiffs.find((d) => d.change === 'removed');
            (0, globals_1.expect)(removed?.stepId).toBe('s2');
            (0, globals_1.expect)(diff.stepCountDelta).toBe(-1);
        });
        (0, globals_1.it)('应检测到修改步骤', () => {
            const wf = makeWorkflow('wf1', [makeStep('s1', 'Step 1')]);
            const v1 = service.createSnapshot(wf, 'v1');
            wf.steps[0].name = 'Step 1 Updated';
            wf.steps[0].payload = { prompt: 'new-prompt' };
            const v2 = service.createSnapshot(wf, 'v2');
            const diff = service.diff(v1, v2);
            const modified = diff.stepDiffs.find((d) => d.change === 'modified');
            (0, globals_1.expect)(modified?.stepId).toBe('s1');
            (0, globals_1.expect)(modified?.fields).toContain('name');
            (0, globals_1.expect)(modified?.fields).toContain('payload');
        });
        (0, globals_1.it)('元组引用也能检测变更', () => {
            const wf = makeWorkflow('wf1', [makeStep('s1', 'Step 1')]);
            service.createSnapshot(wf, 'v1');
            wf.steps.push(makeStep('s2', 'Step 2'));
            service.createSnapshot(wf, 'v2');
            const diff = service.diff(['wf1', 1], ['wf1', 2]);
            (0, globals_1.expect)(diff.hasChanges).toBe(true);
        });
    });
    (0, globals_1.describe)('rollback()', () => {
        (0, globals_1.it)('应回滚到指定版本', () => {
            const wf = makeWorkflow('wf1', [makeStep('s1', 'Step 1')]);
            service.createSnapshot(wf, 'v1');
            wf.steps.push(makeStep('s2', 'Step 2'));
            wf.steps[0].name = 'Modified';
            service.createSnapshot(wf, 'v2');
            const restored = service.rollback('wf1', 1);
            (0, globals_1.expect)(restored.steps).toHaveLength(1);
            (0, globals_1.expect)(restored.steps[0].name).toBe('Step 1');
        });
        (0, globals_1.it)('不存在的版本应抛错', () => {
            const wf = makeWorkflow('wf1', [makeStep('s1', 'Step 1')]);
            service.createSnapshot(wf, 'v1');
            (0, globals_1.expect)(() => service.rollback('wf1', 99)).toThrow('99');
        });
    });
    (0, globals_1.it)('多个工作流的历史应互相隔离', () => {
        const wf1 = makeWorkflow('wf1', [makeStep('s1', 'W1 Step')]);
        const wf2 = makeWorkflow('wf2', [makeStep('s1', 'W2 Step')]);
        service.createSnapshot(wf1, 'w1-v1');
        service.createSnapshot(wf2, 'w2-v1');
        const h1 = service.getHistory('wf1');
        const h2 = service.getHistory('wf2');
        (0, globals_1.expect)(h1).toHaveLength(1);
        (0, globals_1.expect)(h2).toHaveLength(1);
        (0, globals_1.expect)(h1[0].definition.steps[0].name).toBe('W1 Step');
    });
});
//# sourceMappingURL=workflow-version.test.js.map