/**
 * 安排工作流代理 - 智能工作流调度器
 * 
 * 根据工作流ID、代理ID和优先级，智能调度工作流到可用的代理执行。
 * 该函数负责查找工作流、验证代理可用性、匹配优先级和启动工作流执行。
 * 支持三种优先级级别：high（高）、medium（中）、low（低），确保重要任务优先执行。
 * 
 * @param workflowId - 要执行的工作流ID，必须在数据库中存在且状态正常
 * @param agentId - 目标代理的ID，必须支持该工作流的类型
 * @param priority - 执行优先级，可选值为 'high'（高）、'medium'（中）、'low'（低）
 * @returns 返回工作流执行结果对象，包含执行状态和输出数据
 * @throws Error - 当工作流不存在或代理不可用时抛出异常
 * @example
 * // 高优先级工作流调度
 * const result = await scheduleWorkflowAgent(
 *   'report-123',
 *   'ai-agent-001', 
 *   'high'
 * );
 * console.log(result);
 * // 输出示例:
 * // {
 * //   workflowId: 'report-123',
 * //   agentId: 'ai-agent-001',
 * //   status: 'completed',
 * //   output: { reportUrl: 'https://example.com/report.pdf' },
 * //   executionTime: 4520
 * // }
 * 
 * // 中优先级任务调度
 * const mediumResult = await scheduleWorkflowAgent(
 *   'data-analysis-456',
 *   'ai-agent-002',
 *   'medium'
 * );
 * 
 * // 错误处理示例
 * try {
 *   const result = await scheduleWorkflowAgent(
 *     'invalid-workflow',
 *     'ai-agent-001',
 *     'high'
 *   );
 *   console.log(result);
 * } catch (error) {
 *   console.error('工作流调度失败:', error.message);
 *   // 输出: 工作流调度失败: Workflow not found
 * }
 */
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