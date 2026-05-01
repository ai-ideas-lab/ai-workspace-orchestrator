"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.quickWorkflowStatus = quickWorkflowStatus;
exports.isWorkflowActive = isWorkflowActive;
function quickWorkflowStatus() {
    return "idle";
}
function isWorkflowActive() {
    return quickWorkflowStatus() === "running";
}
//# sourceMappingURL=workspace-status.js.map