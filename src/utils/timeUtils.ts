/**
 * 格式化执行时间
 * @param ms 毫秒数
 * @returns 格式化后的时间字符串
 */
export function formatExecutionTime(ms: number): string {
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * 格式化时间长度（分钟:秒）
 * @param ms 毫秒数
 * @returns 格式化后的时间字符串（MM:SS）
 */
export function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}