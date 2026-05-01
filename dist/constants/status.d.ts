export declare const WORKFLOW_STATUS: {
    readonly RUNNING: "running";
    readonly COMPLETED: "completed";
    readonly FAILED: "failed";
    readonly PENDING: "pending";
    readonly SYSTEM_ERROR: "system-error";
};
export declare const EXECUTION_STATUS: {
    readonly COMPLETED: "completed";
    readonly FAILED: "failed";
    readonly PENDING: "pending";
    readonly SYSTEM_ERROR: "system-error";
};
export declare const TASK_STATUS: {
    readonly PENDING: "pending";
    readonly RUNNING: "running";
    readonly COMPLETED: "completed";
    readonly FAILED: "failed";
    readonly CANCELLED: "cancelled";
};
export declare const USER_STATUS: {
    readonly ACTIVE: "active";
    readonly INACTIVE: "inactive";
    readonly SUSPENDED: "suspended";
    readonly PENDING_VERIFICATION: "pending-verification";
};
export declare const ENGINE_STATUS: {
    readonly IDLE: "idle";
    readonly RUNNING: "running";
    readonly ERROR: "error";
    readonly MAINTENANCE: "maintenance";
};
export declare const API_STATUS: {
    readonly SUCCESS: "success";
    readonly ERROR: "error";
    readonly PENDING: "pending";
    readonly TIMEOUT: "timeout";
};
export type WorkflowStatus = typeof WORKFLOW_STATUS[keyof typeof WORKFLOW_STATUS];
export type ExecutionStatus = typeof EXECUTION_STATUS[keyof typeof EXECUTION_STATUS];
export type TaskStatus = typeof TASK_STATUS[keyof typeof TASK_STATUS];
export type UserStatus = typeof USER_STATUS[keyof typeof USER_STATUS];
export type EngineStatus = typeof ENGINE_STATUS[keyof typeof ENGINE_STATUS];
export type ApiStatus = typeof API_STATUS[keyof typeof API_STATUS];
//# sourceMappingURL=status.d.ts.map