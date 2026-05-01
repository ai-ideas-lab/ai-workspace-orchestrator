"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.COMMON = exports.LOG_LEVELS = exports.WORKFLOW_CONFIG = exports.ID_PATTERNS = exports.ERROR_TYPES = exports.METADATA_KEYS = exports.TIMING = exports.STEP_TYPE = exports.WORKFLOW_STATUS = void 0;
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
    SYSTEM_ERROR_ID: 'system-error'
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
exports.COMMON = {
    NULL: null,
    TRUE: true,
    FALSE: false,
    ZERO: 0,
    EMPTY_STRING: '',
    UNDEFINED: undefined
};
//# sourceMappingURL=index.js.map