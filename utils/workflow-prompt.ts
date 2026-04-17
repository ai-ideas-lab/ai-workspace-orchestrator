export function generateWorkflowPrompt(input: string): string {
  const coreComponents = input.split('。').filter(Boolean).slice(0, 3);
  const workflow = coreComponents.map((task, index) => ({
    id: `task-${index + 1}`,
    description: task.trim(),
    priority: index === 0 ? 'high' : 'medium',
    dependencies: index === 0 ? [] : [`task-${index}`]
  }));
  
  return `工作流分析：${JSON.stringify(workflow, null, 2)}
请按优先级执行上述任务，确保依赖关系正确。`;
}