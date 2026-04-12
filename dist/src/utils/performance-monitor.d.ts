export interface PerformanceMetrics {
    endpoint: string;
    method: string;
    responseTime: number;
    timestamp: string;
    success: boolean;
    userAgent?: string;
}
export interface PerformanceStats {
    totalRequests: number;
    averageResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
    successRate: number;
    slowEndpoints: Array<{
        endpoint: string;
        averageTime: number;
        count: number;
    }>;
}
declare class PerformanceMonitor {
    private metrics;
    private maxMetrics;
    recordMetric(metric: PerformanceMetrics): void;
    getStats(): PerformanceStats;
    clear(): void;
    getRecentMetrics(limit?: number): PerformanceMetrics[];
    getEndpointStats(endpoint: string): {
        totalRequests: number;
        averageResponseTime: number;
        successRate: number;
    };
}
export declare const performanceMonitor: PerformanceMonitor;
export declare const performanceMiddleware: (req: any, res: any, next: any) => void;
export declare const getPerformanceStats: (req: any, res: any) => void;
export declare const getEndpointPerformance: (req: any, res: any) => void;
export declare const getRecentPerformance: (req: any, res: any) => void;
export declare const clearPerformanceData: (req: any, res: any) => void;
export {};
//# sourceMappingURL=performance-monitor.d.ts.map