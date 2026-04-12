import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { aiEngineManager } from './services/ai-engine-manager';
import { databaseService } from './services/database-service';
import { naturalLanguageParser } from './services/natural-language-parser';
import { authMiddleware } from './services/auth-service';
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
async function initializeServices() {
    try {
        console.log('🚀 初始化AI Workspace Orchestrator服务...');
        await databaseService.connect();
        console.log('✅ 数据库连接成功');
        await aiEngineManager.initialize();
        console.log('✅ AI引擎管理器初始化成功');
        console.log('🎉 所有服务初始化完成');
    }
    catch (error) {
        console.error('❌ 服务初始化失败:', error);
        process.exit(1);
    }
}
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'AI Workspace Orchestrator is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        services: {
            database: 'connected',
            aiEngines: 'operational'
        }
    });
});
app.get('/status', async (req, res) => {
    try {
        const systemStatus = aiEngineManager.getSystemStatus();
        const engineDetails = aiEngineManager.getEngineDetails();
        res.json({
            success: true,
            status: systemStatus.status,
            timestamp: new Date().toISOString(),
            system: systemStatus,
            engines: engineDetails
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: '获取系统状态失败',
            message: error.message
        });
    }
});
app.get('/api/engines', async (req, res) => {
    try {
        const engines = aiEngineManager.getEngineDetails();
        res.json({
            success: true,
            data: engines,
            count: engines.length
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: '获取引擎列表失败',
            message: error.message
        });
    }
});
app.post('/api/nlp/parse', async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({
                success: false,
                error: '缺少文本内容',
                message: '请提供需要解析的自然语言文本'
            });
        }
        const result = await naturalLanguageParser.parseCommand(text);
        res.json({
            success: true,
            data: result,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: '自然语言解析失败',
            message: error.message
        });
    }
});
app.post('/api/ai/execute', authMiddleware, async (req, res) => {
    try {
        const { input, parameters, engineId } = req.body;
        if (!input) {
            return res.status(400).json({
                success: false,
                error: '缺少输入内容',
                message: '请提供AI任务的输入内容'
            });
        }
        const step = {
            id: `step_${Date.now()}`,
            engineId: engineId || 'openai-gpt-4',
            name: 'AI任务执行',
            input,
            parameters: parameters || {},
            output: null,
            status: 'pending',
            error: null,
            sequenceOrder: 0
        };
        const result = await aiEngineManager.executeStep(step);
        if (result.status === 'completed') {
            await databaseService.createExecution({
                workflowId: 'temp_workflow',
                userId: req.userId,
                status: 'completed',
                result: { output: result.output, engineUsed: result.engineUsed },
                executionTimeMs: 0
            });
        }
        else {
            await databaseService.createExecution({
                workflowId: 'temp_workflow',
                userId: req.userId,
                status: 'failed',
                errorMessage: result.error,
                executionTimeMs: 0
            });
        }
        res.json({
            success: true,
            data: result,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'AI任务执行失败',
            message: error.message
        });
    }
});
app.post('/api/ai/batch-execute', authMiddleware, async (req, res) => {
    try {
        const { steps } = req.body;
        if (!steps || !Array.isArray(steps) || steps.length === 0) {
            return res.status(400).json({
                success: false,
                error: '缺少任务步骤',
                message: '请提供要执行的任务步骤列表'
            });
        }
        const result = await aiEngineManager.executeSteps(steps);
        await databaseService.createExecution({
            workflowId: 'batch_execution',
            userId: req.userId,
            status: result.failedSteps.length > 0 ? 'partial' : 'completed',
            result: {
                total: result.stats.total,
                success: result.stats.success,
                failed: result.stats.failed,
                successRate: result.stats.successRate
            },
            executionTimeMs: 0
        });
        res.json({
            success: true,
            data: result,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: '批量AI任务执行失败',
            message: error.message
        });
    }
});
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password, role } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                error: '缺少必要字段',
                message: '请提供用户名、邮箱和密码'
            });
        }
        const { user, token } = await require('../services/auth-service').AuthService.register({
            username,
            email,
            password,
            role
        });
        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                },
                token
            },
            message: '用户注册成功'
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: '用户注册失败',
            message: error.message
        });
    }
});
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                error: '缺少必要字段',
                message: '请提供用户名和密码'
            });
        }
        const { user, token } = await require('../services/auth-service').AuthService.login({
            username,
            password
        });
        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                },
                token
            },
            message: '用户登录成功'
        });
    }
    catch (error) {
        res.status(401).json({
            success: false,
            error: '用户登录失败',
            message: error.message
        });
    }
});
app.get('/api/executions/history', authMiddleware, async (req, res) => {
    try {
        const { page = 1, limit = 10, workflowId, status, startDate, endDate } = req.query;
        const history = await databaseService.getExecutionHistory({
            page: parseInt(page),
            limit: parseInt(limit),
            workflowId,
            status,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
        });
        res.json({
            success: true,
            data: history,
            pagination: {
                current: parseInt(page),
                total: Math.ceil(history.length / parseInt(limit)),
                count: history.length
            }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: '获取执行历史失败',
            message: error.message
        });
    }
});
app.get('/api/executions/stats', async (req, res) => {
    try {
        const stats = await databaseService.getExecutionStats();
        res.json({
            success: true,
            data: stats,
            generatedAt: new Date().toISOString()
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: '获取执行统计失败',
            message: error.message
        });
    }
});
app.use((err, req, res, next) => {
    console.error('未处理的错误:', err);
    res.status(500).json({
        success: false,
        error: '内部服务器错误',
        message: process.env.NODE_ENV === 'development' ? err.message : '请稍后重试'
    });
});
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: '端点未找到',
        message: `路径 ${req.originalUrl} 不存在`
    });
});
async function startServer() {
    try {
        await initializeServices();
        app.listen(PORT, () => {
            console.log(`🚀 AI Workspace Orchestrator 服务启动成功`);
            console.log(`📡 服务器地址: http://localhost:${PORT}`);
            console.log(`🔧 环境: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🤖 AI引擎状态: ${aiEngineManager.getSystemStatus().status}`);
        });
    }
    catch (error) {
        console.error('❌ 服务器启动失败:', error);
        process.exit(1);
    }
}
process.on('SIGTERM', async () => {
    console.log('🔄 收到SIGTERM信号，正在优雅关闭...');
    try {
        await databaseService.disconnect();
        console.log('✅ 数据库连接已断开');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ 关闭过程中出现错误:', error);
        process.exit(1);
    }
});
process.on('SIGINT', async () => {
    console.log('🔄 收到SIGINT信号，正在优雅关闭...');
    try {
        await databaseService.disconnect();
        console.log('✅ 数据库连接已断开');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ 关闭过程中出现错误:', error);
        process.exit(1);
    }
});
startServer();
export default app;
//# sourceMappingURL=index-updated.js.map