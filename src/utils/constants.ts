/**
 * 应用程序常量定义
 * 集中管理常用的配置值、正则表达式和默认值
 */

// ── 验证相关常量 ─────────────────────────────────────
export const VALIDATION_CONSTANTS = {
  MAX_INPUT_LENGTH: 500,
  MIN_ID_LENGTH: 1,
  MAX_ID_LENGTH: 64,
  MAX_NAME_LENGTH: 100,
  MIN_PASSWORD_LENGTH: 8,
  MAX_CONTENT_LENGTH: 2000,
  DEFAULT_TRUNCATE_LENGTH: 100,
} as const;

// ── 正则表达式常量 ──────────────────────────────────
export const REGEX_CONSTANTS = {
  IDENTIFIER: /^[a-zA-Z_][a-zA-Z0-9_]*$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  PHONE: /^1[3-9]\d{9}$/,
  CHINESE: /[\u4e00-\u9fa5]/,
  WHITESPACE: /\s+/g,
  TRIM: /^\s+|\s+$/g,
} as const;

// ── 字符串常量 ────────────────────────────────────
export const STRING_CONSTANTS = {
  EMPTY_STRING: '',
  SPACE: ' ',
  NEWLINE: '\n',
  TAB: '\t',
  COMMA: ',',
  DOT: '.',
  UNDERSCORE: '_',
  DASH: '-',
} as const;

// ── 随机字符集常量 ────────────────────────────────
export const RANDOM_CHARSET = {
  ALPHANUMERIC: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  ALPHABETIC: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  NUMERIC: '0123456789',
  LOWERCASE: 'abcdefghijklmnopqrstuvwxyz',
  UPPERCASE: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
} as const;

// ── 时间相关常量 ──────────────────────────────────
export const TIME_CONSTANTS = {
  MILLISECONDS_PER_SECOND: 1000,
  MILLISECONDS_PER_MINUTE: 60000,
  MILLISECONDS_PER_HOUR: 3600000,
  SECONDS_PER_MINUTE: 60,
  MINUTES_PER_HOUR: 60,
  HOURS_PER_DAY: 24,
} as const;

// ── 错误消息常量 ──────────────────────────────────
export const ERROR_MESSAGES = {
  INVALID_INPUT: 'Invalid input: must be a valid value',
  INVALID_NUMBER: 'Invalid input: must be a valid number',
  INVALID_STRING: 'Invalid input: must be a non-empty string',
  INVALID_ID_LENGTH: 'Invalid ID length: must be between 1 and 64 characters',
  INVALID_EMAIL: 'Invalid email format',
  INVALID_URL: 'Invalid URL format',
  EMPTY_REQUEST: 'Request content cannot be empty',
  REQUEST_TOO_LONG: 'Request content too long, please simplify and try again',
  DATABASE_CONNECTION: 'Database connection error',
  AI_ENGINE_ERROR: 'AI engine execution error',
  WORKFLOW_EXECUTION_ERROR: 'Workflow execution error',
} as const;

// ── 状态常量 ──────────────────────────────────────
export const STATUS_CONSTANTS = {
  SUCCESS: 'success',
  FAILED: 'failed',
  PENDING: 'pending',
  COMPLETED: 'completed',
  ERROR: 'error',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  CREATED: 'created',
  UPDATED: 'updated',
  DELETED: 'deleted',
} as const;

// ── 重试配置常量 ──────────────────────────────────
export const RETRY_CONSTANTS = {
  DEFAULT_MAX_RETRIES: 3,
  DEFAULT_BASE_DELAY_MS: 1000,
  DEFAULT_MAX_DELAY_MS: 5000,
  DEFAULT_BACKOFF_FACTOR: 2,
} as const;

// ── API相关常量 ───────────────────────────────────
export const API_CONSTANTS = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  DEFAULT_TIMEOUT_MS: 30000,
  MAX_TIMEOUT_MS: 120000,
  CONTENT_TYPE_JSON: 'application/json',
  CONTENT_TYPE_TEXT: 'text/plain',
} as const;