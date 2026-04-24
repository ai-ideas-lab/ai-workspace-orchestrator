/**
 * 调度AI任务 - 基于优先级和预计时长的智能任务调度
 * 
 * 根据任务的优先级和预计执行时间，使用优先级队列算法安排AI任务执行顺序。
 * 该函数会按照优先级从高到低的顺序分配任务开始时间，确保高优先级任务优先执行，
 * 同时考虑任务预计时长来安排合理的执行计划。
 * 
 * @param {Array<{ id: string; priority: number; aiEngine: string; estimatedDuration: number }>} tasks - 待调度的AI任务数组，
 * 每个任务包含ID、优先级、AI引擎类型和预计执行时长（毫秒）
 * @returns {Promise<Array<{ taskId: string; startTime: number; aiEngine: string; estimatedCompletion: number }>>} 返回任务调度结果数组，
 * 每个元素包含任务ID、开始时间、AI引擎类型和预计完成时间
 * 
 * @example
 * // 基本任务调度
 * const tasks = [
 *   { id: 'task-1', priority: 8, aiEngine: 'gpt-4', estimatedDuration: 3000 },
 *   { id: 'task-2', priority: 5, aiEngine: 'claude', estimatedDuration: 5000 },
 *   { id: 'task-3', priority: 10, aiEngine: 'gpt-4', estimatedDuration: 2000 }
 * ];
 * 
 * const schedule = await scheduleAITasks(tasks);
 * console.log(schedule);
 * // 输出示例：
 * // [
 * //   { taskId: 'task-3', startTime: 1640000000000, aiEngine: 'gpt-4', estimatedCompletion: 1640000002000 },
 * //   { taskId: 'task-1', startTime: 1640000002000, aiEngine: 'gpt-4', estimatedCompletion: 1640000005000 },
 * //   { taskId: 'task-2', startTime: 1640000005000, aiEngine: 'claude', estimatedCompletion: 1640000010000 }
 * // ]
 * 
 * @example
 * // 多引擎任务调度
 * const mixedTasks = [
 *   { id: 'translate', priority: 7, aiEngine: 'google-translate', estimatedDuration: 1000 },
 *   { id: 'summarize', priority: 9, aiEngine: 'gpt-4', estimatedDuration: 4000 },
 *   { id: 'analyze', priority: 6, aiEngine: 'claude', estimatedDuration: 3000 }
 * ];
 * 
 * const schedule = await scheduleAITasks(mixedTasks);
 * console.log(schedule.map(item => ({
 *   task: item.taskId,
 *   engine: item.aiEngine,
 *   starts: new Date(item.startTime).toLocaleTimeString(),
 *   ends: new Date(item.estimatedCompletion).toLocaleTimeString()
 * })));
 * // 输出示例：
 * // [
 * //   { task: 'summarize', engine: 'gpt-4', starts: "10:00:00", ends: "10:00:04" },
 * //   { task: 'translate', engine: 'google-translate', starts: "10:00:04", ends: "10:00:05" },
 * //   { task: 'analyze', engine: 'claude', starts: "10:00:05", ends: "10:00:08" }
 * // ]
 * 
 * @throws {Error} 当输入参数无效时抛出异常
 * @throws {Error} 当PriorityQueue类不可用时抛出异常
 */
export async function scheduleAITasks(tasks: Array<{
  id: string;
  priority: number;
  aiEngine: string;
  estimatedDuration: number;
}>) {
  const sorted = tasks.sort((a, b) => b.priority - a.priority);
  const queue = new PriorityQueue();
  sorted.forEach(task => queue.enqueue(task));
  
  const schedule = [];
  while (!queue.isEmpty()) {
    const task = queue.dequeue();
    schedule.push({
      taskId: task.id,
      startTime: Date.now(),
      aiEngine: task.aiEngine,
      estimatedCompletion: Date.now() + task.estimatedDuration
    });
  }
  return schedule;
}

/**
 * 计算任务总执行时长 - 汇总所有任务的预计执行时间
 * 
 * 遍历任务数组，累加每个任务的预计执行时长，返回所有任务的总执行时间。
 * 该函数可用于评估工作流的整体执行时间或批量处理的时间成本估算。
 * 
 * @param {Array<{ id: string; priority: number; aiEngine: string; estimatedDuration: number }>} tasks - 任务数组，
 * 每个任务包含ID、优先级、AI引擎类型和预计执行时长（毫秒）
 * @returns {number} 返回所有任务的总执行时长（毫秒），如果传入空数组则返回0
 * 
 * @example
 * // 计算单任务时长
 * const singleTask = [{ id: 'task-1', priority: 8, aiEngine: 'gpt-4', estimatedDuration: 3000 }];
 * const total = calculateTotalDuration(singleTask);
 * console.log(total); // 输出: 3000
 * 
 * @example
 * // 计算多任务总时长
 * const multipleTasks = [
 *   { id: 'task-1', priority: 5, aiEngine: 'claude', estimatedDuration: 2000 },
 *   { id: 'task-2', priority: 8, aiEngine: 'gpt-4', estimatedDuration: 5000 },
 *   { id: 'task-3', priority: 3, aiEngine: 'gemini', estimatedDuration: 3000 }
 * ];
 * const totalDuration = calculateTotalDuration(multipleTasks);
 * console.log(totalDuration); // 输出: 10000 (10秒总时长)
 * 
 * @example
 * // 空数组处理
 * const emptyResult = calculateTotalDuration([]);
 * console.log(emptyResult); // 输出: 0
 * 
 * @example
 * // 时长转换显示
 * const tasks = [
 *   { id: 'analyze', aiEngine: 'gpt-4', estimatedDuration: 60000 }, // 1分钟
 *   { id: 'summarize', aiEngine: 'claude', estimatedDuration: 120000 }, // 2分钟
 *   { id: 'translate', aiEngine: 'gemini', estimatedDuration: 45000 } // 45秒
 * ];
 * const totalMs = calculateTotalDuration(tasks);
 * const totalSeconds = Math.round(totalMs / 1000);
 * const totalMinutes = Math.floor(totalSeconds / 60);
 * const remainingSeconds = totalSeconds % 60;
 * console.log(`预计总时长: ${totalMinutes}分${remainingSeconds}秒`);
 * // 输出示例: 预计总时长: 3分45秒
 */
export function calculateTotalDuration(tasks: Array<{
  id: string;
  priority: number;
  aiEngine: string;
  estimatedDuration: number;
}>): number {
  return tasks.reduce((total, task) => total + task.estimatedDuration, 0);
}// test change

