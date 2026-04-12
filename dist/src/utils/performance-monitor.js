class PerformanceMonitor {
    metrics = [];
    maxMetrics = 1000;
    recordMetric(metric) {
        this.metrics.push(metric);
        if (this.metrics.length > this.maxMetrics) {
            this.metrics = this.metrics.slice(-this.maxMetrics);
        }
    }
    getStats() {
        if (this.metrics.length === 0) {
            return {
                totalRequests: 0,
                averageResponseTime: 0,
                minResponseTime: 0,
                maxResponseTime: 0,
                successRate: 0,
                slowEndpoints: []
            };
        }
        const successfulMetrics = this.metrics.filter(m => m.success);
        const successRate = (successfulMetrics.length / this.metrics.length) * 100;
        const responseTimes = this.metrics.map(m => m.responseTime);
        const averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
        const minResponseTime = Math.min(...responseTimes);
        const maxResponseTime = Math.max(...responseTimes);
        const avgTime = averageResponseTime;
        const endpointStats = new Map();
        this.metrics.forEach(metric => {
            if (metric.responseTime > avgTime * 1.5) {
                const current = endpointStats.get(metric.endpoint) || { totalTime: 0, count: 0 };
                endpointStats.set(metric.endpoint, {
                    totalTime: current.totalTime + metric.responseTime,
                    count: current.count + 1
                });
            }
        });
        const slowEndpoints = Array.from(endpointStats.entries())
            .map(([endpoint, stats]) => ({
            endpoint,
            averageTime: stats.totalTime / stats.count,
            count: stats.count
        }))
            .sort((a, b) => b.averageTime - a.averageTime)
            .slice(0, 10);
        return {
            totalRequests: this.metrics.length,
            averageResponseTime: Math.round(averageResponseTime * 100) / 100,
            minResponseTime,
            maxResponseTime,
            successRate: Math.round(successRate * 100) / 100,
            slowEndpoints
        };
    }
    clear() {
        this.metrics = [];
    }
    getRecentMetrics(limit = 50) {
        return this.metrics.slice(-limit);
    }
    getEndpointStats(endpoint) {
        const endpointMetrics = this.metrics.filter(m => m.endpoint === endpoint);
        if (endpointMetrics.length === 0) {
            return {
                totalRequests: 0,
                averageResponseTime: 0,
                successRate: 0
            };
        }
        const successfulMetrics = endpointMetrics.filter(m => m.success);
        const successRate = (successfulMetrics.length / endpointMetrics.length) * 100;
        const averageResponseTime = endpointMetrics.reduce((sum, m) => sum + m.responseTime, 0) / endpointMetrics.length;
        return {
            totalRequests: endpointMetrics.length,
            averageResponseTime: Math.round(averageResponseTime * 100) / 100,
            successRate: Math.round(successRate * 100) / 100
        };
    }
}
export const performanceMonitor = new PerformanceMonitor();
export const performanceMiddleware = (req, res, next) => {
    const startTime = Date.now();
    res.on('finish', () => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        const metric = {
            endpoint: req.path,
            method: req.method,
            responseTime,
            timestamp: new Date().toISOString(),
            success: res.statusCode < 400,
            userAgent: req.headers['user-agent']
        };
        performanceMonitor.recordMetric(metric);
    });
    next();
};
export const getPerformanceStats = (req, res) => {
    try {
        const stats = performanceMonitor.getStats();
        res.json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: '获取性能统计失败',
            message: error instanceof Error ? error.message : '未知错误'
        });
    }
};
export const getEndpointPerformance = (req, res) => {
    try {
        const endpoint = req.params.endpoint;
        const stats = performanceMonitor.getEndpointStats(endpoint);
        res.json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: '获取端点性能统计失败',
            message: error instanceof Error ? error.message : '未知错误'
        });
    }
};
export const getRecentPerformance = (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const metrics = performanceMonitor.getRecentMetrics(limit);
        res.json({
            success: true,
            data: metrics,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: '获取最近性能指标失败',
            message: error instanceof Error ? error.message : '未知错误'
        });
    }
};
export const clearPerformanceData = (req, res) => {
    try {
        performanceMonitor.clear();
        res.json({
            success: true,
            message: '性能数据已清空',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: '清空性能数据失败',
            message: error instanceof Error ? error.message : '未知错误'
        });
    }
};
//# sourceMappingURL=performance-monitor.js.map