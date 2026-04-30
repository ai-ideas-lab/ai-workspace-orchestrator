/**
 * AI工作流调度器 - 智能工作流调度管理
 * 
 * 负责将工作流配置转换为可执行的任务调度计划，通过智能优化算法
 * 确保任务按最优顺序执行。支持多步骤工作流的并行和串行执行调度，
 * 提供优先级排序和时间估算功能，确保系统资源的高效利用。
 * 
 * @class AIScheduler
 * @description 工作流智能调度引擎，处理任务优先级、时间估算和调度优化
 */
export class AIScheduler {
  /**
   * 调度工作流执行计划
   * 
   * 将工作流配置转换为具体的执行调度计划，包括任务排序、时间分配
   * 和优先级管理。该函数是整个工作流执行的核心入口点，确保各个步骤
   * 能够按照最优顺序和时间安排执行。
   * 
   * @param {WorkflowConfig} workflow - 工作流配置对象，包含所有步骤信息
   * @param {WorkflowStep[]} workflow.steps - 工作流步骤数组，每个步骤包含ID、类型、权重等
   * @returns {Promise<ScheduledResult>} 返回调度结果，包含调度ID和已排序的任务列表
   * @throws {Error} 当工作流配置无效或调度算法失败时抛出异常
   * @example
   * // 基本工作流调度
   * const workflow = {
   *   steps: [
   *     { id: 'step1', type: 'ai', weight: 8, required: true },
   *     { id: 'step2', type: 'api', weight: 5, required: false },
   *     { id: 'step3', type: 'data', weight: 6, required: true }
   *   ]
   * };
   * const scheduler = new AIScheduler();
   * const result = await scheduler.scheduleWorkflow(workflow);
   * console.log(result.scheduleId); // 输出: UUID格式的调度ID
   * console.log(result.scheduledTasks.length); // 输出: 3
   * 
   * // 高级工作流调度
   * const complexWorkflow = {
   *   steps: [
   *     { id: 'data-collect', type: 'data', weight: 10, required: true },
   *     { id: 'ai-analyze', type: 'ai', weight: 15, required: true },
   *     { id: 'api-notify', type: 'api', weight: 8, required: false }
   *   ]
   * };
   * const advancedResult = await scheduler.scheduleWorkflow(complexWorkflow);
   * // 任务将按优先级排序：ai-analyze > data-collect > api-notify
   */
  async scheduleWorkflow(workflow: WorkflowConfig): Promise<ScheduledResult> {
    const tasks = workflow.steps.map(step => ({
      id: step.id,
      type: step.type,
      priority: this.calculatePriority(step),
      estimatedDuration: this.estimateDuration(step)
    }));
    
    const schedule = await this.optimizeSchedule(tasks);
    return { scheduleId: crypto.randomUUID(), scheduledTasks: schedule };
  }
  
  /**
   * 计算工作流步骤的优先级分数
   * 
   * 基于步骤权重和必需性属性计算综合优先级分数。必需步骤会获得
   * 20%的优先级加成，确保关键任务能够优先执行。优先级分数用于
   * 任务排序和资源分配决策。
   * 
   * @param {WorkflowStep} step - 工作流步骤对象
   * @param {'ai' | 'api' | 'data'} step.type - 步骤类型：AI处理、API调用或数据处理
   * @param {number} step.weight - 步骤权重，数值越高表示越重要
   * @param {boolean} step.required - 是否为必需步骤，必需步骤优先级更高
   * @returns {number} 计算后的优先级分数，用于任务排序
   * @throws {TypeError} 当step参数不是有效对象或缺少必要属性时抛出异常
   * @example
   * // 计算必需步骤的优先级
   * const requiredStep = { type: 'ai', weight: 8, required: true };
   * const priority1 = this.calculatePriority(requiredStep);
   * console.log(priority1); // 输出: 9.6 (8 * 1.2)
   * 
   * // 计算可选步骤的优先级
   * const optionalStep = { type: 'api', weight: 5, required: false };
   * const priority2 = this.calculatePriority(optionalStep);
   * console.log(priority2); // 输出: 5.0 (5 * 1.0)
   * 
   * // 比较不同类型步骤的优先级
   * const aiStep = { type: 'ai', weight: 10, required: true };
   * const dataStep = { type: 'data', weight: 10, required: false };
   * const aiPriority = this.calculatePriority(aiStep);
   * const dataPriority = this.calculatePriority(dataStep);
   * console.log(aiPriority > dataPriority); // 输出: true
   */
  private calculatePriority(step: WorkflowStep): number {
    return step.weight * (step.required ? TIMING.REQUIRED_PRIORITY_MULTIPLIER : 1.0);
  }
  
