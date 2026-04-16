export const generateWorkflowScheduler = async (workflow: Workflow): Promise<WorkflowExecution> => {
  const execution = await prisma.workflowExecution.create({
    data: {
      workflowId: workflow.id,
      status: 'pending',
      steps: workflow.steps.map(step => ({
        stepId: step.id,
        status: 'pending',
        output: null
      }))
    }
  });

  const taskQueue = new PriorityQueue();
  workflow.steps.forEach(step => 
    taskQueue.enqueue(step, step.priority || 1)
  );

  return executeNextStep(taskQueue, execution);
};

const executeNextStep = async (queue: PriorityQueue, execution: WorkflowExecution): Promise<WorkflowExecution> => {
  const step = queue.dequeue();
  if (!step) return execution;
  
  await executeStep(step, execution.id);
  return executeNextStep(queue, execution);
};