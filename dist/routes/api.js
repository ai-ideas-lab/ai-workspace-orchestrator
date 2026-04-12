"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_1 = __importDefault(require("../services/database"));
const ai_engine_1 = __importDefault(require("../services/ai-engine"));
const workflow_engine_1 = __importDefault(require("../services/workflow-engine"));
const router = express_1.default.Router();
const db = database_1.default.getInstance();
const aiEngine = new ai_engine_1.default();
const workflowEngine = new workflow_engine_1.default();
router.get('/health', async (req, res) => {
    try {
        const dbHealthy = await db.healthCheck();
        res.json({
            status: 'ok',
            database: dbHealthy ? 'connected' : 'disconnected',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        res.status(500).json({
            status: 'error',
            database: 'disconnected',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        });
    }
});
router.get('/ai-engines', async (req, res) => {
    try {
        const engines = aiEngine.getAllEngines();
        res.json({
            success: true,
            data: engines,
            count: engines.length
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.post('/ai-engines/:engineId/execute', async (req, res) => {
    try {
        const { engineId } = req.params;
        const { task, options } = req.body;
        if (!task) {
            return res.status(400).json({
                success: false,
                error: 'Task is required'
            });
        }
        const response = await aiEngine.executeTask(engineId, task, options);
        res.json({
            success: response.success,
            data: response.data,
            error: response.error,
            executionTime: response.executionTime
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/workflows', async (req, res) => {
    try {
        const prisma = db.getPrisma();
        const workflows = await prisma.workflow.findMany({
            include: {
                steps: {
                    orderBy: { order: 'asc' }
                },
                executions: {
                    orderBy: { createdAt: 'desc' },
                    take: 10
                }
            }
        });
        res.json({
            success: true,
            data: workflows,
            count: workflows.length
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.post('/workflows', async (req, res) => {
    try {
        const prisma = db.getPrisma();
        const { name, description, steps, trigger } = req.body;
        const workflow = await prisma.workflow.create({
            data: {
                name,
                description,
                config: { trigger },
                steps: {
                    create: steps.map((step, index) => ({
                        name: step.name,
                        type: step.type,
                        config: step.config,
                        order: index,
                        dependencies: step.dependencies || []
                    }))
                }
            },
            include: {
                steps: true
            }
        });
        res.json({
            success: true,
            data: workflow
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.post('/workflows/:workflowId/execute', async (req, res) => {
    try {
        const { workflowId } = req.params;
        const { inputData, userId } = req.body;
        const execution = await workflowEngine.executeWorkflow(workflowId, inputData, userId);
        res.json({
            success: true,
            data: execution
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/workflows/:workflowId/executions', async (req, res) => {
    try {
        const { workflowId } = req.params;
        const prisma = db.getPrisma();
        const executions = await prisma.workflowExecution.findMany({
            where: { workflowId },
            orderBy: { createdAt: 'desc' },
            take: 20,
            include: {
                steps: {
                    include: {
                        execution: true
                    }
                }
            }
        });
        res.json({
            success: true,
            data: executions,
            count: executions.length
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/executions/:executionId/steps', async (req, res) => {
    try {
        const { executionId } = req.params;
        const prisma = db.getPrisma();
        const steps = await prisma.executionStep.findMany({
            where: { executionId },
            orderBy: { order: 'asc' },
            include: {
                step: true
            }
        });
        res.json({
            success: true,
            data: steps,
            count: steps.length
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/executions/history', async (req, res) => {
    try {
        const prisma = db.getPrisma();
        const { page = 1, limit = 20 } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        const [executions, totalCount] = await Promise.all([
            prisma.workflowExecution.findMany({
                orderBy: { createdAt: 'desc' },
                skip: offset,
                take: Number(limit),
                include: {
                    workflow: true,
                    steps: true
                }
            }),
            prisma.workflowExecution.count()
        ]);
        res.json({
            success: true,
            data: executions,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total: totalCount,
                pages: Math.ceil(totalCount / Number(limit))
            }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/stats/summary', async (req, res) => {
    try {
        const prisma = db.getPrisma();
        const [totalWorkflows, totalExecutions, successfulExecutions, failedExecutions] = await Promise.all([
            prisma.workflow.count(),
            prisma.workflowExecution.count(),
            prisma.workflowExecution.count({ where: { status: 'COMPLETED' } }),
            prisma.workflowExecution.count({ where: { status: 'FAILED' } })
        ]);
        res.json({
            success: true,
            data: {
                workflows: totalWorkflows,
                executions: totalExecutions,
                successful: successfulExecutions,
                failed: failedExecutions,
                successRate: totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0
            }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=api.js.map