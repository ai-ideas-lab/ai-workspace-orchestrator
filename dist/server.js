"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const database_service_js_1 = require("./services/database-service.js");
const index_js_1 = require("./database/index.js");
const users_js_1 = __importDefault(require("./routes/users.js"));
const workflows_js_1 = __importDefault(require("./routes/workflows.js"));
const app = (0, express_1.default)();
exports.app = app;
const PORT = process.env.PORT || 3000;
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: '请求过于频繁，请稍后再试'
});
app.use('/api/', limiter);
index_js_1.Database.connect().catch(console.error);
app.use('/api/users', users_js_1.default);
app.use('/api/workflows', workflows_js_1.default);
app.get('/api/users/optimized', async (req, res) => {
    try {
        const users = await database_service_js_1.dbService.getAllUsersWithPostsOptimized();
        res.json({
            success: true,
            data: users,
            message: '获取用户列表成功（优化版本）'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            message: '获取用户列表失败'
        });
    }
});
app.get('/api/users/original', async (req, res) => {
    try {
        const users = await database_service_js_1.dbService.getAllUsersWithPosts();
        res.json({
            success: true,
            data: users,
            message: '获取用户列表成功（原始版本）'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            message: '获取用户列表失败'
        });
    }
});
app.get('/api/posts/search', async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) {
            return res.status(400).json({
                success: false,
                error: '搜索关键词不能为空',
                message: '请提供搜索关键词'
            });
        }
        const posts = await database_service_js_1.dbService.searchPosts(query);
        res.json({
            success: true,
            data: posts,
            message: `搜索"${query}"成功`
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            message: '搜索失败'
        });
    }
});
app.get('/api/users/:id', async (req, res) => {
    try {
        const user = await database_service_js_1.dbService.getUserById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: '用户不存在',
                message: `ID为${req.params.id}的用户不存在`
            });
        }
        res.json({
            success: true,
            data: user,
            message: '获取用户信息成功'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            message: '获取用户信息失败'
        });
    }
});
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'API服务正常运行',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});
app.use((err, req, res, next) => {
    console.error('API错误:', err);
    res.status(500).json({
        success: false,
        error: '服务器内部错误',
        message: '请稍后重试或联系管理员'
    });
});
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: '接口不存在',
        message: `请求的路径 ${req.path} 不存在`
    });
});
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`🚀 API服务器已启动，端口: ${PORT}`);
        console.log(`📊 性能对比API:`);
        console.log(`   - 原始版本: http://localhost:${PORT}/api/users/original`);
        console.log(`   - 优化版本: http://localhost:${PORT}/api/users/optimized`);
        console.log(`🔍 搜索API: http://localhost:${PORT}/api/posts/search?q=关键词`);
        console.log(`👤 用户管理API: http://localhost:${PORT}/api/users`);
        console.log(`   - GET /api/users - 获取所有用户`);
        console.log(`   - POST /api/users - 创建新用户`);
        console.log(`   - GET /api/users/:id - 获取用户详情`);
        console.log(`   - PUT /api/users/:id - 更新用户`);
        console.log(`   - DELETE /api/users/:id - 删除用户`);
        console.log(`   - GET /api/users/:id/stats - 获取用户统计`);
        console.log(`🔄 工作流管理API: http://localhost:${PORT}/api/workflows`);
        console.log(`   - GET /api/workflows - 获取工作流列表`);
        console.log(`   - POST /api/workflows - 创建新工作流`);
        console.log(`   - GET /api/workflows/:id - 获取工作流详情`);
        console.log(`   - PUT /api/workflows/:id - 更新工作流`);
        console.log(`   - DELETE /api/workflows/:id - 删除工作流`);
        console.log(`   - POST /api/workflows/:id/execute - 执行工作流`);
        console.log(`   - GET /api/workflows/:id/executions - 获取执行历史`);
        console.log(`   - POST /api/workflows/validate - 验证工作流配置`);
        console.log(`   - POST /api/workflows/execution-path - 获取执行路径`);
        console.log(`💚 健康检查: http://localhost:${PORT}/api/health`);
    });
}
//# sourceMappingURL=server.js.map