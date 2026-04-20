"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("./database"));
const ai_engine_1 = __importDefault(require("./ai-engine"));
class WorkflowExecutionEngine {
    constructor() {
        this.db = database_1.default.getInstance();
        this.aiEngine = new ai_engine_1.default();
    }
    async executeWorkflow(workflowId, inputData = {}, userId) {
        const prisma = this.db.getPrisma();
        const execution = await prisma.workflowExecution.create({
            data: {
                workflowId,
                userId,
                triggerData: inputData,
                status: 'RUNNING',
                startedAt: new Date()
            }
        });
        try {
            const workflow = await prisma.workflow.findUnique({
                where: { id: workflowId },
                include: {
                    steps: {
                        orderBy: { order: 'asc' }
                    }
                }
            });
            if (!workflow) {
                throw new Error(`Workflow ${workflowId} not found`);
            }
            const results = {};
            const stepExecutions = [];
            for (const step of workflow.steps) {
                const dependenciesMet = this.checkDependencies(step.dependencies, results);
                if (!dependenciesMet) {
                    await prisma.executionStep.create({
                        data: {
                            executionId: execution.id,
                            stepId: step.id,
                            name: step.name,
                            type: step.type,
                            status: 'PENDING',
                            order: step.order
                        }
                    });
                    continue;
                }
                const result = await this.executeStep(step, inputData, results, execution.id);
                const stepExecution = await prisma.executionStep.create({
                    data: {
                        executionId: execution.id,
                        stepId: step.id,
                        name: step.name,
                        type: step.type,
                        status: result.success ? 'COMPLETED' : 'FAILED',
                        config: step.config,
                        result: result.success ? result.output : undefined,
                        error: result.success ? undefined : result.error,
                        order: step.order,
                        startTime: new Date(),
                        endTime: new Date()
                    }
                });
                stepExecutions.push(stepExecution);
                results[step.id] = result;
            }
            const allStepsCompleted = stepExecutions.every(step => step.status === 'COMPLETED');
            const finalStatus = allStepsCompleted ? 'COMPLETED' : 'FAILED';
            const completedExecution = await prisma.workflowExecution.update({
                where: { id: execution.id },
                data: {
                    status: finalStatus,
                    result: this.generateExecutionResult(results),
                    errorMessage: finalStatus === 'FAILED' ? 'Some steps failed to execute' : undefined,
                    completedAt: new Date(),
                    executionTimeMs: Date.now() - execution.startedAt.getTime()
                }
            });
            return completedExecution;
        }
        catch (error) {
            await prisma.workflowExecution.update({
                where: { id: execution.id },
                data: {
                    status: 'FAILED',
                    errorMessage: error instanceof Error ? error.message : 'Unknown error',
                    completedAt: new Date(),
                    executionTimeMs: Date.now() - execution.startedAt.getTime()
                }
            });
            throw error;
        }
    }
    async executeStep(step, inputData, previousResults, executionId) {
        const prisma = this.db.getPrisma();
        try {
            let result;
            switch (step.type) {
                case 'AI_TASK':
                    result = await this.executeAITask(step, inputData, previousResults);
                    break;
                case 'HUMAN_TASK':
                    result = await this.executeHumanTask(step, inputData, previousResults);
                    break;
                case 'DATA_PROCESSING':
                    result = await this.executeDataProcessing(step, inputData, previousResults);
                    break;
                case 'NOTIFICATION':
                    result = await this.executeNotification(step, inputData, previousResults);
                    break;
                case 'VALIDATION':
                    result = await this.executeValidation(step, inputData, previousResults);
                    break;
                default:
                    throw new Error(`Unsupported step type: ${step.type}`);
            }
            await prisma.stepExecutionHistory.create({
                data: {
                    executionId,
                    stepId: step.id,
                    status: result.success ? 'COMPLETED' : 'FAILED',
                    inputData: step.config,
                    outputData: result.output,
                    errorMessage: result.error,
                    startTime: new Date(),
                    endTime: new Date(),
                    durationMs: result.success ? 0 : undefined
                }
            });
            return result;
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                output: undefined
            };
        }
    }
    async executeAITask(step, inputData, previousResults) {
        const { engineId, prompt, systemPrompt, model, temperature } = step.config;
        const context = this.buildContextFromResults(previousResults);
        const fullPrompt = this.interpolatePrompt(prompt, { ...inputData, ...context });
        const response = await this.aiEngine.executeTask(engineId, fullPrompt, {
            systemPrompt,
            model,
            temperature
        });
        if (response.success) {
            return {
                success: true,
                data: response.data,
                output: response.data
            };
        }
        else {
            return {
                success: false,
                error: response.error,
                output: undefined
            };
        }
    }
    async executeHumanTask(step, inputData, previousResults) {
        return {
            success: false,
            error: 'Human tasks require external polling or webhook callbacks',
            output: { status: 'pending' }
        };
    }
    async executeDataProcessing(step, inputData, previousResults) {
        const { transformation, validation } = step.config;
        try {
            const processedData = this.processData(inputData, transformation);
            if (validation) {
                const isValid = this.validateData(processedData, validation);
                if (!isValid) {
                    return {
                        success: false,
                        error: 'Data validation failed',
                        output: processedData
                    };
                }
            }
            return {
                success: true,
                data: processedData,
                output: processedData
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Data processing failed',
                output: undefined
            };
        }
    }
    async executeNotification(step, inputData, previousResults) {
        const { type, message, recipients } = step.config;
        try {
            console.log(`Sending ${type} notification to ${recipients}: ${message}`);
            return {
                success: true,
                data: { type, recipients, sent: true },
                output: { type, recipients, sent: true }
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Notification failed',
                output: undefined
            };
        }
    }
    async executeValidation(step, inputData, previousResults) {
        const { rules } = step.config;
        try {
            const isValid = this.validateInput(inputData, rules);
            return {
                success: isValid,
                data: { valid: isValid },
                output: { valid: isValid, rules }
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Validation failed',
                output: undefined
            };
        }
    }
    checkDependencies(dependencies, results) {
        return dependencies.every(depId => {
            const result = results[depId];
            return result && result.success;
        });
    }
    buildContextFromResults(results) {
        const context = {};
        Object.entries(results).forEach(([stepId, result]) => {
            if (result.success && result.output) {
                context[stepId] = result.output;
            }
        });
        return context;
    }
    interpolatePrompt(prompt, context) {
        return prompt.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return context[key] !== undefined ? String(context[key]) : match;
        });
    }
    processData(input, transformation) {
        if (transformation.type === 'extract') {
            return { [transformation.field]: input[transformation.field] };
        }
        return input;
    }
    validateData(data, rules) {
        return true;
    }
    validateInput(input, rules) {
        return true;
    }
    generateExecutionResults(results) {
        const successfulSteps = Object.entries(results)
            .filter(([_, result]) => result.success)
            .map(([stepId, result]) => ({ stepId, ...result }));
        const failedSteps = Object.entries(results)
            .filter(([_, result]) => !result.success)
            .map(([stepId, result]) => ({ stepId, ...result }));
        return {
            successfulSteps,
            failedSteps,
            summary: {
                total: Object.keys(results).length,
                successful: successfulSteps.length,
                failed: failedSteps.length
            }
        };
    }
}
exports.default = WorkflowExecutionEngine;
//# sourceMappingURL=workflow-engine.js.map