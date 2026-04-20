export async function orchestrateAIAgents(
  workflow: Workflow, 
  agents: AIAgent[], 
  context: Context
): Promise<ExecutionResult> {
  const queue = new RequestQueue();
  agents.forEach(agent => queue.add(agent.execute(context)));
  return await queue.process({ priority: workflow.priority });
}