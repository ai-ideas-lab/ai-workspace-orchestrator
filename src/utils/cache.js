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
 * Get value from cache
 * @param {string} key - Cache key
 * @returns {any|null} Cached value or null if not found or expired
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
 * Set value in cache with optional TTL
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttlSeconds - Time to live in seconds (optional)
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
 * Delete value from cache
 * @param {string} key - Cache key
 */
function delete(key) {
  cache.delete(key);
  if (timeouts.has(key)) {
    clearTimeout(timeouts.get(key));
    timeouts.delete(key);
  }
}

/**
 * Clear all cache entries
 */
function clear() {
  cache.clear();
  timeouts.forEach(timeout => clearTimeout(timeout));
  timeouts.clear();
}

module.exports = { get, set, delete, clear };