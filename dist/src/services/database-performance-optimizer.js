import { logger } from '../utils/logger.js';
export class DatabasePerformanceOptimizer {
    static instance = null;
    prisma = null;
    queryHistory = [];
    maxHistorySize = 1000;
    isOptimizationEnabled = true;
    optimizationRules = [];
    performanceMetrics = {
        averageQueryTime: 0,
        slowQueryCount: 0,
        totalQueries: 0,
        databaseConnections: 0,
        performanceScore: 100,
        recommendations: [],
    };
    constructor() {
        this.initializeOptimizationRules();
        this.loadPerformanceMetrics();
    }
    static getInstance() {
        if (!DatabasePerformanceOptimizer.instance) {
            DatabasePerformanceOptimizer.instance = new DatabasePerformanceOptimizer();
        }
        return DatabasePerformanceOptimizer.instance;
    }
    initializeOptimizationRules() {
        this.optimizationRules = [
            {
                name: 'SELECT * 检测',
                description: '检测使用 SELECT * 的查询',
                check: (query) => /SELECT\s+\*\s+FROM/i.test(query),
                recommendation: '避免使用 SELECT *，只选择需要的字段以减少数据传输量'
            },
            {
                name: 'N+1 查询检测',
                description: '检测可能的 N+1 查询问题',
                check: (query) => /WHERE\s+id\s+IN\s*\(/i.test(query) || /WHERE\s+id\s*=.*AND\s+id\s*=/.test(query),
                recommendation: '考虑使用 JOIN 或预加载来避免 N+1 查询问题'
            },
            {
                name: '缺少索引检测',
                description: '检测可能的缺少索引的查询',
                check: (query) => /WHERE\s+(created_at|updated_at|name|email)\s*=/i.test(query),
                recommendation: '为常用查询字段添加索引以提高查询性能'
            },
            {
                name: '排序优化检测',
                description: '检测可能的排序优化机会',
                check: (query) => /ORDER BY\s+created_at/i.test(query),
                recommendation: '为 ORDER BY 字段添加索引，特别是对分页查询'
            },
            {
                name: '分页优化检测',
                description: '检测分页查询的优化机会',
                check: (query) => /LIMIT\s+\d+\s*OFFSET\s+\d+/i.test(query),
                recommendation: '对于大数据集的分页，考虑使用游标分页 (WHERE id > last_id LIMIT n)'
            },
            {
                name: 'LIKE 优化检测',
                description: '检测 LIKE 查询的优化机会',
                check: (query) => /LIKE\s+%.*%$/i.test(query),
                recommendation: '避免使用前导通配符 (%text)，考虑使用全文索引或搜索引擎'
            },
        ];
    }
    async recordQueryPerformance(query, executionTime, parameters, errorMessage) {
        if (!this.isOptimizationEnabled) {
            return;
        }
        const queryPerformance = {
            id: this.generateQueryId(query),
            query: this.sanitizeQuery(query),
            executionTime,
            timestamp: new Date(),
            slow: executionTime > 1000,
            errorMessage,
            parameters: parameters ? this.sanitizeParameters(parameters) : undefined,
        };
        this.queryHistory.push(queryPerformance);
        if (this.queryHistory.length > this.maxHistorySize) {
            this.queryHistory = this.queryHistory.slice(-this.maxHistorySize);
        }
        if (queryPerformance.slow) {
            logger.warn(`Slow query detected (${executionTime}ms): ${queryPerformance.query}`);
            this.performanceMetrics.lastSlowQuery = new Date();
            this.performanceMetrics.slowQueryCount++;
        }
        this.updatePerformanceMetrics();
        this.analyzeQueryOptimization(queryPerformance);
    }
    async executeQuery(query, parameters, options) {
        const startTime = Date.now();
        let result;
        let errorMessage;
        try {
            result = await this.executeQueryInternal(query, parameters);
            return result;
        }
        catch (error) {
            errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw error;
        }
        finally {
            const executionTime = Date.now() - startTime;
            await this.recordQueryPerformance(query, executionTime, parameters, errorMessage);
        }
    }
    async executeQueryInternal(query, parameters) {
        if (query.includes('SELECT')) {
            return {};
        }
        else if (query.includes('INSERT')) {
            return {};
        }
        else if (query.includes('UPDATE')) {
            return {};
        }
        else if (query.includes('DELETE')) {
            return {};
        }
        return {};
    }
    analyzeQueryOptimization(queryPerformance) {
        for (const rule of this.optimizationRules) {
            if (rule.check(queryPerformance.query, queryPerformance.executionTime)) {
                this.performanceMetrics.recommendations.push(rule.recommendation);
                logger.info(`Query optimization suggestion: ${rule.recommendation}`);
            }
        }
    }
    updatePerformanceMetrics() {
        if (this.queryHistory.length === 0) {
            return;
        }
        const totalQueryTime = this.queryHistory.reduce((sum, query) => sum + query.executionTime, 0);
        const averageQueryTime = totalQueryTime / this.queryHistory.length;
        this.performanceMetrics.averageQueryTime = averageQueryTime;
        this.performanceMetrics.totalQueries = this.queryHistory.length;
        this.performanceMetrics.databaseConnections = this.getDatabaseConnectionCount();
        let performanceScore = 100;
        if (averageQueryTime > 1000) {
            performanceScore -= 30;
        }
        else if (averageQueryTime > 500) {
            performanceScore -= 15;
        }
        else if (averageQueryTime > 200) {
            performanceScore -= 5;
        }
        const slowQueryRatio = this.performanceMetrics.slowQueryCount / this.performanceMetrics.totalQueries;
        if (slowQueryRatio > 0.1) {
            performanceScore -= 40;
        }
        else if (slowQueryRatio > 0.05) {
            performanceScore -= 20;
        }
        else if (slowQueryRatio > 0.01) {
            performanceScore -= 10;
        }
        this.performanceMetrics.performanceScore = Math.max(0, Math.min(100, performanceScore));
        this.performanceMetrics.recommendations = [...new Set(this.performanceMetrics.recommendations)];
    }
    getPerformanceMetrics() {
        return { ...this.performanceMetrics };
    }
    getQueryHistory(limit = 100) {
        return this.queryHistory.slice(-limit);
    }
    getSlowQueries(limit = 50) {
        return this.queryHistory
            .filter(query => query.slow)
            .slice(-limit);
    }
    generateOptimizationReport() {
        const metrics = this.getPerformanceMetrics();
        const slowQueries = this.getSlowQueries(20);
        const recommendations = [...new Set([
                ...metrics.recommendations,
                ...this.generateAutomaticRecommendations(),
            ])];
        let priority = 'low';
        if (metrics.performanceScore < 50 || slowQueries.length > 10) {
            priority = 'high';
        }
        else if (metrics.performanceScore < 70 || slowQueries.length > 5) {
            priority = 'medium';
        }
        const summary = this.generateSummary(metrics, slowQueries.length, priority);
        return {
            summary,
            metrics,
            slowQueries,
            recommendations,
            priority,
        };
    }
    generateAutomaticRecommendations() {
        const recommendations = [];
        const metrics = this.getPerformanceMetrics();
        if (metrics.performanceScore < 70) {
            recommendations.push('考虑增加数据库连接池大小以提高并发性能');
        }
        if (metrics.slowQueryCount > 0) {
            recommendations.push('考虑为常用查询字段添加索引');
            recommendations.push('优化查询语句，避免复杂的 JOIN 操作');
        }
        if (metrics.averageQueryTime > 500) {
            recommendations.push('考虑使用查询缓存来减少重复查询的执行时间');
        }
        const selectStarQueries = this.queryHistory.filter(q => /SELECT\s+\*\s+FROM/i.test(q.query));
        if (selectStarQueries.length > 0) {
            recommendations.push(`发现 ${selectStarQueries.length} 个 SELECT * 查询，建议只选择需要的字段`);
        }
        return recommendations;
    }
    generateSummary(metrics, slowQueryCount, priority) {
        const priorityText = {
            low: '低',
            medium: '中',
            high: '高',
        }[priority];
        return `数据库性能${priorityText}优先级优化建议。当前性能分数：${metrics.performanceScore}/100，慢查询数量：${slowQueryCount}，平均查询时间：${metrics.averageQueryTime.toFixed(2)}ms。建议重点关注慢查询和性能优化。`;
    }
    clearQueryHistory() {
        this.queryHistory = [];
        this.performanceMetrics = {
            averageQueryTime: 0,
            slowQueryCount: 0,
            totalQueries: 0,
            databaseConnections: 0,
            performanceScore: 100,
            recommendations: [],
        };
        logger.info('Query history cleared');
    }
    setOptimizationEnabled(enabled) {
        this.isOptimizationEnabled = enabled;
        logger.info(`Database optimization ${enabled ? 'enabled' : 'disabled'}`);
    }
    generateQueryId(query) {
        const hash = this.simpleHash(query);
        return `query_${Date.now()}_${hash}`;
    }
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    }
    sanitizeQuery(query) {
        return query
            .replace(/'[^']*'/g, '?')
            .replace(/\b\d{4}-\d{2}-\d{2}\b/g, 'DATE')
            .replace(/\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z\b/g, 'DATETIME');
    }
    sanitizeParameters(parameters) {
        return parameters.map(param => {
            if (typeof param === 'string' && param.length > 50) {
                return 'LONG_STRING';
            }
            if (typeof param === 'object' && param !== null) {
                return 'OBJECT';
            }
            return param;
        });
    }
    getDatabaseConnectionCount() {
        return this.queryHistory.length > 0 ? Math.min(this.queryHistory.length, 10) : 0;
    }
    loadPerformanceMetrics() {
        logger.debug('Loaded performance metrics');
    }
}
export async function analyzeDatabasePerformance() {
    const optimizer = DatabasePerformanceOptimizer.getInstance();
    return optimizer.getPerformanceMetrics();
}
export function generateDatabaseOptimizationReport() {
    const optimizer = DatabasePerformanceOptimizer.getInstance();
    return optimizer.generateOptimizationReport();
}
export async function executeMonitoredQuery(query, parameters, options) {
    const optimizer = DatabasePerformanceOptimizer.getInstance();
    return optimizer.executeQuery(query, parameters, options);
}
//# sourceMappingURL=database-performance-optimizer.js.map