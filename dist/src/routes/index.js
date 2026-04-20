import { logger } from '../utils/logger.js';
export function setupRoutes(app, config) {
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
    logger.info('Routes setup completed - API endpoints ready for implementation');
}
//# sourceMappingURL=index.js.map