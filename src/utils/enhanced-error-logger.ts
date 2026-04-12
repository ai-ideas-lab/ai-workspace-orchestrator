/**
 * Enhanced Error Logger - 增强错误日志记录器
 * 
 * 提供结构化的错误日志记录，包含完整的请求上下文、用户信息、环境信息等。
 */

import { AppError, isErrorOperational } from './errors.js';

interface ErrorContext {
  requestId: string;
  userId?: string;
  sessionId?: string;
  userAgent: string;
  ip: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  timestamp: string;
  environment: string;
  version: string;
  traceId?: string;
  spanId?: string;
}

interface ErrorDetails {
  error: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
    statusCode?: number;
  };
  context: ErrorContext;
  metadata?: Record<string, unknown>;
  duration?: number;
  memoryUsage?: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
}

/**
 * 增强错误日志记录器
 */
export class EnhancedErrorLogger {
  private static instance: EnhancedErrorLogger;
  private logs: ErrorDetails[] = [];

  private constructor() {}

  static getInstance(): EnhancedErrorLogger {
    if (!EnhancedErrorLogger.instance) {
      EnhancedErrorLogger.instance = new EnhancedErrorLogger();
    }
    return EnhancedErrorLogger.instance;
  }

  /**
   * 记录错误日志
   */
  logError(error: unknown, context: Partial<ErrorContext>, metadata?: Record<string, unknown>): void {
    const errorDetails: ErrorDetails = {
      error: {
        name: error instanceof Error ? error.name : 'UnknownError',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        code: (error as any).code,
        statusCode: (error as any).statusCode,
      },
      context: this.normalizeContext(context),
      metadata,
      duration: this.getDuration(),
      memoryUsage: this.getMemoryUsage(),
    };

    // 根据错误类型决定日志级别
    if (isErrorOperational(error) || error instanceof AppError) {
      // 业务逻辑错误
      console.warn(`[${errorDetails.context.requestId}] 业务逻辑错误:`, errorDetails);
    } else {
      // 系统错误
      console.error(`[${errorDetails.context.requestId}] 系统错误:`, errorDetails);
    }

    // 存储到内存中（生产环境应该发送到日志系统）
    this.logs.push(errorDetails);

    // 保持最近1000条记录
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }
  }

  /**
   * 记录API错误
   */
  logApiError(error: unknown, req: any, res: any, metadata?: Record<string, unknown>): void {
    const context: Partial<ErrorContext> = {
      requestId: req.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: req.user?.id,
      sessionId: req.session?.id,
      userAgent: req.get('User-Agent') || '',
      ip: this.getClientIp(req),
      method: req.method,
      url: req.originalUrl,
      headers: {
        'content-type': req.get('Content-Type'),
        'content-length': req.get('Content-Length'),
        'authorization': req.get('Authorization') ? 'Bearer ***' : undefined,
        'x-forwarded-for': req.get('X-Forwarded-For'),
        'x-real-ip': req.get('X-Real-IP'),
      },
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
    };

    this.logError(error, context, {
      ...metadata,
      response: {
        statusCode: res.statusCode,
        headers: res.getHeaders(),
      },
    });
  }

  /**
   * 记录数据库错误
   */
  logDatabaseError(error: unknown, operation: string, table: string, query?: string, metadata?: Record<string, unknown>): void {
    this.logError(error, {
      requestId: `db_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    }, {
      operation,
      table,
      query,
      ...metadata,
    });
  }

  /**
   * 记录外部服务错误
   */
  logExternalServiceError(error: unknown, service: string, endpoint: string, request?: any, response?: any): void {
    const context: Partial<ErrorContext> = {
      requestId: `ext_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    };

    this.logError(error, context, {
      service,
      endpoint,
      request,
      response,
      latency: response?.latency,
    });
  }

  /**
   * 获取错误统计
   */
  getErrorStats(): {
    total: number;
    operational: number;
    system: number;
    byErrorCode: Record<string, number>;
    byStatusCode: Record<number, number>;
    recent24h: number;
  } {
    const now = Date.now();
    const dayAgo = now - 24 * 60 * 60 * 1000;
    
    const recentErrors = this.logs.filter(log => 
      new Date(log.context.timestamp).getTime() > dayAgo
    );

    const operational = recentErrors.filter(log => isErrorOperational(log.error));
    const system = recentErrors.filter(log => !isErrorOperational(log.error));

    const byErrorCode: Record<string, number> = {};
    const byStatusCode: Record<number, number> = {};

    recentErrors.forEach(log => {
      const errorCode = log.error.code || 'UNKNOWN';
      const statusCode = log.error.statusCode || 500;
      
      byErrorCode[errorCode] = (byErrorCode[errorCode] || 0) + 1;
      byStatusCode[statusCode] = (byStatusCode[statusCode] || 0) + 1;
    });

    return {
      total: recentErrors.length,
      operational: operational.length,
      system: system.length,
      byErrorCode,
      byStatusCode,
      recent24h: recentErrors.length,
    };
  }

  /**
   * 获取最近的错误
   */
  getRecentErrors(limit: number = 50): ErrorDetails[] {
    return this.logs.slice(-limit);
  }

  /**
   * 清除旧日志
   */
  clearOldLogs(olderThanMs: number = 7 * 24 * 60 * 60 * 1000): void {
    const cutoff = Date.now() - olderThanMs;
    this.logs = this.logs.filter(log => 
      new Date(log.context.timestamp).getTime() > cutoff
    );
  }

  /**
   * 获取客户端IP地址
   */
  private getClientIp(req: any): string {
    return (
      req.headers['x-forwarded-for']?.split(',')[0] ||
      req.headers['x-real-ip'] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      'unknown'
    );
  }

  /**
   * 获取请求持续时间
   */
  private getDuration(): number {
    if (global.performance && performance.now) {
      return performance.now();
    }
    return Date.now();
  }

  /**
   * 获取内存使用情况
   */
  private getMemoryUsage(): {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  } {
    if (global.performance && performance.memory) {
      return {
        rss: performance.memory.rss,
        heapTotal: performance.memory.heapTotal,
        heapUsed: performance.memory.heapUsed,
        external: performance.memory.external,
      };
    }
    return {
      rss: 0,
      heapTotal: 0,
      heapUsed: 0,
      external: 0,
    };
  }

  /**
   * 规范化上下文信息
   */
  private normalizeContext(context: Partial<ErrorContext>): ErrorContext {
    return {
      requestId: context.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: context.userId || undefined,
      sessionId: context.sessionId || undefined,
      userAgent: context.userAgent || '',
      ip: context.ip || 'unknown',
      method: context.method || 'unknown',
      url: context.url || 'unknown',
      headers: context.headers || {},
      timestamp: context.timestamp || new Date().toISOString(),
      environment: context.environment || process.env.NODE_ENV || 'development',
      version: context.version || process.env.npm_package_version || '1.0.0',
      traceId: context.traceId,
      spanId: context.spanId,
    };
  }
}

// 导出单例实例
export const errorLogger = EnhancedErrorLogger.getInstance();