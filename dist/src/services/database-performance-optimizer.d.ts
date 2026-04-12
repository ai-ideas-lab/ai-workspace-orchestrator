export interface QueryPerformance {
    id: string;
    query: string;
    executionTime: number;
    timestamp: Date;
    slow: boolean;
    errorMessage?: string;
    parameters?: any[];
}
export interface DatabasePerformanceMetrics {
    averageQueryTime: number;
    slowQueryCount: number;
    totalQueries: number;
    databaseConnections: number;
    cacheHitRate?: number;
    lastSlowQuery?: Date;
    performanceScore: number;
    recommendations: string[];
}
export interface QueryOptimizationRule {
    name: string;
    description: string;
    check: (query: string, executionTime: number) => boolean;
    recommendation: string;
}
export declare class DatabasePerformanceOptimizer {
    private static instance;
    private prisma;
    private queryHistory;
    private maxHistorySize;
    private isOptimizationEnabled;
    private optimizationRules;
    private performanceMetrics;
    constructor();
    static getInstance(): DatabasePerformanceOptimizer;
    private initializeOptimizationRules;
    recordQueryPerformance(query: string, executionTime: number, parameters?: any[], errorMessage?: string): Promise<void>;
    executeQuery<T>(query: string, parameters?: any[], options?: {
        timeout?: number;
        retry?: boolean;
    }): Promise<T>;
    private executeQueryInternal;
    private analyzeQueryOptimization;
    private updatePerformanceMetrics;
    getPerformanceMetrics(): DatabasePerformanceMetrics;
    getQueryHistory(limit?: number): QueryPerformance[];
    getSlowQueries(limit?: number): QueryPerformance[];
    generateOptimizationReport(): {
        summary: string;
        metrics: DatabasePerformanceMetrics;
        slowQueries: QueryPerformance[];
        recommendations: string[];
        priority: 'low' | 'medium' | 'high';
    };
    private generateAutomaticRecommendations;
    private generateSummary;
    clearQueryHistory(): void;
    setOptimizationEnabled(enabled: boolean): void;
    private generateQueryId;
    private simpleHash;
    private sanitizeQuery;
    private sanitizeParameters;
    private getDatabaseConnectionCount;
    private loadPerformanceMetrics;
}
export declare function analyzeDatabasePerformance(): Promise<DatabasePerformanceMetrics>;
export declare function generateDatabaseOptimizationReport(): {
    summary: string;
    metrics: DatabasePerformanceMetrics;
    slowQueries: QueryPerformance[];
    recommendations: string[];
    priority: "low" | "medium" | "high";
};
export declare function executeMonitoredQuery<T>(query: string, parameters?: any[], options?: {
    timeout?: number;
    retry?: boolean;
}): Promise<T>;
//# sourceMappingURL=database-performance-optimizer.d.ts.map