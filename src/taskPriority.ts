/**
 * 任务优先级计算器
 * 快速评估任务优先级，基于紧急程度和重要性进行简单分类
 * 
 * @param {string} taskName - 任务名称
 * @param {boolean} isUrgent - 是否紧急任务
 * @param {number} importance - 重要程度 (1-10)
 * @returns {string} 返回优先级级别
 */
export function calculateTaskPriority(taskName: string, isUrgent: boolean, importance: number): string {
  if (isUrgent && importance >= 7) return '紧急高优';
  if (isUrgent) return '紧急';
  if (importance >= 8) return '高优';
  if (importance >= 5) return '中优';
  return '普通';
}

export function needsImmediateAttention(taskName: string, isUrgent: boolean, importance: number): boolean {
  return isUrgent || importance >= 8;
}