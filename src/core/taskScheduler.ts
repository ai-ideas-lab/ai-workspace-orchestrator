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