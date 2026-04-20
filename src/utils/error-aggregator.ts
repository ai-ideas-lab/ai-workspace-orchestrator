/**
 * Error Aggregator & Monitoring - 错误聚合与监控系统
 * 
 * 提供统一的错误收集、聚合分析、实时监控和告警功能。
 * 集成熔断器状态、性能指标、用户行为等数据，提供完整的系统健康视图。
 */

import { AppError, isErrorOperational } from './errors.js';
import { CircuitBreaker } from '../services/circuit-breaker.js';

export interface ErrorIncident {
  id: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  service: string;
  errorType: string;
  message: string;
  details: Record<string, unknown>;
  affectedUsers: string[];
  circuitState: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  metrics: {
    responseTime: number;
    errorRate: number;
    throughput: number;
  };
}

export interface ErrorAlert {
  id: string;
  type: 'error_spike' | 'circuit_breaker' | 'performance_degradation' | 'service_down';
  severity: 'warning' | 'error' | 'critical';
  service: string;
  message: string;
  timestamp: Date;
  metrics: Record<string, number>;
  resolved: boolean;
  resolvedAt?: Date;
}

export interface ErrorDashboard {
  summary: {
    totalErrors: number;
    operationalErrors: number;
    systemErrors: number;
    alertCount: number;
    healthScore: number; // 0-100
  };
  services: {
    [serviceName: string]: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      errorRate: number;
      avgResponseTime: number;
      circuitState: string;
      recentErrors: Array<{
        timestamp: Date;
        message: string;
        severity: string;
      }>;
    };
  };
  alerts: ErrorAlert[];
  trends: {
    last24h: number;
    last7d: number;
    last30d: number;
    change24h: number;
    change7d: number;
  };
}

/**
 * 错误聚合器 - 收集和分析系统错误
 */
export class ErrorAggregator {
  private incidents: Map<string, ErrorIncident> = new Map();
  private alerts: Map<string, ErrorAlert> = new Map();
  private serviceMetrics: Map<string, {
    totalRequests: number;
    errorCount: number;
    responseTimes: number[];
    circuitBreaker: CircuitBreaker;
  }> = new Map();

  private alertThresholds = {
    errorRate: 0.1, // 10%错误率触发告警
    responseTime: 5000, // 5秒响应时间触发告警
    errorSpike: 50, // 50个错误/分钟触发尖峰告警
  };

  constructor() {
    this.startPeriodicCheck();
  }

  /**
   * 记录错误
   */
  recordError(
    error: unknown,
    context: {
      path: string;
      method: string;
      userAgent: string;
      ip: string;
      userId?: string;
      sessionId?: string;
      requestId?: string;
      service?: string;
      circuitState?: string;
    },
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): string {
    const errorId = this.generateErrorId();
    const incident: ErrorIncident = {
      id: errorId,
      timestamp: new Date(),
      severity,
      service: context.service || this.identifyService(context.path),
      errorType: this.getErrorType(error),
      message: this.getErrorMessage(error),
      details: this.getErrorDetails(error, context),
      affectedUsers: context.userId ? [context.userId] : [],
      circuitState: context.circuitState || 'CLOSED',
      metrics: this.getCurrentMetrics(context.service),
    };

    this.incidents.set(errorId, incident);
    this.updateServiceMetrics(context.service, error instanceof Error ? false : true);
    this.checkForAlerts(incident);

    // 保持最近10000条记录
    if (this.incidents.size > 10000) {
      const oldestKeys = Array.from(this.incidents.keys()).slice(0, 1000);
      oldestKeys.forEach(key => this.incidents.delete(key));
    }

    return errorId;
  }

  /**
   * 获取错误聚合仪表板数据
   */
  getDashboard(): ErrorDashboard {
    const incidents = Array.from(this.incidents.values());
    const alerts = Array.from(this.alerts.values()).filter(alert => !alert.resolved);
    
    // 计算汇总数据
    const operationalErrors = incidents.filter(i => isErrorOperational(i.details)).length;
    const systemErrors = incidents.length - operationalErrors;
    
    // 按服务分组
    const services = this.groupIncidentsByService(incidents);
    
    // 计算健康分数 (0-100)
    const healthScore = this.calculateHealthScore(services);
    
    // 计算趋势
    const trends = this.calculateTrends();

    return {
      summary: {
        totalErrors: incidents.length,
        operationalErrors,
        systemErrors,
        alertCount: alerts.length,
        healthScore,
      },
      services,
      alerts,
      trends,
    };
  }

