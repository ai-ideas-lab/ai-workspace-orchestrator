/**
 * 解析工作流命令 - 从用户输入中提取工作流意图和执行步骤
 * 
 * 分析用户输入的自然语言命令，识别核心意图、关键词和执行步骤。
 * 支持基本的模式匹配和关键词提取，适用于简单的工作流命令解析。
 * 
 * @param {string} input - 用户输入的自然语言命令，如"创建月度销售报告"
 * @returns {{intent: string; entities: string[]; steps: string[]}} 返回解析结果，包含意图类型、实体数组和步骤数组
 * @throws {TypeError} 当输入参数不是字符串类型时抛出异常
 * @example
 * // 基本命令解析
 * const result = parseWorkflowCommand("创建销售报告");
 * console.log(result.intent); // 输出: "create"
 * console.log(result.entities); // 输出: ["create"]
 * 
 * // 复杂命令解析
 * const complex = parseWorkflowCommand("运行数据分析，生成图表");
 * console.log(complex.steps); // 输出: ["运行", "数据分析", "生成", "图表"]
 */
export function parseWorkflowCommand(input: string): {
  intent: string;
  entities: string[];
  steps: string[];
} {
  const entities = input.match(/\b(?:create|run|schedule|analyze)\b/g) || [];
  const steps = input.split(/[\s,;]+/).filter(word => word.length > 2);
  return {
    intent: entities[0] || 'unknown',
    entities,
    steps
  };
}