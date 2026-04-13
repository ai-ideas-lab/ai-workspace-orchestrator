/**
 * Database Error Handler - 数据库错误处理中间件
 * 
 * 提供专门的数据库错误处理和重试机制，确保数据库操作的安全性和可靠性。
 */

import { Prisma } from '@prisma/client';
import { AppError, SystemError, DatabaseError, ValidationError } from '../utils/errors.js';

export class DatabaseErrorHandler {
  private static instance: DatabaseErrorHandler;
  private retryCount: number = 3;
  private retryDelay: number = 1000; // 1秒

  static getInstance(): DatabaseErrorHandler {
    if (!DatabaseErrorHandler.instance) {
      DatabaseErrorHandler.instance = new DatabaseErrorHandler();
    }
    return DatabaseErrorHandler.instance;
  }

  /**
   * 处理Prisma错误
   */
  handlePrismaError(error: unknown): AppError {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return this.handleKnownPrismaError(error);
    } else if (error instanceof Prisma.PrismaClientValidationError) {
      return new ValidationError(
        '数据库验证错误：数据格式不正确',
        undefined,
        { 
          originalError: error.message,
          stack: error.stack 
        }
      );
    } else if (error instanceof Prisma.PrismaClientRustPanicError) {
      return new SystemError(
        '数据库核心错误：请检查数据库连接',
        'Prisma',
        { 
          originalError: error.message,
          stack: error.stack 
        }
      );
    } else if (error instanceof Prisma.PrismaClientInitializationError) {
      return new SystemError(
        '数据库初始化失败：数据库连接配置错误',
        'Prisma',
        { 
          originalError: error.message,
          stack: error.stack 
        }
      );
    } else if (error instanceof Prisma.PrismaClientUnknownRequestError) {
      return new SystemError(
        '数据库未知错误：请检查请求格式',
        'Prisma',
        { 
          originalError: error.message,
          stack: error.stack 
        }
      );
    } else {
      return new DatabaseError(
        `数据库操作失败: ${error instanceof Error ? error.message : String(error)}`,
        { 
          originalError: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined 
        }
      );
    }
  }

  /**
   * 处理已知的Prisma错误
   */
  private handleKnownPrismaError(error: Prisma.PrismaClientKnownRequestError): AppError {
    switch (error.code) {
      case 'P2002': // 唯一约束冲突
        const field = error.meta?.target ? `字段 ${error.meta.target}` : '唯一字段';
        return new ConflictError(
          `${field} 已存在`,
          { 
            field: error.meta?.target,
            tableName: error.meta?.target,
            originalError: error.message 
          }
        );

      case 'P2003': // 外键约束失败
        return new ValidationError(
          '外键约束失败：关联数据不存在',
          undefined,
          { 
            relationName: error.meta?.relationName,
            fieldName: error.meta?.field_name,
            originalError: error.message 
          }
        );

      case 'P2025': // 记录未找到
        const model = error.meta?.modelName || '记录';
        return new ValidationError(
          `${model} 不存在`,
          undefined,
          { 
            modelName: error.meta?.modelName,
            originalError: error.message 
          }
        );

      case 'P2014': // 外键约束失败
        return new ValidationError(
          '外键约束失败：无效的引用',
          undefined,
          { 
            relationName: error.meta?.relationName,
            originalError: error.message 
          }
        );

      case 'P2016': // 连接查询失败
        return new ValidationError(
          '关联查询失败：数据完整性问题',
          undefined,
          { 
            originalError: error.message 
          }
        );

      case 'P2000': // 字段太长
        const field2 = error.meta?.field_name || '字段';
        return new ValidationError(
          `${field2} 长度超过限制`,
          field2,
          { 
            fieldName: error.meta?.field_name,
            length: error.meta?.length,
            originalError: error.message 
          }
        );

      case 'P2001': // 记录未找到（查询）
        return new ValidationError(
          '查询的记录不存在',
          undefined,
          { 
            originalError: error.message 
          }
        );

      default:
        // 其他Prisma错误码
        return new DatabaseError(
          `数据库操作错误 [${error.code}]: ${error.message}`,
          'Prisma',
          { 
            errorCode: error.code,
            meta: error.meta,
            originalError: error.message 
          }
        );
    }
  }

  /**
   * 带重试的数据库操作
   */
  async withRetry<T>(
    operation: () => Promise<T>,
    operationName: string = 'database operation'
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.retryCount; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // 如果是已知错误，直接抛出，不重试
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (['P2002', 'P2014', 'P2025'].includes(error.code)) {
            throw this.handlePrismaError(error);
          }
        }

        // 其他错误可以重试
        if (attempt < this.retryCount) {
          const delay = this.retryDelay * attempt; // 指数退避
          console.warn(`${operationName} 失败，${delay}ms 后重试 (尝试 ${attempt}/${this.retryCount}):`, lastError.message);
          
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          console.error(`${operationName} 最终失败:`, lastError);
          throw this.handlePrismaError(error);
        }
      }
    }

    throw this.handlePrismaError(lastError);
  }

  /**
   * 批量数据库操作的错误处理
   */
  async withBatchRetry<T>(
    operations: Array<{ name: string; operation: () => Promise<T> }>,
    batchSize: number = 5
  ): Promise<{ results: T[]; errors: Array<{ name: string; error: AppError }> }> {
    const results: T[] = [];
    const errors: Array<{ name: string; error: AppError }> = [];

    for (let i = 0; i < operations.length; i += batchSize) {
      const batch = operations.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async ({ name, operation }) => {
        try {
          const result = await this.withRetry(operation, name);
          results.push(result);
          return { name, result, error: null };
        } catch (error) {
          const appError = error instanceof AppError ? error : this.handlePrismaError(error);
          errors.push({ name, error: appError });
          return { name, result: null, error: appError };
        }
      });

      await Promise.all(batchPromises);
    }

    return { results, errors };
  }

  /**
   * 设置重试配置
   */
  setRetryConfig(count: number, delay: number): void {
    this.retryCount = Math.max(1, count);
    this.retryDelay = Math.max(100, delay);
  }
}

// 导出单例实例
export const dbErrorHandler = DatabaseErrorHandler.getInstance();

/**
 * 数据库操作装饰器
 */
export function withDatabaseRetry<T>(
  operation: () => Promise<T>,
  operationName?: string
): Promise<T> {
  return dbErrorHandler.withRetry(operation, operationName);
}

/**
 * 带错误处理的数据库查询包装器
 */
export async function safeDatabaseQuery<T>(
  query: () => Promise<T>,
  errorMessage: string = '数据库查询失败'
): Promise<T> {
  try {
    return await query();
  } catch (error) {
    throw dbErrorHandler.handlePrismaError(error);
  }
}