/**
 * Enhanced Error Aggregator - 增强错误聚合器
 * 
 * 提供错误聚合、去重、告警等功能，防止错误风暴并提供有意义的错误统计
 */

import { AppError, SystemError, NetworkError, TimeoutError } from './errors.js';
import { logger } from './enhanced-error-logger.js';

export interface ErrorAggregationConfig {
  /** 时间窗口大小（毫秒） */
  windowSizeMs: number;
  /** 相同错误的相似度阈值（0-1） */
  similarityThreshold: number;
  /** 最大聚合错误数量 */
  maxAggregatedErrors: number;
  /** 错误告警阈值 */
  alertThreshold: number;
  /** 告警回调函数 */
  alertCallback?: (aggregatedError: AggregatedError) => void;
}

export interface ErrorStats {
  totalCount: number;
  errorCountByType: Map<string, number>;
  errorCountByCode: Map<string, number>;
  errorRate: number;
  lastErrorAt: Date;
}

export interface AggregatedError {
  errorId: string;
  errorType: string;
  errorCode: string;
  errorMessage: string;
  firstOccurred: Date;
  lastOccurred: Date;
  occurrenceCount: number;
  recentOccurrences: Array<{
    timestamp: Date;
    context: Record<string, unknown>;
    stack?: string;
  }>;
  similarErrors: Array<{
    timestamp: Date;
    similarity: number;
    context: Record<string, unknown>;
  }>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * 错误聚合器
 */
export class ErrorAggregator {
  private static instance: ErrorAggregator;
  private config: ErrorAggregationConfig;
  private errorWindows: Map<string, Array<{
    error: Error;
    timestamp: Date;
    context: Record<string, unknown>;
  }>> = new Map();
  
  private aggregatedErrors: Map<string, AggregatedError> = new Map();
  private stats: ErrorStats = {
    totalCount: 0,
    errorCountByType: new Map(),
    errorCountByCode: new Map(),
    errorRate: 0,
    lastErrorAt: new Date(),
  };

  private constructor(config: Partial<ErrorAggregationConfig> = {}) {
    this.config = {
      windowSizeMs: 5 * 60 * 1000, // 5分钟窗口
      similarityThreshold: 0.8,
      maxAggregatedErrors: 100,
      alertThreshold: 10,
      ...config,
    };

    // 启动清理定时器
    setInterval(() => this.cleanupOldErrors(), this.config.windowSizeMs);
  }

  static getInstance(config?: Partial<ErrorAggregationConfig>): ErrorAggregator {
    if (!ErrorAggregator.instance) {
      ErrorAggregator.instance = new ErrorAggregator(config);
    }
    return ErrorAggregator.instance;
  }

  /**
   * 记录错误
   */
  recordError(
    error: Error,
    context: Record<string, unknown> = {},
    severity: AggregatedError['severity'] = 'medium'
  ): string {
    const errorId = this.generateErrorId(error);
    const timestamp = new Date();
    
    // 更新统计信息
    this.updateStats(error, timestamp);
    
    // 添加到错误窗口
    if (!this.errorWindows.has(errorId)) {
      this.errorWindows.set(errorId, []);
    }
    
    this.errorWindows.get(errorId)!.push({
      error,
      timestamp,
      context,
    });

    // 聚合错误
    this.aggregateError(errorId, error, context, timestamp, severity);

    // 检查是否需要告警
    this.checkForAlerts(errorId);

    return errorId;
  }

  /**
   * 获取错误统计信息
   */
  getStats(): ErrorStats {
    return { ...this.stats };
  }

  /**
   * 获取聚合错误信息
   */
  getAggregatedErrors(): AggregatedError[] {
    return Array.from(this.aggregatedErrors.values())
      .sort((a, b) => b.occurrenceCount - a.occurrenceCount)
      .slice(0, this.config.maxAggregatedErrors);
  }

  /**
   * 获取特定错误的详细信息
   */
  getAggregatedError(errorId: string): AggregatedError | undefined {
    return this.aggregatedErrors.get(errorId);
  }

