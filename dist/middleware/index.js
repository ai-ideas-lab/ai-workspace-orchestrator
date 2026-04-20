"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupMiddleware = setupMiddleware;
const logger_js_1 = require("../utils/logger.js");
function setupMiddleware(app, config) {
    app.use(helmet());
    app.use(cors({
        origin: process.env.FRONTEND_URL || 'http://localhost:3001',
        credentials: true,
    }));
    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
        message: {
            error: 'Too many requests from this IP, please try again later'
        }
    });
    app.use('/api/', limiter);
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    app.use((req, res, next) => {
        logger_js_1.logger.info(`${req.method} ${req.path}`, {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString()
        });
        next();
    });
    app.get('/health', (req, res) => {
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version || '1.0.0'
        });
    });
    app.use('*', (req, res) => {
        res.status(404).json({
            error: 'Not Found',
            message: `${req.method} ${req.path} is not a valid route`
        });
    });
    app.use((error, req, res, next) => {
        logger_js_1.logger.error('Unhandled error:', {
            error: error.message,
            stack: error.stack,
            path: req.path,
            method: req.method
        });
        res.status(500).json({
            error: 'Internal Server Error',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    });
    logger_js_1.logger.info('Middleware setup completed');
}
//# sourceMappingURL=index.js.map