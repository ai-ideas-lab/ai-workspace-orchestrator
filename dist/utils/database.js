"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = exports.dbUtils = exports.DatabaseManager = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    errorFormat: 'pretty'
});
exports.prisma = prisma;
async function connectWithRetry(attempts = 5, delay = 3000) {
    for (let i = 0; i < attempts; i++) {
        try {
            await prisma.$connect();
            console.log('✅ PostgreSQL database connected successfully');
            return prisma;
        }
        catch (error) {
            console.error(`❌ Database connection attempt ${i + 1} failed:`, error.message);
            if (i < attempts - 1) {
                console.log(`⏳ Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    throw new Error(`Failed to connect to PostgreSQL after ${attempts} attempts`);
}
async function checkHealth() {
    try {
        await prisma.$queryRaw `SELECT 1`;
        return true;
    }
    catch (error) {
        console.error('❌ Database health check failed:', error.message);
        return false;
    }
}
let isConnected = false;
class DatabaseManager {
    static async getInstance() {
        if (!DatabaseManager.instance || !isConnected) {
            DatabaseManager.instance = await connectWithRetry();
            isConnected = true;
        }
        return DatabaseManager.instance;
    }
    static async disconnect() {
        if (isConnected) {
            await prisma.$disconnect();
            isConnected = false;
            console.log('🔌 Database disconnected');
        }
    }
    static async healthCheck() {
        return await checkHealth();
    }
}
exports.DatabaseManager = DatabaseManager;
exports.dbUtils = {
    async getStats() {
        const [workflowCount, executionCount, recentExecutions] = await Promise.all([
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
        return {
            totalWorkflows: workflowCount,
            totalExecutions: executionCount,
            recentExecutions,
            databaseType: 'postgresql',
            isConnected: await checkHealth()
        };
    },
    async getWorkflowStats() {
        return await prisma.execution.groupBy({
            by: ['status'],
            _count: {
                id: true
            },
            orderBy: {
                _count: {
                    id: 'desc'
                }
            }
        });
    },
    async getRecentExecutions(limit = 10) {
        return await prisma.execution.findMany({
            take: limit,
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                workflow: {
                    select: {
                        id: true,
                        name: true,
                        status: true
                    }
                }
            }
        });
    },
    async cleanupOldData(daysToKeep = 30) {
        const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
        const [deletedExecutions, deletedSteps] = await Promise.all([
            prisma.execution.deleteMany({
                where: {
                    createdAt: {
                        lt: cutoffDate
                    }
                }
            }),
            prisma.executionStep.deleteMany({
                where: {
                    createdAt: {
                        lt: cutoffDate
                    }
                }
            })
        ]);
        return {
            deletedExecutions,
            deletedSteps
        };
    }
};
exports.default = DatabaseManager;
//# sourceMappingURL=database.js.map