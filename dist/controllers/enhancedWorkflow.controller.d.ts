import { Request, Response } from 'express';
export declare class EnhancedWorkflowController {
    private workflowService;
    constructor();
    getWorkflows(req: Request, res: Response): Promise<void>;
    createWorkflow(req: Request, res: Response): Promise<void>;
    getWorkflow(req: Request, res: Response): Promise<void>;
    updateWorkflow(req: Request, res: Response): Promise<void>;
    deleteWorkflow(req: Request, res: Response): Promise<void>;
    executeWorkflow(req: Request, res: Response): Promise<void>;
    getExecutionHistory(req: Request, res: Response): Promise<void>;
    validateWorkflow(req: Request, res: Response): Promise<void>;
    getExecutionPath(req: Request, res: Response): Promise<void>;
    cloneWorkflow(req: Request, res: Response): Promise<void>;
    private validatePaginationQuery;
    private validateCreateWorkflow;
    private validateUpdateWorkflow;
    private validateExecuteWorkflow;
    private validateExecutionHistoryQuery;
    private validateWorkflowConfig;
    private validateExecutionPath;
}
//# sourceMappingURL=enhancedWorkflow.controller.d.ts.map