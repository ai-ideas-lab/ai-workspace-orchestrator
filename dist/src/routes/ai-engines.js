import express from 'express';
import { aiEngineConfigManager } from '../utils/ai-engine-config-manager.js';
const router = express.Router();
router.get('/', (req, res) => {
    try {
        const engines = aiEngineConfigManager.getSortedEngines();
        const stats = aiEngineConfigManager.getStatistics();
        res.json({
            success: true,
            data: {
                engines,
                statistics: stats,
            },
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString(),
        });
    }
});
router.get('/:id', (req, res) => {
    try {
        const engine = aiEngineConfigManager.getEngine(req.params.id);
        if (!engine) {
            return res.status(404).json({
                success: false,
                error: 'AI engine not found',
                timestamp: new Date().toISOString(),
            });
        }
        res.json({
            success: true,
            data: engine,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString(),
        });
    }
});
router.post('/', (req, res) => {
    try {
        const { name, type, apiKey, model, endpoint, maxTokens, temperature, enabled, priority, timeout, retryAttempts } = req.body;
        if (!name || !type || !apiKey || !model) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: name, type, apiKey, model',
                timestamp: new Date().toISOString(),
            });
        }
        const engine = aiEngineConfigManager.addEngine({
            name,
            type,
            apiKey,
            model,
            endpoint,
            maxTokens: maxTokens || 4000,
            temperature: temperature || 0.7,
            enabled: enabled !== undefined ? enabled : true,
            priority: priority || 10,
            timeout: timeout || 30000,
            retryAttempts: retryAttempts || 3,
        });
        res.status(201).json({
            success: true,
            data: engine,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString(),
        });
    }
});
router.put('/:id', (req, res) => {
    try {
        const updates = req.body;
        const engine = aiEngineConfigManager.updateEngine(req.params.id, updates);
        if (!engine) {
            return res.status(404).json({
                success: false,
                error: 'AI engine not found',
                timestamp: new Date().toISOString(),
            });
        }
        res.json({
            success: true,
            data: engine,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString(),
        });
    }
});
router.delete('/:id', (req, res) => {
    try {
        const deleted = aiEngineConfigManager.deleteEngine(req.params.id);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                error: 'AI engine not found',
                timestamp: new Date().toISOString(),
            });
        }
        res.json({
            success: true,
            message: 'AI engine deleted successfully',
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString(),
        });
    }
});
router.post('/:id/test', async (req, res) => {
    try {
        const isConnected = await aiEngineConfigManager.testEngineConnection(req.params.id);
        const engine = aiEngineConfigManager.getEngine(req.params.id);
        res.json({
            success: true,
            data: {
                engineId: req.params.id,
                engineName: engine?.name || 'Unknown',
                isConnected,
                timestamp: new Date().toISOString(),
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString(),
        });
    }
});
router.post('/test-all', async (req, res) => {
    try {
        const results = await aiEngineConfigManager.testAllConnections();
        const formattedResults = Array.from(results.entries()).map(([engineId, isConnected]) => {
            const engine = aiEngineConfigManager.getEngine(engineId);
            return {
                engineId,
                engineName: engine?.name || 'Unknown',
                isConnected,
            };
        });
        res.json({
            success: true,
            data: {
                results: formattedResults,
                total: formattedResults.length,
                connected: formattedResults.filter(r => r.isConnected).length,
                disconnected: formattedResults.filter(r => !r.isConnected).length,
            },
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString(),
        });
    }
});
router.get('/best', (req, res) => {
    try {
        const bestEngine = aiEngineConfigManager.getBestEngine();
        res.json({
            success: true,
            data: {
                engine: bestEngine,
                timestamp: new Date().toISOString(),
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString(),
        });
    }
});
router.get('/groups', (req, res) => {
    try {
        const groups = aiEngineConfigManager.getAllEngineGroups();
        res.json({
            success: true,
            data: groups,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString(),
        });
    }
});
router.post('/groups', (req, res) => {
    try {
        const { name, description, engineIds, loadBalancingStrategy } = req.body;
        if (!name || !engineIds) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: name, engineIds',
                timestamp: new Date().toISOString(),
            });
        }
        const group = aiEngineConfigManager.addEngineGroup({
            name,
            description,
            engineIds,
            loadBalancingStrategy: loadBalancingStrategy || 'round-robin',
        });
        res.status(201).json({
            success: true,
            data: group,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString(),
        });
    }
});
router.get('/statistics', (req, res) => {
    try {
        const stats = aiEngineConfigManager.getStatistics();
        res.json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString(),
        });
    }
});
export default router;
//# sourceMappingURL=ai-engines.js.map