"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkWorkflowStatus = checkWorkflowStatus;
const constants_1 = require("./constants");
function checkWorkflowStatus() {
    try {
        const status = Math.random() > constants_1.PROBABILITY_CONFIG.STATUS_HEALTH_THRESHOLD ? '健康' : '需要优化';
        return `工作流状态: ${status}`;
    }
    catch (error) {
        console.error('Error checking workflow status:', error);
        return '工作流状态: 未知';
    }
}
//# sourceMappingURL=statusHelper.js.map