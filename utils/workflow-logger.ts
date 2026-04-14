/**
 * 工作流执行日志记录器
 * 轻量级日志记录工具，用于跟踪工作流执行状态和性能指标
 */

export interface WorkflowLog {
  id: string;
  workflowId: string;
  stepId: string;
  agentId: string;
  status: 'started' | 'completed' | 'failed';
  timestamp: Date;
  duration?: number;
  metadata?: Record<string, any>;
}

/**
 * 记录工作流步骤开始执行
 * @param workflowId 工作流ID
 * @param stepId 步骤ID
 * @param agentId 执行代理ID
 * @param metadata 可选的元数据
 * @returns 日志记录ID
 */
export function logWorkflowStart(
  workflowId: string,
  stepId: string,
  agentId: string,
  metadata?: Record<string, any>
): string {
  const log: WorkflowLog = {
    id: generateLogId(),
    workflowId,
    stepId,
    agentId,
    status: 'started',
    timestamp: new Date(),
    metadata
  };
  
  saveLog(log);
  return log.id;
}

/**
 * 记录工作流步骤完成
 * @param logId 日志记录ID
 * @param status 执行状态
 * @param duration 执行时长（毫秒）
 * @param result 执行结果
 */
export function logWorkflowComplete(
  logId: string,
  status: 'completed' | 'failed',
  duration: number,
  result?: Record<string, any>
): void {
  const log = getLog(logId);
  if (!log) {
    console.warn(`Log with ID ${logId} not found`);
    return;
  }
  
  log.status = status;
  log.duration = duration;
  log.metadata = { ...log.metadata, ...(result || {}) };
  
  saveLog(log);
}

/**
 * 生成唯一的日志ID
 * @returns 日志ID字符串
 */
function generateLogId(): string {
  return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 保存日志记录到内存存储
 * @param log 日志记录
 */
function saveLog(log: WorkflowLog): void {
  if (!global.workflowLogs) {
    global.workflowLogs = [];
  }
  global.workflowLogs.push(log);
}

/**
 * 根据ID获取日志记录
 * @param logId 日志ID
 * @returns 日志记录或undefined
 */
function getLog(logId: string): WorkflowLog | undefined {
  return global.workflowLogs?.find(log => log.id === logId);
}

/**
 * 获取工作流的所有执行日志
 * @param workflowId 工作流ID
 * @returns 日志记录数组
 */
export function getWorkflowLogs(workflowId: string): WorkflowLog[] {
  return global.workflowLogs?.filter(log => log.workflowId === workflowId) || [];
}

/**
 * 清理过期的日志记录
 * @param maxAge 最大保留时间（毫秒）
 */
export function cleanupLogs(maxAge: number = 86400000): void {
  const cutoff = Date.now() - maxAge;
  if (global.workflowLogs) {
    global.workflowLogs = global.workflowLogs.filter(log => 
      new Date(log.timestamp).getTime() > cutoff
    );
  }
}
