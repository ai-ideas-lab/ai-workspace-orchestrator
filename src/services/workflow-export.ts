import { WorkflowExecutor } from './workflow-executor';

/**
 * 轻量级工作流导出服务：将工作流定义导出为可移植的 JSON 格式。
 */
export class WorkflowExportService {
  /**
   * 创建工作流导出服务实例
   * @param executor 工作流执行器实例，用于获取工作流定义
   */
  constructor(private executor: WorkflowExecutor) {}

  /**
   * 导出单个工作流为 JSON 字符串
   * 
   * 将指定工作流转换为标准化的 JSON 格式，包含元数据信息，
   * 便于备份、迁移和版本控制。
   * 
   * @param workflowId 要导出工作流的唯一标识符
   * @returns JSON 格式的工作流字符串，包含导出时间戳和完整的工作流定义
   * @throws Error 当指定的工作流不存在时抛出异常
   * @example
   * // 导出单个工作流
   * const exportService = new WorkflowExportService(executor);
   * const jsonExport = exportService.exportAsJson('workflow-123');
   * console.log(jsonExport);
   * // 输出格式:
   * // {
   * //   "exportedAt": "2026-04-13T01:02:00.000Z",
   * //   "id": "workflow-123",
   * //   "name": "数据分析流程",
   * //   "steps": [...]
   * // }
   */
  exportAsJson(workflowId: string): string {
    const wf = this.executor.getWorkflow(workflowId);
    if (!wf) throw new Error(`Workflow ${workflowId} not found`);
    return JSON.stringify({ exportedAt: new Date().toISOString(), ...wf }, null, 2);
  }

  /**
   * 批量导出所有工作流
   * 
   * 将系统中所有工作流一次性导出为对象格式，便于批量处理和迁移。
   * 返回一个以工作流ID为键的工作流对象映射。
   * 
   * @returns 包含所有工作流的对象，键为工作流ID，值为工作流定义
   * @example
   * // 批量导出所有工作流
   * const exportService = new WorkflowExportService(executor);
   * const allWorkflows = exportService.exportAll();
   * 
   * // 遍历导出的工作流
   * Object.entries(allWorkflows).forEach(([id, workflow]) => {
   *   console.log(`工作流 ${id}: ${workflow.name}`);
   * });
   * 
   * // 保存到文件
   * const fs = require('fs');
   * fs.writeFileSync('workflows-backup.json', JSON.stringify(allWorkflows, null, 2));
   */
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
