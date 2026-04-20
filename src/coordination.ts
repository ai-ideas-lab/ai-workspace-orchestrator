/**
 * 协调任务执行 - 任务分配和优先级管理
 * 
 * 根据任务属性和可用代理智能分配任务，计算优先级并优化执行顺序。
 * 该函数负责任务到代理的匹配、优先级计算和调度优化，确保系统资源
 * 的高效利用和任务执行的最优顺序。
 * 
 * @param task 要协调的任务对象，包含任务ID、类型、权重等属性
 * @param agents 可用的代理数组，每个代理具有特定的能力属性
 * @returns 返回协调结果，包含任务ID、分配的代理、预计完成时间和优先级
 * @throws {Error} 当没有可用的合适代理时抛出异常
 * @example
 * // 基本任务协调
 * const task = { id: 'task-123', type: 'data', weight: 8, required: true };
 * const agents = [{ id: 'agent-1', type: 'data', capacity: 5 }, { id: 'agent-2', type: 'ai', capacity: 10 }];
 * const result = coordinateTask(task, agents);
 * console.log(result);
 * // 输出:
 * // {
 * //   taskId: 'task-123',
 * //   status: 'scheduled',
 * //   assignedAgents: [{ id: 'agent-1', type: 'data', capacity: 5 }],
 * //   estimatedCompletion: 2026-04-13T18:00:00.000Z,
 * //   priority: 8.0
 * // }
 * 
 * // 高级任务协调
 * const complexTask = { id: 'task-456', type: 'ai', weight: 12, required: true };
 * const multipleAgents = [
 *   { id: 'agent-1', type: 'ai', capacity: 8 },
 *   { id: 'agent-2', type: 'ai', capacity: 15 },
 *   { id: 'agent-3', type: 'data', capacity: 10 }
 * ];
 * const complexResult = coordinateTask(complexTask, multipleAgents);
 * console.log(complexResult.assignedAgents.length); // 输出: 1 (只分配最适合的代理)
 * console.log(complexResult.priority); // 输出: 14.4 (12 * 1.2 权重加成)
 * 
 * // 错误处理示例
 * try {
 *   const noAgentTask = { id: 'task-789', type: 'api', weight: 5, required: true };
 *   const noAgents = [];
 *   const result = coordinateTask(noAgentTask, noAgents);
 *   console.log(result);
 * } catch (error) {
 *   console.error('任务协调失败:', error.message);
 *   // 输出: 任务协调失败: No suitable agents available for task type: api
 * }
 */
export function coordinateTask(task: Task, agents: Agent[]): TaskResult {
  const assigned = assignAgents(task, agents);
  const priority = calculatePriority(task, assigned);
  const schedule = optimizeSchedule(task, priority);
  
  return {
    taskId: task.id,
    status: 'scheduled',
    assignedAgents: assigned,
    estimatedCompletion: schedule.eta,
    priority: priority
  };
}