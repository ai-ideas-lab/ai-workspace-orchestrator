"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUserRequest = validateUserRequest;
exports.orchestrator = orchestrator;
function validateUserRequest(userRequest) {
    if (typeof userRequest !== 'string') {
        return false;
    }
    if (!userRequest || userRequest.trim().length === 0) {
        return false;
    }
    if (userRequest.length > 1000) {
        return false;
    }
    return true;
}
async function orchestrator(userRequest) {
    const parsed = await parseIntent(userRequest);
    const workflow = await generateWorkflow(parsed);
    const result = await executeWorkflow(workflow);
    return result.status === 'success'
        ? `任务执行成功: ${result.message}`
        : `任务执行失败: ${result.error}`;
}
//# sourceMappingURL=orchestrator.js.map