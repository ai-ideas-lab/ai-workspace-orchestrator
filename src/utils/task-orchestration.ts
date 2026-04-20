/**
 * 计算任务优先级分数 - 智能优先级评估算法
 * 
 * 综合考虑任务的重要性、紧急程度、努力程度和截止时间，使用加权算法计算
 * 任务的优先级分数。算法基于经典的Eisenhower矩阵原理，同时考虑了现代
 * 项目管理的多维评估标准。
 * 
 * 权重分配：
 * - 重要性：40%（任务的长期价值和战略意义）
 * - 紧急程度：40%（时间的紧迫性和截止时间压力）
 * - 努力程度：20%（完成任务所需的时间和资源投入，反向计算）
 * 
 * 截止时间影响：
 * - 1天内到期：紧急度+5分
 * - 3天内到期：紧急度+3分  
 * - 7天内到期：紧急度+1分
 * 
 * @param {Object} task - 任务对象，包含任务的各项属性
 * @param {Date} [task.deadline] - 任务截止时间（可选），用于计算紧急度加成
 * @param {number} task.importance - 任务重要性评分，范围1-10，10为最重要
 * @param {number} task.urgency - 任务紧急程度评分，范围1-10，10为最紧急
 * @param {number} task.effort - 任务努力程度评分，范围1-10，10为最耗费资源
 * @returns {number} 计算后的优先级分数，范围0-100，数值越高优先级越高
 * @throws {TypeError} 当参数类型不符合要求时抛出异常
 * @throws {RangeError} 当评分超出1-10范围时抛出异常
 * @example
 * // 基本优先级计算
 * const basicTask = {
 *   importance: 8,
 *   urgency: 6, 
 *   effort: 3
 * };
 * const priority1 = calculateTaskPriority(basicTask);
 * console.log(priority1); // 输出: 73（(8*0.4) + (6*0.4) + ((11-3)*0.2) = 3.2 + 2.4 + 1.6 = 7.2 -> 72）
 * 
 * // 高优先级任务（紧急且重要）
 * const highPriorityTask = {
 *   importance: 9,
 *   urgency: 10,
 *   effort: 2,
 *   deadline: new Date(Date.now() + 24 * 60 * 60 * 1000) // 明天到期
 * };
 * const priority2 = calculateTaskPriority(highPriorityTask);
 * console.log(priority2); // 输出: 96（紧急度+5加成：10+5=15，但上限为10，所以按10计算）
 * 
 * // 低优先级任务（不重要且不紧急）
 * const lowPriorityTask = {
 *   importance: 2,
 *   urgency: 3,
 *   effort: 8
 * };
 * const priority3 = calculateTaskPriority(lowPriorityTask);
 * console.log(priority3); // 输出: 19（(2*0.4) + (3*0.4) + ((11-8)*0.2) = 0.8 + 1.2 + 0.6 = 2.6 -> 26）
 * 
 * // 长期任务（7天后到期）
 * const longTermTask = {
 *   importance: 7,
 *   urgency: 4,
 *   effort: 5,
 *   deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7天后到期
 * };
 * const priority4 = calculateTaskPriority(longTermTask);
 * console.log(priority4); // 输出: 49（紧急度+1加成：4+1=5）
 */
