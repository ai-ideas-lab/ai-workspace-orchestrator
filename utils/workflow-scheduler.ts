export async function scheduleWorkflowAgent(
  workflowId: string,
  agentId: string,
  priority: 'high' | 'medium' | 'low'
): Promise<WorkflowResult> {
  const workflow = await db.workflow.findUnique({ 
    where: { id: workflowId } 
  });
  
  if (!workflow) throw new Error('Workflow not found');
  
  const agent = await findAvailableAgent(agentId, priority);
  if (!agent) throw new Error('Agent not available');
  
  return executeWorkflow(workflow, agent);
}