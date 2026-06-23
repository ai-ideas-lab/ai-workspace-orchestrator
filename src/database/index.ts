/**
 * Database - 数据库连接和配置
 * 
 * 提供Prisma数据库客户端实例和连接管理
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/enhanced-error-logger.js';
import { formatErrorMessage } from '../utils/error-helper.js';
import { measureExecutionTime, getFormattedTimestamp } from '../utils/timestamp-helper.js';

// 创建Prisma客户端实例
const prismaClient = new PrismaClient({
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

// 数据库连接状态
let isConnected = false;

// 监听Prisma事件
prismaClient.$on('query', (e) => {
  logger.debug('数据库查询:', {
    query: e.query,
    params: e.params,
    duration: `${e.duration}ms`,
  });
});

prismaClient.$on('error', (e) => {
  logger.error('数据库错误:', e);
});

prismaClient.$on('info', (e) => {
  logger.info('数据库信息:', e);
});

prismaClient.$on('warn', (e) => {
  logger.warn('数据库警告:', e);
});

/**
 * 连接到数据库
 */
export async function connectToDatabase(): Promise<void> {
  const { duration } = await measureExecutionTime(async () => {
    try {
      await prismaClient.$connect();
      isConnected = true;
      logger.info('✅ 数据库连接成功');
    } catch (error) {
      logger.error('❌ 数据库连接失败:', error);
      const errorMessage = formatErrorMessage(error, '数据库连接失败: ');
      throw new Error(errorMessage);
    }
  });
  
  logger.debug('数据库连接耗时:', { duration, timestamp: getFormattedTimestamp() });
}

/**
 * 断开数据库连接
 */
export async function disconnectFromDatabase(): Promise<void> {
  const { duration } = await measureExecutionTime(async () => {
    try {
      await prismaClient.$disconnect();
      isConnected = false;
      logger.info('✅ 数据库连接已断开');
    } catch (error) {
      logger.error('❌ 数据库断开连接失败:', error);
      const errorMessage = formatErrorMessage(error, '数据库断开连接失败: ');
      throw new Error(errorMessage);
    }
  });
  
  logger.debug('数据库断开连接耗时:', { duration, timestamp: getFormattedTimestamp() });
}

/**
 * 检查数据库连接状态
 */
export function isDatabaseConnected(): boolean {
  return isConnected;
}

/**
 * 健康检查
 */
export async function checkDatabaseHealth(): Promise<{
  status: 'healthy' | 'unhealthy';
  responseTime: number;
  error?: string;
}> {
  const startTime = Date.now();
  
  try {
    // 执行简单查询测试连接
    await prismaClient.$executeRaw`SELECT 1`;
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'healthy',
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'unhealthy',
      responseTime,
      error: formatErrorMessage(error, '数据库健康检查失败: '),
    };
  }
}

/**
 * 获取数据库统计信息
 */
export async function getDatabaseStats(): Promise<{
  totalWorkflows: number;
  totalUsers: number;
  totalExecutions: number;
  databaseVersion: string;
}> {
  const { result, duration } = await measureExecutionTime(async () => {
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
        databaseVersion: 'PostgreSQL', // 可以从实际数据库获取
      };
    } catch (error) {
      logger.error('获取数据库统计信息失败:', error);
      const errorMessage = formatErrorMessage(error, '获取数据库统计信息失败: ');
      throw new Error(errorMessage);
    }
  });
  
  logger.debug('数据库统计信息查询耗时:', { duration, timestamp: getFormattedTimestamp() });
  
  return result;
}

// 导出Prisma客户端实例
export { prismaClient as prisma };

// 默认导出
export default prisma;