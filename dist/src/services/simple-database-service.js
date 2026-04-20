import { PrismaClient } from '@prisma/client';
export class SimpleDatabaseService {
    prisma;
    constructor() {
        this.prisma = new PrismaClient({
            datasources: {
                db: {
                    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/ai_workspace_orchestrator'
                }
            }
        });
    }
    async connect() {
        try {
            await this.prisma.$connect();
            console.log('✅ PostgreSQL 数据库连接成功');
        }
        catch (error) {
            console.error('❌ 数据库连接失败:', error);
            throw error;
        }
    }
    async disconnect() {
        try {
            await this.prisma.$disconnect();
            console.log('✅ 数据库连接已断开');
        }
        catch (error) {
            console.error('❌ 断开数据库连接失败:', error);
        }
    }
    async testConnection() {
        try {
            await this.prisma.$queryRaw `SELECT 1`;
            return true;
        }
        catch (error) {
            return false;
        }
    }
    async getAllEngines() {
        return this.prisma.aIEngines.findMany({
            orderBy: { created_at: 'desc' }
        });
    }
    async createEngine(engine) {
        return this.prisma.aIEngines.create({
            data: engine
        });
    }
    async updateEngineLoad(id, load) {
        return this.prisma.aIEngines.update({
            where: { id },
            data: {
                load: Math.max(0, Math.min(1, load)),
            }
        });
    }
    async createExecution(execution) {
        return this.prisma.workflowExecutions.create({
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
            }
        });
    }
    async updateExecution(id, updates) {
        return this.prisma.workflowExecutions.update({
            where: { id },
            data: updates
        });
    }
    async getExecutionHistory(options = {}) {
        const { page = 1, limit = 10, workflowId, status } = options;
        const skip = (page - 1) * limit;
        const where = {};
        if (workflowId)
            where.workflow_id = workflowId;
        if (status)
            where.status = status;
        return this.prisma.workflowExecutions.findMany({
            where,
            include: {
                workflow: {
                    select: {
                        id: true,
                        name: true,
                    }
                }
            },
            orderBy: { created_at: 'desc' },
            skip,
            take: limit
        });
    }
    async getExecutionStats() {
        const [total, statusCounts, executionTimes] = await Promise.all([
            this.prisma.workflowExecutions.count(),
            this.prisma.workflowExecutions.groupBy({
                by: ['status'],
                _count: { status: true }
            }),
            this.prisma.workflowExecutions.findMany({
                where: {
                    status: 'completed',
                    execution_time_ms: { not: null }
                },
                select: { execution_time_ms: true }
            })
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
            successRate
        };
    }
    async getDatabaseInfo() {
        try {
            const [version, size, tables, indexes] = await Promise.all([
                this.prisma.$queryRaw `SELECT version()`,
                this.prisma.$queryRaw `
          SELECT pg_size_pretty(pg_database_size(current_database())) as size
        `,
                this.prisma.$queryRaw `
          SELECT COUNT(*) as tables 
          FROM information_schema.tables 
          WHERE table_schema = 'public'
        `,
                this.prisma.$queryRaw `
          SELECT COUNT(*) as indexes 
          FROM pg_indexes 
          WHERE schemaname = 'public'
        `
            ]);
            return {
                version: version[0].version,
                size: size[0].size,
                tables: tables[0].tables,
                indexes: indexes[0].indexes
            };
        }
        catch (error) {
            return {
                version: 'unknown',
                size: 'unknown',
                tables: 0,
                indexes: 0
            };
        }
    }
    async healthCheck() {
        try {
            await this.prisma.$queryRaw `SELECT 1`;
            return { status: 'healthy', message: 'PostgreSQL 连接正常' };
        }
        catch (error) {
            return { status: 'unhealthy', message: error.message };
        }
    }
}
export const simpleDatabaseService = new SimpleDatabaseService();
//# sourceMappingURL=simple-database-service.js.map