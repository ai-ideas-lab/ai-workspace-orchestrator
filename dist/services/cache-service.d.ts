export declare class CacheService {
    private redisUrl;
    private defaultTTL;
    private redisClient;
    private memoryCache;
    private isRedisConnected;
    constructor(redisUrl?: string, defaultTTL?: number);
    private initializeRedis;
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T, ttl?: number): Promise<void>;
    del(key: string): Promise<void>;
    mget<T>(keys: string[]): Promise<(T | null)[]>;
    mset<T>(entries: Array<{
        key: string;
        value: T;
        ttl?: number;
    }>): Promise<void>;
    exists(key: string): Promise<boolean>;
    expire(key: string, ttl: number): Promise<void>;
    cleanup(): void;
    getMemoryStats(): {
        totalKeys: number;
        memoryUsage: number;
    };
    private getFromMemory;
    private setInMemory;
    disconnect(): Promise<void>;
}
export declare const cacheService: CacheService;
//# sourceMappingURL=cache-service.d.ts.map