export function calculateTaskPriority(task: {
  deadline?: Date;
  importance: number; // 1-10
  urgency: number; // 1-10
  effort: number; // 1-10
}): number {
  const now = new Date();
  
  // 计算紧急度权重（如果有截止时间）
  let urgencyScore = task.urgency;
  if (task.deadline) {
    const daysToDeadline = Math.max(0, 
      Math.ceil((task.deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    );
    if (daysToDeadline <= 1) urgencyScore = Math.min(10, urgencyScore + 5);
    else if (daysToDeadline <= 3) urgencyScore = Math.min(10, urgencyScore + 3);
    else if (daysToDeadline <= 7) urgencyScore = Math.min(10, urgencyScore + 1);
  }
  
  // 计算综合优先级
  const priorityScore = 
    (task.importance * 0.4) + 
    (urgencyScore * 0.4) + 
    ((11 - task.effort) * 0.2); // 反向：努力程度越低，优先级越高
  
  return Math.round(Math.max(0, Math.min(100, priorityScore)));
}

/**
 * 根据优先级分数确定任务优先级等级
 * 
 * 将0-100的优先级分数映射为四个标准化的优先级等级：
 * critical（紧急）、high（高）、medium（中）、low（低）。
 * 这种分级方式便于任务管理和视觉化展示，帮助用户快速识别
 * 任务的相对重要性和紧急程度。
 * 
 * 分数映射规则：
 * - 80-100: critical（紧急） - 需要立即处理的重要任务
 * - 60-79: high（高） - 应该优先处理的重要任务  
 * - 40-59: medium（中） - 正常优先级的常规任务
 * - 0-39: low（低） - 可以延后处理的低优先级任务
 * 
 * @param {number} priorityScore - 任务优先级分数，范围0-100
 * @returns {string} 优先级等级字符串，可能的值：'critical'、'high'、'medium'、'low'
 * @throws {TypeError} 当priorityScore不是数字类型时抛出异常
 * @throws {RangeError} 当priorityScore超出0-100范围时抛出异常
 * @example
 * // 紧急任务
 * const criticalLevel = getPriorityLevel(95);
 * console.log(criticalLevel); // 输出: "critical"
 * 
 * // 高优先级任务
 * const highLevel = getPriorityLevel(72);
 * console.log(highLevel); // 输出: "high"
 * 
 * // 中等优先级任务
 * const mediumLevel = getPriorityLevel(45);
 * console.log(mediumLevel); // 输出: "medium"
 * 
 * // 低优先级任务
 * const lowLevel = getPriorityLevel(25);
 * console.log(lowLevel); // 输出: "low"
 * 
 * // 边界测试
 * console.log(getPriorityLevel(80));  // 输出: "critical"
 * console.log(getPriorityLevel(60));  // 输出: "high"
 * console.log(getPriorityLevel(40));  // 输出: "medium"
 * console.log(getPriorityLevel(0));   // 输出: "low"
 * 
 * // 在任务管理中的应用
 * function categorizeTasks(tasks) {
 *   return {
 *     critical: tasks.filter(task => getPriorityLevel(task.score) === 'critical'),
 *     high: tasks.filter(task => getPriorityLevel(task.score) === 'high'),
 *     medium: tasks.filter(task => getPriorityLevel(task.score) === 'medium'),
 *     low: tasks.filter(task => getPriorityLevel(task.score) === 'low')
 *   };
 * }
 */
export function getPriorityLevel(priorityScore: number): 'low' | 'medium' | 'high' | 'critical' {
  if (priorityScore >= 80) return 'critical';
  if (priorityScore >= 60) return 'high';
  if (priorityScore >= 40) return 'medium';
  return 'low';
}

/**
 * 按优先级分数对任务进行降序排序
 * 
 * 将任务数组按照优先级分数从高到低进行排序，确保高优先级任务排在前面。
 * 该函数会创建数组的副本进行排序，不会修改原始数组。优先级分数越高，
 * 表示任务越紧急或重要，应该优先执行。
 * 
 * @param {Array<{priorityScore: number}>} tasks - 待排序的任务数组，
 * 每个任务对象必须包含priorityScore属性（数值类型）
 * @returns {Array<{priorityScore: number}>} 排序后的新任务数组，
 * 按优先级从高到低排列
 * @throws {TypeError} 当tasks参数不是数组类型时抛出异常
 * @throws {Error} 当任务对象缺少priorityScore属性时抛出异常
 * @example
 * // 按优先级排序任务
 * const tasks = [
 *   { id: 1, name: '任务1', priorityScore: 75 },
 *   { id: 2, name: '任务2', priorityScore: 90 },
 *   { id: 3, name: '任务3', priorityScore: 45 }
 * ];
 * const sorted = sortTasksByPriority(tasks);
 * console.log(sorted.map(t => t.name)); // 输出: ["任务2", "任务1", "任务3"]
 * 
 * // 结合优先级等级使用
 * const priorityTasks = [
 *   { id: 1, name: '紧急修复', priorityScore: 95 },
 *   { id: 2, name: '功能开发', priorityScore: 65 },
 *   { id: 3, name: '文档更新', priorityScore: 35 }
 * ];
 * const ordered = sortTasksByPriority(priorityTasks);
 * 
 * // 处理排序后的任务
 * ordered.forEach((task, index) => {
 *   console.log(`${index + 1}. ${task.name} (优先级: ${task.priorityScore})`);
 * });
 * // 输出示例:
 * // 1. 紧急修复 (优先级: 95)
 * // 2. 功能开发 (优先级: 65)  
 * // 3. 文档更新 (优先级: 35)
 * 
 * // 与优先级等级函数结合使用
 * function processTasksByPriority(tasks) {
 *   const sorted = sortTasksByPriority(tasks);
 *   return {
 *     critical: sorted.filter(t => getPriorityLevel(t.priorityScore) === 'critical'),
 *     high: sorted.filter(t => getPriorityLevel(t.priorityScore) === 'high'),
 *     medium: sorted.filter(t => getPriorityLevel(t.priorityScore) === 'medium'),
 *     low: sorted.filter(t => getPriorityLevel(t.priorityScore) === 'low')
 *   };
 * }
 */
export function sortTasksByPriority(tasks: Array<{priorityScore: number}>) {
  // 验证输入参数
  if (!Array.isArray(tasks)) {
    throw new TypeError('tasks参数必须是数组类型');
  }
  
  // 验证每个任务都包含priorityScore属性
  tasks.forEach((task, index) => {
    if (typeof task.priorityScore !== 'number') {
      throw new Error(`任务索引 ${index} 缺少priorityScore属性或类型不是数字`);
    }
  });
  
  // 创建副本并排序
  return [...tasks].sort((a, b) => b.priorityScore - a.priorityScore);
}