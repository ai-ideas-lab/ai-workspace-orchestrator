import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
app.use(helmet());
app.use(cors());
app.use(express.json());
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'AI Workspace Orchestrator'
    });
});
app.get('/api/info', (req, res) => {
    res.json({
        name: 'AI Workspace Orchestrator',
        version: '1.0.0',
        description: '企业级AI工作流自动化平台',
        status: 'development'
    });
});
import executionsRouter from './routes/executions.js';
app.use('/api/executions', executionsRouter);
import aiEngineRouter from './routes/ai-engine.js';
app.use('/api/ai-engine', aiEngineRouter);
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: err.message
    });
});
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Not found'
    });
});
app.listen(PORT, () => {
    console.log(`🚀 AI Workspace Orchestrator running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`📋 API info: http://localhost:${PORT}/api/info`);
});
export default app;
//# sourceMappingURL=index.js.map