"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiWorkflowOrchestrator = exports.AIWorkflowOrchestrator = void 0;
const ai_task_executor_js_1 = require("./ai-task-executor.js");
const logger_js_1 = require("../utils/logger.js");
const events_1 = require("events");
const uuid_1 = require("uuid");
class AIWorkflowOrchestrator extends events_1.EventEmitter {
    constructor() {
        super(...arguments);
        this.activeExecutions = new Map();
        this.workflowQueue = [];
        this.isProcessing = false;
    }
    async startWorkflow(workflow) {
        try {
            const execution = {
                id: (0, uuid_1.v4)(),
                workflowId: workflow.id,
                status: 'running',
                startTime: new Date().toISOString(),
                steps: [],
                logs: [],
            };
            this.activeExecutions.set(execution.id, execution);
            this.emit('workflowStarted', execution);
            logger_js_1.logger.info(`Starting workflow execution: ${execution.id} for workflow ${workflow.id}`);
            await this.executeWorkflowSteps(workflow, execution);
            execution.status = this.determineExecutionStatus(execution.steps);
            execution.endTime = new Date().toISOString();
            execution.duration = this.calculateDuration(execution.startTime, execution.endTime);
            logger_js_1.logger.info(`Workflow execution completed: ${execution.id} with status: ${execution.status}`);
            this.emit('workflowCompleted', execution);
            return execution;
        }
        catch (error) {
            logger_js_1.logger.error(`Workflow execution failed: ${workflow.id}`, error);
            throw error;
        }
    }
    cancelWorkflow(executionId) {
        const execution = this.activeExecutions.get(executionId);
        if (!execution) {
            logger_js_1.logger.warn(`Execution ${executionId} not found`);
            return false;
        }
        for (const step of execution.steps) {
            if (step.status === 'running') {
                ai_task_executor_js_1.aiTaskExecutor.cancelTask(step.id);
                step.status = 'failed';
                step.error = 'Workflow cancelled';
                step.endTime = new Date().toISOString();
            }
        }
        execution.status = 'cancelled';
        execution.endTime = new Date().toISOString();
        this.emit('workflowCancelled', execution);
        logger_js_1.logger.info(`Workflow execution cancelled: ${executionId}`);
        return true;
    }
    getExecutionHistory(executionId) {
        return this.activeExecutions.get(executionId) || null;
    }
    getWorkflowExecutions(workflowId) {
        return Array.from(this.activeExecutions.values())
            .filter(execution => execution.workflowId === workflowId);
    }
    getActiveExecutions() {
        return Array.from(this.activeExecutions.values())
            .filter(execution => execution.status === 'running');
    }
    getExecutionStats() {
        const executions = Array.from(this.activeExecutions.values());
        return {
            total: executions.length,
            running: executions.filter(e => e.status === 'running').length,
            completed: executions.filter(e => e.status === 'completed').length,
            failed: executions.filter(e => e.status === 'failed').length,
            cancelled: executions.filter(e => e.status === 'cancelled').length,
        };
    }
    async executeWorkflowSteps(workflow, execution) {
        const stepResults = new Map();
        const sortedSteps = this.sortStepsByDependencies(workflow.steps);
        for (const step of sortedSteps) {
            try {
                const executionStep = {
                    id: (0, uuid_1.v4)(),
                    stepId: step.id,
                    status: 'pending',
                };
                execution.steps.push(executionStep);
                this.emit('stepStarted', executionStep);
                const canExecute = await this.checkStepPreconditions(step, stepResults);
                if (!canExecute) {
                    executionStep.status = 'skipped';
                    executionStep.endTime = new Date().toISOString();
                    this.emit('stepSkipped', executionStep);
                    continue;
                }
                executionStep.status = 'running';
                executionStep.startTime = new Date().toISOString();
                const result = await this.executeStep(step, executionStep, stepResults);
                executionStep.result = result;
                executionStep.status = 'completed';
                executionStep.endTime = new Date().toISOString();
                executionStep.duration = this.calculateDuration(executionStep.startTime, executionStep.endTime);
                stepResults.set(step.id, result);
                this.emit('stepCompleted', executionStep);
                logger_js_1.logger.debug(`Step completed: ${step.id}`);
            }
            catch (error) {
                const executionStep = execution.steps[execution.steps.length - 1];
                if (executionStep) {
                    executionStep.status = 'failed';
                    executionStep.error = error instanceof Error ? error.message : 'Unknown error';
                    executionStep.endTime = new Date().toISOString();
                    executionStep.duration = this.calculateDuration(executionStep.startTime, executionStep.endTime);
                    this.emit('stepFailed', executionStep);
                }
                logger_js_1.logger.error(`Step execution failed: ${step.id}`, error);
                if (step.type !== 'parallel' && step.type !== 'sequential') {
                    throw error;
                }
            }
        }
    }
    async executeStep(step, executionStep, stepResults) {
        switch (step.type) {
            case 'ai-task':
                return await this.executeAITask(step, executionStep, stepResults);
            case 'condition':
                return await this.executeCondition(step, executionStep, stepResults);
            case 'parallel':
                return await this.executeParallel(step, executionStep, stepResults);
            case 'sequential':
                return await this.executeSequential(step, executionStep, stepResults);
            default:
                throw new Error(`Unsupported step type: ${step.type}`);
        }
    }
    async executeAITask(step, executionStep, stepResults) {
        const taskConfig = step.config;
        const input = this.replaceTemplateVariables(taskConfig.input, stepResults);
        const parameters = this.replaceTemplateVariables(taskConfig.parameters, stepResults);
        const task = {
            id: (0, uuid_1.v4)(),
            type: taskConfig.taskType || 'text-generation',
            provider: taskConfig.provider,
            input,
            parameters,
            status: ai_providers_js_1.AITaskStatus.PENDING,
        };
        const taskPromise = new Promise((resolve, reject) => {
            const onTaskCompleted = (completedTask) => {
                if (completedTask.id === task.id) {
                    ai_task_executor_js_1.aiTaskExecutor.removeListener('taskCompleted', onTaskCompleted);
                    ai_task_executor_js_1.aiTaskExecutor.removeListener('taskFailed', onTaskFailed);
                    if (completedTask.status === ai_providers_js_1.AITaskStatus.COMPLETED) {
                        resolve(completedTask.result);
                    }
                    else {
                        reject(new Error(completedTask.error));
                    }
                }
            };
            const onTaskFailed = (failedTask) => {
                if (failedTask.id === task.id) {
                    ai_task_executor_js_1.aiTaskExecutor.removeListener('taskCompleted', onTaskCompleted);
                    ai_task_executor_js_1.aiTaskExecutor.removeListener('taskFailed', onTaskFailed);
                    reject(new Error(failedTask.error));
                }
            };
            ai_task_executor_js_1.aiTaskExecutor.on('taskCompleted', onTaskCompleted);
            ai_task_executor_js_1.aiTaskExecutor.on('taskFailed', onTaskFailed);
        });
        await ai_task_executor_js_1.aiTaskExecutor.executeTask(task);
        return await taskPromise;
    }
    async executeCondition(step, executionStep, stepResults) {
        const condition = step.config.condition;
        const trueValue = step.config.trueValue;
        const falseValue = step.config.falseValue;
        const conditionResult = this.evaluateCondition(condition, stepResults);
        return conditionResult ? trueValue : falseValue;
    }
    async executeParallel(step, executionStep, stepResults) {
        const subSteps = step.config.steps || [];
        const promises = subSteps.map(subStep => this.executeStep(subStep, executionStep, stepResults));
        const results = await Promise.all(promises);
        return {
            results,
            count: results.length,
        };
    }
    async executeSequential(step, executionStep, stepResults) {
        const subSteps = step.config.steps || [];
        const results = [];
        for (const subStep of subSteps) {
            const result = await this.executeStep(subStep, executionStep, stepResults);
            results.push(result);
            stepResults.set(`${step.id}_${subStep.id}`, result);
        }
        return {
            results,
            count: results.length,
        };
    }
    async checkStepPreconditions(step, stepResults) {
        if (!step.config.preconditions) {
            return true;
        }
        for (const precondition of step.config.preconditions) {
            const conditionResult = this.evaluateCondition(precondition, stepResults);
            if (!conditionResult) {
                return false;
            }
        }
        return true;
    }
    sortStepsByDependencies(steps) {
        const sorted = [];
        const visited = new Set();
        const visiting = new Set();
        const visit = (step) => {
            if (visiting.has(step.id)) {
                throw new Error(`Circular dependency detected: ${step.id}`);
            }
            if (visited.has(step.id)) {
                return;
            }
            visiting.add(step.id);
            for (const nextStepId of step.nextSteps) {
                const nextStep = steps.find(s => s.id === nextStepId);
                if (nextStep) {
                    visit(nextStep);
                }
            }
            visiting.delete(step.id);
            visited.add(step.id);
            sorted.push(step);
        };
        for (const step of steps) {
            visit(step);
        }
        return sorted.reverse();
    }
    evaluateCondition(condition, stepResults) {
        if (typeof condition === 'string') {
            return stepResults.has(condition) && !!stepResults.get(condition);
        }
        if (typeof condition === 'object') {
            return this.evaluateComplexCondition(condition, stepResults);
        }
        return Boolean(condition);
    }
    evaluateComplexCondition(condition, stepResults) {
        if (condition.$and) {
            return condition.$and.every((c) => this.evaluateCondition(c, stepResults));
        }
        if (condition.$or) {
            return condition.$or.some((c) => this.evaluateCondition(c, stepResults));
        }
        if (condition.$not) {
            return !this.evaluateCondition(condition.$not, stepResults);
        }
        return false;
    }
    replaceTemplateVariables(template, stepResults) {
        if (typeof template === 'string') {
            return template.replace(/\${([^}]+)}/g, (match, path) => {
                const [stepId, ...resultPath] = path.split('.');
                const result = stepResults.get(stepId);
                if (result && resultPath.length > 0) {
                    return this.getNestedValue(result, resultPath.join('.'));
                }
                return result || '';
            });
        }
        if (typeof template === 'object' && template !== null) {
            const result = Array.isArray(template) ? [] : {};
            for (const [key, value] of Object.entries(template)) {
                result[key] = this.replaceTemplateVariables(value, stepResults);
            }
            return result;
        }
        return template;
    }
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }
    determineExecutionStatus(steps) {
        const hasFailedSteps = steps.some(step => step.status === 'failed');
        const hasCancelledSteps = steps.some(step => step.status === 'cancelled');
        if (hasCancelledSteps) {
            return 'cancelled';
        }
        if (hasFailedSteps) {
            return 'failed';
        }
        return 'completed';
    }
    calculateDuration(startTime, endTime) {
        if (!startTime || !endTime)
            return 0;
        const start = new Date(startTime).getTime();
        const end = new Date(endTime).getTime();
        return end - start;
    }
}
exports.AIWorkflowOrchestrator = AIWorkflowOrchestrator;
exports.aiWorkflowOrchestrator = new AIWorkflowOrchestrator();
//# sourceMappingURL=ai-workflow-orchestrator.js.map