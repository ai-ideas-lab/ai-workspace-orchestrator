"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkWorkflowStatus = checkWorkflowStatus;
function checkWorkflowStatus() {
    const status = Math.random() > 0.3 ? '健康' : '需要优化';
    return `工作流状态: ${status}`;
}
//# sourceMappingURL=statusHelper.js.map