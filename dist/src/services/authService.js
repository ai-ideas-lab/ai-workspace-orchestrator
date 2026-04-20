import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { successResponse, errorResponse, validationErrorResponse, authErrorResponse, conflictErrorResponse } from '../utils/responseUtils';
import { hashPassword, comparePassword, generateToken, verifyToken, findUserByEmail, findUserById, findActiveSessionByToken, createSession, deactivateSession, extractTokenFromHeader, isUserExistsByEmail, isUserExistsByUsername } from '../utils/authUtils';
import { registerSchema, loginSchema, validateRequest, formatValidationError } from '../utils/validationUtils';
dotenv.config();
const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);
app.use(helmet());
app.use(cors());
app.use(express.json());
const users = new Map();
const sessions = new Map();
const registerSchemaWithValidation = registerSchema;
const loginSchemaWithValidation = loginSchema;
app.get('/health', (req, res) => {
    successResponse(res, {
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'ai-workspace-orchestrator-auth'
    }, undefined, 200);
});
app.post('/auth/register', async (req, res) => {
    try {
        const validatedData = validateRequest(registerSchemaWithValidation, req.body);
        if (isUserExistsByEmail(users, validatedData.email)) {
            return conflictErrorResponse(res, '邮箱已被注册');
        }
        if (isUserExistsByUsername(users, validatedData.username)) {
            return conflictErrorResponse(res, '用户名已被使用');
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
        const session = createSession(user.id, token);
        sessions.set(session.id, session);
        const authResponse = {
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                createdAt: user.createdAt,
            },
            token: token,
            expiresAt: session.expiresAt,
        };
        successResponse(res, authResponse, '注册成功', 201);
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return validationErrorResponse(res, formatValidationError(error));
        }
        console.error('注册错误:', error);
        errorResponse(res, '注册失败');
    }
});
app.post('/auth/login', async (req, res) => {
    try {
        const validatedData = validateRequest(loginSchemaWithValidation, req.body);
        const user = findUserByEmail(users, validatedData.email);
        if (!user) {
            return authErrorResponse(res, '邮箱或密码错误');
        }
        const isPasswordValid = await comparePassword(validatedData.password, user.passwordHash);
        if (!isPasswordValid) {
            return authErrorResponse(res, '邮箱或密码错误');
        }
        const token = generateToken(user.id);
        const session = createSession(user.id, token);
        sessions.set(session.id, session);
        const authResponse = {
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                createdAt: user.createdAt,
            },
            token: token,
            expiresAt: session.expiresAt,
        };
        successResponse(res, authResponse, '登录成功');
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return validationErrorResponse(res, formatValidationError(error));
        }
        console.error('登录错误:', error);
        errorResponse(res, '登录失败');
    }
});
app.get('/auth/me', async (req, res) => {
    try {
        const token = extractTokenFromHeader(req.headers.authorization);
        if (!token) {
            return authErrorResponse(res, '缺少认证token');
        }
        const decoded = verifyToken(token);
        if (!decoded) {
            return authErrorResponse(res, 'token无效或已过期');
        }
        const user = findUserById(users, decoded.userId);
        if (!user) {
            return authErrorResponse(res, '用户不存在');
        }
        const session = findActiveSessionByToken(sessions, token);
        if (!session) {
            return authErrorResponse(res, 'token无效或已过期');
        }
        const userResponse = {
            id: user.id,
            username: user.username,
            email: user.email,
            createdAt: user.createdAt,
        };
        successResponse(res, {
            user: userResponse,
            session: {
                token: token,
                expiresAt: session.expiresAt,
            },
        });
    }
    catch (error) {
        console.error('Token验证错误:', error);
        authErrorResponse(res, 'token无效或已过期');
    }
});
app.post('/auth/logout', async (req, res) => {
    try {
        const token = extractTokenFromHeader(req.headers.authorization);
        if (!token) {
            return authErrorResponse(res, '缺少认证token');
        }
        const deactivated = deactivateSession(sessions, token);
        if (deactivated) {
            successResponse(res, null, '注销成功');
        }
        else {
            successResponse(res, null, '注销成功（token不存在或已失效）');
        }
    }
    catch (error) {
        console.error('注销错误:', error);
        errorResponse(res, '注销失败');
    }
});
const initializeAdmin = async () => {
    if (!isUserExistsByEmail(users, 'admin@example.com')) {
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
//# sourceMappingURL=authService.js.map