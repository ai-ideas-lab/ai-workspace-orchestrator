/**
 * 快速工作流优先级计算器
 * 
 * 根据工作流的紧急程度、复杂度和用户重要性快速计算优先级分数
 * 该函数设计为轻量级、高性能的优先级评估工具
 * 
 * @param {boolean} isUrgent - 是否为紧急任务
 * @param {number} complexity - 任务复杂度 (1-10)
 * @param {boolean} isVIPUser - 是否为VIP用户
 * @returns {number} 返回0-100的优先级分数，数值越高优先级越高
 * @example
 * // 计算紧急任务的优先级
 * const priority = calculateWorkflowPriority(true, 7, false);
 * console.log(priority); // 85
 * 
 * // 计算普通任务的优先级
 * const normalPriority = calculateWorkflowPriority(false, 3, false);
 * console.log(normalPriority); // 25
 */
export function calculateWorkflowPriority(isUrgent: boolean, complexity: number, isVIPUser: boolean): number {
  return Math.min(100, (isUrgent ? 50 : 0) + (complexity * 5) + (isVIPUser ? 25 : 0));
}