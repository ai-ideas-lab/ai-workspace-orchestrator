"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateWorkflow = validateWorkflow;
exports.hasCircularDependencies = hasCircularDependencies;
function validateWorkflow(workflow) {
    const errors = [];
    if (!workflow || typeof workflow !== 'object') {
        errors.push('工作流必须是一个对象');
        return { isValid: false, errors };
    }
    if (!workflow.name || typeof workflow.name !== 'string' || workflow.name.trim() === '') {
        errors.push('工作流名称不能为空');
    }
    if (!workflow.steps || !Array.isArray(workflow.steps)) {
        errors.push('工作流步骤必须是一个数组');
    }
    else {
        workflow.steps.forEach((step, index) => {
            if (!step || typeof step !== 'object') {
                errors.push(`步骤 ${index} 必须是一个对象`);
                return;
            }
            if (!step.id || typeof step.id !== 'string' || step.id.trim() === '') {
                errors.push(`步骤 ${index} ID 不能为空`);
            }
            if (!step.type || typeof step.type !== 'string' || step.type.trim() === '') {
                errors.push(`步骤 ${index} 类型不能为空`);
            }
            if (step.type === 'api' && (!step.endpoint || typeof step.endpoint !== 'string')) {
                errors.push(`步骤 ${index} API步骤缺少endpoint属性`);
            }
            if (step.type === 'ai' && (!step.prompt || typeof step.prompt !== 'string')) {
                errors.push(`步骤 ${index} AI步骤缺少prompt属性`);
            }
        });
    }
    return {
        isValid: errors.length === 0,
        errors
    };
}
function hasCircularDependencies(workflow) {
    if (!workflow.steps || !Array.isArray(workflow.steps)) {
        return false;
    }
    const stepIds = workflow.steps.map((step) => step.id);
    const dependencyGraph = {};
    workflow.steps.forEach((step) => {
        dependencyGraph[step.id] = step.dependencies || [];
    });
    const visited = new Set();
    const recursionStack = new Set();
    function hasCycle(node) {
        if (recursionStack.has(node)) {
            return true;
        }
        if (visited.has(node)) {
            return false;
        }
        visited.add(node);
        recursionStack.add(node);
        for (const neighbor of dependencyGraph[node] || []) {
            if (hasCycle(neighbor)) {
                return true;
            }
        }
        recursionStack.delete(node);
        return false;
    }
    for (const stepId of stepIds) {
        if (hasCycle(stepId)) {
            return true;
        }
    }
    return false;
}
//# sourceMappingURL=workflow-validator.js.map