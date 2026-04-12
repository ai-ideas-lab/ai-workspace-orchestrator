"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const service_js_1 = require("../database/service.js");
const index_js_1 = require("../database/index.js");
const zod_1 = require("zod");
const router = express_1.default.Router();
const createUserSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(50),
    email: zod_1.z.string().email(),
    role: zod_1.z.enum(['USER', 'ADMIN']).optional().default('USER'),
});
const updateUserSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(50).optional(),
    email: zod_1.z.string().email().optional(),
    role: zod_1.z.enum(['USER', 'ADMIN']).optional(),
});
router.get('/', async (req, res) => {
    try {
        const users = await index_js_1.prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json({
            success: true,
            data: users,
            message: '获取用户列表成功',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            message: '获取用户列表失败',
        });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const user = await index_js_1.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                updatedAt: true,
                workflows: {
                    select: {
                        id: true,
                        name: true,
                        status: true,
                        createdAt: true,
                    },
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                },
                executions: {
                    select: {
                        id: true,
                        status: true,
                    },
                    take: 5,
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                error: '用户不存在',
                message: '未找到指定的用户',
            });
        }
        res.json({
            success: true,
            data: user,
            message: '获取用户详情成功',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            message: '获取用户详情失败',
        });
    }
});
router.post('/', async (req, res) => {
    try {
        const validatedData = createUserSchema.parse(req.body);
        const existingUser = await index_js_1.prisma.user.findUnique({
            where: { email: validatedData.email },
        });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: '邮箱已存在',
                message: '该邮箱已被其他用户使用',
            });
        }
        const user = await index_js_1.prisma.user.create({
            data: validatedData,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        res.status(201).json({
            success: true,
            data: user,
            message: '用户创建成功',
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: '数据验证失败',
                details: error.errors,
                message: '请求数据格式不正确',
            });
        }
        res.status(500).json({
            success: false,
            error: error.message,
            message: '用户创建失败',
        });
    }
});
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const validatedData = updateUserSchema.parse(req.body);
        const existingUser = await index_js_1.prisma.user.findUnique({
            where: { id },
        });
        if (!existingUser) {
            return res.status(404).json({
                success: false,
                error: '用户不存在',
                message: '未找到指定的用户',
            });
        }
        if (validatedData.email && validatedData.email !== existingUser.email) {
            const emailExists = await index_js_1.prisma.user.findUnique({
                where: { email: validatedData.email },
            });
            if (emailExists) {
                return res.status(400).json({
                    success: false,
                    error: '邮箱已被使用',
                    message: '该邮箱已被其他用户使用',
                });
            }
        }
        const user = await index_js_1.prisma.user.update({
            where: { id },
            data: validatedData,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        res.json({
            success: true,
            data: user,
            message: '用户更新成功',
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: '数据验证失败',
                details: error.errors,
                message: '请求数据格式不正确',
            });
        }
        res.status(500).json({
            success: false,
            error: error.message,
            message: '用户更新失败',
        });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const existingUser = await index_js_1.prisma.user.findUnique({
            where: { id },
        });
        if (!existingUser) {
            return res.status(404).json({
                success: false,
                error: '用户不存在',
                message: '未找到指定的用户',
            });
        }
        await index_js_1.prisma.user.delete({
            where: { id },
        });
        res.json({
            success: true,
            message: '用户删除成功',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            message: '用户删除失败',
        });
    }
});
router.get('/:id/stats', async (req, res) => {
    try {
        const { id } = req.params;
        const user = await index_js_1.prisma.user.findUnique({
            where: { id },
            select: { id: true },
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                error: '用户不存在',
                message: '未找到指定的用户',
            });
        }
        const stats = await service_js_1.DatabaseService.getStatistics(id);
        res.json({
            success: true,
            data: stats,
            message: '获取用户统计信息成功',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            message: '获取用户统计信息失败',
        });
    }
});
exports.default = router;
//# sourceMappingURL=users.js.map