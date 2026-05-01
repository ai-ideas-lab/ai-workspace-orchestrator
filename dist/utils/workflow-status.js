"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkWorkflowStatus = checkWorkflowStatus;
function checkWorkflowStatus(workflow) {
    return workflow &&
        workflow.status &&
        workflow.status !== 'error' &&
        workflow.steps &&
        workflow.steps.length > 0;
}
//# sourceMappingURL=workflow-status.js.map