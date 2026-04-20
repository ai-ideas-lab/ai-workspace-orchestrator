import { createClient } from 'redis';
export class CacheService {
    redisUrl;
    defaultTTL;
    redisClient = null;
    memoryCache = new Map();
    isRedisConnected = false;
    constructor(redisUrl = 'redis://localhost:6379', defaultTTL = 3600000) {
        this.redisUrl = redisUrl;
        this.defaultTTL = defaultTTL;
        this.initializeRedis();
    }
    async initializeRedis() {
        try {
            this.redisClient = createClient({
                url: this.redisUrl
            });
            this.redisClient.on('error', (err) => {
                console.error('[CacheService] Redis连接错误:', err);
                this.isRedisConnected = false;
            });
            this.redisClient.on('connect', () => {
                console.log('[CacheService] Redis连接成功');
                this.isRedisConnected = true;
            });
            await this.redisClient.connect();
        }
        catch (error) {
            console.error('[CacheService] Redis初始化失败，使用内存缓存:', error);
            this.isRedisConnected = false;
        }
    }
    async get(key) {
        const memoryData = this.getFromMemory(key);
        if (memoryData !== null) {
            return memoryData;
        }
        if (this.isRedisConnected && this.redisClient) {
            try {
                const data = await this.redisClient.get(key);
                if (data) {
                    const parsed = JSON.parse(data);
                    this.setInMemory(key, parsed);
                    return parsed;
                }
            }
            catch (error) {
                console.error('[CacheService] Redis获取失败:', error);
            }
        }
        return null;
    }
    async set(key, value, ttl) {
        const actualTTL = ttl || this.defaultTTL;
        this.setInMemory(key, value, actualTTL);
        if (this.isRedisConnected && this.redisClient) {
            try {
                await this.redisClient.setEx(key, Math.floor(actualTTL / 1000), JSON.stringify(value));
            }
            catch (error) {
                console.error('[CacheService] Redis设置失败:', error);
            }
        }
    }
    async del(key) {
        this.memoryCache.delete(key);
        if (this.isRedisConnected && this.redisClient) {
            try {
                await this.redisClient.del(key);
            }
            catch (error) {
                console.error('[CacheService] Redis删除失败:', error);
            }
        }
    }
    async mget(keys) {
        const results = [];
        for (const key of keys) {
            const value = await this.get(key);
            results.push(value);
        }
        return results;
    }
    async mset(entries) {
        for (const entry of entries) {
            await this.set(entry.key, entry.value, entry.ttl);
        }
    }
    async exists(key) {
        if (this.memoryCache.has(key)) {
            const data = this.memoryCache.get(key);
            if (data && data.expires > Date.now()) {
                return true;
            }
        }
        if (this.isRedisConnected && this.redisClient) {
            try {
                const exists = await this.redisClient.exists(key);
                return exists === 1;
            }
            catch (error) {
                console.error('[CacheService] Redis检查存在失败:', error);
            }
        }
        return false;
    }
    async expire(key, ttl) {
        const data = this.memoryCache.get(key);
        if (data) {
            data.expires = Date.now() + ttl;
        }
        if (this.isRedisConnected && this.redisClient) {
            try {
                await this.redisClient.expire(key, Math.floor(ttl / 1000));
            }
            catch (error) {
                console.error('[CacheService] Redis设置过期时间失败:', error);
            }
        }
    }
    cleanup() {
        const now = Date.now();
        const expiredKeys = [];
        for (const [key, data] of this.memoryCache.entries()) {
            if (data.expires <= now) {
                expiredKeys.push(key);
            }
        }
        expiredKeys.forEach(key => this.memoryCache.delete(key));
        console.log(`[CacheService] 清理了 ${expiredKeys.length} 个过期缓存`);
    }
    getMemoryStats() {
        const memoryUsage = JSON.stringify([...this.memoryCache.values()]).length;
        return {
            totalKeys: this.memoryCache.size,
            memoryUsage
        };
    }
    getFromMemory(key) {
        const data = this.memoryCache.get(key);
        if (data && data.expires > Date.now()) {
            return data.data;
        }
        return null;
    }
    setInMemory(key, value, ttl = this.defaultTTL) {
        this.memoryCache.set(key, {
            data: value,
            expires: Date.now() + ttl
        });
    }
    async disconnect() {
        if (this.redisClient) {
            await this.redisClient.quit();
            this.redisClient = null;
            this.isRedisConnected = false;
        }
    }
}
export const cacheService = new CacheService();
//# sourceMappingURL=cache-service.js.map