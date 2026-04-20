"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDevelopment = exports.isProduction = exports.formatDuration = exports.generateId = exports.sanitizeInput = exports.validateRequest = exports.APIError = exports.ValidationError = exports.apiResponseSchema = exports.executeAITaskSchema = exports.createAIEngineSchema = exports.updateStepSchema = exports.createStepSchema = exports.executeWorkflowSchema = exports.updateWorkflowSchema = exports.createWorkflowSchema = void 0;
const zod_1 = require("zod");
exports.createWorkflowSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    description: zod_1.z.string().optional(),
    steps: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string().min(1),
        type: zod_1.z.enum(['AI_TASK', 'HUMAN_TASK', 'DATA_PROCESSING', 'NOTIFICATION', 'VALIDATION']),
        config: zod_1.z.record(zod_1.z.any()),
        dependencies: zod_1.z.array(zod_1.z.string()).default([]),
        order: zod_1.z.number().min(0)
    })).min(1),
    trigger: zod_1.z.object({
        type: zod_1.z.enum(['manual', 'scheduled', 'webhook', 'event']),
        config: zod_1.z.record(zod_1.z.any())
    }).optional()
});
exports.updateWorkflowSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100).optional(),
    description: zod_1.z.string().optional(),
    status: zod_1.z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
    config: zod_1.z.record(zod_1.z.any()).optional()
});
exports.executeWorkflowSchema = zod_1.z.object({
    inputData: zod_1.z.record(zod_1.z.any()).default({}),
    userId: zod_1.z.string().optional()
});
exports.createStepSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    type: zod_1.z.enum(['AI_TASK', 'HUMAN_TASK', 'DATA_PROCESSING', 'NOTIFICATION', 'VALIDATION']),
    config: zod_1.z.record(zod_1.z.any()),
    dependencies: zod_1.z.array(zod_1.z.string()).default([]),
    order: zod_1.z.number().min(0)
});
exports.updateStepSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    type: zod_1.z.enum(['AI_TASK', 'HUMAN_TASK', 'DATA_PROCESSING', 'NOTIFICATION', 'VALIDATION']).optional(),
    config: zod_1.z.record(zod_1.z.any()).optional(),
    dependencies: zod_1.z.array(zod_1.z.string()).optional(),
    order: zod_1.z.number().min(0).optional()
});
exports.createAIEngineSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    type: zod_1.z.enum(['openai', 'anthropic', 'google']),
    endpoint: zod_1.z.string().url().optional(),
    capabilities: zod_1.z.array(zod_1.z.string()).min(1),
    config: zod_1.z.record(zod_1.z.any()).optional()
});
exports.executeAITaskSchema = zod_1.z.object({
    task: zod_1.z.string().min(1),
    options: zod_1.z.object({
        model: zod_1.z.string().optional(),
        temperature: zod_1.z.number().min(0).max(2).optional(),
        maxTokens: zod_1.z.number().min(1).optional(),
        systemPrompt: zod_1.z.string().optional()
    }).optional()
});
exports.apiResponseSchema = zod_1.z.object({
    success: zod_1.z.boolean(),
    data: zod_1.z.any().optional(),
    error: zod_1.z.string().optional(),
    executionTime: zod_1.z.number().optional(),
    pagination: zod_1.z.object({
        page: zod_1.z.number(),
        limit: zod_1.z.number(),
        total: zod_1.z.number(),
        pages: zod_1.z.number()
    }).optional()
});
class ValidationError extends Error {
    constructor(message, details) {
        super(message);
        this.details = details;
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
class APIError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'APIError';
    }
}
exports.APIError = APIError;
const validateRequest = (schema, data) => {
    const result = schema.safeParse(data);
    if (!result.success) {
        throw new ValidationError('Validation failed', result.error.errors);
    }
    return result.data;
};
exports.validateRequest = validateRequest;
const sanitizeInput = (input) => {
    if (typeof input === 'string') {
        return input.trim();
    }
    if (Array.isArray(input)) {
        return input.map(exports.sanitizeInput);
    }
    if (typeof input === 'object' && input !== null) {
        return Object.fromEntries(Object.entries(input).map(([key, value]) => [key, (0, exports.sanitizeInput)(value)]));
    }
    return input;
};
exports.sanitizeInput = sanitizeInput;
const generateId = () => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
};
exports.generateId = generateId;
const formatDuration = (ms) => {
    if (ms < 1000) {
        return `${ms}ms`;
    }
    else if (ms < 60000) {
        return `${(ms / 1000).toFixed(1)}s`;
    }
    else {
        return `${(ms / 60000).toFixed(1)}m`;
    }
};
exports.formatDuration = formatDuration;
const isProduction = () => {
    return process.env.NODE_ENV === 'production';
};
exports.isProduction = isProduction;
const isDevelopment = () => {
    return process.env.NODE_ENV === 'development';
};
exports.isDevelopment = isDevelopment;
//# sourceMappingURL=validation.js.map