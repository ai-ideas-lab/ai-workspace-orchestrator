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