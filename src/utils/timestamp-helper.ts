/**
 * 时间戳工具
 * 提供统一的时间戳操作和格式化功能
 */

import { ID_PATTERNS } from '../constants/index.js';

/**
 * 创建请求ID - 生成唯一的请求标识符
 * 
 * 生成包含时间戳和随机数的请求ID，用于跟踪和调试
 * 
 * @returns 唯一的请求ID字符串
 */
export function generateRequestId(): string {
  try {
    return `${ID_PATTERNS.REQUEST_PREFIX}${Date.now()}_${ID_PATTERNS.TIMESTAMP_ID_SUFFIX}`;
  } catch (error) {
    // 如果生成失败，返回简单的时间戳
    return `${ID_PATTERNS.REQUEST_PREFIX}${Date.now()}`;
  }
}

/**
 * 测量执行时间 - 测量代码执行耗时
 * 
 * 测量函数或代码块的执行时间，用于性能监控
 * 
 * @param callback - 要测量的回调函数
 * @returns 包含执行时间和结果的Promise
 */
export async function measureExecutionTime<T>(
  callback: () => Promise<T> | T
): Promise<{ result: T; duration: number; timestamp: number }> {
  const startTime = Date.now();
  
  try {
    const result = await callback();
    const endTime = Date.now();
    
    return {
      result,
      duration: endTime - startTime,
      timestamp: endTime
    };
  } catch (error) {
    const endTime = Date.now();
    
    return {
      result: null as T,
      duration: endTime - startTime,
      timestamp: endTime
    };
  }
}

/**
 * 安全的时间戳比较
 * 
 * 比较两个时间戳的大小，避免null或undefined导致的错误
 * 
 * @param timestamp1 - 第一个时间戳
 * @param timestamp2 - 第二个时间戳
 * @returns 比较结果：0表示相等，1表示timestamp1大于timestamp2，-1表示timestamp1小于timestamp2
 */
export function compareTimestamps(timestamp1: number | null | undefined, timestamp2: number | null | undefined): number {
  try {
    const t1 = timestamp1 || 0;
    const t2 = timestamp2 || 0;
    
    if (t1 > t2) return 1;
    if (t1 < t2) return -1;
    return 0;
  } catch (error) {
    return 0;
  }
}

/**
 * 检查时间戳是否过期
 * 
 * 检查给定的时间戳是否已经超过了指定的过期时间
 * 
 * @param timestamp - 要检查的时间戳
 * @param expirationMs - 过期时间（毫秒）
 * @returns 如果已过期返回true，否则返回false
 */
export function isTimestampExpired(timestamp: number | null | undefined, expirationMs: number): boolean {
  try {
    if (!timestamp) return true;
    
    const currentTime = Date.now();
    return currentTime > timestamp + expirationMs;
  } catch (error) {
    return true;
  }
}

/**
 * 获取格式化的时间戳
 * 
 * 获取格式化后的时间戳字符串，用于日志记录和调试
 * 
 * @returns 格式化后的时间戳字符串
 */
export function getFormattedTimestamp(): string {
  try {
    const now = new Date();
    return now.toISOString();
  } catch (error) {
    return new Date().toISOString();
  }
}

/**
 * 创建时间范围对象
 * 
 * 创建包含开始和结束时间的时间范围对象
 * 
 * @param startMs - 开始时间（毫秒）
 * @param endMs - 结束时间（毫秒），可选
 * @returns 时间范围对象
 */
export function createTimeRange(startMs: number, endMs?: number): { start: number; end: number; duration: number } {
  const end = endMs || Date.now();
  
  return {
    start: startMs,
    end,
    duration: end - startMs
  };
}