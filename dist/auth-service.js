import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
app.use(helmet());
app.use(cors());
app.use(express.json());
const users = new Map();
const sessions = new Map();
const registerSchema = z.object({
    username: z.string().min(3).max(20),
    email: z.string().email(),
    password: z.string().min(6),
});
const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});
const hashPassword = async (password) => {
    return await bcrypt.hash(password, 10);
};
const comparePassword = async (password, hash) => {
    return await bcrypt.compare(password, hash);
};
const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET || 'default-secret', { expiresIn: '24h' });
};
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'ai-workspace-orchestrator-auth'
    });
});
app.post('/auth/register', async (req, res) => {
    try {
        const validatedData = registerSchema.parse(req.body);
        const existingUser = Array.from(users.values()).find(user => user.email === validatedData.email);
        if (existingUser) {
            return res.status(409).json({
                success: false,
                error: '邮箱已被注册'
            });
        }
        const existingUsername = Array.from(users.values()).find(user => user.username === validatedData.username);
        if (existingUsername) {
            return res.status(409).json({
                success: false,
                error: '用户名已被使用'
            });
        }
        const passwordHash = await hashPassword(validatedData.password);
        const user = {
            id: uuidv4(),
            username: validatedData.username,
            email: validatedData.email,
            passwordHash,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        users.set(user.id, user);
        const token = generateToken(user.id);
        const session = {
            id: uuidv4(),
            userId: user.id,
            token,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            isActive: true,
        };
        sessions.set(session.id, session);
        res.status(201).json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    createdAt: user.createdAt,
                },
                token: token,
                expiresAt: session.expiresAt,
            },
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                error: '参数验证失败',
                details: error.errors,
            });
        }
        console.error('注册错误:', error);
        res.status(500).json({
            success: false,
            error: '注册失败',
        });
    }
});
app.post('/auth/login', async (req, res) => {
    try {
        const validatedData = loginSchema.parse(req.body);
        const user = Array.from(users.values()).find(u => u.email === validatedData.email);
        if (!user) {
            return res.status(401).json({
                success: false,
                error: '邮箱或密码错误'
            });
        }
        const isPasswordValid = await comparePassword(validatedData.password, user.passwordHash);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                error: '邮箱或密码错误'
            });
        }
        const token = generateToken(user.id);
        const session = {
            id: uuidv4(),
            userId: user.id,
            token,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            isActive: true,
        };
        sessions.set(session.id, session);
        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    createdAt: user.createdAt,
                },
                token: token,
                expiresAt: session.expiresAt,
            },
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                error: '参数验证失败',
                details: error.errors,
            });
        }
        console.error('登录错误:', error);
        res.status(500).json({
            success: false,
            error: '登录失败',
        });
    }
});
app.get('/auth/me', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: '缺少认证token'
            });
        }
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
        const user = Array.from(users.values()).find(u => u.id === decoded.userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                error: '用户不存在'
            });
        }
        const session = Array.from(sessions.values()).find(s => s.token === token && s.userId === decoded.userId && s.isActive && s.expiresAt > new Date());
        if (!session) {
            return res.status(401).json({
                success: false,
                error: 'token无效或已过期'
            });
        }
        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    createdAt: user.createdAt,
                },
                session: {
                    token: token,
                    expiresAt: session.expiresAt,
                },
            },
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error('Token验证错误:', error);
        res.status(401).json({
            success: false,
            error: 'token无效或已过期'
        });
    }
});
app.post('/auth/logout', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(400).json({
                success: false,
                error: '缺少认证token'
            });
        }
        const token = authHeader.substring(7);
        const session = Array.from(sessions.values()).find(s => s.token === token);
        if (session) {
            session.isActive = false;
            sessions.set(session.id, session);
        }
        res.json({
            success: true,
            message: '注销成功',
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error('注销错误:', error);
        res.status(500).json({
            success: false,
            error: '注销失败',
        });
    }
});
const initializeAdmin = async () => {
    const adminExists = Array.from(users.values()).find(user => user.email === 'admin@example.com');
    if (!adminExists) {
        const passwordHash = await hashPassword('admin123');
        const admin = {
            id: uuidv4(),
            username: 'admin',
            email: 'admin@example.com',
            passwordHash,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        users.set(admin.id, admin);
        console.log('管理员用户已创建: admin@example.com / admin123');
    }
};
const startServer = async () => {
    try {
        await initializeAdmin();
        app.listen(PORT, () => {
            console.log(`🚀 认证服务已启动: http://localhost:${PORT}`);
            console.log(`📋 API文档:`);
            console.log(`  POST /auth/register - 用户注册`);
            console.log(`  POST /auth/login - 用户登录`);
            console.log(`  GET /auth/me - 获取用户信息`);
            console.log(`  POST /auth/logout - 用户注销`);
            console.log(`  GET /health - 健康检查`);
        });
    }
    catch (error) {
        console.error('服务器启动失败:', error);
        process.exit(1);
    }
};
startServer();
export default app;
//# sourceMappingURL=auth-service.js.map