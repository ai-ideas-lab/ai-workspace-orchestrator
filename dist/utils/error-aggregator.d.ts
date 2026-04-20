export interface ErrorAggregationConfig {
    windowSizeMs: number;
    similarityThreshold: number;
    maxAggregatedErrors: number;
    alertThreshold: number;
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
export declare class ErrorAggregator {
    private static instance;
    private config;
    private errorWindows;
    private aggregatedErrors;
    private stats;
    private constructor();
    static getInstance(config?: Partial<ErrorAggregationConfig>): ErrorAggregator;
    recordError(error: Error, context?: Record<string, unknown>, severity?: AggregatedError['severity']): string;
    getStats(): ErrorStats;
    getAggregatedErrors(): AggregatedError[];
    getAggregatedError(errorId: string): AggregatedError | undefined;
    private cleanupOldErrors;
    private updateStats;
    private aggregateError;
    private findSimilarErrors;
    private calculateErrorSimilarity;
    private calculateStackSimilarity;
    private checkForAlerts;
    private generateErrorId;
    private simpleHash;
    private getErrorCode;
}
export declare function createErrorAggregatorMiddleware(config?: Partial<ErrorAggregationConfig>): (error: Error, req: any, res: any, next: any) => void;
export { ErrorAggregator as default };
//# sourceMappingURL=error-aggregator.d.ts.map