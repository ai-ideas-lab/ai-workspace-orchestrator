/**
 * 应用程序常量定义
 * 统一管理所有重复使用的字符串、数字和配置值
 */

// ── 工作流状态常量 ─────────────────────────────────────
export const WORKFLOW_STATUS = {
  COMPLETED: 'completed' as const,
  FAILED: 'failed' as const,
  PENDING: 'pending' as const,
  SYSTEM_ERROR: 'system-error' as const
} as const;

// ── 步骤类型常量 ───────────────────────────────────────
export const STEP_TYPE = {
  AI: 'ai' as const,
  API: 'api' as const,
  DATABASE: 'database' as const,
  HTTP: 'http' as const,
  DATA: 'data' as const
} as const;

// ── 时间相关常量 ───────────────────────────────────────
export const TIMING = {
  // 重试配置
  DEFAULT_MAX_RETRIES: 2,
  WORKFLOW_FETCH_MAX_RETRIES: 3,
  BASE_DELAY_MS: 1000,
  MAX_DELAY_MS: 5000,
  AI_DURATION_MS: 5000,
  API_DURATION_MS: 1000,
  DATA_DURATION_MS: 1000,
  
  // 优先级计算
  REQUIRED_PRIORITY_MULTIPLIER: 1.2,
  SUCCESS_THRESHOLD_RATIO: 0.5
} as const;

// ── 元数据键常量 ───────────────────────────────────────
export const METADATA_KEYS = {
  ENGINE_TYPE: 'engineType' as const,
  ORDER: 'order' as const,
  SUCCESS: 'success' as const,
  RETRIES: 'retries' as const,
  FINAL_ERROR: 'finalError' as const,
  UNEXPECTED_ERROR: 'unexpectedError' as const,
  STEP_ID: 'stepId' as const,
  USER_ID: 'userId' as const,
  SESSION_ID: 'sessionId' as const,
  CORRELATION_ID: 'correlationId' as const,
  ERROR: 'error' as const,
  TIMESTAMP: 'timestamp' as const,
  SYSTEM_ERROR: 'system-error' as const,
  WORKFLOW_EXECUTION_ERROR: 'workflow-execution-error' as const,
  DATABASE_CONNECTION_ERROR: 'database' as const,
  AI_ENGINE_ERROR: 'ai' as const
} as const;

// ── 错误类型常量 ───────────────────────────────────────
export const ERROR_TYPES = {
  WORKFLOW_EXECUTION_ERROR: 'workflow-execution-error' as const,
  DATABASE_CONNECTION_ERROR: 'database' as const,
  AI_ENGINE_ERROR: 'ai' as const,
  APP_ERROR: 'app-error' as const,
  VALIDATION_ERROR: 'validation-error' as const,
  NETWORK_ERROR: 'network-error' as const
} as const;

// ── ID生成模式 ─────────────────────────────────────────
export const ID_PATTERNS = {
  SESSION_PREFIX: 'session_',
  CORRELATION_PREFIX: 'correlation_',
  SYSTEM_ERROR_ID: 'system-error'
} as const;

// ── 工作流配置常量 ────────────────────────────────────
export const WORKFLOW_CONFIG = {
  MIN_SUCCESS_RATIO: 0.5,
  MAX_CONCURRENT_STEPS: 10,
  DEFAULT_TIMEOUT_MS: 30000,
  RETRY_BACKOFF_FACTOR: 2,
  MAX_RETRY_ATTEMPTS: 3
} as const;

// ── 日志级别常量 ──────────────────────────────────────
export const LOG_LEVELS = {
  ERROR: 'error' as const,
  WARN: 'warn' as const,
  INFO: 'info' as const,
  DEBUG: 'debug' as const
} as const;

// ── 通用的实用工具常量 ────────────────────────────────
export const COMMON = {
  NULL: null,
  TRUE: true,
  FALSE: false,
  ZERO: 0,
  EMPTY_STRING: '',
  UNDEFINED: undefined
} as const;