  /**
   * 清理旧错误数据
   */
  private cleanupOldErrors(): void {
    const now = new Date();
    const cutoffTime = new Date(now.getTime() - this.config.windowSizeMs);

    // 清理错误窗口
    for (const [errorId, errors] of this.errorWindows.entries()) {
      const filteredErrors = errors.filter(e => e.timestamp > cutoffTime);
      
      if (filteredErrors.length === 0) {
        this.errorWindows.delete(errorId);
        this.aggregatedErrors.delete(errorId);
      } else {
        this.errorWindows.set(errorId, filteredErrors);
      }
    }

    logger.info(`错误聚合器清理完成，剩余错误类型: ${this.errorWindows.size}`);
  }

  /**
   * 更新错误统计信息
   */
  private updateStats(error: Error, timestamp: Date): void {
    this.stats.totalCount++;
    this.stats.lastErrorAt = timestamp;

    // 按错误类型统计
    const errorType = error.constructor.name;
    const typeCount = this.stats.errorCountByType.get(errorType) || 0;
    this.stats.errorCountByType.set(errorType, typeCount + 1);

    // 按错误码统计
    const errorCode = this.getErrorCode(error);
    const codeCount = this.stats.errorCountByCode.get(errorCode) || 0;
    this.stats.errorCountByCode.set(errorCode, codeCount + 1);

    // 计算错误率（假设有请求量统计）
    // 这里可以根据实际的请求数量来计算更精确的错误率
    this.stats.errorRate = this.stats.totalCount / Math.max(this.stats.totalCount, 1);
  }

  /**
   * 聚合错误
   */
  private aggregateError(
    errorId: string,
    error: Error,
    context: Record<string, unknown>,
    timestamp: Date,
    severity: AggregatedError['severity']
  ): void {
    const existingAggregated = this.aggregatedErrors.get(errorId);

    if (existingAggregated) {
      // 更新现有聚合错误
      existingAggregated.lastOccurred = timestamp;
      existingAggregated.occurrenceCount++;
      
      // 添加到最近发生列表
      existingAggregated.recentOccurrences.push({
        timestamp,
        context,
        stack: error.stack,
      });

      // 限制最近发生列表大小
      if (existingAggregated.recentOccurrences.length > 10) {
        existingAggregated.recentOccurrences = existingAggregated.recentOccurrences.slice(-10);
      }
    } else {
      // 创建新的聚合错误
      const aggregatedError: AggregatedError = {
        errorId,
        errorType: error.constructor.name,
        errorCode: this.getErrorCode(error),
        errorMessage: error.message,
        firstOccurred: timestamp,
        lastOccurred: timestamp,
        occurrenceCount: 1,
        recentOccurrences: [{
          timestamp,
          context,
          stack: error.stack,
        }],
        similarErrors: [],
        severity,
      };

      this.aggregatedErrors.set(errorId, aggregatedError);
    }

    // 查找相似错误
    this.findSimilarErrors(errorId, error, context, timestamp);
  }

  /**
   * 查找相似错误
   */
  private findSimilarErrors(
    targetErrorId: string,
    targetError: Error,
    targetContext: Record<string, unknown>,
    timestamp: Date
  ): void {
    const targetAggregated = this.aggregatedErrors.get(targetErrorId);
    if (!targetAggregated) return;

    // 在当前窗口中查找相似错误
    const targetWindow = this.errorWindows.get(targetErrorId) || [];
    
    for (const [otherErrorId, otherErrors] of this.errorWindows.entries()) {
      if (otherErrorId === targetErrorId) continue;

      for (const otherErrorData of otherErrors) {
        const similarity = this.calculateErrorSimilarity(targetError, otherErrorData.error);
        
        if (similarity >= this.config.similarityThreshold) {
          targetAggregated.similarErrors.push({
            timestamp: otherErrorData.timestamp,
            similarity,
            context: otherErrorData.context,
          });
        }
      }
    }

    // 限制相似错误数量
    if (targetAggregated.similarErrors.length > 5) {
      targetAggregated.similarErrors = targetAggregated.similarErrors
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5);
    }
  }

