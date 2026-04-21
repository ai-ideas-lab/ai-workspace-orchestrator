/**
 * 工作流命令提取工具
 * 从用户输入中提取格式化的工作流命令
 */
export function extractWorkflowCommand(input: string): string {
  const command = input.trim().toLowerCase();
  
  // 常见工作流命令映射
  const commandMap: Record<string, string> = {
    '生成': 'generate',
    '创建': 'create', 
    '分析': 'analyze',
    '报告': 'report',
    '总结': 'summary',
    '优化': 'optimize'
  };
  
  // 查找匹配的命令
  for (const [chinese, english] of Object.entries(commandMap)) {
    if (command.includes(chinese)) {
      return english;
    }
  }
  
  return 'process'; // 默认命令
}