  /**
   * 获取服务健康状态
   */
  getServiceHealth(serviceName: string): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    errorRate: number;
    avgResponseTime: number;
    circuitState: string;
    recentErrors: Array<{
      timestamp: Date;
      message: string;
      severity: string;
    }>;
  } {
    const serviceMetrics = this.serviceMetrics.get(serviceName);
    if (!serviceMetrics) {
      return {
        status: 'healthy',
        errorRate: 0,
        avgResponseTime: 0,
        circuitState: 'CLOSED',
        recentErrors: [],
      };
    }

    const errorRate = serviceMetrics.errorCount / serviceMetrics.totalRequests;
    const avgResponseTime = serviceMetrics.responseTimes.length > 0 
      ? serviceMetrics.responseTimes.reduce((a, b) => a + b, 0) / serviceMetrics.responseTimes.length 
      : 0;

    const status = this.calculateServiceStatus(errorRate, avgResponseTime, serviceMetrics.circuitBreaker.getState());
    const recentErrors = Array.from(this.incidents.values())
      .filter(incident => incident.service === serviceName)
      .slice(-10)
      .map(incident => ({
        timestamp: incident.timestamp,
        message: incident.message,
        severity: incident.severity,
      }));

    return {
      status,
      errorRate,
      avgResponseTime,
      circuitState: serviceMetrics.circuitBreaker.getState(),
      recentErrors,
    };
  }

  /**
   * 解决告警
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
      this.alerts.set(alertId, alert);
    }
  }

  /**
   * 清理旧数据
   */
  cleanupOldData(olderThanMs: number = 7 * 24 * 60 * 60 * 1000): void {
    const cutoff = Date.now() - olderThanMs;
    
    // 清理旧错误记录
    for (const [id, incident] of this.incidents) {
      if (incident.timestamp.getTime() < cutoff) {
        this.incidents.delete(id);
      }
    }

    // 清理已解决的旧告警
    for (const [id, alert] of this.alerts) {
      if (alert.resolved && alert.resolvedAt && alert.resolvedAt.getTime() < cutoff) {
        this.alerts.delete(id);
      }
    }
  }

  // 私有方法

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private identifyService(path: string): string {
    if (path.includes('/api/ai') || path.includes('/workflow')) return 'ai-engine';
    if (path.includes('/api/database') || path.includes('/db')) return 'database';
    if (path.includes('/api/auth') || path.includes('/login')) return 'auth';
    if (path.includes('/api/queue') || path.includes('/request')) return 'request-queue';
    return 'unknown';
  }

  private getErrorType(error: unknown): string {
    if (error instanceof AppError) return error.constructor.name;
    if (error instanceof Error) return error.name;
    return 'UnknownError';
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    return String(error);
  }

  private getErrorDetails(error: unknown, context: any): Record<string, unknown> {
    const details: Record<string, unknown> = {
      context: {
        path: context.path,
        method: context.method,
        ip: context.ip,
        userAgent: context.userAgent,
      },
    };

    if (context.userId) details.userId = context.userId;
    if (context.sessionId) details.sessionId = context.sessionId;
    if (context.requestId) details.requestId = context.requestId;

    if (error instanceof AppError) {
      details.appError = {
        statusCode: error.statusCode,
        errorCode: error.errorCode,
        isOperational: error.isOperational,
        originalDetails: error.details,
      };
    }

    return details;
  }

  private getCurrentMetrics(service?: string): {
    responseTime: number;
    errorRate: number;
    throughput: number;
  } {
    const serviceMetrics = service ? this.serviceMetrics.get(service) : null;
    
    return {
      responseTime: serviceMetrics && serviceMetrics.responseTimes.length > 0
        ? serviceMetrics.responseTimes[serviceMetrics.responseTimes.length - 1]
        : 0,
      errorRate: serviceMetrics && serviceMetrics.totalRequests > 0
        ? serviceMetrics.errorCount / serviceMetrics.totalRequests
        : 0,
      throughput: serviceMetrics ? serviceMetrics.totalRequests / 60 : 0, // 每分钟请求数
    };
  }

  private updateServiceMetrics(service: string | undefined, isError: boolean): void {
    if (!service) return;

    if (!this.serviceMetrics.has(service)) {
      this.serviceMetrics.set(service, {
        totalRequests: 0,
        errorCount: 0,
        responseTimes: [],
        circuitBreaker: new CircuitBreaker(),
      });
    }

    const metrics = this.serviceMetrics.get(service)!;
    metrics.totalRequests++;
    if (isError) metrics.errorCount++;
    
    // 模拟响应时间 (实际应该从真实请求中获取)
    const responseTime = Math.random() * 1000 + 100; // 100-1100ms
    metrics.responseTimes.push(responseTime);
    
    // 保持最近1000个响应时间
    if (metrics.responseTimes.length > 1000) {
      metrics.responseTimes = metrics.responseTimes.slice(-1000);
    }
  }

  private checkForAlerts(incident: ErrorIncident): void {
    const alerts: ErrorAlert[] = [];

    // 错误率告警
    const serviceMetrics = this.serviceMetrics.get(incident.service);
    if (serviceMetrics) {
      const errorRate = serviceMetrics.errorCount / serviceMetrics.totalRequests;
      if (errorRate > this.alertThresholds.errorRate) {
        alerts.push({
          id: `error_rate_${Date.now()}`,
          type: 'error_spike',
          severity: errorRate > 0.2 ? 'critical' : 'warning',
          service: incident.service,
          message: `${incident.service} 错误率过高: ${(errorRate * 100).toFixed(2)}%`,
          timestamp: new Date(),
          metrics: { errorRate: errorRate * 100 },
          resolved: false,
        });
      }
    }

    // 熔断器告警
    if (incident.circuitState === 'OPEN') {
      alerts.push({
        id: `circuit_breaker_${Date.now()}`,
        type: 'circuit_breaker',
        severity: 'critical',
        service: incident.service,
        message: `${incident.service} 已熔断，拒绝所有请求`,
        timestamp: new Date(),
        metrics: {},
        resolved: false,
      });
    }

    // 高严重性错误告警
    if (incident.severity === 'critical') {
      alerts.push({
        id: `critical_error_${Date.now()}`,
        type: 'service_down',
        severity: 'critical',
        service: incident.service,
        message: `检测到严重错误: ${incident.message}`,
        timestamp: new Date(),
        metrics: {},
        resolved: false,
      });
    }

    // 添加告警到系统
    alerts.forEach(alert => {
      this.alerts.set(alert.id, alert);
    });
  }

  private groupIncidentsByService(incidents: ErrorIncident[]): ErrorDashboard['services'] {
    const services: ErrorDashboard['services'] = {};
    
    const serviceNames = [...new Set(incidents.map(i => i.service))];
    
    serviceNames.forEach(serviceName => {
      const serviceIncidents = incidents.filter(i => i.service === serviceName);
      const serviceMetrics = this.serviceMetrics.get(serviceName);
      
      const errorRate = serviceMetrics && serviceMetrics.totalRequests > 0
        ? serviceMetrics.errorCount / serviceMetrics.totalRequests
        : 0;
      
      const avgResponseTime = serviceMetrics && serviceMetrics.responseTimes.length > 0
        ? serviceMetrics.responseTimes.reduce((a, b) => a + b, 0) / serviceMetrics.responseTimes.length
        : 0;
      
      services[serviceName] = {
        status: this.calculateServiceStatus(errorRate, avgResponseTime, 
          serviceMetrics?.circuitBreaker.getState() || 'CLOSED'),
        errorRate,
        avgResponseTime,
        circuitState: serviceMetrics?.circuitBreaker.getState() || 'CLOSED',
        recentErrors: serviceIncidents.slice(-5).map(incident => ({
          timestamp: incident.timestamp,
          message: incident.message,
          severity: incident.severity,
        })),
      };
    });
    
    return services;
  }

  private calculateServiceStatus(errorRate: number, avgResponseTime: number, circuitState: string): 'healthy' | 'degraded' | 'unhealthy' {
    if (circuitState === 'OPEN') return 'unhealthy';
    if (errorRate > 0.2 || avgResponseTime > 5000) return 'unhealthy';
    if (errorRate > 0.1 || avgResponseTime > 2000) return 'degraded';
    return 'healthy';
  }

  private calculateHealthScore(services: ErrorDashboard['services']): number {
    const serviceCount = Object.keys(services).length;
    if (serviceCount === 0) return 100;
    
    const healthyServices = Object.values(services).filter(s => s.status === 'healthy').length;
    const degradedServices = Object.values(services).filter(s => s.status === 'degraded').length;
    
    // 健康分数计算：健康服务100分，降级服务60分，不健康服务0分
    return Math.round((healthyServices * 100 + degradedServices * 60) / serviceCount);
  }

  private calculateTrends(): ErrorDashboard['trends'] {
    const now = Date.now();
    const incidents = Array.from(this.incidents.values());
    
    const last24h = incidents.filter(i => now - i.timestamp.getTime() < 24 * 60 * 60 * 1000).length;
    const last7d = incidents.filter(i => now - i.timestamp.getTime() < 7 * 24 * 60 * 60 * 1000).length;
    const last30d = incidents.filter(i => now - i.timestamp.getTime() < 30 * 24 * 60 * 60 * 1000).length;
    
    // 计算变化百分比 (与之前同期比较)
    const previous24h = incidents.filter(i => 
      now - i.timestamp.getTime() >= 24 * 60 * 60 * 1000 && 
      now - i.timestamp.getTime() < 48 * 60 * 60 * 1000
    ).length;
    
    const change24h = previous24h > 0 ? ((last24h - previous24h) / previous24h) * 100 : 0;
    
    return {
      last24h,
      last7d,
      last30d,
      change24h: Math.round(change24h),
      change7d: 0, // 简化实现，实际应该计算7天变化
    };
  }

  private startPeriodicCheck(): void {
    // 每分钟清理一次旧数据
    setInterval(() => {
      this.cleanupOldData();
    }, 60 * 1000);
    
    // 每分钟检查系统健康状态
    setInterval(() => {
      this.performHealthCheck();
    }, 60 * 1000);
  }

  private performHealthCheck(): void {
    // 这里可以添加更复杂的健康检查逻辑
    // 比如检查关键服务的响应时间、错误率等
    console.log('系统健康检查执行');
  }
}

// 导出单例实例
export const errorAggregator = new ErrorAggregator();