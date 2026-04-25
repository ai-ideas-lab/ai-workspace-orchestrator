/**
 * 检查工作流状态是否健康
 * @param status 工作流状态
 * @returns 是否健康
 */
export function isWorkflowHealthy(status: string): boolean {
  return ['completed', 'running'].includes(status);
}