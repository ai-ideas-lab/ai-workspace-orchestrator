/**
 * Database Error Handler - 数据库错误处理器
 * 
 * 集成Prisma错误处理，提供统一的数据库错误分类和处理
 */

import { Prisma } from '@prisma/client';
import { AppError, DatabaseError, SystemError, ValidationError } from './errors.js';
import { logger } from './enhanced-error-logger.js';

export interface DatabaseErrorContext {
  operation: string;
  table: string;
  query?: string;
  parameters?: Record<string, unknown>;
  userId?: string;
  correlationId?: string;
}

/**
 * 数据库错误处理器
 */
export class DatabaseErrorHandler {
  /**
   * 处理Prisma错误并转换为应用错误
   */
  static handlePrismaError(
    error: unknown,
    context: DatabaseErrorContext
  ): AppError {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return this.handleKnownPrismaError(error, context);
    } else if (error instanceof Prisma.PrismaClientValidationError) {
      return this.handleValidationError(error, context);
    } else if (error instanceof Prisma.PrismaClientRustPanicError) {
      return this.handleRustPanicError(error, context);
    } else if (error instanceof Prisma.PrismaClientUnknownRequestError) {
      return this.handleUnknownRequestError(error, context);
    } else {
      return this.handleGenericError(error, context);
    }
  }

  /**
   * 处理已知的Prisma请求错误
   */
  private static handleKnownPrismaError(
    error: Prisma.PrismaClientKnownRequestError,
    context: DatabaseErrorContext
  ): AppError {
    const errorCode = error.code;
    const meta = error.meta;

    logger.error('Prisma已知错误:', {
      code: errorCode,
      meta,
      context,
      stack: error.stack,
    });

    switch (errorCode) {
      case 'P2002':
        // 唯一约束冲突
        const field = (meta?.target as string[])?.[0] || '字段';
        return new ValidationError(
          `${field}已存在，请使用其他值`,
          field,
          { 
            code: errorCode,
            table: context.table,
            target: meta?.target,
          }
        );

      case 'P2003':
        // 外键约束失败
        const relationField = (meta?.field_name as string) || '关联字段';
        return new ValidationError(
          `关联的${relationField}不存在`,
          relationField,
          { 
            code: errorCode,
            table: context.table,
            relationField: meta?.field_name,
          }
        );

      case 'P2025':
        // 记录未找到
        const modelName = (meta?.model_name as string) || '记录';
        return new AppError(
          `${modelName}不存在`,
          404,
          'RECORD_NOT_FOUND',
          true,
          { 
            code: errorCode,
            model: meta?.model_name,
            cause: meta?.cause,
          },
          `请求的${modelName}不存在`
        );

      case 'P2016':
        // 记录已被删除
        const deletedModel = (meta?.model_name as string) || '记录';
        return new AppError(
          `${deletedModel}已被删除或不存在`,
          404,
          'RECORD_DELETED',
          true,
          { 
            code: errorCode,
            model: meta?.model_name,
          },
          `请求的${deletedModel}不存在或已被删除`
        );

      case 'P2022':
        // 数据库连接问题
        return new SystemError(
          '数据库连接失败',
          'database',
          { 
            code: errorCode,
            originalError: error.message,
            context,
          }
        );

      case 'P2001':
        // 查询结果为空
        return new AppError(
          '查询结果为空',
          404,
          'QUERY_EMPTY',
          true,
          { 
            code: errorCode,
            table: context.table,
          },
          '未找到匹配的记录'
        );

      case 'P2010':
        // 查询错误
        return new DatabaseError(
          `数据库查询错误: ${error.message}`,
          {
            code: errorCode,
            table: context.table,
            query: context.query,
            originalError: error.message,
          }
        );

      default:
        // 其他已知错误
        return new DatabaseError(
          `数据库操作失败: ${error.message}`,
          {
            code: errorCode,
            table: context.table,
            operation: context.operation,
            originalError: error.message,
          }
        );
    }
  }

  /**
   * 处理Prisma验证错误
   */
  private static handleValidationError(
    error: Prisma.PrismaClientValidationError,
    context: DatabaseErrorContext
  ): AppError {
    logger.error('Prisma验证错误:', {
      message: error.message,
      context,
      stack: error.stack,
    });

    return new ValidationError(
      '数据验证失败',
      undefined,
      {
        operation: context.operation,
        table: context.table,
        validationError: error.message,
      }
    );
  }

  /**
   * 处理Prisma Rust panic错误
   */
  private static handleRustPanicError(
    error: Prisma.PrismaClientRustPanicError,
    context: DatabaseErrorContext
  ): AppError {
    logger.error('Prisma Rust panic错误:', {
      message: error.message,
      context,
      stack: error.stack,
    });

    return new SystemError(
      '数据库内部错误，请稍后重试',
      'database',
      {
        code: 'RUST_PANIC',
        table: context.table,
        operation: context.operation,
        originalError: error.message,
      }
    );
  }

  /**
   * 处理未知的Prisma请求错误
   */
  private static handleUnknownRequestError(
    error: Prisma.PrismaClientUnknownRequestError,
    context: DatabaseErrorContext
  ): AppError {
    logger.error('Prisma未知请求错误:', {
      message: error.message,
      context,
      stack: error.stack,
    });

    return new DatabaseError(
      `数据库未知错误: ${error.message}`,
      {
        operation: context.operation,
        table: context.table,
        originalError: error.message,
      }
    );
  }

  /**
   * 处理通用错误
   */
  private static handleGenericError(
    error: unknown,
    context: DatabaseErrorContext
  ): AppError {
    logger.error('数据库通用错误:', {
      error,
      context,
      stack: error instanceof Error ? error.stack : undefined,
    });

    return new DatabaseError(
      '数据库操作失败',
      {
        operation: context.operation,
        table: context.table,
        originalError: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      }
    );
  }

  /**
   * 包装数据库操作，自动处理错误
   */
  static wrapDatabaseOperation<T>(
    operation: () => Promise<T>,
    context: DatabaseErrorContext
  ): Promise<T> {
    return operation().catch((error) => {
      const appError = this.handlePrismaError(error, context);
      throw appError;
    });
  }

  /**
   * 批量数据库操作，部分失败继续执行
   */
  static async executeBatchWithPartialFailure<T>(
    operations: Array<{
      id: string;
      operation: () => Promise<T>;
      context: DatabaseErrorContext;
    }>,
    overallContext: DatabaseErrorContext
  ): Promise<{
    successes: Array<{ id: string; result: T }>;
    failures: Array<{ id: string; error: AppError }>;
  }> {
    const successes: Array<{ id: string; result: T }> = [];
    const failures: Array<{ id: string; error: AppError }> = [];

    const promises = operations.map(async ({ id, operation, context }) => {
      try {
        const result = await this.wrapDatabaseOperation(operation, {
          ...overallContext,
          ...context,
          operation: `${overallContext.operation}[${id}]`,
        });
        successes.push({ id, result });
      } catch (error) {
        if (error instanceof AppError) {
          failures.push({ id, error });
        } else {
          const appError = this.handleGenericError(error, context);
          failures.push({ id, error: appError });
        }
      }
    });

    await Promise.all(promises);
    return { successes, failures };
  }

  /**
   * 检查错误是否为数据库相关错误
   */
  static isDatabaseError(error: unknown): boolean {
    return error instanceof Prisma.PrismaClientKnownRequestError ||
           error instanceof Prisma.PrismaClientValidationError ||
           error instanceof Prisma.PrismaClientRustPanicError ||
           error instanceof Prisma.PrismaClientUnknownRequestError;
  }

  /**
   * 检查错误是否为可重试的数据库错误
   */
  static isRetryableDatabaseError(error: unknown): boolean {
    if (!this.isDatabaseError(error)) {
      return false;
    }

    const prismaError = error as Prisma.PrismaClientKnownRequestError;
    
    // 可重试的错误类型
    const retryableCodes = [
      'P2022', // 数据库连接问题
      'P2010', // 查询错误
      'P2000', // 通用约束错误
    ];

    return retryableCodes.includes(prismaError.code);
  }
}

// 导出数据库错误处理装饰器
export function withDatabaseErrorHandling(
  context: DatabaseErrorContext
) {
  return function <T extends (...args: any[]) => Promise<any>>(
    target: any,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    const method = descriptor.value!;

    descriptor.value = (async function(this: any, ...args: any[]) {
      return DatabaseErrorHandler.wrapDatabaseOperation(
        () => method.apply(this, args),
        context
      );
    }) as any;

    return descriptor;
  };
}