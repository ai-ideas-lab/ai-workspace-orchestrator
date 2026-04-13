"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceOrchestrator = void 0;
class WorkspaceOrchestrator {
    constructor() {
        this.aiEngines = new Map();
        this.workflows = new Map();
    }
    registerEngine(name, engine) {
        if (!engine || typeof engine.execute !== 'function') {
            throw new Error(`Engine must have execute method`);
        }
        this.aiEngines.set(name, engine);
    }
    async executeWorkflow(workflow) {
        const results = [];
        for (const step of workflow.steps) {
            const engine = this.aiEngines.get(step.engine);
            if (!engine)
                throw new Error(`Engine ${step.engine} not found`);
            const result = await engine.execute(step.input);
            results.push(result);
        }
        return results;
    }
}
exports.WorkspaceOrchestrator = WorkspaceOrchestrator;
//# sourceMappingURL=WorkspaceOrchestrator.js.map