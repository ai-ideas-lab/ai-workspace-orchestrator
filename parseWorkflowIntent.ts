/**
 * 解析工作流意图 - 自然语言处理引擎
 * 
 * 使用后端NLP服务解析用户输入的自然语言文本，提取其中的命令实体和意图信息。
 * 将用户的口语化指令转换为结构化的工作流执行指令，支持复杂的多步骤任务分解。
 * 
 * 该函数调用AI工作流管理器的实体解析API，支持中文和英文输入，能够识别
 * 创建、删除、启动、停止、分析等不同类型的操作指令。
 * 
 * @param text - 用户输入的自然语言文本，支持中文和英文
 * @returns 返回解析结果，包含提取的命令和识别的实体信息
 * @throws 当网络请求失败或API返回错误时抛出异常
 * @example
 * // 解析工作流创建指令
 * const result = await parseWorkflowIntent("创建一个报告生成工作流");
 * console.log(result);
 * // 输出:
 * // {
 * //   commands: [
 * //     {
 * //       action: "create",
 * //       parameters: { workflowType: "report" },
 * //       confidence: 0.95
 * //     }
 * //   ],
 * //   entities: { workflow: "report生成" }
 * // }
 * 
 * // 解析复杂指令
 * const complexResult = await parseWorkflowIntent(
 *   "启动数据分析流程，使用客户数据生成月度报告，并设置优先级为高"
 * );
 * console.log(complexResult.commands);
 * // 可能输出:
 * // [
 * //   { action: "start", parameters: { dataType: "customer" }, confidence: 0.88 },
 * //   { action: "generate", parameters: { reportType: "monthly" }, confidence: 0.92 },
 * //   { action: "setPriority", parameters: { level: "high" }, confidence: 0.85 }
 * // ]
 * 
 * // 处理失败情况
 * try {
 *   const result = await parseWorkflowIntent("无效指令");
 *   console.log(result);
 * } catch (error) {
 *   console.error("解析失败:", error.message);
 *   // 输出: 解析失败: Network Error
 * }
 */
export function parseWorkflowIntent(text: string): {
  commands: Array<{
    action: string;
    parameters: Record<string, any>;
    confidence: number;
  }>;
  entities: Record<string, any>;
} {
  const response = await fetch('/api/parse/entities', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });
  return response.json();
}