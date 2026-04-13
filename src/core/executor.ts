/**
 * 执行工作流 - 核心工作流执行引擎
 * 
 * 根据工作流ID和用户输入，按照预设的步骤顺序执行整个工作流。
 * 该函数负责步骤排序、引擎选择、结果收集和执行状态管理。
 * 支持多步骤工作流的串行执行，每个步骤的结果会传递给后续步骤。
 * 
 * @param workflowId - 要执行的工作流ID，必须在数据库中存在
 * @param userInput - 用户输入的原始文本，用于工作流执行上下文
 * @returns 返回执行结果对象，包含工作流ID、所有步骤的执行结果和完成时间
 * @throws Error - 当工作流不存在时抛出异常
 * @example
 * // 基本工作流执行
 * const result = await executeWorkflow('workflow-123', '生成月度报告');
 * console.log(result);
 * // 输出:
 * // {
 * //   workflowId: 'workflow-123',
 * //   results: [
 * //     { stepId: 'step-1', output: '数据已收集', status: 'completed' },
 * //     { stepId: 'step-2', output: '报告已生成', status: 'completed' }
 * //   ],
 * //   completedAt: 2026-04-13T04:59:00.000Z
 * // }
 * 
 * // 错误处理示例
 * try {
 *   const result = await executeWorkflow('invalid-workflow', 'test input');
 *   console.log(result);
 * } catch (error) {
 *   console.error('工作流执行失败:', error.message);
 *   // 输出: 工作流执行失败: Workflow not found
 * }
 */
export async function executeWorkflow(workflowId: string, userInput: string) {
  const workflow = await prisma.workflow.findUnique({ where: { id: workflowId } });
  if (!workflow) throw new Error('Workflow not found');
  
  const steps = workflow.steps.sort((a, b) => a.order - b.order);
  const results = [];
  
  for (const step of steps) {
    const engine = getEngine(step.engineType);
    const result = await engine.execute(step, userInput, results);
    results.push(result);
  }
  
  return { workflowId, results, completedAt: new Date() };
}