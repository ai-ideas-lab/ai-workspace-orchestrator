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

const validateStep = (step: WorkflowStep): boolean => {
  if (!step.id || !step.name) {
    console.error('Invalid step: missing id or name');
    return false;
  }
  if (!Array.isArray(step.parameters) && step.parameters !== undefined) {
    console.error('Invalid step: parameters must be an array');
    return false;
  }
  return true;
};

const executeNextStep = async (queue: PriorityQueue, execution: WorkflowExecution): Promise<WorkflowExecution> => {
  const step = queue.dequeue();
  if (!step) return execution;
  
  if (!validateStep(step)) {
    throw new Error('Invalid workflow step configuration');
  }
  
  await executeStep(step, execution.id);
  return executeNextStep(queue, execution);
};