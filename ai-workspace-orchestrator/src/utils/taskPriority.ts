/**
 * 计算任务优先级分数
 * @param urgency 紧急程度 (1-10)
 * @param importance 重要程度 (1-10)
 * @param effort 所需努力 (1-10)
 * @returns 优先级分数 (0-100)
 */
export function calculateTaskPriority(urgency: number, importance: number, effort: number): number {
  return Math.round((urgency * 0.4 + importance * 0.4 - effort * 0.2) * 10);
}