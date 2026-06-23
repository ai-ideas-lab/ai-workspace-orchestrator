"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.COMMON = exports.PROBABILITY_CONFIG = exports.LOG_LEVELS = exports.WORKFLOW_CONFIG = exports.ERROR_PATTERNS = exports.ID_PATTERNS = exports.ERROR_TYPES = exports.METADATA_KEYS = exports.TIMING = exports.STEP_TYPE = exports.WORKFLOW_STATUS = void 0;
exports.WORKFLOW_STATUS = {
    COMPLETED: 'completed',
    FAILED: 'failed',
    PENDING: 'pending',
    SYSTEM_ERROR: 'system-error'
};
exports.STEP_TYPE = {
    AI: 'ai',
    API: 'api',
    DATABASE: 'database',
    HTTP: 'http',
    DATA: 'data'
};
exports.TIMING = {
    DEFAULT_MAX_RETRIES: 2,
    WORKFLOW_FETCH_MAX_RETRIES: 3,
    BASE_DELAY_MS: 1000,
    MAX_DELAY_MS: 5000,
    AI_DURATION_MS: 5000,
    API_DURATION_MS: 1000,
    DATA_DURATION_MS: 1000,
    REQUIRED_PRIORITY_MULTIPLIER: 1.2,
    SUCCESS_THRESHOLD_RATIO: 0.5
};
exports.METADATA_KEYS = {
    ENGINE_TYPE: 'engineType',
    ORDER: 'order',
    SUCCESS: 'success',
    RETRIES: 'retries',
    FINAL_ERROR: 'finalError',
    UNEXPECTED_ERROR: 'unexpectedError',
    STEP_ID: 'stepId',
    USER_ID: 'userId',
    SESSION_ID: 'sessionId',
    CORRELATION_ID: 'correlationId',
    ERROR: 'error',
    TIMESTAMP: 'timestamp',
    SYSTEM_ERROR: 'system-error',
    WORKFLOW_EXECUTION_ERROR: 'workflow-execution-error',
    DATABASE_CONNECTION_ERROR: 'database',
    AI_ENGINE_ERROR: 'ai'
};
exports.ERROR_TYPES = {
    WORKFLOW_EXECUTION_ERROR: 'workflow-execution-error',
    DATABASE_CONNECTION_ERROR: 'database',
    AI_ENGINE_ERROR: 'ai',
    APP_ERROR: 'app-error',
    VALIDATION_ERROR: 'validation-error',
    NETWORK_ERROR: 'network-error'
};
exports.ID_PATTERNS = {
    SESSION_PREFIX: 'session_',
    CORRELATION_PREFIX: 'correlation_',
    SYSTEM_ERROR_ID: 'system-error',
    REQUEST_PREFIX: 'req_',
    TIMESTAMP_ID_SUFFIX: Math.random().toString(36).substr(2, 9)
};
exports.ERROR_PATTERNS = {
    DEFAULT_ERROR_PREFIX: 'Error: ',
    DB_CONNECTION_FAILED: '数据库连接失败',
    DB_DISCONNECTION_FAILED: '数据库断开连接失败',
    DB_STATS_FAILED: '获取数据库统计信息失败',
    UNKNOWN_ERROR: 'UnknownError',
    NULL_OR_UNDEFINED: null
};
exports.WORKFLOW_CONFIG = {
    MIN_SUCCESS_RATIO: 0.5,
    MAX_CONCURRENT_STEPS: 10,
    DEFAULT_TIMEOUT_MS: 30000,
    RETRY_BACKOFF_FACTOR: 2,
    MAX_RETRY_ATTEMPTS: 3
};
exports.LOG_LEVELS = {
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
    DEBUG: 'debug'
};
exports.PROBABILITY_CONFIG = {
    TASK_WEIGHT_MIN: 1,
    TASK_WEIGHT_MAX: 20,
    AGENT_CAPACITY_MIN: 1,
    AGENT_CAPACITY_MAX: 100,
    COMPLEXITY_MIN: 0.5,
    COMPLEXITY_MAX: 2.0,
    PROBABILITY_EXTREMELY_HIGH: 0.9,
    PROBABILITY_HIGH: 0.7,
    PROBABILITY_MEDIUM: 0.5,
    PROBABILITY_LOW_MEDIUM: 0.3,
    STATUS_HEALTH_THRESHOLD: 0.3,
    MIN_PROBABILITY: 0,
    MAX_PROBABILITY: 1
};
exports.COMMON = {
    NULL: null,
    TRUE: true,
    FALSE: false,
    ZERO: 0,
    EMPTY_STRING: '',
    UNDEFINED: undefined
};
//# sourceMappingURL=index.js.map