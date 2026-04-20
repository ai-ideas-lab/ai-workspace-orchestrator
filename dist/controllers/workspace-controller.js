import { naturalLanguageParser } from '../services/natural-language-parser';
import { aiScheduler } from '../services/ai-scheduler';
import { executionLogger } from '../services/execution-logger';
export class WorkspaceController {
    async parseCommand(req, res) {
        try {
            const { text } = req.body;
            if (!text) {
                res.status(400).json({ error: '缺少text参数' });
                return;
            }
            const result = await naturalLanguageParser.parseCommand(text);
            res.json({
                success: true,
                data: result
            });
        }
        catch (error) {
            console.error('解析命令失败:', error);
            res.status(500).json({
                success: false,
                error: '解析命令失败',
                message: error instanceof Error ? error.message : '未知错误'
            });
        }
    }
    async registerEngine(req, res) {
        try {
            const engine = req.body;
            if (!engine.id || !engine.name || !engine.type || !engine.endpoint) {
                res.status(400).json({ error: '缺少必要的引擎信息' });
                return;
            }
            aiScheduler.registerEngine(engine);
            res.json({
                success: true,
                message: 'AI引擎注册成功',
                data: engine
            });
        }
        catch (error) {
            console.error('注册引擎失败:', error);
            res.status(500).json({
                success: false,
                error: '注册引擎失败',
                message: error instanceof Error ? error.message : '未知错误'
            });
        }
    }
    async getSystemStatus(req, res) {
        try {
            const status = aiScheduler.getSystemStatus();
            res.json({
                success: true,
                data: status
            });
        }
        catch (error) {
            console.error('获取系统状态失败:', error);
            res.status(500).json({
                success: false,
                error: '获取系统状态失败',
                message: error instanceof Error ? error.message : '未知错误'
            });
        }
    }
    async getAvailableEngines(req, res) {
        try {
            const { type } = req.query;
            const engines = aiScheduler.getAvailableEngines(type);
            res.json({
                success: true,
                data: engines
            });
        }
        catch (error) {
            console.error('获取可用引擎失败:', error);
            res.status(500).json({
                success: false,
                error: '获取可用引擎失败',
                message: error instanceof Error ? error.message : '未知错误'
            });
        }
    }
    async executeWorkflowStep(req, res) {
        try {
            const step = req.body;
            if (!step.id || !step.engineId || !step.input) {
                res.status(400).json({ error: '缺少必要的工作流步骤信息' });
                return;
            }
            const result = await aiScheduler.executeWorkflowStep(step);
            res.json({
                success: result.success,
                data: result.success ? result.result : null,
                error: result.error
            });
        }
        catch (error) {
            console.error('执行工作流步骤失败:', error);
            res.status(500).json({
                success: false,
                error: '执行工作流步骤失败',
                message: error instanceof Error ? error.message : '未知错误'
            });
        }
    }
    async executeWorkflow(req, res) {
        try {
            const workflow = req.body;
            if (!workflow.id || !workflow.name || !workflow.steps) {
                res.status(400).json({ error: '缺少必要的工作流信息' });
                return;
            }
            const result = await aiScheduler.executeWorkflow(workflow);
            res.json({
                success: result.success,
                data: result.success ? result.result : null,
                error: result.error
            });
        }
        catch (error) {
            console.error('执行工作流失败:', error);
            res.status(500).json({
                success: false,
                error: '执行工作流失败',
                message: error instanceof Error ? error.message : '未知错误'
            });
        }
    }
    async createWorkflow(req, res) {
        try {
            const { name, description, steps } = req.body;
            if (!name || !steps || !Array.isArray(steps)) {
                res.status(400).json({ error: '缺少必要的工作流信息' });
                return;
            }
            const workflow = aiScheduler.createWorkflow(name, description, steps);
            res.json({
                success: true,
                data: workflow
            });
        }
        catch (error) {
            console.error('创建工作流失败:', error);
            res.status(500).json({
                success: false,
                error: '创建工作流失败',
                message: error instanceof Error ? error.message : '未知错误'
            });
        }
    }
    async getWorkflow(req, res) {
        try {
            const { workflowId } = req.params;
            if (!workflowId) {
                res.status(400).json({ error: '缺少工作流ID' });
                return;
            }
            const workflow = aiScheduler.getWorkflow(workflowId);
            if (!workflow) {
                res.status(404).json({ error: '工作流不存在' });
                return;
            }
            res.json({
                success: true,
                data: workflow
            });
        }
        catch (error) {
            console.error('获取工作流状态失败:', error);
            res.status(500).json({
                success: false,
                error: '获取工作流状态失败',
                message: error instanceof Error ? error.message : '未知错误'
            });
        }
    }
    async cancelWorkflow(req, res) {
        try {
            const { workflowId } = req.params;
            if (!workflowId) {
                res.status(400).json({ error: '缺少工作流ID' });
                return;
            }
            const success = aiScheduler.cancelWorkflow(workflowId);
            if (!success) {
                res.status(404).json({ error: '工作流不存在或无法取消' });
                return;
            }
            res.json({
                success: true,
                message: '工作流取消成功'
            });
        }
        catch (error) {
            console.error('取消工作流失败:', error);
            res.status(500).json({
                success: false,
                error: '取消工作流失败',
                message: error instanceof Error ? error.message : '未知错误'
            });
        }
    }
    async getWorkflowTemplates(req, res) {
        try {
            const { category } = req.query;
            const templates = aiScheduler.getWorkflowTemplates(category);
            res.json({
                success: true,
                data: templates
            });
        }
        catch (error) {
            console.error('获取工作流模板失败:', error);
            res.status(500).json({
                success: false,
                error: '获取工作流模板失败',
                message: error instanceof Error ? error.message : '未知错误'
            });
        }
    }
    async searchWorkflowTemplates(req, res) {
        try {
            const { q } = req.query;
            if (!q || typeof q !== 'string') {
                res.status(400).json({ error: '缺少搜索参数' });
                return;
            }
            const templates = aiScheduler.searchWorkflowTemplates(q);
            res.json({
                success: true,
                data: templates
            });
        }
        catch (error) {
            console.error('搜索工作流模板失败:', error);
            res.status(500).json({
                success: false,
                error: '搜索工作流模板失败',
                message: error instanceof Error ? error.message : '未知错误'
            });
        }
    }
    async getRecommendedTemplates(req, res) {
        try {
            const { userId } = req.query;
            const { limit } = req.query;
            const templates = aiScheduler.getRecommendedTemplates(userId, limit ? parseInt(limit) : undefined);
            res.json({
                success: true,
                data: templates
            });
        }
        catch (error) {
            console.error('获取推荐模板失败:', error);
            res.status(500).json({
                success: false,
                error: '获取推荐模板失败',
                message: error instanceof Error ? error.message : '未知错误'
            });
        }
    }
    async createWorkflowFromTemplate(req, res) {
        try {
            const { templateId, customName, customSteps } = req.body;
            if (!templateId) {
                res.status(400).json({ error: '缺少模板ID' });
                return;
            }
            const workflow = aiScheduler.createWorkflowFromTemplate(templateId, customName, customSteps);
            if (!workflow) {
                res.status(404).json({ error: '模板不存在' });
                return;
            }
            res.json({
                success: true,
                data: workflow
            });
        }
        catch (error) {
            console.error('从模板创建工作流失败:', error);
            res.status(500).json({
                success: false,
                error: '从模板创建工作流失败',
                message: error instanceof Error ? error.message : '未知错误'
            });
        }
    }
    async saveUserTemplate(req, res) {
        try {
            const { userId, name, description, workflow, tags } = req.body;
            if (!userId || !name || !description || !workflow) {
                res.status(400).json({ error: '缺少必要参数' });
                return;
            }
            const template = aiScheduler.saveUserTemplate(userId, name, description, workflow, tags);
            res.json({
                success: true,
                data: template
            });
        }
        catch (error) {
            console.error('保存用户模板失败:', error);
            res.status(500).json({
                success: false,
                error: '保存用户模板失败',
                message: error instanceof Error ? error.message : '未知错误'
            });
        }
    }
    async getUserTemplates(req, res) {
        try {
            const { userId } = req.params;
            if (!userId) {
                res.status(400).json({ error: '缺少用户ID' });
                return;
            }
            const templates = aiScheduler.getUserTemplates(userId);
            res.json({
                success: true,
                data: templates
            });
        }
        catch (error) {
            console.error('获取用户模板失败:', error);
            res.status(500).json({
                success: false,
                error: '获取用户模板失败',
                message: error instanceof Error ? error.message : '未知错误'
            });
        }
    }
    async deleteUserTemplate(req, res) {
        try {
            const { userId, templateId } = req.params;
            if (!userId || !templateId) {
                res.status(400).json({ error: '缺少用户ID或模板ID' });
                return;
            }
            const success = aiScheduler.deleteUserTemplate(userId, templateId);
            if (!success) {
                res.status(404).json({ error: '模板不存在或无权限删除' });
                return;
            }
            res.json({
                success: true,
                message: '模板删除成功'
            });
        }
        catch (error) {
            console.error('删除用户模板失败:', error);
            res.status(500).json({
                success: false,
                error: '删除用户模板失败',
                message: error instanceof Error ? error.message : '未知错误'
            });
        }
    }
    async getPopularTemplates(req, res) {
        try {
            const { limit } = req.query;
            const templates = aiScheduler.getPopularTemplates(limit ? parseInt(limit) : undefined);
            res.json({
                success: true,
                data: templates
            });
        }
        catch (error) {
            console.error('获取热门模板失败:', error);
            res.status(500).json({
                success: false,
                error: '获取热门模板失败',
                message: error instanceof Error ? error.message : '未知错误'
            });
        }
    }
    async getTemplateStats(req, res) {
        try {
            const stats = aiScheduler.getTemplateStats();
            res.json({
                success: true,
                data: stats
            });
        }
        catch (error) {
            console.error('获取模板统计失败:', error);
            res.status(500).json({
                success: false,
                error: '获取模板统计失败',
                message: error instanceof Error ? error.message : '未知错误'
            });
        }
    }
    async getWorkflowExecutionLog(req, res) {
        try {
            const { workflowId } = req.params;
            if (!workflowId) {
                res.status(400).json({ error: '缺少工作流ID' });
                return;
            }
            const log = executionLogger.getWorkflowLog(workflowId);
            if (!log) {
                res.status(404).json({ error: '工作流执行日志不存在' });
                return;
            }
            res.json({
                success: true,
                data: log
            });
        }
        catch (error) {
            console.error('获取工作流执行日志失败:', error);
            res.status(500).json({
                success: false,
                error: '获取工作流执行日志失败',
                message: error instanceof Error ? error.message : '未知错误'
            });
        }
    }
    async getStepExecutionLogs(req, res) {
        try {
            const { workflowId } = req.params;
            if (!workflowId) {
                res.status(400).json({ error: '缺少工作流ID' });
                return;
            }
            const stepLogs = executionLogger.getStepLogs(workflowId);
            res.json({
                success: true,
                data: stepLogs
            });
        }
        catch (error) {
            console.error('获取步骤执行日志失败:', error);
            res.status(500).json({
                success: false,
                error: '获取步骤执行日志失败',
                message: error instanceof Error ? error.message : '未知错误'
            });
        }
    }
    async getRecentExecutionHistory(req, res) {
        try {
            const { limit } = req.query;
            const history = executionLogger.getRecentExecutionHistory(limit ? parseInt(limit) : 10);
            res.json({
                success: true,
                data: history
            });
        }
        catch (error) {
            console.error('获取执行历史失败:', error);
            res.status(500).json({
                success: false,
                error: '获取执行历史失败',
                message: error instanceof Error ? error.message : '未知错误'
            });
        }
    }
    async getPerformanceStats(req, res) {
        try {
            const stats = executionLogger.getPerformanceStats();
            res.json({
                success: true,
                data: stats
            });
        }
        catch (error) {
            console.error('获取性能统计失败:', error);
            res.status(500).json({
                success: false,
                error: '获取性能统计失败',
                message: error instanceof Error ? error.message : '未知错误'
            });
        }
    }
    async filterLogsByStatus(req, res) {
        try {
            const { status } = req.params;
            if (!status || !['completed', 'failed', 'running'].includes(status)) {
                res.status(400).json({ error: '无效的状态参数' });
                return;
            }
            const filteredLogs = executionLogger.filterLogsByStatus(status);
            res.json({
                success: true,
                data: filteredLogs
            });
        }
        catch (error) {
            console.error('筛选日志失败:', error);
            res.status(500).json({
                success: false,
                error: '筛选日志失败',
                message: error instanceof Error ? error.message : '未知错误'
            });
        }
    }
    async getDashboardData(req, res) {
        try {
            const [recentHistory, performanceStats, systemStatus] = await Promise.all([
                executionLogger.getRecentExecutionHistory(5),
                executionLogger.getPerformanceStats(),
                aiScheduler.getSystemStatus()
            ]);
            const dashboardData = {
                recentExecutions: recentHistory,
                performanceStats,
                systemStatus,
                timestamp: new Date().toISOString()
            };
            res.json({
                success: true,
                data: dashboardData
            });
        }
        catch (error) {
            console.error('获取仪表板数据失败:', error);
            res.status(500).json({
                success: false,
                error: '获取仪表板数据失败',
                message: error instanceof Error ? error.message : '未知错误'
            });
        }
    }
}
//# sourceMappingURL=workspace-controller.js.map