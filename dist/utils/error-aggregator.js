"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorAggregator = exports.ErrorAggregator = void 0;
const errors_js_1 = require("./errors.js");
const circuit_breaker_js_1 = require("../services/circuit-breaker.js");
class ErrorAggregator {
    constructor() {
        this.incidents = new Map();
        this.alerts = new Map();
        this.serviceMetrics = new Map();
        this.alertThresholds = {
            errorRate: 0.1,
            responseTime: 5000,
            errorSpike: 50,
        };
        this.startPeriodicCheck();
    }
    recordError(error, context, severity = 'medium') {
        const errorId = this.generateErrorId();
        const incident = {
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
        if (this.incidents.size > 10000) {
            const oldestKeys = Array.from(this.incidents.keys()).slice(0, 1000);
            oldestKeys.forEach(key => this.incidents.delete(key));
        }
        return errorId;
    }
    getDashboard() {
        const incidents = Array.from(this.incidents.values());
        const alerts = Array.from(this.alerts.values()).filter(alert => !alert.resolved);
        const operationalErrors = incidents.filter(i => (0, errors_js_1.isErrorOperational)(i.details)).length;
        const systemErrors = incidents.length - operationalErrors;
        const services = this.groupIncidentsByService(incidents);
        const healthScore = this.calculateHealthScore(services);
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
    getServiceHealth(serviceName) {
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
    resolveAlert(alertId) {
        const alert = this.alerts.get(alertId);
        if (alert) {
            alert.resolved = true;
            alert.resolvedAt = new Date();
            this.alerts.set(alertId, alert);
        }
    }
    cleanupOldData(olderThanMs = 7 * 24 * 60 * 60 * 1000) {
        const cutoff = Date.now() - olderThanMs;
        for (const [id, incident] of this.incidents) {
            if (incident.timestamp.getTime() < cutoff) {
                this.incidents.delete(id);
            }
        }
        for (const [id, alert] of this.alerts) {
            if (alert.resolved && alert.resolvedAt && alert.resolvedAt.getTime() < cutoff) {
                this.alerts.delete(id);
            }
        }
    }
    generateErrorId() {
        return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    identifyService(path) {
        if (path.includes('/api/ai') || path.includes('/workflow'))
            return 'ai-engine';
        if (path.includes('/api/database') || path.includes('/db'))
            return 'database';
        if (path.includes('/api/auth') || path.includes('/login'))
            return 'auth';
        if (path.includes('/api/queue') || path.includes('/request'))
            return 'request-queue';
        return 'unknown';
    }
    getErrorType(error) {
        if (error instanceof errors_js_1.AppError)
            return error.constructor.name;
        if (error instanceof Error)
            return error.name;
        return 'UnknownError';
    }
    getErrorMessage(error) {
        if (error instanceof Error)
            return error.message;
        return String(error);
    }
    getErrorDetails(error, context) {
        const details = {
            context: {
                path: context.path,
                method: context.method,
                ip: context.ip,
                userAgent: context.userAgent,
            },
        };
        if (context.userId)
            details.userId = context.userId;
        if (context.sessionId)
            details.sessionId = context.sessionId;
        if (context.requestId)
            details.requestId = context.requestId;
        if (error instanceof errors_js_1.AppError) {
            details.appError = {
                statusCode: error.statusCode,
                errorCode: error.errorCode,
                isOperational: error.isOperational,
                originalDetails: error.details,
            };
        }
        return details;
    }
    getCurrentMetrics(service) {
        const serviceMetrics = service ? this.serviceMetrics.get(service) : null;
        return {
            responseTime: serviceMetrics && serviceMetrics.responseTimes.length > 0
                ? serviceMetrics.responseTimes[serviceMetrics.responseTimes.length - 1]
                : 0,
            errorRate: serviceMetrics && serviceMetrics.totalRequests > 0
                ? serviceMetrics.errorCount / serviceMetrics.totalRequests
                : 0,
            throughput: serviceMetrics ? serviceMetrics.totalRequests / 60 : 0,
        };
    }
    updateServiceMetrics(service, isError) {
        if (!service)
            return;
        if (!this.serviceMetrics.has(service)) {
            this.serviceMetrics.set(service, {
                totalRequests: 0,
                errorCount: 0,
                responseTimes: [],
                circuitBreaker: new circuit_breaker_js_1.CircuitBreaker(),
            });
        }
        const metrics = this.serviceMetrics.get(service);
        metrics.totalRequests++;
        if (isError)
            metrics.errorCount++;
        const responseTime = Math.random() * 1000 + 100;
        metrics.responseTimes.push(responseTime);
        if (metrics.responseTimes.length > 1000) {
            metrics.responseTimes = metrics.responseTimes.slice(-1000);
        }
    }
    checkForAlerts(incident) {
        const alerts = [];
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
        alerts.forEach(alert => {
            this.alerts.set(alert.id, alert);
        });
    }
    groupIncidentsByService(incidents) {
        const services = {};
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
                status: this.calculateServiceStatus(errorRate, avgResponseTime, serviceMetrics?.circuitBreaker.getState() || 'CLOSED'),
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
    calculateServiceStatus(errorRate, avgResponseTime, circuitState) {
        if (circuitState === 'OPEN')
            return 'unhealthy';
        if (errorRate > 0.2 || avgResponseTime > 5000)
            return 'unhealthy';
        if (errorRate > 0.1 || avgResponseTime > 2000)
            return 'degraded';
        return 'healthy';
    }
    calculateHealthScore(services) {
        const serviceCount = Object.keys(services).length;
        if (serviceCount === 0)
            return 100;
        const healthyServices = Object.values(services).filter(s => s.status === 'healthy').length;
        const degradedServices = Object.values(services).filter(s => s.status === 'degraded').length;
        return Math.round((healthyServices * 100 + degradedServices * 60) / serviceCount);
    }
    calculateTrends() {
        const now = Date.now();
        const incidents = Array.from(this.incidents.values());
        const last24h = incidents.filter(i => now - i.timestamp.getTime() < 24 * 60 * 60 * 1000).length;
        const last7d = incidents.filter(i => now - i.timestamp.getTime() < 7 * 24 * 60 * 60 * 1000).length;
        const last30d = incidents.filter(i => now - i.timestamp.getTime() < 30 * 24 * 60 * 60 * 1000).length;
        const previous24h = incidents.filter(i => now - i.timestamp.getTime() >= 24 * 60 * 60 * 1000 &&
            now - i.timestamp.getTime() < 48 * 60 * 60 * 1000).length;
        const change24h = previous24h > 0 ? ((last24h - previous24h) / previous24h) * 100 : 0;
        return {
            last24h,
            last7d,
            last30d,
            change24h: Math.round(change24h),
            change7d: 0,
        };
    }
    startPeriodicCheck() {
        setInterval(() => {
            this.cleanupOldData();
        }, 60 * 1000);
        setInterval(() => {
            this.performHealthCheck();
        }, 60 * 1000);
    }
    performHealthCheck() {
        console.log('系统健康检查执行');
    }
}
exports.ErrorAggregator = ErrorAggregator;
exports.errorAggregator = new ErrorAggregator();
//# sourceMappingURL=error-aggregator.js.map