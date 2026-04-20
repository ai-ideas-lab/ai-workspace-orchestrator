"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const ai_workflow_executor_js_1 = require("./ai-workflow-executor.js");
const router = express_1.default.Router();
const createWorkflowSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, '工作流名称不能为空'),
    description: zod_1.z.string().min(1, '工作流描述不能为空'),
    steps: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string().min(1, '步骤ID不能为空'),
        name: zod_1.z.string().min(1, '步骤名称不能为空'),
        type: zod_1.z.enum(['ai-task', 'condition', 'parallel', 'sequential']),
        config: zod_1.z.record(zod_1.z.any()),
        nextSteps: zod_1.z.array(zod_1.z.string())
    })).min(1, '至少需要一个步骤')
});
const updateWorkflowStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['draft', 'active', 'paused'])
});
router.get('/workflows', (req, res) => {
    try {
        ai_workflow_executor_js_1.aiWorkflowExecutor.createSampleWorkflows();
        const workflows = [
            {
                id: 'doc-analysis-sample',
                name: '文档分析流程',
                description: '分析文档内容并生成摘要',
                status: 'active',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                stepsCount: 2
            },
            {
                id: 'code-review-sample',
                name: '代码审查流程',
                description: '对代码进行质量审查和建议',
                status: 'active',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                stepsCount: 2
            }
        ];
        res.json({
            success: true,
            data: workflows,
            count: workflows.length
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: '获取工作流列表失败',
            details: error instanceof Error ? error.message : '未知错误'
        });
    }
});
router.get('/workflows/:workflowId', (req, res) => {
    try {
        const { workflowId } = req.params;
        const workflows = ai_workflow_executor_js_1.aiWorkflowExecutor.createSampleWorkflows();
        const workflow = {
            id: workflowId,
            name: '示例工作流',
            description: '这是一个示例工作流，演示AI工作流执行功能',
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            steps: [
                {
                    id: 'step1',
                    name: '第一步',
                    type: 'ai-task',
                    config: {
                        input: '测试输入内容',
                        providerId: 'test-provider',
                        taskType: 'text-generation',
                        parameters: {}
                    },
                    nextSteps: ['step2']
                },
                {
                    id: 'step2',
                    name: '第二步',
                    type: 'text-generation',
                    config: {
                        input: '{{step1_result}}',
                        providerId: 'test-provider',
                        taskType: 'text-generation',
                        parameters: {}
                    },
                    nextSteps: []
                }
            ]
        };
        if (!workflow) {
            return res.status(404).json({
                success: false,
                error: '工作流不存在'
            });
        }
        res.json({
            success: true,
            data: workflow
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: '获取工作流详情失败',
            details: error instanceof Error ? error.message : '未知错误'
        });
    }
});
router.post('/workflows', (req, res) => {
    try {
        const validatedData = createWorkflowSchema.parse(req.body);
        const workflow = {
            id: `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: validatedData.name,
            description: validatedData.description,
            steps: validatedData.steps,
            status: 'draft',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        ai_workflow_executor_js_1.aiWorkflowExecutor.registerWorkflow(workflow);
        res.status(201).json({
            success: true,
            data: workflow,
            message: '工作流创建成功'
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
            error: '创建工作流失败',
            details: error instanceof Error ? error.message : '未知错误'
        });
    }
});
router.put('/workflows/:workflowId/status', (req, res) => {
    try {
        const { workflowId } = req.params;
        const validatedData = updateWorkflowStatusSchema.parse(req.body);
        res.json({
            success: true,
            data: {
                id: workflowId,
                status: validatedData.status,
                updatedAt: new Date().toISOString()
            },
            message: '工作流状态更新成功'
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
            error: '更新工作流状态失败',
            details: error instanceof Error ? error.message : '未知错误'
        });
    }
});
router.post('/workflows/:workflowId/execute', async (req, res) => {
    try {
        const { workflowId } = req.params;
        const { inputData = {} } = req.body;
        const execution = await ai_workflow_executor_js_1.aiWorkflowExecutor.executeWorkflow(workflowId, inputData);
        res.status(201).json({
            success: true,
            data: execution,
            message: '工作流执行已启动'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: '执行工作流失败',
            details: error instanceof Error ? error.message : '未知错误'
        });
    }
});
router.get('/workflows/:workflowId/executions', (req, res) => {
    try {
        const { workflowId } = req.params;
        const executions = ai_workflow_executor_js_1.aiWorkflowExecutor.getWorkflowExecutions(workflowId);
        res.json({
            success: true,
            data: executions,
            count: executions.length
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: '获取执行历史失败',
            details: error instanceof Error ? error.message : '未知错误'
        });
    }
});
router.get('/executions/:executionId', (req, res) => {
    try {
        const { executionId } = req.params;
        const execution = ai_workflow_executor_js_1.aiWorkflowExecutor.getExecutionHistory(executionId);
        if (!execution) {
            return res.status(404).json({
                success: false,
                error: '执行记录不存在'
            });
        }
        res.json({
            success: true,
            data: execution
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: '获取执行详情失败',
            details: error instanceof Error ? error.message : '未知错误'
        });
    }
});
router.delete('/executions/:executionId', (req, res) => {
    try {
        const { executionId } = req.params;
        const cancelled = ai_workflow_executor_js_1.aiWorkflowExecutor.cancelExecution(executionId);
        if (!cancelled) {
            return res.status(400).json({
                success: false,
                error: '无法取消执行：执行不存在或已完成'
            });
        }
        res.json({
            success: true,
            message: '执行已取消'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: '取消执行失败',
            details: error instanceof Error ? error.message : '未知错误'
        });
    }
});
router.get('/executions', (req, res) => {
    try {
        const executions = ai_workflow_executor_js_1.aiWorkflowExecutor.getAllExecutions();
        res.json({
            success: true,
            data: executions,
            count: executions.length
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: '获取执行历史失败',
            details: error instanceof Error ? error.message : '未知错误'
        });
    }
});
router.post('/executions/cleanup', (req, res) => {
    try {
        const { maxAge = 86400000 } = req.body;
        const cleanedCount = ai_workflow_executor_js_1.aiWorkflowExecutor.cleanupExecutions(maxAge);
        res.json({
            success: true,
            message: `已清理 ${cleanedCount} 条执行记录`,
            data: { cleanedCount, maxAge }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: '清理执行历史失败',
            details: error instanceof Error ? error.message : '未知错误'
        });
    }
});
router.get('/stats', (req, res) => {
    try {
        const executions = ai_workflow_executor_js_1.aiWorkflowExecutor.getAllExecutions();
        const stats = {
            totalExecutions: executions.length,
            successfulExecutions: executions.filter(e => e.status === 'completed').length,
            failedExecutions: executions.filter(e => e.status === 'failed').length,
            runningExecutions: executions.filter(e => e.status === 'running').length,
            averageDuration: executions.length > 0
                ? executions.reduce((sum, e) => sum + (e.duration || 0), 0) / executions.length
                : 0
        };
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: '获取统计信息失败',
            details: error instanceof Error ? error.message : '未知错误'
        });
    }
});
router.get('/step-types', (req, res) => {
    const stepTypes = [
        {
            id: 'ai-task',
            name: 'AI任务',
            description: '执行AI相关的任务，如文本生成、代码分析等',
            configSchema: {
                input: 'string (必填) - 任务输入内容，支持模板变量',
                providerId: 'string (必填) - AI提供商ID',
                taskType: 'string (必填) - 任务类型',
                parameters: 'object (可选) - 任务参数'
            }
        },
        {
            id: 'condition',
            name: '条件判断',
            description: '根据条件决定后续执行路径',
            configSchema: {
                condition: 'string (必填) - 条件表达式',
                trueSteps: 'array (可选) - 条件为真时执行的步骤',
                falseSteps: 'array (可选) - 条件为假时执行的步骤'
            }
        },
        {
            id: 'parallel',
            name: '并行执行',
            description: '同时执行多个步骤',
            configSchema: {
                steps: 'array (必填) - 并行执行的步骤列表'
            }
        },
        {
            id: 'sequential',
            name: '顺序执行',
            description: '按顺序执行多个步骤',
            configSchema: {
                steps: 'array (必填) - 顺序执行的步骤列表'
            }
        }
    ];
    res.json({
        success: true,
        data: stepTypes
    });
});
exports.default = router;
//# sourceMappingURL=ai-workflow-service.js.map