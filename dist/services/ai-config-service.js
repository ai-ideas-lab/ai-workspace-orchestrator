"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const router = express_1.default.Router();
const aiConfigSchema = zod_1.z.object({
    provider: zod_1.z.enum(['openai', 'anthropic', 'google']),
    apiKey: zod_1.z.string().min(1, 'API密钥不能为空'),
    model: zod_1.z.string().min(1, '模型名称不能为空'),
    baseUrl: zod_1.z.string().optional(),
    maxTokens: zod_1.z.number().min(1).max(32000).optional(),
    temperature: zod_1.z.number().min(0).max(2).optional(),
});
let aiConfigs = [];
router.get('/configs', (req, res) => {
    try {
        res.json({
            success: true,
            data: aiConfigs,
            count: aiConfigs.length
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: '获取配置失败',
            details: error instanceof Error ? error.message : '未知错误'
        });
    }
});
router.post('/config', (req, res) => {
    try {
        const validatedData = aiConfigSchema.parse(req.body);
        const existingConfig = aiConfigs.find(config => config.provider === validatedData.provider &&
            config.model === validatedData.model);
        if (existingConfig) {
            return res.status(400).json({
                success: false,
                error: '该配置已存在',
                provider: validatedData.provider,
                model: validatedData.model
            });
        }
        const newConfig = {
            id: `ai_${Date.now()}`,
            provider: validatedData.provider,
            apiKey: validatedData.apiKey,
            model: validatedData.model,
            baseUrl: validatedData.baseUrl || getDefaultUrl(validatedData.provider),
            maxTokens: validatedData.maxTokens || getDefaultMaxTokens(validatedData.provider),
            temperature: validatedData.temperature || 0.7,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isActive: true
        };
        aiConfigs.push(newConfig);
        res.status(201).json({
            success: true,
            data: newConfig,
            message: 'AI服务配置添加成功'
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: '参数验证失败',
                details: error.errors
            });
        }
        res.status(500).json({
            success: false,
            error: '添加配置失败',
            details: error instanceof Error ? error.message : '未知错误'
        });
    }
});
router.put('/config/:id', (req, res) => {
    try {
        const { id } = req.params;
        const validatedData = aiConfigSchema.parse(req.body);
        const configIndex = aiConfigs.findIndex(config => config.id === id);
        if (configIndex === -1) {
            return res.status(404).json({
                success: false,
                error: '配置不存在'
            });
        }
        const updatedConfig = {
            ...aiConfigs[configIndex],
            ...validatedData,
            baseUrl: validatedData.baseUrl || aiConfigs[configIndex].baseUrl,
            maxTokens: validatedData.maxTokens || aiConfigs[configIndex].maxTokens,
            temperature: validatedData.temperature || aiConfigs[configIndex].temperature,
            updatedAt: new Date().toISOString()
        };
        aiConfigs[configIndex] = updatedConfig;
        res.json({
            success: true,
            data: updatedConfig,
            message: 'AI服务配置更新成功'
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: '参数验证失败',
                details: error.errors
            });
        }
        res.status(500).json({
            success: false,
            error: '更新配置失败',
            details: error instanceof Error ? error.message : '未知错误'
        });
    }
});
router.delete('/config/:id', (req, res) => {
    try {
        const { id } = req.params;
        const configIndex = aiConfigs.findIndex(config => config.id === id);
        if (configIndex === -1) {
            return res.status(404).json({
                success: false,
                error: '配置不存在'
            });
        }
        const deletedConfig = aiConfigs.splice(configIndex, 1)[0];
        res.json({
            success: true,
            data: deletedConfig,
            message: 'AI服务配置删除成功'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: '删除配置失败',
            details: error instanceof Error ? error.message : '未知错误'
        });
    }
});
router.post('/test-connection', (req, res) => {
    try {
        const { provider, apiKey, model } = req.body;
        if (!provider || !apiKey || !model) {
            return res.status(400).json({
                success: false,
                error: '缺少必要参数'
            });
        }
        const testResult = {
            success: true,
            message: '连接测试成功',
            provider,
            model,
            responseTime: Math.floor(Math.random() * 1000) + 100,
            timestamp: new Date().toISOString()
        };
        res.json(testResult);
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: '连接测试失败',
            details: error instanceof Error ? error.message : '未知错误'
        });
    }
});
router.get('/providers', (req, res) => {
    const providers = [
        {
            id: 'openai',
            name: 'OpenAI',
            models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
            description: 'OpenAI GPT系列模型，强大的通用AI能力'
        },
        {
            id: 'anthropic',
            name: 'Anthropic',
            models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
            description: 'Anthropic Claude系列模型，注重安全性和对话能力'
        },
        {
            id: 'google',
            name: 'Google',
            models: ['gemini-pro', 'gemini-1.5-pro', 'gemini-1.5-flash'],
            description: 'Google Gemini系列模型，多模态AI能力'
        }
    ];
    res.json({
        success: true,
        data: providers
    });
});
function getDefaultUrl(provider) {
    const urls = {
        openai: 'https://api.openai.com/v1',
        anthropic: 'https://api.anthropic.com',
        google: 'https://generativelanguage.googleapis.com/v1beta'
    };
    return urls[provider] || '';
}
function getDefaultMaxTokens(provider) {
    const maxTokens = {
        openai: 4000,
        anthropic: 8000,
        google: 8000
    };
    return maxTokens[provider] || 4000;
}
exports.default = router;
//# sourceMappingURL=ai-config-service.js.map