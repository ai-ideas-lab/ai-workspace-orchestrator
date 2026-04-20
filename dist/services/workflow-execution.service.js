"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.workflowExecutionService = exports.WorkflowExecutionService = void 0;
const types_1 = require("../types");
const logger_1 = require("../utils/logger");
const database_1 = require("../database");
const agent_service_1 = require("./agent.service");
class WorkflowExecutionService {
    constructor() {
        this.executions = new Map();
    }
    async executeWorkflow(workflowId, input) {
        logger_1.logger.info(`Starting workflow execution: ${workflowId}`, { input });
        const workflow = await database_1.db.prisma.workflow.findUnique({
            where: { id: workflowId },
            include: {
                agents: true,
            },
        });
        if (!workflow) {
            throw new Error(`Workflow not found: ${workflowId}`);
        }
        const execution = await database_1.db.prisma.workflowExecution.create({
            data: {
                workflowId,
                agentId: workflow.agents[0]?.id || '',
                status: types_1.ExecutionStatus.PENDING,
                input: JSON.stringify(input),
            },
        });
        const executionData = {
            id: execution.id,
            workflowId,
            agentId: execution.agentId,
            status: execution.status,
            input,
            startTime: execution.startTime,
            steps: [],
        };
        this.executions.set(execution.id, executionData);
        logger_1.logger.info(`Workflow execution started: ${execution.id}`);
        this.executeStepsAsync(executionData);
        return executionData;
    }
    async executeStepsAsync(execution) {
        try {
            const workflow = await database_1.db.prisma.workflow.findUnique({
                where: { id: execution.workflowId },
                include: {
                    agents: true,
                },
            });
            if (!workflow) {
                throw new Error(`Workflow not found: ${execution.workflowId}`);
            }
            const config = workflow.config;
            const steps = config.steps || [];
            for (let i = 0; i < steps.length; i++) {
                const step = steps[i];
                await this.executeStep(execution, step, i);
            }
            await this.updateExecutionStatus(execution.id, types_1.ExecutionStatus.COMPLETED);
            logger_1.logger.info(`Workflow execution completed: ${execution.id}`);
        }
        catch (error) {
            logger_1.logger.error(`Workflow execution failed: ${execution.id}`, { error: error.message });
            await this.updateExecutionStatus(execution.id, types_1.ExecutionStatus.FAILED, error.message);
        }
    }
    async executeStep(execution, step, stepNumber) {
        const executionStep = {
            id: `step_${execution.id}_${stepNumber}`,
            executionId: execution.id,
            stepNumber,
            name: step.name,
            description: step.description,
            status: types_1.StepStatus.PENDING,
            input: {},
        };
        await database_1.db.prisma.executionStep.create({
            data: {
                id: executionStep.id,
                executionId: execution.id,
                stepNumber,
                name: step.name,
                description: step.description,
                status: types_1.StepStatus.PENDING,
                input: JSON.stringify(executionStep.input),
            },
        });
        execution.steps.push(executionStep);
        try {
            await this.updateStepStatus(executionStep.id, types_1.StepStatus.RUNNING);
            executionStep.status = types_1.StepStatus.RUNNING;
            executionStep.startTime = new Date();
            switch (step.type) {
                case 'ai_generation':
                    await this.executeAIStep(executionStep, step);
                    break;
                case 'data_processing':
                    await this.executeDataProcessingStep(executionStep, step);
                    break;
                case 'api_call':
                    await this.executeAPICallStep(executionStep, step);
                    break;
                case 'condition':
                    await this.executeConditionStep(executionStep, step);
                    break;
                default:
                    throw new Error(`Unsupported step type: ${step.type}`);
            }
            await this.updateStepStatus(executionStep.id, types_1.StepStatus.COMPLETED);
            executionStep.status = types_1.StepStatus.COMPLETED;
            executionStep.endTime = new Date();
            executionStep.duration = executionStep.endTime.getTime() - executionStep.startTime.getTime();
            logger_1.logger.info(`Step completed: ${executionStep.id}`);
        }
        catch (error) {
            logger_1.logger.error(`Step failed: ${executionStep.id}`, { error: error.message });
            await this.updateStepStatus(executionStep.id, types_1.StepStatus.FAILED, error.message);
            executionStep.status = types_1.StepStatus.FAILED;
            executionStep.error = error.message;
            executionStep.endTime = new Date();
            throw error;
        }
    }
    async executeAIStep(executionStep, step) {
        if (!step.agentId) {
            throw new Error('Agent ID is required for AI generation step');
        }
        const agent = await database_1.db.prisma.workflowAgent.findUnique({
            where: { id: step.agentId },
        });
        if (!agent) {
            throw new Error(`Agent not found: ${step.agentId}`);
        }
        const input = step.config.input || {};
        const result = await agent_service_1.agentService.executeAgent(agent.id, input);
        executionStep.output = result;
        await database_1.db.prisma.executionStep.update({
            where: { id: executionStep.id },
            data: {
                output: JSON.stringify(result),
            },
        });
    }
    async executeDataProcessingStep(executionStep, step) {
        const inputData = step.config.input || {};
        const processingFunction = step.config.function;
        if (!processingFunction) {
            throw new Error('Processing function is required for data processing step');
        }
        try {
            const output = {
                processedData: inputData,
                timestamp: new Date().toISOString(),
            };
            executionStep.output = output;
            await database_1.db.prisma.executionStep.update({
                where: { id: executionStep.id },
                data: {
                    output: JSON.stringify(output),
                },
            });
        }
        catch (error) {
            throw new Error(`Data processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async executeAPICallStep(executionStep, step) {
        const apiUrl = step.config.url;
        const method = step.config.method || 'GET';
        const headers = step.config.headers || {};
        const data = step.config.data || {};
        if (!apiUrl) {
            throw new Error('API URL is required for API call step');
        }
        try {
            const response = await fetch(apiUrl, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    ...headers,
                },
                body: method !== 'GET' ? JSON.stringify(data) : undefined,
            });
            if (!response.ok) {
                throw new Error(`API call failed: ${response.status} ${response.statusText}`);
            }
            const result = await response.json();
            executionStep.output = {
                status: response.status,
                data: result,
            };
            await database_1.db.prisma.executionStep.update({
                where: { id: executionStep.id },
                data: {
                    output: JSON.stringify(executionStep.output),
                },
            });
        }
        catch (error) {
            throw new Error(`API call failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async executeConditionStep(executionStep, step) {
        const condition = step.config.condition;
        const data = step.config.data || {};
        if (!condition) {
            throw new Error('Condition is required for condition step');
        }
        const conditionMet = this.evaluateCondition(condition, data);
        executionStep.output = {
            conditionMet,
            condition,
            data,
        };
        await database_1.db.prisma.executionStep.update({
            where: { id: executionStep.id },
            data: {
                output: JSON.stringify(executionStep.output),
            },
        });
    }
    evaluateCondition(condition, data) {
        if (condition.field && condition.operator && condition.value !== undefined) {
            const fieldValue = data[condition.field];
            switch (condition.operator) {
                case 'eq':
                    return fieldValue === condition.value;
                case 'ne':
                    return fieldValue !== condition.value;
                case 'gt':
                    return Number(fieldValue) > Number(condition.value);
                case 'lt':
                    return Number(fieldValue) < Number(condition.value);
                case 'contains':
                    return String(fieldValue).includes(String(condition.value));
                default:
                    return false;
            }
        }
        return false;
    }
    async updateExecutionStatus(executionId, status, error) {
        await database_1.db.prisma.workflowExecution.update({
            where: { id: executionId },
            data: {
                status,
                error,
                endTime: new Date(),
            },
        });
        const execution = this.executions.get(executionId);
        if (execution) {
            execution.status = status;
            if (error) {
                execution.error = error;
            }
            execution.endTime = new Date();
            execution.duration = execution.endTime.getTime() - execution.startTime.getTime();
        }
    }
    async updateStepStatus(stepId, status, error) {
        await database_1.db.prisma.executionStep.update({
            where: { id: stepId },
            data: {
                status,
                error,
                endTime: status === types_1.StepStatus.RUNNING ? null : new Date(),
            },
        });
    }
    getExecution(executionId) {
        return this.executions.get(executionId);
    }
    getAllExecutions() {
        return Array.from(this.executions.values());
    }
}
exports.WorkflowExecutionService = WorkflowExecutionService;
exports.workflowExecutionService = new WorkflowExecutionService();
//# sourceMappingURL=workflow-execution.service.js.map