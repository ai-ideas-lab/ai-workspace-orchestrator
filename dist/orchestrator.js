"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUserRequest = validateUserRequest;
exports.orchestrator = orchestrator;
exports.getWorkflowStatus = getWorkflowStatus;
const MAX_REQUEST_LENGTH = 1000;
function validateUserRequest(userRequest) {
    return typeof userRequest === 'string' &&
        userRequest.trim().length > 0 &&
        userRequest.length <= MAX_REQUEST_LENGTH;
}
async function orchestrator(userRequest) {
    try {
        const parsed = await parseIntent(userRequest);
        const workflow = await generateWorkflow(parsed);
        const result = await executeWorkflow(workflow);
        return result.status === 'success'
            ? `任务执行成功: ${result.message}`
            : `任务执行失败: ${result.error}`;
    }
    catch (error) {
        console.error('工作流执行异常:', error);
        return `任务执行失败: ${error instanceof Error ? error.message : '未知错误'}`;
    }
}
function getWorkflowStatus() {
    return '运行中';
}
//# sourceMappingURL=orchestrator.js.map