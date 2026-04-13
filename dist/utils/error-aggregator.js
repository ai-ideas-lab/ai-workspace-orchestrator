"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = exports.ErrorAggregator = void 0;
exports.createErrorAggregatorMiddleware = createErrorAggregatorMiddleware;
const errors_js_1 = require("./errors.js");
const enhanced_error_logger_js_1 = require("./enhanced-error-logger.js");
class ErrorAggregator {
    constructor(config = {}) {
        this.errorWindows = new Map();
        this.aggregatedErrors = new Map();
        this.stats = {
            totalCount: 0,
            errorCountByType: new Map(),
            errorCountByCode: new Map(),
            errorRate: 0,
            lastErrorAt: new Date(),
        };
        this.config = {
            windowSizeMs: 5 * 60 * 1000,
            similarityThreshold: 0.8,
            maxAggregatedErrors: 100,
            alertThreshold: 10,
            ...config,
        };
        setInterval(() => this.cleanupOldErrors(), this.config.windowSizeMs);
    }
    static getInstance(config) {
        if (!ErrorAggregator.instance) {
            ErrorAggregator.instance = new ErrorAggregator(config);
        }
        return ErrorAggregator.instance;
    }
    recordError(error, context = {}, severity = 'medium') {
        const errorId = this.generateErrorId(error);
        const timestamp = new Date();
        this.updateStats(error, timestamp);
        if (!this.errorWindows.has(errorId)) {
            this.errorWindows.set(errorId, []);
        }
        this.errorWindows.get(errorId).push({
            error,
            timestamp,
            context,
        });
        this.aggregateError(errorId, error, context, timestamp, severity);
        this.checkForAlerts(errorId);
        return errorId;
    }
    getStats() {
        return { ...this.stats };
    }
    getAggregatedErrors() {
        return Array.from(this.aggregatedErrors.values())
            .sort((a, b) => b.occurrenceCount - a.occurrenceCount)
            .slice(0, this.config.maxAggregatedErrors);
    }
    getAggregatedError(errorId) {
        return this.aggregatedErrors.get(errorId);
    }
    cleanupOldErrors() {
        const now = new Date();
        const cutoffTime = new Date(now.getTime() - this.config.windowSizeMs);
        for (const [errorId, errors] of this.errorWindows.entries()) {
            const filteredErrors = errors.filter(e => e.timestamp > cutoffTime);
            if (filteredErrors.length === 0) {
                this.errorWindows.delete(errorId);
                this.aggregatedErrors.delete(errorId);
            }
            else {
                this.errorWindows.set(errorId, filteredErrors);
            }
        }
        enhanced_error_logger_js_1.logger.info(`错误聚合器清理完成，剩余错误类型: ${this.errorWindows.size}`);
    }
    updateStats(error, timestamp) {
        this.stats.totalCount++;
        this.stats.lastErrorAt = timestamp;
        const errorType = error.constructor.name;
        const typeCount = this.stats.errorCountByType.get(errorType) || 0;
        this.stats.errorCountByType.set(errorType, typeCount + 1);
        const errorCode = this.getErrorCode(error);
        const codeCount = this.stats.errorCountByCode.get(errorCode) || 0;
        this.stats.errorCountByCode.set(errorCode, codeCount + 1);
        this.stats.errorRate = this.stats.totalCount / Math.max(this.stats.totalCount, 1);
    }
    aggregateError(errorId, error, context, timestamp, severity) {
        const existingAggregated = this.aggregatedErrors.get(errorId);
        if (existingAggregated) {
            existingAggregated.lastOccurred = timestamp;
            existingAggregated.occurrenceCount++;
            existingAggregated.recentOccurrences.push({
                timestamp,
                context,
                stack: error.stack,
            });
            if (existingAggregated.recentOccurrences.length > 10) {
                existingAggregated.recentOccurrences = existingAggregated.recentOccurrences.slice(-10);
            }
        }
        else {
            const aggregatedError = {
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
        this.findSimilarErrors(errorId, error, context, timestamp);
    }
    findSimilarErrors(targetErrorId, targetError, targetContext, timestamp) {
        const targetAggregated = this.aggregatedErrors.get(targetErrorId);
        if (!targetAggregated)
            return;
        const targetWindow = this.errorWindows.get(targetErrorId) || [];
        for (const [otherErrorId, otherErrors] of this.errorWindows.entries()) {
            if (otherErrorId === targetErrorId)
                continue;
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
        if (targetAggregated.similarErrors.length > 5) {
            targetAggregated.similarErrors = targetAggregated.similarErrors
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, 5);
        }
    }
    calculateErrorSimilarity(error1, error2) {
        if (error1.constructor.name !== error2.constructor.name) {
            return 0;
        }
        const message1 = error1.message;
        const message2 = error2.message;
        const maxLength = Math.max(message1.length, message2.length);
        const minLength = Math.min(message1.length, message2.length);
        if (minLength === 0)
            return 0;
        let matchingChars = 0;
        for (let i = 0; i < minLength; i++) {
            if (message1[i] === message2[i]) {
                matchingChars++;
            }
        }
        const messageSimilarity = matchingChars / maxLength;
        const stackSimilarity = error1.stack && error2.stack
            ? this.calculateStackSimilarity(error1.stack, error2.stack)
            : 0;
        return (messageSimilarity * 0.7) + (stackSimilarity * 0.3);
    }
    calculateStackSimilarity(stack1, stack2) {
        const lines1 = stack1.split('\n').filter(line => line.trim());
        const lines2 = stack2.split('\n').filter(line => line.trim());
        const minLength = Math.min(lines1.length, lines2.length);
        let matchingLines = 0;
        for (let i = 0; i < minLength; i++) {
            const cleanLine1 = lines1[i].replace(/\/.*?:\d+/, '').trim();
            const cleanLine2 = lines2[i].replace(/\/.*?:\d+/, '').trim();
            if (cleanLine1 === cleanLine2) {
                matchingLines++;
            }
        }
        return matchingLines / Math.max(lines1.length, lines2.length);
    }
    checkForAlerts(errorId) {
        const aggregatedError = this.aggregatedErrors.get(errorId);
        if (!aggregatedError)
            return;
        if (aggregatedError.occurrenceCount >= this.config.alertThreshold) {
            enhanced_error_logger_js_1.logger.warn(`错误告警: ${aggregatedError.errorCode} 已发生 ${aggregatedError.occurrenceCount} 次`);
            if (this.config.alertCallback) {
                this.config.alertCallback(aggregatedError);
            }
        }
        if (aggregatedError.severity === 'critical') {
            enhanced_error_logger_js_1.logger.error(`严重错误告警: ${aggregatedError.errorId}`);
            if (this.config.alertCallback) {
                this.config.alertCallback(aggregatedError);
            }
        }
    }
    generateErrorId(error) {
        const type = error.constructor.name;
        const message = error.message;
        const stack = error.stack?.substring(0, 100) || '';
        const hash = this.simpleHash(`${type}:${message}:${stack}`);
        return `${type}_${hash}`;
    }
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }
    getErrorCode(error) {
        if (error instanceof errors_js_1.AppError) {
            return error.errorCode;
        }
        if (error instanceof errors_js_1.SystemError) {
            return 'SYSTEM_ERROR';
        }
        if (error instanceof errors_js_1.NetworkError) {
            return 'NETWORK_ERROR';
        }
        if (error instanceof errors_js_1.TimeoutError) {
            return 'TIMEOUT_ERROR';
        }
        const type = error.constructor.name;
        const match = error.message.match(/(\w+_ERROR|_ERROR|ERROR)/i);
        if (match) {
            return match[1].toUpperCase();
        }
        return `${type.toUpperCase()}_ERROR`;
    }
}
exports.ErrorAggregator = ErrorAggregator;
exports.default = ErrorAggregator;
function createErrorAggregatorMiddleware(config) {
    const aggregator = ErrorAggregator.getInstance(config);
    return (error, req, res, next) => {
        const context = {
            path: req.path,
            method: req.method,
            userAgent: req.get('User-Agent'),
            ip: req.ip,
            userId: req.user?.id,
            sessionId: req.session?.id,
            requestId: req.requestId,
        };
        let severity = 'medium';
        if (error instanceof errors_js_1.SystemError) {
            severity = 'high';
        }
        else if (error instanceof errors_js_1.NetworkError) {
            severity = 'medium';
        }
        else if (error.message.includes('critical') || error.message.includes('fatal')) {
            severity = 'critical';
        }
        const errorId = aggregator.recordError(error, context, severity);
        res.setHeader('X-Error-ID', errorId);
        next(error);
    };
}
//# sourceMappingURL=error-aggregator.js.map