/**
 * 快速工作流状态处理器 - 简化状态转换
 * 
 * @param current 当前状态
 * @param target 目标状态
 * @returns 是否可以转换
 */
export function quickWorkflowTransition(current: string, target: string): boolean {
  const validTransitions = {
    'pending': ['running', 'cancelled'],
    'running': ['completed', 'failed', 'paused'],
    'paused': ['running', 'cancelled'],
    'completed': [],
    'failed': ['pending'],
    'cancelled': []
  };
  
  return validTransitions[current]?.includes(target) || false;
}