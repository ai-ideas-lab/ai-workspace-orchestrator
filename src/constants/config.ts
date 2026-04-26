/**
 * 配置常量定义
 * 
 * 统一管理系统中使用的各种配置值，避免重复的数字和字符串常量，
 * 提高代码的可维护性和一致性。
 */

// 时间配置（毫秒）
export const TIME_CONFIG = {
  SHORT_DELAY: 1000, // 1秒
  MEDIUM_DELAY: 2000, // 2秒
  LONG_DELAY: 5000, // 5秒
  EXTRA_LONG_DELAY: 30000, // 30秒
  VERY_SHORT_DELAY: 100, // 100毫秒
  RETRY_BASE_DELAY: 1000, // 重试基础延迟
  CACHE_TTL_SHORT: 60 * 1000, // 1分钟缓存
  CACHE_TTL_MEDIUM: 5 * 60 * 1000, // 5分钟缓存
  CACHE_TTL_LONG: 30 * 60 * 1000, // 30分钟缓存
  REQUEST_TIMEOUT: 10000, // 10秒请求超时
  HEALTH_CHECK_INTERVAL: 30000, // 30秒健康检查
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24小时会话超时
} as const;

// 重试配置
export const RETRY_CONFIG = {
  MAX_RETRIES_DEFAULT: 3,
  MAX_RETRIES_CRITICAL: 5,
  MAX_RETRIES_NON_CRITICAL: 2,
  BASE_DELAY_MS: 1000,
  MAX_DELAY_MS: 5000,
  RETRY_MULTIPLIER: 2,
  RETRY_JITTER_FACTOR: 0.1, // 10%随机抖动
} as const;

// HTTP状态码
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

// 数据库相关配置
export const DATABASE_CONFIG = {
  MAX_CONNECTIONS: 10,
  CONNECTION_TIMEOUT: 5000,
  IDLE_TIMEOUT: 30000,
  MAX_LIFETIME: 1800000, // 30分钟
  QUERY_TIMEOUT: 10000,
  RETRY_COUNT: 3,
} as const;

// 分页配置
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
} as const;

// 缓存配置
export const CACHE_CONFIG = {
  DEFAULT_TTL: 300, // 5分钟
  MAX_TTL: 3600, // 1小时
  CLEANUP_INTERVAL: 600, // 10分钟
  MAX_SIZE: 1000, // 最大缓存条目数
} as const;

// 文件上传配置
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'application/pdf', 'text/plain'],
  MAX_FILES: 5,
} as const;

// 日志配置
export const LOG_CONFIG = {
  LEVELS: ['error', 'warn', 'info', 'debug'] as const,
  MAX_LOG_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_LOG_FILES: 5,
  LOG_FORMAT: 'json' as const,
} as const;

// 导出配置类型
export type TimeConfig = typeof TIME_CONFIG;
export type RetryConfig = typeof RETRY_CONFIG;
export type HttpStatus = typeof HTTP_STATUS[keyof typeof HTTP_STATUS];
export type DatabaseConfig = typeof DATABASE_CONFIG;
export type PaginationConfig = typeof PAGINATION_CONFIG;
export type CacheConfig = typeof CACHE_CONFIG;
export type UploadConfig = typeof UPLOAD_CONFIG;
export type LogConfig = typeof LOG_CONFIG;