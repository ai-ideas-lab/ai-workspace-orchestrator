"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const ai_engine_js_1 = require("./ai-engine.js");
const router = express_1.default.Router();
const createTaskSchema = zod_1.z.object({
    type: zod_1.z.enum(['text-generation', 'code-analysis', 'image-generation', 'document-processing']),
    providerId: zod_1.z.string().min(1, '提供商ID不能为空'),
    input: zod_1.z.string().min(1, '输入内容不能为空'),
    parameters: zod_1.z.record(zod_1.z.any()).optional(),
});
router.get('/tasks', (req, res) => {
    try {
        const activeTasks = ai_engine_js_1.aiEngine.getActiveTasks();
        res.json({
            success: true,
            data: activeTasks,
            count: activeTasks.length,
            queue: ai_engine_js_1.aiEngine.getQueueStatus()
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: '获取任务列表失败',
            details: error instanceof Error ? error.message : '未知错误'
        });
    }
});
router.post('/task', (req, res) => {
    try {
        const validatedData = createTaskSchema.parse(req.body);
        const activeTasks = ai_engine_js_1.aiEngine.getActiveTasks();
        const providerTask = activeTasks.find(task => task.provider.id === validatedData.providerId);
        if (!providerTask) {
            return res.status(404).json({
                success: false,
                error: '未找到指定的AI提供商配置'
            });
        }
        const newTask = ai_engine_js_1.aiEngine.executeTask({
            type: validatedData.type,
            provider: providerTask.provider,
            input: validatedData.input,
            parameters: validatedData.parameters || {}
        });
        res.status(201).json({
            success: true,
            data: newTask,
            message: 'AI任务创建成功'
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: '参数验证失败',
                details: error.errors
            });
        }
        res.status(500).json({
            success: false,
            error: '创建任务失败',
            details: error instanceof Error ? error.message : '未知错误'
        });
    }
});
router.get('/task/:taskId', (req, res) => {
    try {
        const { taskId } = req.params;
        const task = ai_engine_js_1.aiEngine.getTaskStatus(taskId);
        if (!task) {
            return res.status(404).json({
                success: false,
                error: '任务不存在'
            });
        }
        res.json({
            success: true,
            data: task
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: '获取任务状态失败',
            details: error instanceof Error ? error.message : '未知错误'
        });
    }
});
router.delete('/task/:taskId', (req, res) => {
    try {
        const { taskId } = req.params;
        const cancelled = ai_engine_js_1.aiEngine.cancelTask(taskId);
        if (!cancelled) {
            return res.status(404).json({
                success: false,
                error: '任务不存在或无法取消'
            });
        }
        res.json({
            success: true,
            message: '任务取消成功'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: '取消任务失败',
            details: error instanceof Error ? error.message : '未知错误'
        });
    }
});
router.get('/queue', (req, res) => {
    try {
        const queueStatus = ai_engine_js_1.aiEngine.getQueueStatus();
        res.json({
            success: true,
            data: queueStatus
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: '获取队列状态失败',
            details: error instanceof Error ? error.message : '未知错误'
        });
    }
});
router.post('/cleanup', (req, res) => {
    try {
        const { maxAge } = req.body;
        const maxAgeNumber = typeof maxAge === 'number' ? maxAge : 3600000;
        ai_engine_js_1.aiEngine.cleanupCompletedTasks(maxAgeNumber);
        res.json({
            success: true,
            message: '已完成任务清理完成'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: '清理任务失败',
            details: error instanceof Error ? error.message : '未知错误'
        });
    }
});
router.post('/test-engine', async (req, res) => {
    try {
        const { providerId, testInput = 'Hello, this is a test message.' } = req.body;
        const activeTasks = ai_engine_js_1.aiEngine.getActiveTasks();
        const providerTask = activeTasks.find(task => task.provider.id === providerId);
        if (!providerTask) {
            return res.status(404).json({
                success: false,
                error: '未找到指定的AI提供商配置'
            });
        }
        const testTask = ai_engine_js_1.aiEngine.executeTask({
            type: 'text-generation',
            provider: providerTask.provider,
            input: testInput,
            parameters: {}
        });
        const maxWaitTime = 30000;
        const startTime = Date.now();
        while (Date.now() - startTime < maxWaitTime) {
            const currentTask = ai_engine_js_1.aiEngine.getTaskStatus(testTask.id);
            if (currentTask && (currentTask.status === 'completed' || currentTask.status === 'failed')) {
                return res.json({
                    success: true,
                    data: currentTask,
                    message: 'AI引擎测试完成'
                });
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        res.status(408).json({
            success: false,
            error: '测试超时',
            data: ai_engine_js_1.aiEngine.getTaskStatus(testTask.id)
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: '测试AI引擎失败',
            details: error instanceof Error ? error.message : '未知错误'
        });
    }
});
router.get('/task-types', (req, res) => {
    const taskTypes = [
        {
            id: 'text-generation',
            name: '文本生成',
            description: '生成各种类型的文本内容，如文章、邮件、创意写作等',
            examples: ['写一封感谢信', '生成产品描述', '创作故事']
        },
        {
            id: 'code-analysis',
            name: '代码分析',
            description: '分析代码质量、提供改进建议、解释代码功能',
            examples: ['分析这段代码的性能', '优化这个函数', '解释这段逻辑']
        },
        {
            id: 'image-generation',
            name: '图像生成',
            description: '根据描述生成图像内容（需要支持图像生成的模型）',
            examples: ['生成一个科技感的logo', '创建一个自然风景图', '设计一个卡通角色']
        },
        {
            id: 'document-processing',
            name: '文档处理',
            description: '处理和分析各种文档内容，提取关键信息',
            examples: ['总结这篇文档', '提取关键数据', '分析文档结构']
        }
    ];
    res.json({
        success: true,
        data: taskTypes
    });
});
exports.default = router;
//# sourceMappingURL=ai-task-service.js.map