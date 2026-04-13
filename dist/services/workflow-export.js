"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowExportService = void 0;
class WorkflowExportService {
    constructor(executor) {
        this.executor = executor;
    }
    exportAsJson(workflowId) {
        const wf = this.executor.getWorkflow(workflowId);
        if (!wf)
            throw new Error(`Workflow ${workflowId} not found`);
        return JSON.stringify({ exportedAt: new Date().toISOString(), ...wf }, null, 2);
    }
    exportAll() {
        const ids = this.executor.listWorkflows?.() ?? [];
        const result = {};
        for (const id of ids) {
            const wf = this.executor.getWorkflow(id);
            if (wf)
                result[id] = wf;
        }
        return result;
    }
}
exports.WorkflowExportService = WorkflowExportService;
//# sourceMappingURL=workflow-export.js.map