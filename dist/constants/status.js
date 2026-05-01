"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.API_STATUS = exports.ENGINE_STATUS = exports.USER_STATUS = exports.TASK_STATUS = exports.EXECUTION_STATUS = exports.WORKFLOW_STATUS = void 0;
exports.WORKFLOW_STATUS = {
    RUNNING: 'running',
    COMPLETED: 'completed',
    FAILED: 'failed',
    PENDING: 'pending',
    SYSTEM_ERROR: 'system-error'
};
exports.EXECUTION_STATUS = {
    COMPLETED: 'completed',
    FAILED: 'failed',
    PENDING: 'pending',
    SYSTEM_ERROR: 'system-error'
};
exports.TASK_STATUS = {
    PENDING: 'pending',
    RUNNING: 'running',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled'
};
exports.USER_STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    SUSPENDED: 'suspended',
    PENDING_VERIFICATION: 'pending-verification'
};
exports.ENGINE_STATUS = {
    IDLE: 'idle',
    RUNNING: 'running',
    ERROR: 'error',
    MAINTENANCE: 'maintenance'
};
exports.API_STATUS = {
    SUCCESS: 'success',
    ERROR: 'error',
    PENDING: 'pending',
    TIMEOUT: 'timeout'
};
//# sourceMappingURL=status.js.map