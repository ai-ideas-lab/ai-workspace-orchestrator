/**
 * 通用错误处理工具
 * 提供统一的错误处理和消息格式化功能
 */

import { ERROR_PATTERNS } from '../constants/index.js';

/**
 * 格式化错误消息 - 统一错误消息格式
 * 
 * 将错误对象转换为统一的字符串格式，支持多种错误类型
 * 
 * @param error - 要格式化的错误对象或字符串
 * @param prefix - 错误前缀，用于标识错误类型
 * @returns 格式化后的错误消息字符串
 */
export function formatErrorMessage(error: any, prefix: string = ERROR_PATTERNS.DEFAULT_ERROR_PREFIX): string {
  try {
    if (typeof error === 'string') {
      return prefix + error;
    }
    
    if (error instanceof Error) {
      return prefix + error.message;
    }
    
    return prefix + String(error);
  } catch (formatError) {
    // 如果格式化过程出错，返回原始错误
    return String(error);
  }
}

/**
 * 安全的错误消息提取
 * 
 * 从错误对象中安全提取错误消息，避免类型错误
 * 
 * @param error - 错误对象
 * @param defaultValue - 默认返回值
 * @returns 错误消息或默认值
 */
export function extractErrorMessage(error: any, defaultValue: string = 'Unknown error'): string {
  try {
    if (error instanceof Error) {
      return error.message;
    }
    
    if (typeof error === 'string') {
      return error;
    }
    
    return defaultValue;
  } catch (extractError) {
    return defaultValue;
  }
}

/**
 * 检查错误类型 - 判断错误是否为特定类型
 * 
 * 检查错误是否属于特定的错误类型或具有特定属性
 * 
 * @param error - 要检查的错误对象
 * @param errorType - 要匹配的错误类型名称
 * @param property - 要检查的属性名
 * @param propertyValue - 期望的属性值
 * @returns 如果匹配则返回true，否则返回false
 */
export function isErrorOfType(error: any, errorType?: string, property?: string, propertyValue?: any): boolean {
  try {
    if (!error) return false;
    
    if (errorType && error.constructor && error.constructor.name === errorType) {
      return true;
    }
    
    if (property && typeof error[property] !== 'undefined') {
      if (propertyValue !== undefined) {
        return error[property] === propertyValue;
      }
      return true;
    }
    
    return false;
  } catch (checkError) {
    return false;
  }
}

/**
 * 创建标准错误对象
 * 
 * 创建包含标准错误信息的错误对象
 * 
 * @param message - 错误消息
 * @param code - 错误代码
 * @param statusCode - HTTP状态码
 * @param originalError - 原始错误对象
 * @returns 标准化的错误对象
 */
export function createStandardError(message: string, code: string = 'INTERNAL_ERROR', statusCode: number = 500, originalError?: any) {
  const error = new Error(message);
  error.name = code;
  error.statusCode = statusCode;
  
  if (originalError) {
    error.originalError = originalError;
    error.stack = originalError.stack;
  }
  
  return error;
}

/**
 * 判断错误是否为可重试错误
 * 
 * 判断错误是否属于可重试的类型（如网络错误、临时错误等）
 * 
 * @param error - 要检查的错误对象
 * @returns 如果是可重试错误返回true，否则返回false
 */
export function isRetryableError(error: any): boolean {
  try {
    if (!error) return false;
    
    // 网络相关错误
    const networkErrors = [
      'ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND',
      'Network Error', 'fetch failed', 'timeout', 'connection'
    ];
    
    const errorMessage = error.message || String(error);
    
    // 检查是否为网络错误
    if (networkErrors.some(msg => errorMessage.toLowerCase().includes(msg.toLowerCase()))) {
      return true;
    }
    
    // 检查是否为数据库连接错误
    if (errorMessage.includes('database') || errorMessage.includes('connection')) {
      return true;
    }
    
    // 检查是否为超时错误
    if (errorMessage.includes('timeout')) {
      return true;
    }
    
    // 检查是否为临时性错误
    const transientErrors = ['temporary', 'temporary unavailable', 'service unavailable'];
    if (transientErrors.some(msg => errorMessage.toLowerCase().includes(msg.toLowerCase()))) {
      return true;
    }
    
    return false;
  } catch (checkError) {
    return false;
  }
}