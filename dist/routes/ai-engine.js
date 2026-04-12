import { Router } from 'express';
import { aiEngineService } from '../services/ai-engine-service.js';
const router = Router();
router.get('/engines', async (req, res) => {
    try {
        const engines = aiEngineService.getAvailableEngines();
        res.json({
            success: true,
            data: { engines },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch AI engines',
            message: error.message
        });
    }
});
router.post('/select-engine', async (req, res) => {
    try {
        const { taskType, requirements } = req.body;
        if (!taskType) {
            return res.status(400).json({
                success: false,
                error: 'Task type is required'
            });
        }
        const engine = await aiEngineService.selectBestEngine(taskType, requirements);
        res.json({
            success: true,
            data: engine,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to select AI engine',
            message: error.message
        });
    }
});
router.post('/execute', async (req, res) => {
    try {
        const { engine, task } = req.body;
        if (!engine || !task) {
            return res.status(400).json({
                success: false,
                error: 'Engine and task are required'
            });
        }
        const result = await aiEngineService.executeAITask(engine, task);
        res.json({
            success: true,
            data: result,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to execute AI task',
            message: error.message
        });
    }
});
router.post('/batch-execute', async (req, res) => {
    try {
        const { tasks } = req.body;
        if (!tasks || !Array.isArray(tasks)) {
            return res.status(400).json({
                success: false,
                error: 'Tasks must be an array'
            });
        }
        const results = await aiEngineService.executeTasksBatch(tasks);
        res.json({
            success: true,
            data: { results },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to execute batch tasks',
            message: error.message
        });
    }
});
router.post('/task-suggestions', async (req, res) => {
    try {
        const { taskType } = req.body;
        if (!taskType) {
            return res.status(400).json({
                success: false,
                error: 'Task type is required'
            });
        }
        const suggestions = await aiEngineService.getTaskSuggestions(taskType);
        res.json({
            success: true,
            data: { suggestions },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch task suggestions',
            message: error.message
        });
    }
});
router.post('/estimate-cost', async (req, res) => {
    try {
        const { engine, prompt, estimatedTokens } = req.body;
        if (!engine) {
            return res.status(400).json({
                success: false,
                error: 'Engine is required'
            });
        }
        const cost = await aiEngineService.estimateTaskCost(engine, prompt, estimatedTokens);
        res.json({
            success: true,
            data: cost,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to estimate task cost',
            message: error.message
        });
    }
});
router.post('/validate-task', async (req, res) => {
    try {
        const { task } = req.body;
        if (!task) {
            return res.status(400).json({
                success: false,
                error: 'Task is required'
            });
        }
        const validation = aiEngineService.validateTask(task);
        res.json({
            success: true,
            data: validation,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to validate task',
            message: error.message
        });
    }
});
export default router;
//# sourceMappingURL=ai-engine.js.map