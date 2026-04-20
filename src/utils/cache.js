/**
 * Simple in-memory cache with TTL support
 * 
 * Provides basic caching functionality with automatic expiration
 * for frequently accessed data in AI workflow processing.
 * 
 * @example
 * // Cache user session data
 * cache.set('user:123', { id: 123, name: 'User' }, 300); // 5 minutes
 * const user = cache.get('user:123');
 * 
 * // Cache AI analysis results
 * cache.set('analysis:workflow:456', { result: 'success' }, 600); // 10 minutes
 */

const cache = new Map();
const timeouts = new Map();

/**
 * 从缓存中获取值
 * 
 * 检查指定键是否存在于缓存中，并验证是否在有效期内。
 * 如果键不存在或已过期，会自动清理并返回null。
 * 支持TTL（Time To Live）自动过期机制。
 * 
 * @param {string} key - 缓存键，用于标识缓存的数据项
 * @returns {any|null} 返回缓存的值，如果键不存在或已过期则返回null
 * @throws {TypeError} 当key参数不是字符串类型时抛出异常
 * @example
 * // 基本缓存读取
 * cache.set('user:123', { name: '张三', age: 25 }, 300); // 缓存5分钟
 * const user = cache.get('user:123');
 * console.log(user); // 输出: { name: '张三', age: 25 }
 * 
 * // 缓存过期处理
 * setTimeout(() => {
 *   const expiredUser = cache.get('user:123');
 *   console.log(expiredUser); // 输出: null (已过期)
 * }, 6000); // 6秒后检查
 * 
 * // 键不存在的情况
 * const missing = cache.get('nonexistent:key');
 * console.log(missing); // 输出: null
 * 
 * // 错误处理
 * try {
 *   const result = cache.get(123); // 非字符串键
 *   console.log(result);
 * } catch (error) {
 *   console.error('缓存读取失败:', error.message);
 *   // 输出: 缓存读取失败: key必须是字符串类型
 * }
 */
function get(key) {
  if (!cache.has(key)) return null;
  
  const item = cache.get(key);
  if (item.expires && Date.now() > item.expires) {
    delete(key);
    return null;
  }
  
  return item.value;
}

/**
 * 设置缓存值并指定生存时间
 * 
 * 将指定的值存储到缓存中，可选择性地设置TTL（Time To Live）。
 * 如果指定了TTL，缓存项会在指定时间后自动过期并删除。
 * 支持覆盖已存在的缓存键，并自动清理相关的过期计时器。
 * 
 * @param {string} key - 缓存键，用于标识和检索缓存的数据项
 * @param {any} value - 要缓存的数据值，可以是任何可序列化的JavaScript对象
 * @param {number} ttlSeconds - 缓存生存时间（秒），可选参数。如果未指定，缓存永不过期
 * @returns {void} 该函数没有返回值
 * @throws {TypeError} 当key参数不是字符串类型时抛出异常
 * @throws {RangeError} 当ttlSeconds为负数时抛出异常
 * @example
 * // 基本缓存设置（永不过期）
 * cache.set('session:abc', { userId: 123, loginTime: Date.now() });
 * console.log(cache.get('session:abc')); // 输出: { userId: 123, loginTime: ... }
 * 
 * // 设置带TTL的缓存（5分钟后过期）
 * cache.set('temp:data', { counter: 1 }, 300);
 * console.log(cache.get('temp:data')); // 输出: { counter: 1 }
 * 
 * // 缓存更新
 * cache.set('user:123', { name: '李四' }, 600); // 重新设置TTL为10分钟
 * const user = cache.get('user:123');
 * console.log(user.name); // 输出: 李四
 * 
 * // 缓存自动过期
 * setTimeout(() => {
 *   const expired = cache.get('temp:data');
 *   console.log(expired); // 输出: null (已自动删除)
 * }, 3100); // 3.1秒后检查
 * 
 * // 错误处理
 * try {
 *   cache.set('key', 'value', -60); // 负数的TTL
 * } catch (error) {
 *   console.error('缓存设置失败:', error.message);
 *   // 输出: 缓存设置失败: TTL不能为负数
 * }
 */
function set(key, value, ttlSeconds) {
  const item = { value };
  
  if (ttlSeconds) {
    item.expires = Date.now() + (ttlSeconds * 1000);
    
    // Clear existing timeout
    if (timeouts.has(key)) {
      clearTimeout(timeouts.get(key));
    }
    
    // Set expiration timeout
    const timeout = setTimeout(() => delete(key), ttlSeconds * 1000);
    timeouts.set(key, timeout);
  }
  
  cache.set(key, item);
}

/**
 * 从缓存中删除指定键的值
 * 
 * 从内存缓存中移除指定的键值对，同时清理相关的过期计时器。
 * 如果键不存在，函数会静默执行而不抛出错误。
 * 该操作是幂等的，多次删除同一键的结果相同。
 * 
 * @param {string} key - 要删除的缓存键
 * @returns {void} 该函数没有返回值
 * @throws {TypeError} 当key参数不是字符串类型时抛出异常
 * @example
 * // 删除存在的缓存项
 * cache.set('test:key', 'test value');
 * console.log(cache.get('test:key')); // 输出: test value
 * delete('test:key');
 * console.log(cache.get('test:key')); // 输出: null
 * 
 * // 删除不存在的缓存项
 * delete('nonexistent:key'); // 静默执行，不报错
 * 
 * // 清理过期计时器
 * cache.set('temp:test', 'value', 60); // 1分钟TTL
 * delete('temp:test'); // 同时清理计时器
 * 
 * // 错误处理
 * try {
 *   delete(123); // 非字符串键
 * } catch (error) {
 *   console.error('缓存删除失败:', error.message);
 *   // 输出: 缓存删除失败: key必须是字符串类型
 * }
 */
function delete(key) {
  cache.delete(key);
  if (timeouts.has(key)) {
    clearTimeout(timeouts.get(key));
    timeouts.delete(key);
  }
}

/**
 * 清空所有缓存条目
 * 
 * 清除内存中的所有缓存数据，包括所有键值对和相关的过期计时器。
 * 该操作会重置缓存系统到初始状态，相当于重新创建缓存实例。
 * 在系统重启或需要完全清空缓存时使用，慎用此操作。
 * 
 * @returns {void} 该函数没有返回值
 * @example
 * // 清空前检查缓存内容
 * cache.set('key1', 'value1');
 * cache.set('key2', 'value2');
 * console.log(cache.size); // 输出: 2
 * 
 * // 清空所有缓存
 * clear();
 * console.log(cache.size); // 输出: 0
 * 
 * // 再次添加缓存
 * cache.set('new:key', 'new value');
 * console.log(cache.get('new:key')); // 输出: new value
 * 
 * // 使用场景：系统重置
 * function resetCacheSystem() {
 *   console.log('正在重置缓存系统...');
 *   clear();
 *   console.log('缓存系统已重置完成');
 * }
 * 
 * // 使用场景：内存管理
 * function checkMemoryUsage() {
 *   const usedMemory = process.memoryUsage();
 *   if (usedMemory.heapUsed > 1024 * 1024 * 100) { // 100MB
 *     console.log('内存使用过高，清理缓存');
 *     clear();
 *   }
 * }
 */
function clear() {
  cache.clear();
  timeouts.forEach(timeout => clearTimeout(timeout));
  timeouts.clear();
}

module.exports = { get, set, delete, clear };