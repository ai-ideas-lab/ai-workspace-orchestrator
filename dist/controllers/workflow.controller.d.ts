import { Request, Response } from 'express';
export declare class WorkflowController {
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
}
//# sourceMappingURL=workflow.controller.d.ts.map