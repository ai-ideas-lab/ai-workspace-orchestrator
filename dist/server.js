"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const http_1 = require("http");
const workflows_js_1 = __importDefault(require("./routes/workflows.js"));
const errorMiddleware_1 = require("./middleware/errorMiddleware");
const errorMiddleware_2 = require("./middleware/errorMiddleware");
const error_aggregator_js_1 = require("./utils/error-aggregator.js");
const logger_js_1 = require("./utils/logger.js");
const event_bus_js_1 = require("./services/event-bus.js");
function formatUptime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hours > 0) {
        return `${hours}h ${minutes}m ${secs}s`;
    }
    else if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    }
    else {
        return `${secs}s`;
    }
}
const app = (0, express_1.default)();
exports.app = app;
const server = (0, http_1.createServer)(app);
exports.server = server;
const PORT = process.env.PORT || 3000;
(0, errorMiddleware_1.setupGlobalErrorMonitoring)();
logger_js_1.logger.info('🚀 AI Workspace Orchestrator 启动中...');
logger_js_1.logger.info(`环境: ${process.env.NODE_ENV || 'development'}`);
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
}));
app.use(errorMiddleware_2.requestIdMiddleware);
const errorAggregator = (0, error_aggregator_js_1.createErrorAggregatorMiddleware)({
    windowSizeMs: 5 * 60 * 1000,
    similarityThreshold: 0.8,
    maxAggregatedErrors: 100,
    alertThreshold: 10,
    alertCallback: (aggregatedError) => {
        logger_js_1.logger.warn(`错误告警触发: ${aggregatedError.errorCode} (${aggregatedError.occurrenceCount}次)`);
    }
});
app.use(errorAggregator);
app.use((0, morgan_1.default)('combined', {
    stream: {
        write: (message) => logger_js_1.logger.info(message.trim()),
    },
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
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
app.get('/system', (req, res) => {
    const requestId = req.requestId || 'unknown';
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();
    const cpuUsage = process.cpuUsage();
    res.status(200).json({
        success: true,
        message: '系统信息',
        requestId,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        version: process.version,
        platform: process.platform,
        arch: process.arch,
        uptime: {
            seconds: Math.floor(uptime),
            formatted: formatUptime(uptime),
        },
        memory: {
            rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
            heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
            heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
            external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
        },
        cpu: {
            user: `${Math.round(cpuUsage.user / 1000000)}ms`,
            system: `${Math.round(cpuUsage.system / 1000000)}ms`,
        },
        port: PORT,
    });
});
const apiRouter = express_1.default.Router();
apiRouter.use('/workflows', workflows_js_1.default);
app.use('/api', apiRouter);
app.use(errorMiddleware_1.notFoundHandler);
app.use(errorMiddleware_1.globalErrorHandler);
server.listen(PORT, () => {
    logger_js_1.logger.info(`🚀 AI Workspace Orchestrator 服务已启动`);
    logger_js_1.logger.info(`📡 监听端口: ${PORT}`);
    logger_js_1.logger.info(`🌐 健康检查: http://localhost:${PORT}/health`);
    logger_js_1.logger.info(`📚 API文档: http://localhost:${PORT}/api`);
});
const gracefulShutdown = (signal) => {
    logger_js_1.logger.info(`🔄 收到 ${signal} 信号，开始优雅关闭...`);
    server.close(() => {
        logger_js_1.logger.info('✅ HTTP服务器已关闭');
        event_bus_js_1.EventBus.getInstance().shutdown();
        logger_js_1.logger.info('✅ 事件总线已关闭');
        process.exit(0);
    });
    setTimeout(() => {
        logger_js_1.logger.error('⚠️ 强制关闭超时，退出进程');
        process.exit(1);
    }, 10000);
};
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('uncaughtException', (error) => {
    logger_js_1.logger.error('🚨 未捕获的异常:', error);
    gracefulShutdown('uncaughtException');
});
process.on('unhandledRejection', (reason, promise) => {
    logger_js_1.logger.error('🚨 未处理的Promise拒绝:', {
        reason,
        promise: promise.toString(),
        stack: reason.stack,
    });
});
exports.default = app;
//# sourceMappingURL=server.js.map