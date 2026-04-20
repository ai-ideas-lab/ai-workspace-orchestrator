import { WorkflowExecutor } from './workflow-executor';
export declare class WorkflowExportService {
    private executor;
    constructor(executor: WorkflowExecutor);
    exportAsJson(workflowId: string): string;
    exportAll(): Record<string, any>;
}
//# sourceMappingURL=workflow-export.d.ts.map