import { PrismaClient } from '@prisma/client';
export class DatabaseService {
    prisma;
    constructor() {
        this.prisma = new PrismaClient();
    }
    async connect() {
        try {
            await this.prisma.$connect();
            console.log('🗄️ 数据库连接成功');
        }
        catch (error) {
            console.error('❌ 数据库连接失败:', error);
            throw error;
        }
    }
    async disconnect() {
        try {
            await this.prisma.$disconnect();
            console.log('🗄️ 数据库连接已断开');
        }
        catch (error) {
            console.error('❌ 断开数据库连接失败:', error);
        }
    }
    async testConnection() {
        try {
            await this.prisma.$queryRaw `SELECT 1`;
            console.log('✅ 数据库连接测试成功');
            return true;
        }
        catch (error) {
            console.error('❌ 数据库连接测试失败:', error);
            return false;
        }
    }
    async registerEngine(engine) {
        console.log(`[DatabaseService] 注册AI引擎: ${engine.name}`);
        const dbEngine = await this.prisma.aIEngines.create({
            data: {
                name: engine.name,
                type: engine.type,
                endpoint: engine.endpoint,
                capabilities: engine.capabilities,
                status: engine.status,
                load: engine.load,
            },
        });
        return this.mapDbAIEngineToAIEngine(dbEngine);
    }
    async getEngine(id) {
        const dbEngine = await this.prisma.aIEngines.findUnique({
            where: { id: id },
        });
        return dbEngine ? this.mapDbAIEngineToAIEngine(dbEngine) : null;
    }
    async getAllEngines() {
        const dbEngines = await this.prisma.aIEngines.findMany({
            orderBy: { created_at: 'desc' },
        });
        return dbEngines.map(this.mapDbAIEngineToAIEngine);
    }
    async getAvailableEngines() {
        const dbEngines = await this.prisma.aIEngines.findMany({
            where: {
                status: 'active',
                load: { lte: 0.8 },
            },
            orderBy: { load: 'asc' },
        });
        return dbEngines.map(this.mapDbAIEngineToAIEngine);
    }
    async updateEngineLoad(id, load) {
        const dbEngine = await this.prisma.aIEngines.update({
            where: { id: id },
            data: {
                load: Math.max(0, Math.min(1, load)),
            },
        });
        return this.mapDbAIEngineToAIEngine(dbEngine);
    }
    async updateEngineStatus(id, status) {
        const dbEngine = await this.prisma.aIEngines.update({
            where: { id: id },
            data: { status },
        });
        return this.mapDbAIEngineToAIEngine(dbEngine);
    }
    async createWorkflow(workflow) {
        console.log(`[DatabaseService] 创建工作流: ${workflow.name}`);
        const dbWorkflow = await this.prisma.workflows.create({
            data: {
                name: workflow.name,
                description: workflow.description,
                status: workflow.status,
                config: workflow.config || {},
            },
        });
        return this.mapDbWorkflowToWorkflow(dbWorkflow);
    }
    async getWorkflow(id) {
        const dbWorkflow = await this.prisma.workflows.findUnique({
            where: { id: id },
            include: {
                steps: {
                    orderBy: { sequence_order: 'asc' },
                },
            },
        });
        return dbWorkflow ? this.mapDbWorkflowToWorkflow(dbWorkflow) : null;
    }
    async getUserWorkflows(userId) {
        const where = userId ? { user_id: userId } : {};
        const dbWorkflows = await this.prisma.workflows.findMany({
            where,
            include: {
                steps: {
                    orderBy: { sequence_order: 'asc' },
                },
            },
            orderBy: { created_at: 'desc' },
        });
        return dbWorkflows.map(this.mapDbWorkflowToWorkflow);
    }
    async updateWorkflowStatus(id, status) {
        const dbWorkflow = await this.prisma.workflows.update({
            where: { id: id },
            data: {
                status,
                updated_at: new Date(),
            },
            include: {
                steps: {
                    orderBy: { sequence_order: 'asc' },
                },
            },
        });
        return this.mapDbWorkflowToWorkflow(dbWorkflow);
    }
    async deleteWorkflow(id) {
        try {
            await this.prisma.workflows.delete({
                where: { id: id },
            });
            console.log(`✅ 工作流删除成功: ${id}`);
            return true;
        }
        catch (error) {
            console.error(`❌ 删除工作流失败: ${id}`, error);
            return false;
        }
    }
    async createWorkflowStep(step) {
        const dbStep = await this.prisma.workflowSteps.create({
            data: {
                workflow_id: step.workflowId,
                engine_id: step.engineId,
                name: step.name,
                input: step.input || {},
                parameters: step.parameters || {},
                output: step.output,
                status: step.status,
                error_message: step.error,
                sequence_order: step.sequenceOrder || 0,
            },
        });
        return this.mapDbWorkflowStepToWorkflowStep(dbStep);
    }
    async updateWorkflowStep(id, updates) {
        const data = {
            ...updates,
            updated_at: new Date(),
        };
        if (updates.error) {
            data.error_message = updates.error;
        }
        const dbStep = await this.prisma.workflowSteps.update({
            where: { id: id },
            data,
        });
        return this.mapDbWorkflowStepToWorkflowStep(dbStep);
    }
    async createExecution(execution) {
        console.log(`[DatabaseService] 创建工作流执行记录: workflow=${execution.workflowId}`);
        const dbExecution = await this.prisma.workflowExecutions.create({
            data: {
                workflow_id: execution.workflowId,
                user_id: execution.userId,
                status: execution.status,
                trigger_data: execution.triggerData || {},
                result: execution.result || {},
                error_message: execution.errorMessage,
                started_at: execution.startedAt,
                completed_at: execution.completedAt,
                execution_time_ms: execution.executionTimeMs,
            },
        });
        return this.mapDbWorkflowExecutionToWorkflowExecution(dbExecution);
    }
    async updateExecution(id, updates) {
        const data = {
            ...updates,
            updated_at: new Date(),
        };
        const dbExecution = await this.prisma.workflowExecutions.update({
            where: { id: id },
            data,
        });
        return this.mapDbWorkflowExecutionToWorkflowExecution(dbExecution);
    }
    async getExecutionHistory(options = {}) {
        const { page = 1, limit = 10, workflowId, status, startDate, endDate, } = options;
        const skip = (page - 1) * limit;
        const where = {};
        if (workflowId) {
            where.workflow_id = workflowId;
        }
        if (status) {
            where.status = status;
        }
        if (startDate && endDate) {
            where.created_at = {
                gte: startDate,
                lte: endDate,
            };
        }
        const dbExecutions = await this.prisma.workflowExecutions.findMany({
            where,
            include: {
                workflow: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: { created_at: 'desc' },
            skip,
            take: limit,
        });
        return dbExecutions.map(this.mapDbWorkflowExecutionToWorkflowExecution);
    }
    async getExecutionStats() {
        const [total, statusCounts, executionTimes] = await Promise.all([
            this.prisma.workflowExecutions.count(),
            this.prisma.workflowExecutions.groupBy({
                by: ['status'],
                _count: { status: true },
            }),
            this.prisma.workflowExecutions.findMany({
                where: {
                    status: 'completed',
                    execution_time_ms: { not: null },
                },
                select: { execution_time_ms: true },
            }),
        ]);
        const status = {};
        statusCounts.forEach(item => {
            status[item.status] = item._count.status;
        });
        const avgExecutionTime = executionTimes.length > 0
            ? executionTimes.reduce((sum, item) => sum + item.execution_time_ms, 0) / executionTimes.length
            : 0;
        const successCount = status['completed'] || 0;
        const successRate = total > 0 ? (successCount / total) * 100 : 0;
        return {
            total,
            status,
            avgExecutionTime,
            successRate,
        };
    }
    async recordStepExecutionHistory(data) {
        const durationMs = data.endTime && data.startTime
            ? data.endTime.getTime() - data.startTime.getTime()
            : null;
        await this.prisma.stepExecutionHistory.create({
            data: {
                execution_id: data.executionId,
                step_id: data.stepId,
                status: data.status,
                input_data: data.inputData || {},
                output_data: data.outputData || {},
                error_message: data.errorMessage,
                start_time: data.startTime,
                end_time: data.endTime,
                duration_ms: durationMs,
            },
        });
    }
    async getTemplates(options = {}) {
        const { category, isPublic = true, limit = 50 } = options;
        const where = {};
        if (category) {
            where.category = category;
        }
        if (isPublic !== undefined) {
            where.is_public = isPublic;
        }
        const templates = await this.prisma.templates.findMany({
            where,
            orderBy: { usage_count: 'desc' },
            take: limit,
        });
        return templates;
    }
    async createWorkflowFromTemplate(templateId, userId, customConfig) {
        console.log(`[DatabaseService] 从模板创建工作流: template=${templateId}`);
        const template = await this.prisma.templates.findUnique({
            where: { id: templateId },
        });
        if (!template) {
            throw new Error(`模板未找到: ${templateId}`);
        }
        await this.prisma.templates.update({
            where: { id: templateId },
            data: { usage_count: { increment: 1 } },
        });
        const workflow = await this.createWorkflow({
            name: template.name,
            description: template.description,
            status: 'draft',
            config: customConfig || template.config,
        });
        return { workflow, template };
    }
    mapDbAIEngineToAIEngine(dbEngine) {
        return {
            id: dbEngine.id,
            name: dbEngine.name,
            type: dbEngine.type,
            endpoint: dbEngine.endpoint,
            capabilities: dbEngine.capabilities,
            status: dbEngine.status,
            load: parseFloat(dbEngine.load),
        };
    }
    mapDbWorkflowToWorkflow(dbWorkflow) {
        return {
            id: dbWorkflow.id,
            name: dbWorkflow.name,
            description: dbWorkflow.description,
            status: dbWorkflow.status,
            steps: (dbWorkflow.steps || []).map((step) => this.mapDbWorkflowStepToWorkflowStep(step)),
            config: dbWorkflow.config,
            createdAt: new Date(dbWorkflow.created_at),
            updatedAt: new Date(dbWorkflow.updated_at),
        };
    }
    mapDbWorkflowStepToWorkflowStep(dbStep) {
        return {
            id: dbStep.id,
            workflowId: dbStep.workflow_id,
            engineId: dbStep.engine_id,
            name: dbStep.name,
            input: dbStep.input,
            parameters: dbStep.parameters,
            output: dbStep.output,
            status: dbStep.status,
            error: dbStep.error_message,
            sequenceOrder: dbStep.sequence_order,
        };
    }
    mapDbWorkflowExecutionToWorkflowExecution(dbExecution) {
        return {
            id: dbExecution.id,
            workflowId: dbExecution.workflow_id,
            userId: dbExecution.user_id,
            status: dbExecution.status,
            triggerData: dbExecution.trigger_data,
            result: dbExecution.result,
            errorMessage: dbExecution.error_message,
            startedAt: dbExecution.started_at,
            completedAt: dbExecution.completed_at,
            executionTimeMs: dbExecution.execution_time_ms,
            createdAt: new Date(dbExecution.created_at),
        };
    }
    async cleanupOldData(daysToKeep = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
        const deletedCount = await this.prisma.stepExecutionHistory.deleteMany({
            where: {
                created_at: { lt: cutoffDate },
            },
        });
        console.log(`🧹 清理了 ${deletedCount.count} 条过期步骤执行记录`);
        return deletedCount.count;
    }
}
export const databaseService = new DatabaseService();
//# sourceMappingURL=database-service.js.map