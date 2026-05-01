export declare const VALIDATION_CONSTANTS: {
    readonly MAX_INPUT_LENGTH: 500;
    readonly MIN_ID_LENGTH: 1;
    readonly MAX_ID_LENGTH: 64;
    readonly MAX_NAME_LENGTH: 100;
    readonly MIN_PASSWORD_LENGTH: 8;
    readonly MAX_CONTENT_LENGTH: 2000;
    readonly DEFAULT_TRUNCATE_LENGTH: 100;
};
export declare const REGEX_CONSTANTS: {
    readonly IDENTIFIER: RegExp;
    readonly EMAIL: RegExp;
    readonly URL: RegExp;
    readonly PHONE: RegExp;
    readonly CHINESE: RegExp;
    readonly WHITESPACE: RegExp;
    readonly TRIM: RegExp;
};
export declare const STRING_CONSTANTS: {
    readonly EMPTY_STRING: "";
    readonly SPACE: " ";
    readonly NEWLINE: "\n";
    readonly TAB: "\t";
    readonly COMMA: ",";
    readonly DOT: ".";
    readonly UNDERSCORE: "_";
    readonly DASH: "-";
};
export declare const RANDOM_CHARSET: {
    readonly ALPHANUMERIC: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    readonly ALPHABETIC: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    readonly NUMERIC: "0123456789";
    readonly LOWERCASE: "abcdefghijklmnopqrstuvwxyz";
    readonly UPPERCASE: "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
};
export declare const TIME_CONSTANTS: {
    readonly MILLISECONDS_PER_SECOND: 1000;
    readonly MILLISECONDS_PER_MINUTE: 60000;
    readonly MILLISECONDS_PER_HOUR: 3600000;
    readonly SECONDS_PER_MINUTE: 60;
    readonly MINUTES_PER_HOUR: 60;
    readonly HOURS_PER_DAY: 24;
};
export declare const ERROR_MESSAGES: {
    readonly INVALID_INPUT: "Invalid input: must be a valid value";
    readonly INVALID_NUMBER: "Invalid input: must be a valid number";
    readonly INVALID_STRING: "Invalid input: must be a non-empty string";
    readonly INVALID_ID_LENGTH: "Invalid ID length: must be between 1 and 64 characters";
    readonly INVALID_EMAIL: "Invalid email format";
    readonly INVALID_URL: "Invalid URL format";
    readonly EMPTY_REQUEST: "Request content cannot be empty";
    readonly REQUEST_TOO_LONG: "Request content too long, please simplify and try again";
    readonly DATABASE_CONNECTION: "Database connection error";
    readonly AI_ENGINE_ERROR: "AI engine execution error";
    readonly WORKFLOW_EXECUTION_ERROR: "Workflow execution error";
};
export declare const STATUS_CONSTANTS: {
    readonly SUCCESS: "success";
    readonly FAILED: "failed";
    readonly PENDING: "pending";
    readonly COMPLETED: "completed";
    readonly ERROR: "error";
    readonly ACTIVE: "active";
    readonly INACTIVE: "inactive";
    readonly CREATED: "created";
    readonly UPDATED: "updated";
    readonly DELETED: "deleted";
};
export declare const RETRY_CONSTANTS: {
    readonly DEFAULT_MAX_RETRIES: 3;
    readonly DEFAULT_BASE_DELAY_MS: 1000;
    readonly DEFAULT_MAX_DELAY_MS: 5000;
    readonly DEFAULT_BACKOFF_FACTOR: 2;
};
export declare const API_CONSTANTS: {
    readonly DEFAULT_PAGE_SIZE: 20;
    readonly MAX_PAGE_SIZE: 100;
    readonly DEFAULT_TIMEOUT_MS: 30000;
    readonly MAX_TIMEOUT_MS: 120000;
    readonly CONTENT_TYPE_JSON: "application/json";
    readonly CONTENT_TYPE_TEXT: "text/plain";
};
//# sourceMappingURL=constants.d.ts.map