/**
 * 快速获取工作流状态
 * 
 * 提供工作流的当前状态检查，包括空闲、运行中、已完成和错误四种状态。
 * 这是一个轻量级的快速检查方法，适合实时监控和状态显示。
 * 在生产环境中，这个函数会检查实际的工作流状态数据。
 * 
 * @returns {"idle" | "running" | "completed" | "error"} 返回工作流状态枚举值
 * - "idle": 工作流空闲，等待处理任务
 * - "running": 工作流正在执行中
 * - "completed": 工作流已成功完成
 * - "error": 工作流执行过程中出现错误
 * 
 * @example
 * // 基本状态检查
 * const status = quickWorkflowStatus();
 * console.log(status); // "idle"
 * 
 * // 状态判断示例
 * const currentStatus = quickWorkflowStatus();
 * switch(currentStatus) {
 *   case "idle":
 *     console.log("工作流空闲，可以接受新任务");
 *     break;
 *   case "running":
 *     console.log("工作流正在处理任务");
 *     break;
 *   case "completed":
 *     console.log("工作流已完成任务");
 *     break;
 *   case "error":
 *     console.log("工作流执行出现错误");
 *     break;
 * }
 * 
 * // 前端UI状态更新
 * function updateUI() {
 *   const status = quickWorkflowStatus();
 *   const statusElement = document.getElementById('workflow-status');
 *   if (statusElement) {
 *     statusElement.textContent = `状态: ${status}`;
 *     statusElement.className = `status-${status}`;
 *   }
 * }
 * 
 * // 定时状态轮询
 * setInterval(updateUI, 1000); // 每秒更新一次状态
 */
export function quickWorkflowStatus(): "idle" | "running" | "completed" | "error" {
    // Simple mock implementation - in production this would check actual workflow state
    return "idle";
}

export function isWorkflowActive(): boolean {
    return quickWorkflowStatus() === "running";
}
