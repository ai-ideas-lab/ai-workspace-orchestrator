export declare const WORKFLOW_STATUS: {
    readonly COMPLETED: "completed";
    readonly FAILED: "failed";
    readonly PENDING: "pending";
    readonly SYSTEM_ERROR: "system-error";
};
export declare const STEP_TYPE: {
    readonly AI: "ai";
    readonly API: "api";
    readonly DATABASE: "database";
    readonly HTTP: "http";
    readonly DATA: "data";
};
export declare const TIMING: {
    readonly DEFAULT_MAX_RETRIES: 2;
    readonly WORKFLOW_FETCH_MAX_RETRIES: 3;
    readonly BASE_DELAY_MS: 1000;
    readonly MAX_DELAY_MS: 5000;
    readonly AI_DURATION_MS: 5000;
    readonly API_DURATION_MS: 1000;
    readonly DATA_DURATION_MS: 1000;
    readonly REQUIRED_PRIORITY_MULTIPLIER: 1.2;
    readonly SUCCESS_THRESHOLD_RATIO: 0.5;
};
export declare const METADATA_KEYS: {
    readonly ENGINE_TYPE: "engineType";
    readonly ORDER: "order";
    readonly SUCCESS: "success";
    readonly RETRIES: "retries";
    readonly FINAL_ERROR: "finalError";
    readonly UNEXPECTED_ERROR: "unexpectedError";
    readonly STEP_ID: "stepId";
    readonly USER_ID: "userId";
    readonly SESSION_ID: "sessionId";
    readonly CORRELATION_ID: "correlationId";
    readonly ERROR: "error";
    readonly TIMESTAMP: "timestamp";
    readonly SYSTEM_ERROR: "system-error";
    readonly WORKFLOW_EXECUTION_ERROR: "workflow-execution-error";
    readonly DATABASE_CONNECTION_ERROR: "database";
    readonly AI_ENGINE_ERROR: "ai";
};
export declare const ERROR_TYPES: {
    readonly WORKFLOW_EXECUTION_ERROR: "workflow-execution-error";
    readonly DATABASE_CONNECTION_ERROR: "database";
    readonly AI_ENGINE_ERROR: "ai";
    readonly APP_ERROR: "app-error";
    readonly VALIDATION_ERROR: "validation-error";
    readonly NETWORK_ERROR: "network-error";
};
export declare const ID_PATTERNS: {
    readonly SESSION_PREFIX: "session_";
    readonly CORRELATION_PREFIX: "correlation_";
    readonly SYSTEM_ERROR_ID: "system-error";
};
export declare const WORKFLOW_CONFIG: {
    readonly MIN_SUCCESS_RATIO: 0.5;
    readonly MAX_CONCURRENT_STEPS: 10;
    readonly DEFAULT_TIMEOUT_MS: 30000;
    readonly RETRY_BACKOFF_FACTOR: 2;
    readonly MAX_RETRY_ATTEMPTS: 3;
};
export declare const LOG_LEVELS: {
    readonly ERROR: "error";
    readonly WARN: "warn";
    readonly INFO: "info";
    readonly DEBUG: "debug";
};
export declare const COMMON: {
    readonly NULL: null;
    readonly TRUE: true;
    readonly FALSE: false;
    readonly ZERO: 0;
    readonly EMPTY_STRING: "";
    readonly UNDEFINED: undefined;
};
//# sourceMappingURL=index.d.ts.map