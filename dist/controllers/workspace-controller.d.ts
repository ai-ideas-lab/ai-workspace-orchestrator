import { Request, Response } from 'express';
export declare class WorkspaceController {
    parseCommand(req: Request, res: Response): Promise<void>;
    registerEngine(req: Request, res: Response): Promise<void>;
    getSystemStatus(req: Request, res: Response): Promise<void>;
    getAvailableEngines(req: Request, res: Response): Promise<void>;
    executeWorkflowStep(req: Request, res: Response): Promise<void>;
    executeWorkflow(req: Request, res: Response): Promise<void>;
    createWorkflow(req: Request, res: Response): Promise<void>;
    getWorkflow(req: Request, res: Response): Promise<void>;
    cancelWorkflow(req: Request, res: Response): Promise<void>;
    getWorkflowTemplates(req: Request, res: Response): Promise<void>;
    searchWorkflowTemplates(req: Request, res: Response): Promise<void>;
    getRecommendedTemplates(req: Request, res: Response): Promise<void>;
    createWorkflowFromTemplate(req: Request, res: Response): Promise<void>;
    saveUserTemplate(req: Request, res: Response): Promise<void>;
    getUserTemplates(req: Request, res: Response): Promise<void>;
    deleteUserTemplate(req: Request, res: Response): Promise<void>;
    getPopularTemplates(req: Request, res: Response): Promise<void>;
    getTemplateStats(req: Request, res: Response): Promise<void>;
    getWorkflowExecutionLog(req: Request, res: Response): Promise<void>;
    getStepExecutionLogs(req: Request, res: Response): Promise<void>;
    getRecentExecutionHistory(req: Request, res: Response): Promise<void>;
    getPerformanceStats(req: Request, res: Response): Promise<void>;
    filterLogsByStatus(req: Request, res: Response): Promise<void>;
    getDashboardData(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=workspace-controller.d.ts.map