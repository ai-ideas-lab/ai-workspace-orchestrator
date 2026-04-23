/**
 * 快速Promise包装器 - 简化异步操作
 * 
 * @param fn 异步函数
 * @returns Promise包装的函数
 */
export function quickPromise<T>(fn: () => Promise<T>): () => Promise<T> {
  return fn;
}