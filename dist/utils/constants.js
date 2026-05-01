"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.API_CONSTANTS = exports.RETRY_CONSTANTS = exports.STATUS_CONSTANTS = exports.ERROR_MESSAGES = exports.TIME_CONSTANTS = exports.RANDOM_CHARSET = exports.STRING_CONSTANTS = exports.REGEX_CONSTANTS = exports.VALIDATION_CONSTANTS = void 0;
exports.VALIDATION_CONSTANTS = {
    MAX_INPUT_LENGTH: 500,
    MIN_ID_LENGTH: 1,
    MAX_ID_LENGTH: 64,
    MAX_NAME_LENGTH: 100,
    MIN_PASSWORD_LENGTH: 8,
    MAX_CONTENT_LENGTH: 2000,
    DEFAULT_TRUNCATE_LENGTH: 100,
};
exports.REGEX_CONSTANTS = {
    IDENTIFIER: /^[a-zA-Z_][a-zA-Z0-9_]*$/,
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
    PHONE: /^1[3-9]\d{9}$/,
    CHINESE: /[\u4e00-\u9fa5]/,
    WHITESPACE: /\s+/g,
    TRIM: /^\s+|\s+$/g,
};
exports.STRING_CONSTANTS = {
    EMPTY_STRING: '',
    SPACE: ' ',
    NEWLINE: '\n',
    TAB: '\t',
    COMMA: ',',
    DOT: '.',
    UNDERSCORE: '_',
    DASH: '-',
};
exports.RANDOM_CHARSET = {
    ALPHANUMERIC: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
    ALPHABETIC: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
    NUMERIC: '0123456789',
    LOWERCASE: 'abcdefghijklmnopqrstuvwxyz',
    UPPERCASE: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
};
exports.TIME_CONSTANTS = {
    MILLISECONDS_PER_SECOND: 1000,
    MILLISECONDS_PER_MINUTE: 60000,
    MILLISECONDS_PER_HOUR: 3600000,
    SECONDS_PER_MINUTE: 60,
    MINUTES_PER_HOUR: 60,
    HOURS_PER_DAY: 24,
};
exports.ERROR_MESSAGES = {
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
};
exports.STATUS_CONSTANTS = {
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
};
exports.RETRY_CONSTANTS = {
    DEFAULT_MAX_RETRIES: 3,
    DEFAULT_BASE_DELAY_MS: 1000,
    DEFAULT_MAX_DELAY_MS: 5000,
    DEFAULT_BACKOFF_FACTOR: 2,
};
exports.API_CONSTANTS = {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
    DEFAULT_TIMEOUT_MS: 30000,
    MAX_TIMEOUT_MS: 120000,
    CONTENT_TYPE_JSON: 'application/json',
    CONTENT_TYPE_TEXT: 'text/plain',
};
//# sourceMappingURL=constants.js.map