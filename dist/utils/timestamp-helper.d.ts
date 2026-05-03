export declare function generateRequestId(): string;
export declare function measureExecutionTime<T>(callback: () => Promise<T> | T): Promise<{
    result: T;
    duration: number;
    timestamp: number;
}>;
export declare function compareTimestamps(timestamp1: number | null | undefined, timestamp2: number | null | undefined): number;
export declare function isTimestampExpired(timestamp: number | null | undefined, expirationMs: number): boolean;
export declare function getFormattedTimestamp(): string;
export declare function createTimeRange(startMs: number, endMs?: number): {
    start: number;
    end: number;
    duration: number;
};
//# sourceMappingURL=timestamp-helper.d.ts.map