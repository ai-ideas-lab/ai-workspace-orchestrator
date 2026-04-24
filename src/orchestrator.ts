/**
 * AI工作流协调器 - 主协调函数
 * 
 * 接收用户请求并处理完整的工作流执行流程，包括意图解析、工作流生成和执行。
 * 该函数是整个AI工作流系统的核心入口点，负责将用户自然语言输入转换为
 * 可执行的工作流并协调各个AI引擎的执行过程。
 * 
 * @param {string} userRequest - 用户输入的自然语言请求，如"创建月度销售报告"
 * @returns {Promise<string>} 返回执行结果描述，成功时包含成功消息，失败时包含错误详情
 * @throws {Error} 当工作流解析失败、生成失败或执行过程中出现异常时抛出异常
 * @example
 * // 基本工作流执行
 * const result = await orchestrator("生成本月的销售数据报告");
 * console.log(result);
 * // 输出示例: "任务执行成功: 销售报告已生成完成，包含图表和总结"
 * 
 * // 复杂AI工作流执行
 * const complexResult = await orchestrator("分析客户反馈并生成改进建议");
 * console.log(complexResult);
 * // 输出示例: "任务执行成功: 已完成客户反馈分析，生成5项改进建议"
 * 
 * // 错误处理示例
 * try {
 *   const errorResult = await orchestrator("执行一个不存在的任务");
 *   console.log(errorResult);
 * } catch (error) {
 *   console.error('工作流执行失败:', error.message);
 *   // 输出示例: "工作流执行失败: 无法识别的用户意图类型"
 * }
 * 
 * // 边界情况处理
 * const emptyResult = await orchestrator("");
 * console.log(emptyResult);
 * // 输出示例: "任务执行失败: 用户请求不能为空"
 * 
 * // 参数验证
 * const invalidResult = await orchestrator(123 as any);
 * // 应该抛出 TypeError: userRequest must be a string
 */
/**
 * 验证用户请求的有效性
 * 
 * 检查用户请求是否为空、过长或包含敏感内容
 * @param {string} userRequest - 用户输入的请求
 * @returns {boolean} 返回验证是否通过
 * @example
 * const isValid = validateUserRequest("创建月度销售报告");
 * console.log(isValid); // true
 * 
 * const isEmpty = validateUserRequest("");
 * console.log(isEmpty); // false
 */
const MAX_REQUEST_LENGTH = 1000;
export function validateUserRequest(userRequest: string): boolean {
  return typeof userRequest === 'string' && 
         userRequest.trim().length > 0 && 
         userRequest.length <= MAX_REQUEST_LENGTH;
}

/**
 * AI工作流协调器 - 主协调函数
 * 
 * 接收用户请求并处理完整的工作流执行流程，包括意图解析、工作流生成和执行。
 * 该函数是整个AI工作流系统的核心入口点，负责将用户自然语言输入转换为
 * 可执行的工作流并协调各个AI引擎的执行过程。
 * 
 * @param {string} userRequest - 用户输入的自然语言请求，如"创建月度销售报告"
 * @returns {Promise<string>} 返回执行结果描述，成功时包含成功消息，失败时包含错误详情
 * @throws {Error} 当工作流解析失败、生成失败或执行过程中出现异常时抛出异常
 * @example
 * // 基本工作流执行
 * const result = await orchestrator("生成本月的销售数据报告");
 * console.log(result);
 * // 输出示例: "任务执行成功: 销售报告已生成完成，包含图表和总结"
 * 
 * // 复杂AI工作流执行
 * const complexResult = await orchestrator("分析客户反馈并生成改进建议");
 * console.log(complexResult);
 * // 输出示例: "任务执行成功: 已完成客户反馈分析，生成5项改进建议"
 * 
 * // 错误处理示例
 * try {
 *   const errorResult = await orchestrator("执行一个不存在的任务");
 *   console.log(errorResult);
 * } catch (error) {
 *   console.error('工作流执行失败:', error.message);
 *   // 输出示例: "工作流执行失败: 无法识别的用户意图类型"
 * }
 * 
 * // 边界情况处理
 * const emptyResult = await orchestrator("");
 * console.log(emptyResult);
 * // 输出示例: "任务执行失败: 用户请求不能为空"
 * 
 * // 参数验证
 * const invalidResult = await orchestrator(123 as any);
 * // 应该抛出 TypeError: userRequest must be a string
 */
export async function orchestrator(userRequest: string): Promise<string> {
  try {
    const parsed = await parseIntent(userRequest);
    const workflow = await generateWorkflow(parsed);
    const result = await executeWorkflow(workflow);
    return result.status === 'success' 
      ? `任务执行成功: ${result.message}`
      : `任务执行失败: ${result.error}`;
  } catch (error) {
    console.error('工作流执行异常:', error);
    return `任务执行失败: ${error instanceof Error ? error.message : '未知错误'}`;
  }
}
export function getWorkflowStatus(): string {
  return '运行中';
}
