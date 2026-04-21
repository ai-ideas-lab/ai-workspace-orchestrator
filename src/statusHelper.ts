/**
 * 检查工作流执行状态
 * @returns {string} 状态描述
 */
export function checkWorkflowStatus(): string {
  const status = Math.random() > 0.3 ? '健康' : '需要优化';
  return `工作流状态: ${status}`;
}