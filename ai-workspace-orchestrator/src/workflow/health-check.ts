import { WorkflowExecution } from '@prisma/client';

export const checkWorkflowHealth = async (executionId: string): Promise<{healthy: boolean, status: string}> => {
  const execution = await prisma.workflowExecution.findUnique({
    where: { id: executionId },
    include: { workflow: true }
  });
  
  if (!execution) return {healthy: false, status: 'not_found'};
  return {
    healthy: execution.status === 'running' || execution.status === 'completed',
    status: execution.status
  };
};