  /**
   * 计算错误相似度
   */
  private calculateErrorSimilarity(error1: Error, error2: Error): number {
    if (error1.constructor.name !== error2.constructor.name) {
      return 0;
    }

    const message1 = error1.message;
    const message2 = error2.message;

    // 简单的字符串相似度计算
    const maxLength = Math.max(message1.length, message2.length);
    const minLength = Math.min(message1.length, message2.length);
    
    if (minLength === 0) return 0;

    let matchingChars = 0;
    for (let i = 0; i < minLength; i++) {
      if (message1[i] === message2[i]) {
        matchingChars++;
      }
    }

    const messageSimilarity = matchingChars / maxLength;

    // 堆栈相似度（可选，计算成本较高）
    const stackSimilarity = error1.stack && error2.stack 
      ? this.calculateStackSimilarity(error1.stack, error2.stack)
      : 0;

    return (messageSimilarity * 0.7) + (stackSimilarity * 0.3);
  }

  /**
   * 计算堆栈相似度
   */
  private calculateStackSimilarity(stack1: string, stack2: string): number {
    const lines1 = stack1.split('\n').filter(line => line.trim());
    const lines2 = stack2.split('\n').filter(line => line.trim());

    const minLength = Math.min(lines1.length, lines2.length);
    let matchingLines = 0;

    for (let i = 0; i < minLength; i++) {
      // 去除文件路径和时间戳，只比较核心信息
      const cleanLine1 = lines1[i].replace(/\/.*?:\d+/, '').trim();
      const cleanLine2 = lines2[i].replace(/\/.*?:\d+/, '').trim();
      
      if (cleanLine1 === cleanLine2) {
        matchingLines++;
      }
    }

    return matchingLines / Math.max(lines1.length, lines2.length);
  }

  /**
   * 检查是否需要告警
   */
  private checkForAlerts(errorId: string): void {
    const aggregatedError = this.aggregatedErrors.get(errorId);
    if (!aggregatedError) return;

    // 检查发生次数是否超过阈值
    if (aggregatedError.occurrenceCount >= this.config.alertThreshold) {
      logger.warn(`错误告警: ${aggregatedError.errorCode} 已发生 ${aggregatedError.occurrenceCount} 次`);
      
      if (this.config.alertCallback) {
        this.config.alertCallback(aggregatedError);
      }
    }

    // 检查错误严重程度
    if (aggregatedError.severity === 'critical') {
      logger.error(`严重错误告警: ${aggregatedError.errorId}`);
      
      if (this.config.alertCallback) {
        this.config.alertCallback(aggregatedError);
      }
    }
  }

  /**
   * 生成错误ID
   */
  private generateErrorId(error: Error): string {
    const type = error.constructor.name;
    const message = error.message;
    const stack = error.stack?.substring(0, 100) || '';
    
    const hash = this.simpleHash(`${type}:${message}:${stack}`);
    return `${type}_${hash}`;
  }

  /**
   * 简单哈希函数
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * 获取错误码
   */
  private getErrorCode(error: Error): string {
    if (error instanceof AppError) {
      return error.errorCode;
    }
    
    if (error instanceof SystemError) {
      return 'SYSTEM_ERROR';
    }
    
    if (error instanceof NetworkError) {
      return 'NETWORK_ERROR';
    }
    
    if (error instanceof TimeoutError) {
      return 'TIMEOUT_ERROR';
    }
    
    // 根据错误类型生成错误码
    const type = error.constructor.name;
    const match = error.message.match(/(\w+_ERROR|_ERROR|ERROR)/i);
    if (match) {
      return match[1].toUpperCase();
    }
    
    return `${type.toUpperCase()}_ERROR`;
  }
}

/**
 * 增强错误聚合中间件
 */
export function createErrorAggregatorMiddleware(config?: Partial<ErrorAggregationConfig>) {
  const aggregator = ErrorAggregator.getInstance(config);

  return (error: Error, req: any, res: any, next: any) => {
    const context = {
      path: req.path,
      method: req.method,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?.id,
      sessionId: req.session?.id,
      requestId: req.requestId,
    };

    // 根据错误类型确定严重程度
    let severity: AggregatedError['severity'] = 'medium';
    if (error instanceof SystemError) {
      severity = 'high';
    } else if (error instanceof NetworkError) {
      severity = 'medium';
    } else if (error.message.includes('critical') || error.message.includes('fatal')) {
      severity = 'critical';
    }

    const errorId = aggregator.recordError(error, context, severity);
    
    // 添加错误ID到响应头
    res.setHeader('X-Error-ID', errorId);
    
    next(error);
  };
}

export { ErrorAggregator as default };