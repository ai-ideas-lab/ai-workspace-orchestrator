/**
 * Main Server - 服务器入口文件
 * 
 * 设置Express应用、中间件、路由和全局错误处理
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';

// 导入路由
import workflowRoutes from './routes/workflows.js';
import { globalErrorHandler, notFoundHandler, setupGlobalErrorMonitoring } from './middleware/errorMiddleware.ts';
import { requestIdMiddleware } from './middleware/errorMiddleware.ts';
import { createErrorAggregatorMiddleware } from './utils/error-aggregator.js';
import { logger } from './utils/logger.js';

// 导入服务
import { WorkflowService } from './services/workflow-scheduler.js';
import { EventBus } from './services/event-bus.js';

// ── 应用初始化 ────────────────────────────────────────

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3000;

// ── 全局错误监控设置 ─────────────────────────────────

// 必须在启动服务器前设置全局错误监听器
setupGlobalErrorMonitoring();

logger.info('🚀 AI Workspace Orchestrator 启动中...');
logger.info(`环境: ${process.env.NODE_ENV || 'development'}`);

// ── 中间件配置 ───────────────────────────────────────

// 安全中间件
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true,
}));

// 请求ID中间件 (必须在其他中间件之前)
app.use(requestIdMiddleware);

// 错误聚合中间件 (在路由之前，用于捕获未处理的错误)
const errorAggregator = createErrorAggregatorMiddleware({
  windowSizeMs: 5 * 60 * 1000, // 5分钟窗口
  similarityThreshold: 0.8,
  maxAggregatedErrors: 100,
  alertThreshold: 10,
  alertCallback: (aggregatedError) => {
    logger.warn(`错误告警触发: ${aggregatedError.errorCode} (${aggregatedError.occurrenceCount}次)`);
  }
});
app.use(errorAggregator);

// 日志中间件
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim()),
  },
}));

// 解析中间件
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 健康检查端点
app.get('/health', (req, res) => {
  const requestId = req.requestId || 'unknown';
  res.status(200).json({
    success: true,
    message: '服务运行正常',
    requestId,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ── API路由 ────────────────────────────────────────────

// API版本前缀
const apiRouter = express.Router();

// 工作流路由
apiRouter.use('/workflows', workflowRoutes);

// API路由
app.use('/api', apiRouter);

// ── 404处理 ────────────────────────────────────────────

app.use(notFoundHandler);

// ── 全局错误处理中间件 (必须在所有路由之后) ─────────────

app.use(globalErrorHandler);

// ── 服务启动 ────────────────────────────────────────────

server.listen(PORT, () => {
  logger.info(`🚀 AI Workspace Orchestrator 服务已启动`);
  logger.info(`📡 监听端口: ${PORT}`);
  logger.info(`🌐 健康检查: http://localhost:${PORT}/health`);
  logger.info(`📚 API文档: http://localhost:${PORT}/api`);
});

// ── 优雅关闭 ────────────────────────────────────────────

const gracefulShutdown = (signal: string) => {
  logger.info(`🔄 收到 ${signal} 信号，开始优雅关闭...`);
  
  server.close(() => {
    logger.info('✅ HTTP服务器已关闭');
    
    // 关闭数据库连接、事件总线等
    EventBus.getInstance().shutdown();
    logger.info('✅ 事件总线已关闭');
    
    process.exit(0);
  });
  
  // 强制关闭超时
  setTimeout(() => {
    logger.error('⚠️ 强制关闭超时，退出进程');
    process.exit(1);
  }, 10000);
};

// 监听关闭信号
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ── 未捕获异常处理 ─────────────────────────────────────

process.on('uncaughtException', (error) => {
  logger.error('🚨 未捕获的异常:', error);
  // 优雅关闭
  gracefulShutdown('uncaughtException');
});

// ── 未处理的Promise拒绝 ──────────────────────────────────

process.on('unhandledRejection', (reason, promise) => {
  logger.error('🚨 未处理的Promise拒绝:', {
    reason,
    promise: promise.toString(),
    stack: (reason as Error).stack,
  });
});

// ── 导出应用 ────────────────────────────────────────────

export { app, server };
export default app;