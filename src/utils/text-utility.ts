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

/**
 * 验证邮箱格式是否正确
 * @param email 需要验证的邮箱地址
 * @returns 是否为有效的邮箱格式
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 从文本中提取动作动词
 * @param text 工作流描述文本
 * @returns 动作动词数组
 */
export function extractActionVerbs(text: string): string[] {
  const actionVerbs = ['创建', '执行', '更新', '删除', '获取', '设置', '验证', '发送', '接收', '分析', '处理', '转换', '同步', '备份', '恢复'];
  const words = cleanText(text).split(' ');
  return words.filter(word => actionVerbs.includes(word));
}