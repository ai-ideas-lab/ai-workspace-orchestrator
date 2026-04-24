/**
 * 格式化执行时间
 * @param ms 毫秒数
 * @returns 格式化后的时间字符串
 */
export function formatExecutionTime(ms: number): string {
  return `${(ms / 1000).toFixed(2)}s`;
}