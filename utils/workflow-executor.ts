export async function executeWorkflowStep(step: WorkflowStep, context: ExecutionContext): Promise<StepResult> {
  const agent = selectAIAgent(step.type);
  const input = preprocessInput(step.input, context);
  const result = await agent.execute(input);
  const processed = postprocessOutput(result, step.metadata);
  await logStepExecution(step.id, processed, context.userId);
  return { success: true, data: processed, metrics: extractMetrics(result) };
}

function selectAIAgent(type: StepType): AIEngine {
  return type === 'ai' ? new AIGptEngine() : type === 'api' ? new APIClient() : new DataProcessor();
}