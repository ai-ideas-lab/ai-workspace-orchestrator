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

function generateLogId(): string {
  return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function saveLog(log: WorkflowLog): void {
  if (!global.workflowLogs) {
    global.workflowLogs = [];
  }
  global.workflowLogs.push(log);
}

function getLog(logId: string): WorkflowLog | undefined {
  return global.workflowLogs?.find(log => log.id === logId);
}

export function getWorkflowLogs(workflowId: string): WorkflowLog[] {
  return global.workflowLogs?.filter(log => log.workflowId === workflowId) || [];
}

export function cleanupLogs(maxAge: number = 86400000): void {
  const cutoff = Date.now() - maxAge;
  if (global.workflowLogs) {
    global.workflowLogs = global.workflowLogs.filter(log => 
      new Date(log.timestamp).getTime() > cutoff
    );
  }
}
