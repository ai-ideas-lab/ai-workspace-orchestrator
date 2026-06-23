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

/**
 * 判断任务是否需要立即处理
 * 
 * 根据任务的紧急程度和重要性判断是否需要立即处理，
 * 适用于任务管理系统中的优先级判断和提醒机制
 * 
 * @param {string} taskName - 任务名称，用于日志记录和用户界面显示
 * @param {boolean} isUrgent - 是否为紧急任务，通常表示有时间限制或高优先级
 * @param {number} importance - 任务重要程度评分，范围1-10，数值越高越重要
 * @returns {boolean} 返回是否需要立即处理，true表示需要立即关注，false可以稍后处理
 * @throws {TypeError} 当importance不在1-10范围内时抛出异常
 * 
 * @example
 * // 紧急任务检查
 * const urgentTask = needsImmediateAttention('修复生产bug', true, 5);
 * console.log(urgentTask); // true (紧急任务总是立即处理)
 * 
 * // 高重要性任务检查
 * const highPriorityTask = needsImmediateAttention('季度报告', false, 9);
 * console.log(highPriorityTask); // true (高重要性任务需要立即处理)
 * 
 * // 普通任务检查
 * const normalTask = needsImmediateAttention('整理文档', false, 4);
 * console.log(normalTask); // false (普通任务可以稍后处理)
 * 
 * // 边界情况测试
 * const criticalTask = needsImmediateAttention('安全漏洞修复', false, 10);
 * console.log(criticalTask); // true (最高重要性任务)
 * 
 * // 错误处理示例
 * try {
 *   const invalid = needsImmediateAttention('测试', false, 15);
 * } catch (error) {
 *   console.error(error.message); // "importance must be between 1 and 10"
 * }
 */
export function needsImmediateAttention(taskName: string, isUrgent: boolean, importance: number): boolean {
  if (importance < 1 || importance > 10) {
    throw new TypeError('importance must be between 1 and 10');
  }
  return isUrgent || importance >= 8;
}