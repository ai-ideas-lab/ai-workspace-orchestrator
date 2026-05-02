import { PROBABILITY_CONFIG } from './constants';

/**
 * 计算任务完成概率 - 基于任务权重和代理容量的概率计算
 * 
 * 根据任务的重要性和代理的处理能力计算任务的成功完成概率，
 * 为任务优先级提供概率性的补充信息。
 * 
 * @param taskWeight 任务的权重值 (1-20)
 * @param agentCapacity 代理的总处理能力 (1-100)
 * @param complexity 任务的复杂度系数 (0.5-2.0)
 * @returns 返回0-1之间的完成概率值
 * @throws {Error} 当参数超出有效范围时抛出异常
 * @example
 * // 基本概率计算
 * const probability = calculateCompletionProbability(8, 10, 1.0);
 * console.log(probability); // 输出: 0.8 (80%完成概率)
 * 
 * // 高复杂度任务
 * const complexProbability = calculateCompletionProbability(15, 20, 1.5);
 * console.log(complexProbability); // 输出: 0.5 (50%完成概率)
 * 
 * // 高能力代理处理简单任务
 * const easyTask = calculateCompletionProbability(5, 50, 0.8);
 * console.log(easyTask); // 输出: 0.96 (96%完成概率)
 */
export function calculateCompletionProbability(taskWeight: number, agentCapacity: number, complexity: number = 1.0): number {
  try {
    // 参数验证
    if (taskWeight < PROBABILITY_CONFIG.TASK_WEIGHT_MIN || taskWeight > PROBABILITY_CONFIG.TASK_WEIGHT_MAX) {
      throw new Error(`Task weight must be between ${PROBABILITY_CONFIG.TASK_WEIGHT_MIN} and ${PROBABILITY_CONFIG.TASK_WEIGHT_MAX}`);
    }
    
    if (agentCapacity < PROBABILITY_CONFIG.AGENT_CAPACITY_MIN || agentCapacity > PROBABILITY_CONFIG.AGENT_CAPACITY_MAX) {
      throw new Error(`Agent capacity must be between ${PROBABILITY_CONFIG.AGENT_CAPACITY_MIN} and ${PROBABILITY_CONFIG.AGENT_CAPACITY_MAX}`);
    }
    
    if (complexity < PROBABILITY_CONFIG.COMPLEXITY_MIN || complexity > PROBABILITY_CONFIG.COMPLEXITY_MAX) {
      throw new Error(`Complexity factor must be between ${PROBABILITY_CONFIG.COMPLEXITY_MIN} and ${PROBABILITY_CONFIG.COMPLEXITY_MAX}`);
    }
    
    // 基础概率计算：容量/权重，受复杂度影响
    const baseProbability = Math.min(agentCapacity / taskWeight, 1.0);
    
    // 应用复杂度系数
    const adjustedProbability = baseProbability / complexity;
    
    // 确保概率在0-1范围内
    return Math.max(PROBABILITY_CONFIG.MIN_PROBABILITY, Math.min(PROBABILITY_CONFIG.MAX_PROBABILITY, adjustedProbability));
  } catch (error) {
    console.error('Error calculating completion probability:', error);
    throw error;
  }
}

/**
 * 概率等级分类 - 将完成概率转换为等级描述
 * 
 * @param probability 完成概率值 (0-1)
 * @returns 返回概率等级字符串
 * @example
 * const level = getProbabilityLevel(0.8);
 * console.log(level); // 输出: "高"
 * 
 * const levels = [
 *   getProbabilityLevel(0.2),
 *   getProbabilityLevel(0.5),
 *   getProbabilityLevel(0.8),
 *   getProbabilityLevel(0.95)
 * ];
 * console.log(levels); // 输出: ["低", "中", "高", "极高"]
 */
export function getProbabilityLevel(probability: number): string {
  if (probability >= PROBABILITY_CONFIG.PROBABILITY_EXTREMELY_HIGH) return '极高';
  if (probability >= PROBABILITY_CONFIG.PROBABILITY_HIGH) return '高';
  if (probability >= PROBABILITY_CONFIG.PROBABILITY_MEDIUM) return '中';
  if (probability >= PROBABILITY_CONFIG.PROBABILITY_LOW_MEDIUM) return '中低';
  return '低';
}