/**
 * 快速开发辅助函数 - 简化常见操作
 * 
 * @param input 输入字符串
 * @returns 处理后的字符串
 */
export function quickFormat(input: string): string {
  return input.trim().replace(/\s+/g, ' ');
}

/**
 * 快速验证函数 - 检查输入有效性
 * 
 * @param input 要验证的输入
 * @returns 验证结果
 */
export function quickValidate(input: string): boolean {
  return input.length > 0 && input.length < 1000;
}