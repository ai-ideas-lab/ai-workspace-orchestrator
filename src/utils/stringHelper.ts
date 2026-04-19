/**
 * 字符串工具函数
 * 检查字符串是否为空或只包含空格
 */
export function isEmptyOrWhitespace(text: string): boolean {
  return !text || text.trim().length === 0;
}

/**
 * 生成简单的随机ID
 */
export function generateRandomId(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}