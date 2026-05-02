/**
 * 智能优先级计算器 - 基于多因素快速计算
 * 
 * @param urgency 紧急度 1-10
 * @param impact 影响力 1-10  
 * @param effort 努力度 1-10
 * @returns 优先级分数 1-100
 */
export function calculatePriority(urgency: number, impact: number, effort: number): number {
  return Math.round((urgency * 0.4 + impact * 0.4 - effort * 0.2) * 10);
}