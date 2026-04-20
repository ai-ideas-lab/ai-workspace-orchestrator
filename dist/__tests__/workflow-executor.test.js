"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const workflow_executor_1 = require("../services/workflow-executor");
function linearWorkflow() {
    return {
        id: 'wf-linear',
        name: '线性工作流',
        steps: [
            { id: 'a', name: 'Step A', taskType: 'text', payload: { text: 'hello' }, dependsOn: [] },
            { id: 'b', name: 'Step B', taskType: 'text', payload: { text: 'world' }, dependsOn: ['a'] },
            { id: 'c', name: 'Step C', taskType: 'text', payload: { text: '!' }, dependsOn: ['b'] },
        ],
    };
}
function parallelWorkflow() {
    return {
        id: 'wf-parallel',
        name: '并行工作流',
        steps: [
            { id: 'root', name: 'Root', taskType: 'text', payload: {}, dependsOn: [] },
            { id: 'left', name: 'Left', taskType: 'text', payload: { side: 'L' }, dependsOn: ['root'] },
            { id: 'right', name: 'Right', taskType: 'text', payload: { side: 'R' }, dependsOn: ['root'] },
        ],
    };
}
(0, globals_1.describe)('WorkflowExecutor', () => {
    let executor;
    (0, globals_1.beforeEach)(() => {
        executor = new workflow_executor_1.WorkflowExecutor();
        executor.registerEngine('engine-1', { weight: 100 });
    });
    (0, globals_1.it)('应按顺序执行线性工作流', async () => {
        const order = [];
        const execFn = async (taskType, payload) => {
            order.push(payload.text);
            return { output: payload.text };
        };
        const result = await executor.execute(linearWorkflow(), execFn);
        (0, globals_1.expect)(result.status).toBe('COMPLETED');
        (0, globals_1.expect)(result.steps).toHaveLength(3);
        (0, globals_1.expect)(result.steps.every((s) => s.status === 'SUCCEEDED')).toBe(true);
        (0, globals_1.expect)(order).toEqual(['hello', 'world', '!']);
        (0, globals_1.expect)(result.durationMs).toBeGreaterThanOrEqual(0);
    });
    (0, globals_1.it)('应并行执行无依赖的步骤', async () => {
        const startTimes = [];
        const execFn = async (_taskType, payload, engineId) => {
            startTimes.push({ stepId: payload.side || 'root', at: Date.now() });
            await new Promise((r) => setTimeout(r, 20));
            return { done: true };
        };
        const result = await executor.execute(parallelWorkflow(), execFn);
        (0, globals_1.expect)(result.status).toBe('COMPLETED');
        (0, globals_1.expect)(result.steps).toHaveLength(3);
        const leftStart = startTimes.find((s) => s.stepId === 'L').at;
        const rightStart = startTimes.find((s) => s.stepId === 'R').at;
        (0, globals_1.expect)(Math.abs(leftStart - rightStart)).toBeLessThan(200);
    });
    (0, globals_1.it)('依赖失败时应跳过下游步骤', async () => {
        const wf = {
            id: 'wf-fail',
            name: '失败传播',
            steps: [
                { id: 'a', name: 'A', taskType: 'text', payload: {}, dependsOn: [] },
                { id: 'b', name: 'B', taskType: 'text', payload: {}, dependsOn: ['a'] },
                { id: 'c', name: 'C', taskType: 'text', payload: {}, dependsOn: ['b'] },
            ],
        };
        let callCount = 0;
        const execFn = async () => {
            callCount++;
            if (callCount === 1)
                throw new Error('Engine exploded');
            return { ok: true };
        };
        const result = await executor.execute(wf, execFn);
        (0, globals_1.expect)(result.status).toBe('FAILED');
        (0, globals_1.expect)(result.steps.find((s) => s.stepId === 'a').status).toBe('FAILED');
        (0, globals_1.expect)(result.steps.find((s) => s.stepId === 'b').status).toBe('SKIPPED');
        (0, globals_1.expect)(result.steps.find((s) => s.stepId === 'c').status).toBe('SKIPPED');
    });
    (0, globals_1.it)('应支持取消工作流', async () => {
        const wf = {
            id: 'wf-cancel',
            name: '取消测试',
            steps: [
                { id: 'a', name: 'A', taskType: 'text', payload: {}, dependsOn: [] },
                { id: 'b', name: 'B', taskType: 'text', payload: {}, dependsOn: ['a'] },
            ],
        };
        const execFn = async () => {
            executor.cancel('wf-cancel');
            return { ok: true };
        };
        const result = await executor.execute(wf, execFn);
        (0, globals_1.expect)(result.status).toBe('CANCELLED');
        const stepB = result.steps.find((s) => s.stepId === 'b');
        (0, globals_1.expect)(['SKIPPED', 'PENDING']).toContain(stepB.status);
    });
    (0, globals_1.it)('应在失败时自动重试', async () => {
        const wf = {
            id: 'wf-retry',
            name: '重试测试',
            steps: [
                {
                    id: 'a',
                    name: 'A',
                    taskType: 'text',
                    payload: {},
                    dependsOn: [],
                    maxRetries: 2,
                },
            ],
        };
        let attempts = 0;
        const execFn = async () => {
            attempts++;
            if (attempts < 3)
                throw new Error(`Attempt ${attempts} failed`);
            return { ok: true, attempt: attempts };
        };
        const result = await executor.execute(wf, execFn);
        (0, globals_1.expect)(result.status).toBe('COMPLETED');
        (0, globals_1.expect)(result.steps[0].status).toBe('SUCCEEDED');
        (0, globals_1.expect)(result.steps[0].retries).toBe(2);
        (0, globals_1.expect)(attempts).toBe(3);
    });
    (0, globals_1.it)('应能注销已注册的引擎', () => {
        const executor = new workflow_executor_1.WorkflowExecutor();
        executor.registerEngine('engine-1', { weight: 100 });
        (0, globals_1.expect)(() => executor.registerEngine('engine-1', { weight: 100 })).not.toThrow();
        const deregisterResult = executor.deregisterEngine('engine-1');
        (0, globals_1.expect)(deregisterResult).toBe(true);
        const deregisterNonexistent = executor.deregisterEngine('nonexistent-engine');
        (0, globals_1.expect)(deregisterNonexistent).toBe(false);
        (0, globals_1.expect)(() => executor.registerEngine('engine-1', { weight: 50 })).not.toThrow();
    });
    (0, globals_1.it)('无引擎注册时使用默认执行函数应返回 COMPLETED', async () => {
        const emptyExecutor = new workflow_executor_1.WorkflowExecutor();
        const result = await emptyExecutor.execute(linearWorkflow());
        (0, globals_1.expect)(result.status).toBe('COMPLETED');
        (0, globals_1.expect)(result.steps.every(step => step.status === 'SUCCEEDED')).toBe(true);
    });
    (0, globals_1.it)('无引擎注册且无执行函数时默认返回 COMPLETED', async () => {
        const emptyExecutor = new workflow_executor_1.WorkflowExecutor();
        const result = await emptyExecutor.execute(linearWorkflow(), undefined);
        (0, globals_1.expect)(result.status).toBe('COMPLETED');
        (0, globals_1.expect)(result.steps.every(step => step.status === 'SUCCEEDED')).toBe(true);
    });
});
//# sourceMappingURL=workflow-executor.test.js.map