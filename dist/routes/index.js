"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupRoutes = setupRoutes;
const logger_js_1 = require("../utils/logger.js");
function setupRoutes(app, config) {
    const apiRouter = express.Router();
    apiRouter.get('/', (req, res) => {
        res.json({
            service: 'AI Workspace Orchestrator API',
            version: '1.0.0',
            status: 'operational',
            timestamp: new Date().toISOString(),
            availableAIProviders: config.ai ? Object.keys(config.ai).filter(p => config.ai[p].apiKey) : []
        });
    });
    app.use('/api', apiRouter);
    logger_js_1.logger.info('Routes setup completed - API endpoints ready for implementation');
}
//# sourceMappingURL=index.js.map