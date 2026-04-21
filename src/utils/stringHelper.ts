/**
 * 字符串工具函数
 * 检查字符串是否为空或只包含空格
 */
export function isEmptyOrWhitespace(text: string): boolean {
  return !text || text.trim().length === 0;
}

/**
 * 生成指定长度的随机字符串ID
 * 
 * 创建由字母和数字组成的随机标识符，适用于临时ID、会话键等场景。
 * 使用加密安全的随机数生成器，确保生成的ID具有足够的随机性。
 * 
 * @param length ID的长度，默认为8个字符。最小值为1，最大值为64
 * @returns 生成的随机ID字符串，包含大写字母、小写字母和数字
 * @throws {RangeError} 当length参数超出1-64范围时抛出异常
 * @example
 * // 生成默认长度的随机ID
 * const id1 = generateRandomId();
 * console.log(id1); // 输出类似 "A3fX7bP2"
 * 
 * // 生成16位的随机ID
 * const id2 = generateRandomId(16);
 * console.log(id2); // 输出类似 "kL9mN2pQ5rS7tX1z"
 * 
 * // 生成用于会话标识的长ID
 * const sessionId = generateRandomId(32);
 * console.log(sessionId); // 输出类似 "aB3cD6eF9hI2jK5mN8pQ1sT4vW7xZ0"
 */
export function generateRandomId(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}