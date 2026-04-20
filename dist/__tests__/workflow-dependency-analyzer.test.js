"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const workflow_dependency_analyzer_1 = require("../services/workflow-dependency-analyzer");
(0, globals_1.describe)('WorkflowDependencyAnalyzer', () => {
    const analyzer = new workflow_dependency_analyzer_1.WorkflowDependencyAnalyzer();
    const step = (id, deps = []) => ({
        id,
        name: id,
        taskType: 'test',
        payload: {},
        dependsOn: deps,
    });
    (0, globals_1.describe)('detectCycles', () => {
        (0, globals_1.it)('应返回空数组当没有循环依赖时', () => {
            const steps = [step('a'), step('b', ['a']), step('c', ['b'])];
            (0, globals_1.expect)(analyzer.detectCycles(steps)).toEqual([]);
        });
        (0, globals_1.it)('应检测到简单循环 A → B → C → A', () => {
            const steps = [step('a', ['c']), step('b', ['a']), step('c', ['b'])];
            const cycles = analyzer.detectCycles(steps);
            (0, globals_1.expect)(cycles.length).toBeGreaterThan(0);
            const flat = cycles.flat();
            (0, globals_1.expect)(flat).toContain('a');
            (0, globals_1.expect)(flat).toContain('b');
            (0, globals_1.expect)(flat).toContain('c');
        });
        (0, globals_1.it)('应检测到自循环', () => {
            const steps = [step('a', ['a']), step('b')];
            const cycles = analyzer.detectCycles(steps);
            (0, globals_1.expect)(cycles.length).toBe(1);
            (0, globals_1.expect)(cycles[0]).toEqual(['a', 'a']);
        });
        (0, globals_1.it)('空步骤列表应返回空', () => {
            (0, globals_1.expect)(analyzer.detectCycles([])).toEqual([]);
        });
    });
    (0, globals_1.describe)('topologicalSort', () => {
        (0, globals_1.it)('应正确排序线性依赖链', () => {
            const steps = [step('c', ['b']), step('a'), step('b', ['a'])];
            const layers = analyzer.topologicalSort(steps);
            (0, globals_1.expect)(layers[0]).toEqual(['a']);
            (0, globals_1.expect)(layers[1]).toEqual(['b']);
            (0, globals_1.expect)(layers[2]).toEqual(['c']);
        });
        (0, globals_1.it)('无依赖步骤应在同一层（可并行）', () => {
            const steps = [step('a'), step('b'), step('c')];
            const layers = analyzer.topologicalSort(steps);
            (0, globals_1.expect)(layers.length).toBe(1);
            (0, globals_1.expect)(new Set(layers[0])).toEqual(new Set(['a', 'b', 'c']));
        });
        (0, globals_1.it)('菱形依赖应正确分层', () => {
            const steps = [step('a'), step('b', ['a']), step('c', ['a']), step('d', ['b', 'c'])];
            const layers = analyzer.topologicalSort(steps);
            (0, globals_1.expect)(layers[0]).toEqual(['a']);
            (0, globals_1.expect)(new Set(layers[1])).toEqual(new Set(['b', 'c']));
            (0, globals_1.expect)(layers[2]).toEqual(['d']);
        });
    });
    (0, globals_1.describe)('validate', () => {
        (0, globals_1.it)('有效 DAG 应通过验证', () => {
            const steps = [step('a'), step('b', ['a']), step('c', ['a']), step('d', ['b', 'c'])];
            const report = analyzer.validate(steps);
            (0, globals_1.expect)(report.valid).toBe(true);
            (0, globals_1.expect)(report.errors).toEqual([]);
            (0, globals_1.expect)(report.cycles).toEqual([]);
            (0, globals_1.expect)(report.stats.totalSteps).toBe(4);
            (0, globals_1.expect)(report.stats.maxDepth).toBe(3);
            (0, globals_1.expect)(report.stats.criticalPathLength).toBe(3);
        });
        (0, globals_1.it)('包含循环依赖时应标记为无效', () => {
            const steps = [step('a', ['b']), step('b', ['a'])];
            const report = analyzer.validate(steps);
            (0, globals_1.expect)(report.valid).toBe(false);
            (0, globals_1.expect)(report.cycles.length).toBeGreaterThan(0);
        });
        (0, globals_1.it)('引用不存在的步骤应标记为无效', () => {
            const steps = [step('a', ['nonexistent'])];
            const report = analyzer.validate(steps);
            (0, globals_1.expect)(report.valid).toBe(false);
            (0, globals_1.expect)(report.unknownDependencies).toContain('nonexistent');
        });
        (0, globals_1.it)('孤立节点应被检测但不算错误', () => {
            const steps = [step('a'), step('b'), step('c', ['a'])];
            const report = analyzer.validate(steps);
            (0, globals_1.expect)(report.orphanSteps).toContain('b');
            (0, globals_1.expect)(report.valid).toBe(true);
        });
        (0, globals_1.it)('空工作流应通过验证', () => {
            const report = analyzer.validate([]);
            (0, globals_1.expect)(report.valid).toBe(true);
            (0, globals_1.expect)(report.stats.totalSteps).toBe(0);
        });
    });
});
//# sourceMappingURL=workflow-dependency-analyzer.test.js.map