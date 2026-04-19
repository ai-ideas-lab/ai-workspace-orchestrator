/**
 * 清理用户输入内容，移除潜在的安全风险字符
 * 
 * @param {string} input - 用户输入的字符串
 * @returns {string} 清理后的安全字符串
 */
export function sanitizeUserInput(input: string): string {
  if (typeof input !== "string") return "";
  
  return input
    .trim()
    .replace(/<[^>]*>/g, "") // 移除HTML标签
    .replace(/javascript:/gi, "") // 移除javascript协议
    .replace(/data:/gi, "") // 移除data协议
    .replace(/<script[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // 移除script标签
    .substring(0, 2000); // 限制长度
}
