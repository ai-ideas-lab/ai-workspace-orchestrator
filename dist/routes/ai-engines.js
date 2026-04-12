"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ai_engine_config_manager_js_1 = require("../utils/ai-engine-config-manager.js");
const router = express_1.default.Router();
router.get('/', (req, res) => {
    try {
        const engines = ai_engine_config_manager_js_1.aiEngineConfigManager.getSortedEngines();
        const stats = ai_engine_config_manager_js_1.aiEngineConfigManager.getStatistics();
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
        const engine = ai_engine_config_manager_js_1.aiEngineConfigManager.getEngine(req.params.id);
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
        const engine = ai_engine_config_manager_js_1.aiEngineConfigManager.addEngine({
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
        const engine = ai_engine_config_manager_js_1.aiEngineConfigManager.updateEngine(req.params.id, updates);
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
        const deleted = ai_engine_config_manager_js_1.aiEngineConfigManager.deleteEngine(req.params.id);
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
        const isConnected = await ai_engine_config_manager_js_1.aiEngineConfigManager.testEngineConnection(req.params.id);
        const engine = ai_engine_config_manager_js_1.aiEngineConfigManager.getEngine(req.params.id);
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
        const results = await ai_engine_config_manager_js_1.aiEngineConfigManager.testAllConnections();
        const formattedResults = Array.from(results.entries()).map(([engineId, isConnected]) => {
            const engine = ai_engine_config_manager_js_1.aiEngineConfigManager.getEngine(engineId);
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
        const bestEngine = ai_engine_config_manager_js_1.aiEngineConfigManager.getBestEngine();
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
        const groups = ai_engine_config_manager_js_1.aiEngineConfigManager.getAllEngineGroups();
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
        const group = ai_engine_config_manager_js_1.aiEngineConfigManager.addEngineGroup({
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
        const stats = ai_engine_config_manager_js_1.aiEngineConfigManager.getStatistics();
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
exports.default = router;
//# sourceMappingURL=ai-engines.js.map