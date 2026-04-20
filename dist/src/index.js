import express from 'express';
import { z } from 'zod';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { workflowService } from './services/workflowService';
import { aiEngineService } from './services/aiEngineService';
const app = express();
const PORT = process.env.PORT || 3001;
const prisma = new PrismaClient();
app.use(express.json());
app.use(cors());
async function initializeDatabase() {
    try {
        await prisma.$connect();
        console.log('✅ Database connected successfully');
        await import('@prisma/client');
        console.log('✅ Prisma client generated');
    }
    catch (error) {
        console.error('❌ Database connection failed:', error);
        process.exit(1);
    }
}
const createWorkflowSchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().min(1).max(500),
    config: z.record(z.any()).optional()
});
const updateWorkflowSchema = createWorkflowSchema.partial();
app.get('/health', async (req, res) => {
    try {
        await prisma.$queryRaw `SELECT 1`;
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            database: 'connected',
            version: '1.0.0'
        });
    }
    catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            database: 'disconnected',
            error: error.message
        });
    }
});
app.post('/workflows', async (req, res) => {
    try {
        const validatedData = createWorkflowSchema.parse(req.body);
        const workflow = await workflowService.createWorkflow(validatedData);
        res.status(201).json(workflow);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
app.get('/workflows', async (req, res) => {
    try {
        const workflows = await workflowService.getWorkflows();
        res.json(workflows);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get('/workflows/:id', async (req, res) => {
    try {
        const workflow = await workflowService.getWorkflow(req.params.id);
        if (!workflow) {
            return res.status(404).json({ error: 'Workflow not found' });
        }
        res.json(workflow);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.post('/workflows/:id/execute', async (req, res) => {
    try {
        const execution = await workflowService.executeWorkflow(req.params.id, {
            metadata: req.body.metadata || {},
            triggeredBy: req.body.triggeredBy || 'api'
        });
        res.status(201).json(execution);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get('/executions/:id', async (req, res) => {
    try {
        const execution = await workflowService.getExecution(req.params.id);
        if (!execution) {
            return res.status(404).json({ error: 'Execution not found' });
        }
        res.json(execution);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get('/executions', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const executions = await workflowService.getExecutions(limit);
        res.json(executions);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get('/stats/workflows', async (req, res) => {
    try {
        const [totalWorkflows, totalExecutions, recentExecutions] = await Promise.all([
            prisma.workflow.count(),
            prisma.execution.count(),
            prisma.execution.count({
                where: {
                    createdAt: {
                        gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
                    }
                }
            })
        ]);
        const successRate = await prisma.execution.aggregate({
            _avg: {}
        });
        res.json({
            totalWorkflows,
            totalExecutions,
            recentExecutions,
            successRate: 0
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.ws('/executions/:id/stream', (ws, req) => {
    ws.on('connection', (socket) => {
        console.log('Client connected to execution stream');
        socket.send(JSON.stringify({
            type: 'connected',
            executionId: req.params.id,
            timestamp: new Date().toISOString()
        }));
        socket.on('close', () => {
            console.log('Client disconnected from execution stream');
        });
    });
});
app.get('/ai-engines/status', async (req, res) => {
    try {
        const status = await aiEngineService.getEngineStatus();
        res.json(status);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get('/ai-engines/available', async (req, res) => {
    try {
        const engines = await aiEngineService.getAvailableEngines();
        res.json({ engines });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.post('/ai-engines/:engine/test', async (req, res) => {
    try {
        const { engine } = req.params;
        const isAvailable = await aiEngineService.testConnection(engine);
        res.json({
            engine,
            available: isAvailable,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.post('/ai-engines/:engine/execute', async (req, res) => {
    try {
        const { engine } = req.params;
        const { prompt, systemPrompt, maxTokens, temperature, jsonMode, context } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }
        const result = await aiEngineService.executeEngine(engine, {
            prompt,
            systemPrompt,
            maxTokens,
            temperature,
            jsonMode,
            context,
        });
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
async function initializeAIEngines() {
    try {
        console.log('🤖 Initializing AI Engines...');
        const engineConfigs = [];
        if (process.env.OPENAI_API_KEY) {
            engineConfigs.push({
                provider: 'openai',
                model: process.env.OPENAI_MODEL || 'gpt-4-turbo',
                apiKey: process.env.OPENAI_API_KEY,
                maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 4000,
                temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7,
            });
        }
        if (process.env.ANTHROPIC_API_KEY) {
            engineConfigs.push({
                provider: 'anthropic',
                model: process.env.ANTHROPIC_MODEL || 'claude-3-sonnet',
                apiKey: process.env.ANTHROPIC_API_KEY,
                maxTokens: parseInt(process.env.ANTHROPIC_MAX_TOKENS) || 4000,
                temperature: parseFloat(process.env.ANTHROPIC_TEMPERATURE) || 0.7,
            });
        }
        if (process.env.GOOGLE_API_KEY) {
            engineConfigs.push({
                provider: 'google',
                model: 'gemini-pro',
                apiKey: process.env.GOOGLE_API_KEY,
                maxTokens: parseInt(process.env.GOOGLE_MAX_TOKENS) || 4000,
                temperature: parseFloat(process.env.GOOGLE_TEMPERATURE) || 0.7,
            });
        }
        if (engineConfigs.length > 0) {
            aiEngineService.initializeEngines(engineConfigs);
            console.log(`✅ Initialized ${engineConfigs.length} AI engines`);
            for (const config of engineConfigs) {
                const isWorking = await aiEngineService.testConnection(config.provider);
                console.log(`${isWorking ? '✅' : '❌'} ${config.provider}: ${isWorking ? 'Working' : 'Failed to connect'}`);
            }
        }
        else {
            console.log('⚠️  No AI engine API keys configured. AI features will be limited.');
        }
    }
    catch (error) {
        console.error('❌ Error initializing AI engines:', error);
    }
}
async function seedDatabase() {
    try {
        const existingWorkflows = await prisma.workflow.count();
        if (existingWorkflows === 0) {
            console.log('🌱 Seeding database with sample workflows...');
            await prisma.workflow.createMany({
                data: [
                    {
                        name: '市场分析报告生成',
                        description: '使用AI分析市场数据并生成综合报告',
                        config: {
                            aiProvider: 'openai',
                            model: 'gpt-4',
                            analysisDepth: 'comprehensive'
                        },
                        status: 'PUBLISHED'
                    },
                    {
                        name: '代码审查与优化',
                        description: '自动审查代码质量并提供优化建议',
                        config: {
                            aiProvider: 'anthropic',
                            model: 'claude-3',
                            focusAreas: ['performance', 'security', 'readability']
                        },
                        status: 'PUBLISHED'
                    },
                    {
                        name: '客户反馈分析',
                        description: '分析客户反馈并提取关键洞察',
                        config: {
                            aiProvider: 'google',
                            model: 'gemini-pro',
                            analysisType: 'sentiment',
                            categories: ['product', 'service', 'pricing']
                        },
                        status: 'DRAFT'
                    }
                ]
            });
            console.log('✅ Database seeded successfully');
        }
    }
    catch (error) {
        console.error('❌ Database seeding failed:', error);
    }
}
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
});
async function startServer() {
    try {
        await initializeDatabase();
        await initializeAIEngines();
        await seedDatabase();
        app.listen(PORT, () => {
            console.log(`🚀 AI Workspace Orchestrator API server running on port ${PORT}`);
            console.log(`📊 Health check: http://localhost:${PORT}/health`);
            console.log(`🔗 API documentation: http://localhost:${PORT}/workflows`);
            console.log(`📈 Stats: http://localhost:${PORT}/stats/workflows`);
            console.log(`🤖 AI engines: ${aiEngineService.getAvailableEngines().join(', ') || 'None configured'}`);
        });
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}
startServer();
export default app;
//# sourceMappingURL=index.js.map