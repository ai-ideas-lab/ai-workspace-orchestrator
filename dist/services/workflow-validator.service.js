"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowValidator = void 0;
const logger_js_1 = require("../utils/logger.js");
const zod_1 = require("zod");
const workflowSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, '工作流名称不能为空').max(100, '工作流名称不能超过100个字符'),
    description: zod_1.z.string().max(500, '描述不能超过500个字符').optional(),
    config: zod_1.z.object({
        trigger: zod_1.z.object({
            type: zod_1.z.enum(['manual', 'scheduled', 'webhook', 'api']),
            config: zod_1.z.record(zod_1.z.any()).optional()
        }).optional(),
        variables: zod_1.z.record(zod_1.z.any()).optional()
    }).optional(),
    steps: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string().min(1, '步骤ID不能为空'),
        name: zod_1.z.string().min(1, '步骤名称不能为空'),
        type: zod_1.z.enum(['ai_generation', 'data_processing', 'api_call', 'condition', 'loop']),
        config: zod_1.z.object({}),
        order: zod_1.z.number().min(0),
        dependencies: zod_1.z.array(zod_1.z.string()).optional(),
        timeout: zod_1.z.number().min(1).max(3600).optional()
    }))
}).refine(data => {
    const stepIds = data.steps.map(step => step.id);
    return stepIds.length === new Set(stepIds).size;
}, {
    message: '步骤ID必须唯一',
    path: ['steps']
});
const stepConfigSchemas = {
    ai_generation: zod_1.z.object({
        model: zod_1.z.string().min(1),
        prompt: zod_1.z.string().min(1),
        systemPrompt: zod_1.z.string().optional(),
        temperature: zod_1.z.number().min(0).max(2).optional(),
        maxTokens: zod_1.z.number().min(1).optional(),
        inputVariables: zod_1.z.array(zod_1.z.string()).optional()
    }),
    data_processing: zod_1.z.object({
        processor: zod_1.z.string().min(1),
        input: zod_1.z.record(zod_1.z.any()).optional(),
        outputFormat: zod_1.z.string().optional()
    }),
    api_call: zod_1.z.object({
        method: zod_1.z.enum(['GET', 'POST', 'PUT', 'DELETE']),
        url: zod_1.z.string().url(),
        headers: zod_1.z.record(zod_1.z.string()).optional(),
        body: zod_1.z.record(zod_1.z.any()).optional(),
        timeout: zod_1.z.number().min(1000).optional()
    }),
    condition: zod_1.z.object({
        variable: zod_1.z.string().min(1),
        operator: zod_1.z.enum(['equals', 'not_equals', 'greater_than', 'less_than', 'contains']),
        value: zod_1.z.any(),
        ifTrue: zod_1.z.number().min(0),
        ifFalse: zod_1.z.number().min(0)
    }),
    loop: zod_1.z.object({
        type: zod_1.z.enum(['count', 'condition']),
        count: zod_1.z.number().min(1).optional(),
        condition: zod_1.z.string().optional(),
        variable: zod_1.z.string().optional(),
        stepId: zod_1.z.string().min(1)
    })
};
class WorkflowValidator {
    static validateWorkflow(workflow) {
        try {
            workflowSchema.parse(workflow);
            workflow.steps.forEach(step => {
                const stepSchema = stepConfigSchemas[step.type];
                if (stepSchema) {
                    try {
                        stepSchema.parse(step.config);
                    }
                    catch (error) {
                        logger_js_1.logger.error(`步骤 "${step.name}" 配置验证失败:`, error);
                        throw new Error(`步骤 "${step.name}" 配置无效: ${error.message}`);
                    }
                }
            });
            this.validateDependencies(workflow.steps);
            return { valid: true, errors: [] };
        }
        catch (error) {
            logger_js_1.logger.error('工作流验证失败:', error);
            return {
                valid: false,
                errors: error instanceof Error ? [error.message] : ['未知验证错误']
            };
        }
    }
    static validateDependencies(steps) {
        const stepIds = steps.map(step => step.id);
        steps.forEach(step => {
            if (step.dependencies) {
                step.dependencies.forEach(depId => {
                    if (!stepIds.includes(depId)) {
                        throw new Error(`步骤 "${step.name}" 依赖的步骤 "${depId}" 不存在`);
                    }
                    if (depId === step.id) {
                        throw new Error(`步骤 "${step.name}" 不能依赖自身`);
                    }
                });
            }
        });
    }
    static validateExecutionInput(workflow, input) {
        try {
            if (workflow.config?.variables) {
                Object.keys(workflow.config.variables).forEach(varName => {
                    if (workflow.config.variables[varName].required && !input[varName]) {
                        throw new Error(`缺少必需变量: ${varName}`);
                    }
                });
            }
            return { valid: true, errors: [] };
        }
        catch (error) {
            return {
                valid: false,
                errors: error instanceof Error ? [error.message] : ['执行输入验证失败']
            };
        }
    }
    static getExecutionOrder(steps) {
        const ordered = [];
        const remaining = [...steps];
        const processed = new Set();
        while (remaining.length > 0) {
            let found = false;
            for (let i = 0; i < remaining.length; i++) {
                const step = remaining[i];
                const canProcess = !step.dependencies?.some(depId => !processed.has(depId));
                if (canProcess) {
                    ordered.push(step);
                    processed.add(step.id);
                    remaining.splice(i, 1);
                    found = true;
                    break;
                }
            }
            if (!found) {
                throw new Error('工作流存在循环依赖或无法解析的依赖关系');
            }
        }
        return ordered;
    }
}
exports.WorkflowValidator = WorkflowValidator;
//# sourceMappingURL=workflow-validator.service.js.map