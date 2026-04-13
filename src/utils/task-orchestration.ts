/**
 * 计算任务优先级分数
 * @param task 任务对象
 * @returns 优先级分数（0-100）
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
 * 获取优先级等级
 */
export function getPriorityLevel(priorityScore: number): 'low' | 'medium' | 'high' | 'critical' {
  if (priorityScore >= 80) return 'critical';
  if (priorityScore >= 60) return 'high';
  if (priorityScore >= 40) return 'medium';
  return 'low';
}

/**
 * 按优先级排序任务
 */
export function sortTasksByPriority(tasks: Array<{priorityScore: number}>) {
  return [...tasks].sort((a, b) => b.priorityScore - a.priorityScore);
}