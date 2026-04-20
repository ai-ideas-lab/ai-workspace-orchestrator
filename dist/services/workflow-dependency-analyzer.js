"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowDependencyAnalyzer = void 0;
class WorkflowDependencyAnalyzer {
    validate(steps) {
        const errors = [];
        const stepIds = new Set(steps.map((s) => s.id));
        const unknownDependencies = this.findUnknownDependencies(steps, stepIds);
        if (unknownDependencies.length > 0) {
            errors.push(`存在引用不存在步骤的依赖: ${unknownDependencies.join(', ')}`);
        }
        const cycles = this.detectCycles(steps);
        if (cycles.length > 0) {
            errors.push(`检测到 ${cycles.length} 个循环依赖: ${cycles.map((c) => c.join(' → ')).join('; ')}`);
        }
        const executionLayers = this.topologicalSort(steps);
        const orphanSteps = this.findOrphanSteps(steps);
        if (orphanSteps.length > 0) {
        }
        const criticalPathLength = this.computeCriticalPathLength(steps, executionLayers);
        return {
            valid: errors.length === 0,
            executionLayers,
            cycles,
            orphanSteps,
            unknownDependencies,
            errors,
            stats: {
                totalSteps: steps.length,
                maxDepth: executionLayers.length,
                criticalPathLength,
            },
        };
    }
    detectCycles(steps) {
        const adj = new Map();
        for (const step of steps) {
            adj.set(step.id, step.dependsOn ?? []);
        }
        const WHITE = 0, GRAY = 1, BLACK = 2;
        const color = new Map();
        for (const id of adj.keys())
            color.set(id, WHITE);
        const cycles = [];
        const path = [];
        const dfs = (node) => {
            color.set(node, GRAY);
            path.push(node);
            const neighbors = adj.get(node) ?? [];
            for (const neighbor of neighbors) {
                if (!adj.has(neighbor))
                    continue;
                const neighborColor = color.get(neighbor);
                if (neighborColor === GRAY) {
                    const cycleStart = path.indexOf(neighbor);
                    cycles.push([...path.slice(cycleStart), neighbor]);
                }
                else if (neighborColor === WHITE) {
                    dfs(neighbor);
                }
            }
            path.pop();
            color.set(node, BLACK);
        };
        for (const id of adj.keys()) {
            if (color.get(id) === WHITE)
                dfs(id);
        }
        return cycles;
    }
    topologicalSort(steps) {
        const adj = new Map();
        const inDegree = new Map();
        const stepIds = new Set(steps.map((s) => s.id));
        for (const step of steps) {
            adj.set(step.id, []);
            inDegree.set(step.id, 0);
        }
        for (const step of steps) {
            for (const dep of step.dependsOn ?? []) {
                if (stepIds.has(dep)) {
                    adj.get(dep).push(step.id);
                    inDegree.set(step.id, (inDegree.get(step.id) ?? 0) + 1);
                }
            }
        }
        const layers = [];
        let queue = [...stepIds].filter((id) => (inDegree.get(id) ?? 0) === 0);
        let visited = 0;
        while (queue.length > 0) {
            layers.push([...queue]);
            visited += queue.length;
            const nextQueue = [];
            for (const node of queue) {
                for (const downstream of adj.get(node) ?? []) {
                    const newDeg = (inDegree.get(downstream) ?? 1) - 1;
                    inDegree.set(downstream, newDeg);
                    if (newDeg === 0)
                        nextQueue.push(downstream);
                }
            }
            queue = nextQueue;
        }
        return layers;
    }
    findUnknownDependencies(steps, stepIds) {
        const unknown = [];
        for (const step of steps) {
            for (const dep of step.dependsOn ?? []) {
                if (!stepIds.has(dep))
                    unknown.push(dep);
            }
        }
        return [...new Set(unknown)];
    }
    findOrphanSteps(steps) {
        if (steps.length <= 1)
            return [];
        const hasUpstream = new Set();
        const hasDownstream = new Set();
        const stepIds = new Set(steps.map((s) => s.id));
        for (const step of steps) {
            for (const dep of step.dependsOn ?? []) {
                if (stepIds.has(dep)) {
                    hasUpstream.add(step.id);
                    hasDownstream.add(dep);
                }
            }
        }
        return steps
            .filter((s) => !hasUpstream.has(s.id) && !hasDownstream.has(s.id))
            .map((s) => s.id);
    }
    computeCriticalPathLength(steps, layers) {
        if (steps.length === 0)
            return 0;
        if (layers.length === 0)
            return 0;
        const depth = new Map();
        const layerMap = new Map();
        const stepIds = new Set(steps.map((s) => s.id));
        for (let i = 0; i < layers.length; i++) {
            if (layers[i]) {
                for (const id of layers[i])
                    layerMap.set(id, i);
            }
        }
        for (const step of steps) {
            const deps = (step.dependsOn ?? []).filter((d) => stepIds.has(d));
            if (deps.length === 0) {
                depth.set(step.id, 1);
            }
            else {
                depth.set(step.id, Math.max(...deps.map((d) => depth.get(d) ?? 0)) + 1);
            }
        }
        return Math.max(0, ...Array.from(depth.values()));
    }
}
exports.WorkflowDependencyAnalyzer = WorkflowDependencyAnalyzer;
//# sourceMappingURL=workflow-dependency-analyzer.js.map