import { workflowTemplateLibrary } from './workflow-template-library';
import { optimizedExecutionLogger } from './optimized-execution-logger';
import { cacheService } from './cache-service';
import { Worker } from 'worker_threads';
export class OptimizedAIScheduler {
    maxConcurrentTasks;
    maxRetries;
    cacheEnabled;
    engines = new Map();
    runningWorkflows = new Map();
    pendingTasks = [];
    taskQueue = null;
    isProcessing = false;
    metrics = {
        totalTasks: 0,
        completedTasks: 0,
        failedTasks: 0,
        averageProcessingTime: 0,
        cacheHits: 0,
        cacheMisses: 0
    };
    constructor(maxConcurrentTasks = 5, maxRetries = 3, cacheEnabled = true) {
        this.maxConcurrentTasks = maxConcurrentTasks;
        this.maxRetries = maxRetries;
        this.cacheEnabled = cacheEnabled;
        this.initializeWorker();
    }
    async initializeWorker() {
        try {
            this.taskQueue = new Worker('./src/services/task-worker.js', {
                workerData: { maxConcurrentTasks: this.maxConcurrentTasks }
            });
            this.taskQueue.on('message', (result) => {
                this.handleTaskResult(result);
            });
            this.taskQueue.on('error', (error) => {
                console.error('[OptimizedAIScheduler] 工作线程错误:', error);
            });
            console.log('[OptimizedAIScheduler] 工作线程池初始化完成');
        }
        catch (error) {
            console.error('[OptimizedAIScheduler] 工作线程池初始化失败:', error);
        }
    }
    async registerEngine(engine) {
        this.engines.set(engine.id, engine);
        if (this.cacheEnabled) {
            await cacheService.del(`engines:${engine.type}`);
        }
        console.log(`[OptimizedAIScheduler] 注册AI引擎: ${engine.name} (${engine.id})`);
    }
    async getAvailableEngines(engineType) {
        const cacheKey = engineType ? `engines:${engineType}` : 'engines:all';
        if (this.cacheEnabled) {
            const cached = await cacheService.get(cacheKey);
            if (cached) {
                this.metrics.cacheHits++;
                return cached;
            }
        }
        const allEngines = Array.from(this.engines.values());
        const availableEngines = engineType
            ? allEngines.filter(engine => engine.status === 'active' &&
                engine.load < 0.8 &&
                engine.type === engineType)
            : allEngines.filter(engine => engine.status === 'active' && engine.load < 0.8);
        if (this.cacheEnabled) {
            await cacheService.set(cacheKey, availableEngines, 300000);
            this.metrics.cacheMisses++;
        }
        return availableEngines;
    }
    async selectBestEngine(engineType, priority = 'medium') {
        const availableEngines = await this.getAvailableEngines(engineType);
        if (availableEngines.length === 0) {
            console.log(`[OptimizedAIScheduler] 没有可用的${engineType}引擎`);
            return null;
        }
        if (priority === 'high') {
            return availableEngines.reduce((best, current) => {
                const bestScore = best.load + (current.load < best.load ? 0.1 : 0);
                const currentScore = current.load + (current.load < best.load ? 0.1 : 0);
                return currentScore < bestScore ? current : best;
            });
        }
        else {
            const sortedEngines = availableEngines.sort((a, b) => {
                const aScore = a.load + (a.status === 'active' ? 0 : 0.5);
                const bScore = b.load + (b.status === 'active' ? 0 : 0.5);
                return aScore - bScore;
            });
            const selectedIndex = Math.min(Math.floor(availableEngines.length / 2), availableEngines.length - 1);
            return sortedEngines[selectedIndex];
        }
    }
    async executeWorkflowStep(step) {
        const startTime = Date.now();
        this.metrics.totalTasks++;
        if (this.cacheEnabled) {
            const cacheKey = `step-result:${step.engineId}:${JSON.stringify(step.input)}:${JSON.stringify(step.parameters)}`;
            const cached = await cacheService.get(cacheKey);
            if (cached) {
                this.metrics.cacheHits++;
                this.metrics.completedTasks++;
                this.updateProcessingTime(startTime);
                return cached;
            }
        }
        const engine = this.engines.get(step.engineId);
        if (!engine) {
            this.metrics.failedTasks++;
            this.updateProcessingTime(startTime);
            return {
                success: false,
                error: `引擎未找到: ${step.engineId}`
            };
        }
        if (engine.status !== 'active') {
            this.metrics.failedTasks++;
            this.updateProcessingTime(startTime);
            return {
                success: false,
                error: `引擎不可用: ${engine.name} (状态: ${engine.status})`
            };
        }
        console.log(`[OptimizedAIScheduler] 执行工作流步骤: ${step.id} 使用引擎 ${engine.name}`);
        try {
            const result = await this.callAIEngineWithRetry(engine, step.input, step.parameters);
            this.updateEngineLoad(engine.id, 0.3);
            if (this.cacheEnabled && result.success) {
                const cacheKey = `step-result:${step.engineId}:${JSON.stringify(step.input)}:${JSON.stringify(step.parameters)}`;
                await cacheService.set(cacheKey, result, 3600000);
            }
            this.metrics.completedTasks++;
            this.updateProcessingTime(startTime);
            return result;
        }
        catch (error) {
            this.metrics.failedTasks++;
            this.updateProcessingTime(startTime);
            return {
                success: false,
                error: error instanceof Error ? error.message : '未知错误'
            };
        }
    }
    async executeWorkflow(workflow) {
        console.log(`[OptimizedAIScheduler] 开始执行工作流: ${workflow.name}`);
        await optimizedExecutionLogger.logWorkflowStart(workflow);
        try {
            workflow.status = 'running';
            workflow.updatedAt = new Date();
            const results = [];
            let hasError = false;
            const stepPromises = workflow.steps.map(async (step, index) => {
                if (hasError) {
                    step.status = 'failed';
                    step.error = '工作流已中断';
                    return null;
                }
                console.log(`[OptimizedAIScheduler] 执行步骤 ${step.id}: ${step.engineId}`);
                await optimizedExecutionLogger.logStepStart(workflow.id, step);
                const startTime = Date.now();
                const stepResult = await this.executeWorkflowStep(step);
                const duration = Date.now() - startTime;
                if (stepResult.success) {
                    step.status = 'completed';
                    step.output = stepResult.result;
                    results.push(stepResult.result);
                    await optimizedExecutionLogger.logStepComplete(workflow.id, step.id, stepResult.result, duration);
                    const nextStepIndex = index + 1;
                    if (nextStepIndex < workflow.steps.length) {
                        workflow.steps[nextStepIndex].input = stepResult.result;
                    }
                }
                else {
                    step.status = 'failed';
                    step.error = stepResult.error;
                    hasError = true;
                    console.error(`[OptimizedAIScheduler] 步骤 ${step.id} 执行失败:`, stepResult.error);
                    await optimizedExecutionLogger.logStepFailure(workflow.id, step.id, stepResult.error || '未知错误', duration);
                }
                workflow.updatedAt = new Date();
                return stepResult;
            });
            const stepResults = await Promise.allSettled(stepPromises);
            const finalStatus = hasError ? 'failed' : 'completed';
            workflow.status = finalStatus;
            this.runningWorkflows.set(workflow.id, workflow);
            await optimizedExecutionLogger.logWorkflowComplete(workflow.id, finalStatus);
            return {
                success: !hasError,
                result: {
                    workflowId: workflow.id,
                    results,
                    finalStatus: workflow.status,
                    completedSteps: workflow.steps.filter(s => s.status === 'completed').length,
                    totalSteps: workflow.steps.length
                },
                error: hasError ? '工作流执行部分失败' : undefined
            };
        }
        catch (error) {
            workflow.status = 'failed';
            this.runningWorkflows.set(workflow.id, workflow);
            await optimizedExecutionLogger.logWorkflowComplete(workflow.id, 'failed');
            return {
                success: false,
                error: error instanceof Error ? error.message : '工作流执行失败'
            };
        }
    }
    async executeWorkflowStepsBatch(steps) {
        const results = [];
        const batchSize = Math.min(this.maxConcurrentTasks, steps.length);
        const batches = [];
        for (let i = 0; i < steps.length; i += batchSize) {
            batches.push(steps.slice(i, i + batchSize));
        }
        for (const batch of batches) {
            const batchResults = await Promise.all(batch.map(step => this.executeWorkflowStep(step)));
            results.push(...batchResults);
            if (batches.indexOf(batch) < batches.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        return results;
    }
    async getSystemStatus() {
        const cacheKey = 'system-status';
        if (this.cacheEnabled) {
            const cached = await cacheService.get(cacheKey);
            if (cached) {
                this.metrics.cacheHits++;
                return cached;
            }
        }
        const engineStatus = Array.from(this.engines.values()).map(engine => ({
            id: engine.id,
            name: engine.name,
            type: engine.type,
            status: engine.status,
            load: engine.load,
            capabilities: engine.capabilities
        }));
        const workflowStatus = Array.from(this.runningWorkflows.values()).map(workflow => ({
            id: workflow.id,
            name: workflow.name,
            status: workflow.status,
            steps: workflow.steps.length,
            completedSteps: workflow.steps.filter(s => s.status === 'completed').length,
            createdAt: workflow.createdAt.toISOString()
        }));
        const status = {
            engines: {
                total: this.engines.size,
                active: engineStatus.filter(e => e.status === 'active').length,
                averageLoad: engineStatus.reduce((acc, e) => acc + e.load, 0) / engineStatus.length || 0,
                queueSize: this.pendingTasks.length
            },
            workflows: {
                total: this.runningWorkflows.size,
                running: workflowStatus.filter(w => w.status === 'running').length,
                completed: workflowStatus.filter(w => w.status === 'completed').length
            },
            metrics: this.metrics,
            details: {
                engines: engineStatus,
                workflows: workflowStatus
            }
        };
        if (this.cacheEnabled) {
            await cacheService.set(cacheKey, status, 30000);
            this.metrics.cacheMisses++;
        }
        return status;
    }
    getPerformanceMetrics() {
        return {
            ...this.metrics,
            throughput: this.metrics.completedTasks / Math.max(1, process.uptime()),
            errorRate: this.metrics.totalTasks > 0 ? (this.metrics.failedTasks / this.metrics.totalTasks) * 100 : 0,
            cacheHitRate: this.metrics.totalCacheHits + this.metrics.cacheMisses > 0
                ? (this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses)) * 100
                : 0
        };
    }
    updateEngineLoad(engineId, loadDelta) {
        const engine = this.engines.get(engineId);
        if (engine) {
            engine.load = Math.max(0, Math.min(1, engine.load + loadDelta));
            console.log(`[OptimizedAIScheduler] 更新引擎负载: ${engine.name} = ${engine.load.toFixed(2)}`);
        }
    }
    async callAIEngineWithRetry(engine, input, parameters, retryCount = 0) {
        try {
            const result = await this.callAIEngine(engine, input, parameters);
            return result;
        }
        catch (error) {
            if (retryCount < this.maxRetries) {
                console.log(`[OptimizedAIScheduler] 重试调用AI引擎: ${engine.name} (重试次数: ${retryCount + 1})`);
                await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
                return this.callAIEngineWithRetry(engine, input, parameters, retryCount + 1);
            }
            else {
                throw error;
            }
        }
    }
    async callAIEngine(engine, input, parameters) {
        console.log(`[OptimizedAIScheduler] 调用AI引擎: ${engine.name}`, { input, parameters });
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        switch (engine.type) {
            case 'text-generation':
                return {
                    success: true,
                    type: 'text',
                    content: `生成的文本内容: ${JSON.stringify(input)}`,
                    metadata: {
                        engine: engine.name,
                        parameters,
                        timestamp: new Date().toISOString()
                    }
                };
            case 'image-generation':
                return {
                    success: true,
                    type: 'image',
                    url: `https://example.com/images/generated_${Date.now()}.png`,
                    metadata: {
                        engine: engine.name,
                        parameters,
                        timestamp: new Date().toISOString()
                    }
                };
            case 'code-analysis':
                return {
                    success: true,
                    type: 'analysis',
                    issues: [],
                    suggestions: ['优化代码结构', '添加错误处理'],
                    score: 85,
                    metadata: {
                        engine: engine.name,
                        parameters,
                        timestamp: new Date().toISOString()
                    }
                };
            case 'document-processing':
                return {
                    success: true,
                    type: 'document',
                    summary: '文档处理完成',
                    extractedData: {},
                    metadata: {
                        engine: engine.name,
                        parameters,
                        timestamp: new Date().toISOString()
                    }
                };
            default:
                throw new Error(`不支持的引擎类型: ${engine.type}`);
        }
    }
    handleTaskResult(result) {
        console.log('[OptimizedAIScheduler] 收到任务结果:', result);
    }
    updateProcessingTime(startTime) {
        const processingTime = Date.now() - startTime;
        this.metrics.averageProcessingTime =
            (this.metrics.averageProcessingTime * (this.metrics.totalTasks - 1) + processingTime) / this.metrics.totalTasks;
    }
    async getWorkflowTemplates(category) {
        const cacheKey = category ? `templates:${category}` : 'templates:all';
        if (this.cacheEnabled) {
            const cached = await cacheService.get(cacheKey);
            if (cached) {
                this.metrics.cacheHits++;
                return cached;
            }
        }
        let templates;
        if (category) {
            templates = workflowTemplateLibrary.getTemplatesByCategory(category);
        }
        else {
            templates = workflowTemplateLibrary.getAllTemplates();
        }
        if (this.cacheEnabled) {
            await cacheService.set(cacheKey, templates, 3600000);
            this.metrics.cacheMisses++;
        }
        return templates;
    }
    getWorkflow(workflowId) {
        return this.runningWorkflows.get(workflowId);
    }
    cancelWorkflow(workflowId) {
        const workflow = this.runningWorkflows.get(workflowId);
        if (workflow && workflow.status === 'running') {
            workflow.status = 'failed';
            workflow.steps.forEach(step => {
                if (step.status === 'running') {
                    step.status = 'failed';
                    step.error = '工作流已取消';
                }
            });
            workflow.updatedAt = new Date();
            console.log(`[OptimizedAIScheduler] 取消工作流: ${workflow.name}`);
            return true;
        }
        return false;
    }
    createWorkflow(name, description, steps) {
        const workflow = {
            id: `workflow-${Date.now()}`,
            name,
            description,
            steps,
            status: 'draft',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.runningWorkflows.set(workflow.id, workflow);
        console.log(`[OptimizedAIScheduler] 创建工作流: ${name} (${workflow.id})`);
        return workflow;
    }
}
export const optimizedAIScheduler = new OptimizedAIScheduler();
//# sourceMappingURL=optimized-ai-scheduler.js.map