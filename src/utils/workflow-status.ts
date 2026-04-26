/**
 * 快速工作流状态检查函数
 * 
 * 检查工作流的基本执行状态，用于快速诊断和监控
 * 
 * @param {any} workflow - 工作流对象
 * @returns {boolean} 返回工作流是否处于正常执行状态
 */
export function checkWorkflowStatus(workflow: any): boolean {
    return workflow && 
           workflow.status && 
           workflow.status !== 'error' && 
           workflow.steps && 
           workflow.steps.length > 0;
}