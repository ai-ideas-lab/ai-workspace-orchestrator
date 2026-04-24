/**
 * 快速文本格式化工具
 * 
 * 提供简单的文本格式化功能，包括首字母大写和去除空白
 */
export function formatText(text: string): string {
  return text.trim().replace(/(^\w|\s\w)/g, m => m.toUpperCase());
}