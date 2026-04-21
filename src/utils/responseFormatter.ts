/**
 * 统一API响应格式化函数
 * 将执行结果转换为标准化的响应格式
 */
export function formatApiResponse<T>(data: T, success: boolean = true, message?: string): {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
} {
  return {
    success,
    data: success ? data : undefined,
    error: success ? undefined : message,
    message,
    timestamp: new Date().toISOString()
  };
}