  /**
   * 估算工作流步骤的执行时间
   * 
   * 根据步骤类型估算平均执行时间。AI处理步骤通常需要更长时间（5秒），
   * 而API调用和数据处理相对较快（1秒）。这个估算用于工作流调度和
   * 资源预留计算。
   * 
   * @param {WorkflowStep} step - 工作流步骤对象
   * @param {'ai' | 'api' | 'data'} step.type - 步骤类型：AI处理、API调用或数据处理
   * @returns {number} 估算的执行时间，单位为毫秒
   * @throws {TypeError} 当step参数不是有效对象时抛出异常
   * @example
   * // AI处理步骤的执行时间
   * const aiStep = { type: 'ai', weight: 8, required: true };
   * const aiDuration = this.estimateDuration(aiStep);
   * console.log(aiDuration); // 输出: 5000
   * 
   * // API调用步骤的执行时间
   * const apiStep = { type: 'api', weight: 5, required: false };
   * const apiDuration = this.estimateDuration(apiStep);
   * console.log(apiDuration); // 输出: 1000
   * 
   * // 数据处理步骤的执行时间
   * const dataStep = { type: 'data', weight: 6, required: true };
   * const dataDuration = this.estimateDuration(dataStep);
   * console.log(dataDuration); // 输出: 1000
   * 
   * // 不同类型步骤的时间对比
   * console.log(this.estimateDuration({ type: 'ai' }) > this.estimateDuration({ type: 'api' })); // 输出: true
   */
  private estimateDuration(step: WorkflowStep): number {
    return step.type === STEP_TYPE.AI ? TIMING.AI_DURATION_MS : TIMING.API_DURATION_MS;
  }
  
  /**
   * 记录工作流调度优化日志
   * 
   * 在任务调度优化过程中记录调试信息，包括任务数量、优先级分布
   * 和排序结果。用于调试和性能监控，帮助开发者了解工作流调度
   * 的执行过程和结果。
   * 
   * @param {Task[]} tasks - 原始任务列表
   * @param {ScheduledTask[]} optimized - 优化后的任务列表
   * @returns {void} 该方法不返回值，仅执行日志记录操作
   * @throws {TypeError} 当tasks或optimized参数不是数组类型时抛出异常
   * @example
   * // 记录调度优化日志
   * const tasks = [{ id: 'task1', priority: 9.6 }, { id: 'task2', priority: 5.0 }];
   * const optimized = tasks.sort((a, b) => b.priority - a.priority);
   * this.logScheduleOptimization(tasks, optimized);
   * // 输出: 优化前任务数: 2, 优化后任务数: 2
   */
  private logScheduleOptimization(tasks: Task[], optimized: ScheduledTask[]): void {
    console.log(`优化前任务数: ${tasks.length}, 优化后任务数: ${optimized.length}`);
    console.log(`最高优先级任务: ${optimized[0]?.id || 'N/A'} (${optimized[0]?.priority || 0})`);
    console.log(`最低优先级任务: ${optimized[optimized.length - 1]?.id || 'N/A'} (${optimized[optimized.length - 1]?.priority || 0})`);
  }

  /**
   * 优化工作流任务调度顺序
   * 
   * 根据任务优先级对任务列表进行排序，确保高优先级任务优先执行。
   * 使用降序排序，优先级数值越高的任务排在越前面。这是工作流调度的
   * 核心算法，确保系统资源的最佳分配和任务的正确执行顺序。
   * 
   * @param {Task[]} tasks - 待优化的任务列表，每个任务包含优先级和其他属性
   * @param {Task} tasks.priority - 任务优先级，数值越高优先级越高
   * @param {'ai' | 'api' | 'data'} tasks.type - 任务类型
   * @param {number} tasks.weight - 任务权重
   * @param {boolean} tasks.required - 是否为必需任务
   * @param {number} tasks.estimatedDuration - 估算的执行时间
   * @returns {ScheduledTask[]} 优化后的任务列表，已按优先级降序排列
   * @throws {TypeError} 当tasks参数不是数组类型时抛出异常
   * @example
   * // 任务调度优化
   * const tasks = [
   *   { id: 'task1', type: 'ai', weight: 8, required: true, priority: 9.6, estimatedDuration: 5000 },
   *   { id: 'task2', type: 'api', weight: 5, required: false, priority: 5.0, estimatedDuration: 1000 },
   *   { id: 'task3', type: 'data', weight: 6, required: true, priority: 7.2, estimatedDuration: 1000 }
   * ];
   * const optimized = this.optimizeSchedule(tasks);
   * console.log(optimized[0].id); // 输出: 'task1' (优先级最高)
   * console.log(optimized[1].id); // 输出: 'task3' (优先级次之)
   * console.log(optimized[2].id); // 输出: 'task2' (优先级最低)
   * 
   * // 验证排序正确性
   * for (let i = 0; i < optimized.length - 1; i++) {
   *   console.log(optimized[i].priority >= optimized[i + 1].priority); // 应该输出: true
   * }
   */
  private async optimizeSchedule(tasks: Task[]): Promise<ScheduledTask[]> {
    const optimized = tasks.sort((a, b) => b.priority - a.priority);
    this.logScheduleOptimization(tasks, optimized);
    return optimized;
  }
}

interface WorkflowStep {
  id: string;
  type: typeof STEP_TYPE.AI | typeof STEP_TYPE.API | typeof STEP_TYPE.DATA;
  weight: number;
  required: boolean;
}

interface WorkflowConfig {
  steps: WorkflowStep[];
}

interface ScheduledResult {
  scheduleId: string;
  scheduledTasks: ScheduledTask[];
}

interface Task extends WorkflowStep {
  priority: number;
  estimatedDuration: number;
}

interface ScheduledTask extends Task {
  startTime: number;
  endTime: number;
}