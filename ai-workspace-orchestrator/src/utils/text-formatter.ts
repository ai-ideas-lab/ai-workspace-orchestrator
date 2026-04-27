/**
 * 快速文本格式化工具
 * 
 * 提供简单的文本格式化功能，包括首字母大写和去除空白
 */
export function formatText(text: string): string {
  return text.trim().replace(/(^\w|\s\w)/g, m => m.toUpperCase());
}

/**
 * 智能文本分析
 * 
 * 分析文本长度并返回状态标记
 */
export function analyzeText(text: string): 'short' | 'medium' | 'long' {
  const length = text.trim().length;
  if (length < 50) return 'short';
  if (length < 200) return 'medium';
  return 'long';
}