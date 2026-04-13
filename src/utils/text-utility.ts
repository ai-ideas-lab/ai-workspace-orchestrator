/**
 * 文本格式化工具函数
 */

/**
 * 清理文本中的多余空格和换行
 * @param text 需要清理的文本
 * @returns 清理后的文本
 */
export function cleanText(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

/**
 * 截取文本到指定长度
 * @param text 原始文本
 * @param maxLength 最大长度
 * @param suffix 后缀（如"..."）
 * @returns 截取后的文本
 */
export function truncateText(text: string, maxLength: number, suffix: string = '...'): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
}