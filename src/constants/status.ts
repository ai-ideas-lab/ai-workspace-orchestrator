/**
 * 状态常量定义
 * 
 * 统一管理系统中使用的各种状态值，避免重复的字符串常量，
 * 提高代码的可维护性和一致性。
 */

// 工作流状态
export const WORKFLOW_STATUS = {
  RUNNING: 'running' as const,
  COMPLETED: 'completed' as const,
  FAILED: 'failed' as const,
  PENDING: 'pending' as const,
  SYSTEM_ERROR: 'system-error' as const
} as const;

// 执行步骤状态
export const EXECUTION_STATUS = {
  COMPLETED: 'completed' as const,
  FAILED: 'failed' as const,
  PENDING: 'pending' as const,
  SYSTEM_ERROR: 'system-error' as const
} as const;

// 任务状态
export const TASK_STATUS = {
  PENDING: 'pending' as const,
  RUNNING: 'running' as const,
  COMPLETED: 'completed' as const,
  FAILED: 'failed' as const,
  CANCELLED: 'cancelled' as const
} as const;

// 用户状态
export const USER_STATUS = {
  ACTIVE: 'active' as const,
  INACTIVE: 'inactive' as const,
  SUSPENDED: 'suspended' as const,
  PENDING_VERIFICATION: 'pending-verification' as const
} as const;

// AI引擎状态
export const ENGINE_STATUS = {
  IDLE: 'idle' as const,
  RUNNING: 'running' as const,
  ERROR: 'error' as const,
  MAINTENANCE: 'maintenance' as const
} as const;

// API响应状态
export const API_STATUS = {
  SUCCESS: 'success' as const,
  ERROR: 'error' as const,
  PENDING: 'pending' as const,
  TIMEOUT: 'timeout' as const
} as const;

// 导入所有状态类型的联合类型
export type WorkflowStatus = typeof WORKFLOW_STATUS[keyof typeof WORKFLOW_STATUS];
export type ExecutionStatus = typeof EXECUTION_STATUS[keyof typeof EXECUTION_STATUS];
export type TaskStatus = typeof TASK_STATUS[keyof typeof TASK_STATUS];
export type UserStatus = typeof USER_STATUS[keyof typeof USER_STATUS];
export type EngineStatus = typeof ENGINE_STATUS[keyof typeof ENGINE_STATUS];
export type ApiStatus = typeof API_STATUS[keyof typeof API_STATUS];