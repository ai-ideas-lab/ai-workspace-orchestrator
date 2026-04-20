import { config } from '../config';
import { logger } from '../utils/logger';
import { databaseService } from './database-service';
export class DatabaseManager {
    isInitialized = false;
    async initialize() {
        if (this.isInitialized)
            return;
        try {
            console.log('🚀 初始化数据库管理器...');
            await databaseService.initialize();
            await this.initializeAIEngines();
            this.isInitialized = true;
            console.log('✅ 数据库管理器初始化完成');
        }
        catch (error) {
            console.error('❌ 数据库管理器初始化失败:', error);
            throw error;
        }
    }
    async initializeAIEngines() {
        try {
            const existingEngines = await databaseService.findAIEngines();
            if (existingEngines.length === 0) {
                console.log('🔧 初始化AI引擎数据...');
                const openaiEngines = [
                    {
                        name: 'OpenAI GPT-4 Turbo',
                        type: 'text-generation',
                        endpoint: config.ai.openai.baseURL,
                        capabilities: ['text-generation', 'code-analysis', 'document-processing'],
                        status: 'active',
                        load: 0.0
                    },
                    {
                        name: 'OpenAI GPT-4',
                        type: 'text-generation',
                        endpoint: config.ai.openai.baseURL,
                        capabilities: ['text-generation', 'code-analysis', 'document-processing'],
                        status: 'active',
                        load: 0.0
                    },
                    {
                        name: 'OpenAI GPT-3.5',
                        type: 'text-generation',
                        endpoint: config.ai.openai.baseURL,
                        capabilities: ['text-generation', 'document-processing'],
                        status: 'active',
                        load: 0.0
                    }
                ];
                const claudeEngines = [
                    {
                        name: 'Anthropic Claude Sonnet',
                        type: 'text-generation',
                        endpoint: config.ai.anthropic.baseURL,
                        capabilities: ['text-generation', 'code-analysis', 'document-processing', 'reasoning'],
                        status: 'active',
                        load: 0.0
                    },
                    {
                        name: 'Anthropic Claude Opus',
                        type: 'text-generation',
                        endpoint: config.ai.anthropic.baseURL,
                        capabilities: ['text-generation', 'code-analysis', 'document-processing', 'reasoning'],
                        status: 'active',
                        load: 0.0
                    },
                    {
                        name: 'Anthropic Claude Haiku',
                        type: 'text-generation',
                        endpoint: config.ai.anthropic.baseURL,
                        capabilities: ['text-generation', 'document-processing'],
                        status: 'active',
                        load: 0.0
                    }
                ];
                const allEngines = [...openaiEngines, ...claudeEngines];
                for (const engineData of allEngines) {
                    await databaseService.createAIEngine(engineData);
                }
                console.log(`✅ 创建了 ${allEngines.length} 个AI引擎`);
            }
            else {
                console.log(`✅ 找到 ${existingEngines.length} 个现有AI引擎`);
            }
        }
        catch (error) {
            console.error('❌ AI引擎数据初始化失败:', error);
            throw error;
        }
    }
    async loadEnginesFromDatabase() {
        try {
            const engines = await databaseService.findAIEngines();
            console.log(`📊 从数据库加载了 ${engines.length} 个AI引擎`);
            return engines;
        }
        catch (error) {
            console.error('❌ 从数据库加载引擎失败:', error);
            throw error;
        }
    }
    async updateEngineStatus(engineId, status, load = 0.0) {
        try {
            await databaseService.updateAIEngine(engineId, { status, load });
            logger.info(`引擎状态已更新到数据库: ${engineId} -> ${status} (负载: ${load})`);
        }
        catch (error) {
            logger.error(`更新引擎状态到数据库失败: ${error.message}`);
            throw error;
        }
    }
    async recordWorkflowExecution(data) {
        try {
            const execution = await databaseService.createWorkflowExecution(data);
            logger.info(`工作流执行已记录到数据库: ${execution.id}`);
            return execution.id;
        }
        catch (error) {
            logger.error(`记录工作流执行到数据库失败: ${error.message}`);
            throw error;
        }
    }
    async updateWorkflowExecution(executionId, status, result, error_message) {
        try {
            await databaseService.updateWorkflowExecution(executionId, {
                status,
                result,
                error_message
            });
            logger.info(`工作流执行状态已更新: ${executionId} -> ${status}`);
        }
        catch (error) {
            logger.error(`更新工作流执行状态失败: ${error.message}`);
            throw error;
        }
    }
    async recordStepExecution(data) {
        try {
            const history = await databaseService.createStepExecutionHistory(data);
            logger.info(`步骤执行历史已记录: ${history.id}`);
            return history.id;
        }
        catch (error) {
            logger.error(`记录步骤执行历史失败: ${error.message}`);
            throw error;
        }
    }
    async updateStepExecution(historyId, status, output_data, error_message) {
        try {
            await databaseService.updateStepExecutionHistory(historyId, {
                status,
                output_data,
                error_message
            });
            logger.info(`步骤执行历史已更新: ${historyId} -> ${status}`);
        }
        catch (error) {
            logger.error(`更新步骤执行历史失败: ${error.message}`);
            throw error;
        }
    }
    async getWorkflowStats() {
        try {
            const stats = await databaseService.getWorkflowExecutionStats();
            logger.info(`获取工作流统计信息: ${JSON.stringify(stats)}`);
            return stats;
        }
        catch (error) {
            logger.error(`获取工作流统计信息失败: ${error.message}`);
            throw error;
        }
    }
    async getExecutionHistory(params) {
        try {
            const history = await databaseService.getExecutionHistory(params);
            logger.info(`查询执行历史: ${history.length} 条记录`);
            return history;
        }
        catch (error) {
            logger.error(`查询执行历史失败: ${error.message}`);
            throw error;
        }
    }
    async createWorkflow(data) {
        try {
            const workflow = await databaseService.createWorkflow(data);
            logger.info(`工作流已创建: ${workflow.id}`);
            return workflow.id;
        }
        catch (error) {
            logger.error(`创建工作流失败: ${error.message}`);
            throw error;
        }
    }
    async updateWorkflowStatus(workflowId, status) {
        try {
            await databaseService.updateWorkflowStatus(workflowId, status);
            logger.info(`工作流状态已更新: ${workflowId} -> ${status}`);
        }
        catch (error) {
            logger.error(`更新工作流状态失败: ${error.message}`);
            throw error;
        }
    }
    async createWorkflowStep(data) {
        try {
            const step = await databaseService.createWorkflowStep(data);
            logger.info(`工作流步骤已创建: ${step.id}`);
            return step.id;
        }
        catch (error) {
            logger.error(`创建工作流步骤失败: ${error.message}`);
            throw error;
        }
    }
    async updateWorkflowStep(stepId, data) {
        try {
            await databaseService.updateWorkflowStep(stepId, data);
            logger.info(`工作流步骤状态已更新: ${stepId} -> ${data.status}`);
        }
        catch (error) {
            logger.error(`更新工作流步骤状态失败: ${error.message}`);
            throw error;
        }
    }
    async healthCheck() {
        try {
            const health = await databaseService.healthCheck();
            logger.info(`数据库健康检查: ${health.status}`);
            return health;
        }
        catch (error) {
            logger.error(`数据库健康检查失败: ${error.message}`);
            return {
                status: 'unhealthy',
                details: { error: error.message }
            };
        }
    }
    isDatabaseInitialized() {
        return this.isInitialized;
    }
    async shutdown() {
        if (this.isInitialized) {
            try {
                await databaseService.disconnect();
                this.isInitialized = false;
                logger.info('数据库管理器已关闭');
            }
            catch (error) {
                logger.error(`关闭数据库管理器失败: ${error.message}`);
            }
        }
    }
}
export const databaseManager = new DatabaseManager();
//# sourceMappingURL=database-manager.js.map