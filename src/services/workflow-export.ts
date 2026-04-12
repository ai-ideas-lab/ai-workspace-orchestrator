import { WorkflowExecutor } from './workflow-executor';

/**
 * 轻量级工作流导出服务：将工作流定义导出为可移植的 JSON 格式。
 */
export class WorkflowExportService {
  constructor(private executor: WorkflowExecutor) {}

  /** 导出单个工作流为 JSON 字符串 */
  exportAsJson(workflowId: string): string {
    const wf = this.executor.getWorkflow(workflowId);
    if (!wf) throw new Error(`Workflow ${workflowId} not found`);
    return JSON.stringify({ exportedAt: new Date().toISOString(), ...wf }, null, 2);
  }

  /** 批量导出所有工作流 */
  exportAll(): Record<string, any> {
    const ids = this.executor.listWorkflows?.() ?? [];
    const result: Record<string, any> = {};
    for (const id of ids) {
      const wf = this.executor.getWorkflow(id);
      if (wf) result[id] = wf;
    }
    return result;
  }
}
