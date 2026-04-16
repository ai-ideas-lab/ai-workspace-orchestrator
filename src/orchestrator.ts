export async function orchestrator(userRequest: string): Promise<string> {
  const parsed = await parseIntent(userRequest);
  const workflow = await generateWorkflow(parsed);
  const result = await executeWorkflow(workflow);
  return result.status === 'success' 
    ? `任务执行成功: ${result.message}`
    : `任务执行失败: ${result.error}`;
}