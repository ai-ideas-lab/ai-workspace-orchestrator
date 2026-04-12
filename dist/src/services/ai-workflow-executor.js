import { aiEngine } from './ai-engine.js';
export class AIWorkflowExecutor {
    executions = new Map();
    workflows = new Map();
    registerWorkflow(workflow) {
        this.workflows.set(workflow.id, workflow);
        console.log(`工作流已注册: ${workflow.name} (${workflow.id})`);
    }
    async executeWorkflow(workflowId, inputData = {}) {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) {
            throw new Error(`工作流不存在: ${workflowId}`);
        }
        if (workflow.status !== 'active') {
            throw new Error(`工作流未激活: ${workflow.name}`);
        }
        const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const execution = {
            id: executionId,
            workflowId,
            status: 'running',
            startTime: new Date().toISOString(),
            steps: [],
            logs: []
        };
        this.executions.set(executionId, execution);
        try {
            console.log(`开始执行工作流: ${workflow.name}`);
            await this.executeWorkflowSteps(workflow, execution, inputData);
            execution.status = 'completed';
            execution.endTime = new Date().toISOString();
            execution.duration = Date.now() - new Date(execution.startTime).getTime();
            console.log(`工作流执行完成: ${workflow.name}`);
        }
        catch (error) {
            execution.status = 'failed';
            execution.endTime = new Date().toISOString();
            execution.duration = Date.now() - new Date(execution.startTime).getTime();
            const errorMessage = error instanceof Error ? error.message : '未知错误';
            execution.logs.push({
                timestamp: new Date().toISOString(),
                level: 'error',
                message: `工作流执行失败: ${errorMessage}`,
                data: { error }
            });
            console.error(`工作流执行失败: ${workflow.name}`, error);
        }
        return execution;
    }
    async executeWorkflowSteps(workflow, execution, inputData) {
        for (const step of workflow.steps) {
            await this.executeStep(step, execution, inputData);
        }
    }
    async executeStep(step, execution, context) {
        const stepStartTime = Date.now();
        const executionStep = {
            id: `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            stepId: step.id,
            status: 'pending',
            startTime: new Date().toISOString()
        };
        execution.steps.push(executionStep);
        try {
            console.log(`开始执行步骤: ${step.name} (${step.type})`);
            executionStep.status = 'running';
            switch (step.type) {
                case 'ai-task':
                    await this.executeAITaskStep(step, executionStep, context);
                    break;
                case 'condition':
                    await this.executeConditionStep(step, executionStep, context);
                    break;
                case 'parallel':
                    await this.executeParallelStep(step, executionStep, execution, context);
                    break;
                case 'sequential':
                    await this.executeSequentialStep(step, executionStep, execution, context);
                    break;
                default:
                    throw new Error(`不支持的步骤类型: ${step.type}`);
            }
            executionStep.status = 'completed';
            executionStep.endTime = new Date().toISOString();
            executionStep.duration = Date.now() - stepStartTime;
            console.log(`步骤执行完成: ${step.name}`);
        }
        catch (error) {
            executionStep.status = 'failed';
            executionStep.endTime = new Date().toISOString();
            executionStep.duration = Date.now() - stepStartTime;
            executionStep.error = error instanceof Error ? error.message : '未知错误';
            const errorMessage = error instanceof Error ? error.message : '未知错误';
            execution.logs.push({
                timestamp: new Date().toISOString(),
                level: 'error',
                message: `步骤执行失败: ${step.name} - ${errorMessage}`,
                data: { stepId: step.id, error }
            });
            throw error;
        }
    }
    async executeAITaskStep(step, executionStep, context) {
        const { input, providerId, taskType, parameters } = step.config;
        const taskInput = this.resolveTemplate(input, context);
        const activeTasks = aiEngine.getActiveTasks();
        const providerTask = activeTasks.find(t => t.provider.id === providerId);
        if (!providerTask) {
            throw new Error(`未找到AI提供商配置: ${providerId}`);
        }
        const task = aiEngine.executeTask({
            type: taskType,
            provider: providerTask.provider,
            input: taskInput,
            parameters: parameters || {}
        });
        while (task.status === 'pending' || task.status === 'running') {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        if (task.status === 'failed') {
            throw new Error(`AI任务执行失败: ${task.error}`);
        }
        executionStep.result = {
            taskId: task.id,
            result: task.result,
            duration: task.duration
        };
        context[`step_${step.id}_result`] = task.result;
    }
    async executeConditionStep(step, executionStep, context) {
        const { condition, trueSteps, falseSteps } = step.config;
        const conditionResult = this.evaluateCondition(condition, context);
        executionStep.result = {
            condition,
            result: conditionResult
        };
        context[`step_${step.id}_condition`] = conditionResult;
    }
    async executeParallelStep(step, executionStep, execution, context) {
        const { steps: parallelSteps } = step.config;
        const promises = parallelSteps.map(async (subStep) => {
            return this.executeStep(subStep, execution, context);
        });
        await Promise.all(promises);
        executionStep.result = { parallelStepsExecuted: parallelSteps.length };
    }
    async executeSequentialStep(step, executionStep, execution, context) {
        const { steps: sequentialSteps } = step.config;
        for (const subStep of sequentialSteps) {
            await this.executeStep(subStep, execution, context);
        }
        executionStep.result = { sequentialStepsExecuted: sequentialSteps.length };
    }
    resolveTemplate(template, context) {
        return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return context[key] || match;
        });
    }
    evaluateCondition(condition, context) {
        try {
            const resolvedCondition = condition.replace(/\{\{(\w+)\}\}/g, (match, key) => {
                const value = context[key];
                return typeof value === 'string' ? `"${value}"` : String(value);
            });
            return Function('"use strict"; return (' + resolvedCondition + ')')();
        }
        catch (error) {
            console.error('条件评估失败:', error);
            return false;
        }
    }
    getExecutionHistory(executionId) {
        return this.executions.get(executionId);
    }
    getWorkflowExecutions(workflowId) {
        return Array.from(this.executions.values())
            .filter(execution => execution.workflowId === workflowId);
    }
    getAllExecutions() {
        return Array.from(this.executions.values());
    }
    cancelExecution(executionId) {
        const execution = this.executions.get(executionId);
        if (!execution || execution.status !== 'running') {
            return false;
        }
        execution.status = 'failed';
        execution.endTime = new Date().toISOString();
        execution.logs.push({
            timestamp: new Date().toISOString(),
            level: 'info',
            message: '执行已被取消'
        });
        return true;
    }
    cleanupExecutions(maxAge = 86400000) {
        const now = Date.now();
        let cleanedCount = 0;
        for (const [executionId, execution] of this.executions) {
            if (execution.endTime) {
                const endTime = new Date(execution.endTime).getTime();
                if (now - endTime > maxAge) {
                    this.executions.delete(executionId);
                    cleanedCount++;
                }
            }
        }
        return cleanedCount;
    }
    createSampleWorkflows() {
        const documentAnalysisWorkflow = {
            id: 'doc-analysis-sample',
            name: '文档分析流程',
            description: '分析文档内容并生成摘要',
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            steps: [
                {
                    id: 'step1',
                    name: '文档内容提取',
                    type: 'ai-task',
                    config: {
                        input: '{{document_content}}',
                        providerId: 'default-provider',
                        taskType: 'document-processing',
                        parameters: { extractKeywords: true }
                    },
                    nextSteps: ['step2']
                },
                {
                    id: 'step2',
                    name: '摘要生成',
                    type: 'ai-task',
                    config: {
                        input: '基于以下文档内容生成摘要: {{step1_result}}',
                        providerId: 'default-provider',
                        taskType: 'text-generation',
                        parameters: { maxLength: 500 }
                    },
                    nextSteps: []
                }
            ]
        };
        const codeReviewWorkflow = {
            id: 'code-review-sample',
            name: '代码审查流程',
            description: '对代码进行质量审查和建议',
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            steps: [
                {
                    id: 'step1',
                    name: '代码分析',
                    type: 'ai-task',
                    config: {
                        input: '{{code_content}}',
                        providerId: 'default-provider',
                        taskType: 'code-analysis',
                        parameters: { checkSecurity: true, checkPerformance: true }
                    },
                    nextSteps: ['step2']
                },
                {
                    id: 'step2',
                    name: '改进建议',
                    type: 'ai-task',
                    config: {
                        input: '基于以下代码分析结果生成改进建议: {{step1_result}}',
                        providerId: 'default-provider',
                        taskType: 'text-generation',
                        parameters: { style: 'technical' }
                    },
                    nextSteps: []
                }
            ]
        };
        this.registerWorkflow(documentAnalysisWorkflow);
        this.registerWorkflow(codeReviewWorkflow);
    }
}
export const aiWorkflowExecutor = new AIWorkflowExecutor();
//# sourceMappingURL=ai-workflow-executor.js.map