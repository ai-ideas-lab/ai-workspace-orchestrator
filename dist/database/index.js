"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
exports.connectToDatabase = connectToDatabase;
exports.disconnectFromDatabase = disconnectFromDatabase;
exports.isDatabaseConnected = isDatabaseConnected;
exports.checkDatabaseHealth = checkDatabaseHealth;
exports.getDatabaseStats = getDatabaseStats;
const client_1 = require("@prisma/client");
const enhanced_error_logger_js_1 = require("../utils/enhanced-error-logger.js");
const prismaClient = new client_1.PrismaClient({
    log: [
        {
            emit: 'event',
            level: 'query',
        },
        {
            emit: 'event',
            level: 'error',
        },
        {
            emit: 'event',
            level: 'info',
        },
        {
            emit: 'event',
            level: 'warn',
        },
    ],
});
exports.prisma = prismaClient;
let isConnected = false;
prismaClient.$on('query', (e) => {
    enhanced_error_logger_js_1.logger.debug('数据库查询:', {
        query: e.query,
        params: e.params,
        duration: `${e.duration}ms`,
    });
});
prismaClient.$on('error', (e) => {
    enhanced_error_logger_js_1.logger.error('数据库错误:', e);
});
prismaClient.$on('info', (e) => {
    enhanced_error_logger_js_1.logger.info('数据库信息:', e);
});
prismaClient.$on('warn', (e) => {
    enhanced_error_logger_js_1.logger.warn('数据库警告:', e);
});
async function connectToDatabase() {
    try {
        await prismaClient.$connect();
        isConnected = true;
        enhanced_error_logger_js_1.logger.info('✅ 数据库连接成功');
    }
    catch (error) {
        enhanced_error_logger_js_1.logger.error('❌ 数据库连接失败:', error);
        throw new Error(`数据库连接失败: ${error instanceof Error ? error.message : String(error)}`);
    }
}
async function disconnectFromDatabase() {
    try {
        await prismaClient.$disconnect();
        isConnected = false;
        enhanced_error_logger_js_1.logger.info('✅ 数据库连接已断开');
    }
    catch (error) {
        enhanced_error_logger_js_1.logger.error('❌ 数据库断开连接失败:', error);
        throw new Error(`数据库断开连接失败: ${error instanceof Error ? error.message : String(error)}`);
    }
}
function isDatabaseConnected() {
    return isConnected;
}
async function checkDatabaseHealth() {
    const startTime = Date.now();
    try {
        await prismaClient.$executeRaw `SELECT 1`;
        const responseTime = Date.now() - startTime;
        return {
            status: 'healthy',
            responseTime,
        };
    }
    catch (error) {
        const responseTime = Date.now() - startTime;
        return {
            status: 'unhealthy',
            responseTime,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}
async function getDatabaseStats() {
    try {
        const [workflows, users, executions] = await Promise.all([
            prismaClient.workflow.count(),
            prismaClient.user.count(),
            prismaClient.workflowExecution.count(),
        ]);
        return {
            totalWorkflows: workflows,
            totalUsers: users,
            totalExecutions: executions,
            databaseVersion: 'PostgreSQL',
        };
    }
    catch (error) {
        enhanced_error_logger_js_1.logger.error('获取数据库统计信息失败:', error);
        throw new Error(`获取数据库统计信息失败: ${error instanceof Error ? error.message : String(error)}`);
    }
}
exports.default = prisma;
//# sourceMappingURL=index.js.map