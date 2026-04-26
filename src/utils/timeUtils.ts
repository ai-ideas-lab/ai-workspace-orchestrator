import { TIME_CONSTANTS } from './constants';

/**
 * 格式化执行时间
 * @param ms 毫秒数
 * @returns 格式化后的时间字符串
 */
export function formatExecutionTime(ms: number): string {
  try {
    if (typeof ms !== 'number' || isNaN(ms)) {
      throw new Error('Invalid input: ms must be a valid number');
    }
    return `${(ms / TIME_CONSTANTS.MILLISECONDS_PER_SECOND).toFixed(2)}s`;
  } catch (error) {
    console.error('Error in formatExecutionTime:', error);
    return '0.00s'; // Return default value on error
  }
}

/**
 * 格式化时间长度（分钟:秒）
 * @param ms 毫秒数
 * @returns 格式化后的时间字符串（MM:SS）
 */
export function formatDuration(ms: number): string {
  try {
    if (typeof ms !== 'number' || isNaN(ms) || ms < 0) {
      throw new Error('Invalid input: ms must be a non-negative number');
    }
    
    const minutes = Math.floor(ms / TIME_CONSTANTS.MILLISECONDS_PER_MINUTE);
    const seconds = Math.floor((ms % TIME_CONSTANTS.MILLISECONDS_PER_MINUTE) / TIME_CONSTANTS.MILLISECONDS_PER_SECOND);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } catch (error) {
    console.error('Error in formatDuration:', error);
    return '00:00'; // Return default value on error
  }
}