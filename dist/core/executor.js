"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EXECUTION_CONSTANTS = void 0;
exports.executeWorkflow = executeWorkflow;
exports.EXECUTION_CONSTANTS = {
    STATUS: {
        COMPLETED: 'completed',
        FAILED: 'failed',
        PENDING: 'pending',
        SYSTEM_ERROR: 'system-error'
    },
    RETRY_CONFIG: {
        DEFAULT_MAX_RETRIES: 2,
        WORKFLOW_FETCH_MAX_RETRIES: 3,
        BASE_DELAY_MS: 1000,
        MAX_DELAY_MS: 5000
    },
    ERROR_TYPES: {
        WORKFLOW_EXECUTION_ERROR: 'workflow-execution-error',
        DATABASE_CONNECTION_ERROR: 'database',
        AI_ENGINE_ERROR: 'ai'
    },
    METADATA_KEYS: {
        ENGINE_TYPE: 'engineType',
        ORDER: 'order',
        SUCCESS: 'success',
        RETRIES: 'retries',
        FINAL_ERROR: 'finalError',
        UNEXPECTED_ERROR: 'unexpectedError',
        STEP_ID: 'stepId',
        USER_ID: 'userId',
        SESSION_ID: 'sessionId',
        CORRELATION_ID: 'correlationId'
    }
};
async function getWorkflow(workflowId) {
    const workflow = await prisma.workflow.findUnique({
        where: { id: workflowId }
    });
    if (!workflow) {
        throw new Error(`Workflow not found: ${workflowId}`);
    }
    return {
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
        steps: workflow.steps,
        createdAt: workflow.createdAt,
        updatedAt: workflow.updatedAt
    };
}
function sortWorkflowSteps(steps) {
    return steps.sort((a, b) => a.order - b.order);
}
async function executeWorkflowStep(step, userInput, previousResults) {
    const startTime = Date.now();
    try {
        const engine = getEngine(step.engineType);
        const output = await engine.execute(step, userInput, previousResults);
        return {
            stepId: step.id,
            output,
            status: 'completed',
            duration: Date.now() - startTime,
            metadata: {
                [exports.EXECUTION_CONSTANTS.METADATA_KEYS.ENGINE_TYPE]: step.engineType,
                [exports.EXECUTION_CONSTANTS.METADATA_KEYS.ORDER]: step.order,
                [exports.EXECUTION_CONSTANTS.METADATA_KEYS.SUCCESS]: true
            }
        };
    }
    catch (error) {
        const asyncErrorHandler = AsyncErrorHandler.getInstance();
        const context = {
            operation: `workflow_step_${step.id}`,
            userId: previousResults[0]?.metadata?.userId || 'unknown',
            sessionId: `session_${Date.now()}`,
            correlationId: `correlation_${Date.now()}`,
            metadata: {
                stepId: step.id,
                engineType: step.engineType,
                order: step.order,
                previousResults: previousResults.length,
                userInput
            }
        };
        try {
            const output = await asyncErrorHandler.executeWithRetry(async () => {
                const engine = getEngine(step.engineType);
                return await engine.execute(step, userInput, previousResults);
            }, context, {
                maxRetries: exports.EXECUTION_CONSTANTS.RETRY_CONFIG.DEFAULT_MAX_RETRIES,
                baseDelayMs: exports.EXECUTION_CONSTANTS.RETRY_CONFIG.BASE_DELAY_MS,
                maxDelayMs: exports.EXECUTION_CONSTANTS.RETRY_CONFIG.MAX_DELAY_MS,
                retryCondition: (error) => {
                    return !(error instanceof AppError && error.isOperational);
                },
                onRetry: (error, attempt) => {
                    console.warn(`工作流步骤 ${step.id} 第 ${attempt} 次重试:`, {
                        error: error instanceof Error ? error.message : String(error),
                        attempt,
                        stepId: step.id,
                        engineType: step.engineType
                    });
                }
            });
            return {
                stepId: step.id,
                output,
                status: exports.EXECUTION_CONSTANTS.STATUS.COMPLETED,
                duration: Date.now() - startTime,
                metadata: {
                    [exports.EXECUTION_CONSTANTS.METADATA_KEYS.ENGINE_TYPE]: step.engineType,
                    [exports.EXECUTION_CONSTANTS.METADATA_KEYS.ORDER]: step.order,
                    [exports.EXECUTION_CONSTANTS.METADATA_KEYS.SUCCESS]: true,
                    retries: exports.EXECUTION_CONSTANTS.RETRY_CONFIG.DEFAULT_MAX_RETRIES
                }
            };
        }
        catch (finalError) {
            console.error(`工作流步骤 ${step.id} 执行失败（重试后）:`, {
                error: finalError instanceof Error ? finalError.message : String(finalError),
                stepId: step.id,
                engineType: step.engineType,
                order: step.order
            });
            return {
                stepId: step.id,
                output: null,
                status: 'failed',
                error: finalError instanceof Error ? finalError.message : String(finalError),
                duration: Date.now() - startTime,
                metadata: {
                    [exports.EXECUTION_CONSTANTS.METADATA_KEYS.ENGINE_TYPE]: step.engineType,
                    [exports.EXECUTION_CONSTANTS.METADATA_KEYS.ORDER]: step.order,
                    [exports.EXECUTION_CONSTANTS.METADATA_KEYS.SUCCESS]: false,
                    retries: exports.EXECUTION_CONSTANTS.RETRY_CONFIG.DEFAULT_MAX_RETRIES,
                    [exports.EXECUTION_CONSTANTS.METADATA_KEYS.FINAL_ERROR]: finalError instanceof Error ? finalError.constructor.name : String(finalError)
                }
            };
        }
    }
}
async function executeWorkflow(workflowId, userInput) {
    const startTime = Date.now();
    try {
        const asyncErrorHandler = AsyncErrorHandler.getInstance();
        const workflow = await asyncErrorHandler.executeWithRetry(async () => {
            const workflow = await getWorkflow(workflowId);
            if (!workflow.steps || workflow.steps.length === 0) {
                throw new Error(`Workflow ${workflowId} has no steps`);
            }
            return workflow;
        }, {
            operation: `get_workflow_${workflowId}`,
            userId: 'unknown',
            sessionId: `session_${Date.now()}`,
            correlationId: `correlation_${Date.now()}`,
            metadata: { workflowId, userInput }
        }, {
            maxRetries: 3,
            baseDelayMs: 1000,
            maxDelayMs: 5000,
            retryCondition: (error) => {
                return error.message.includes('database') || error.message.includes('connection');
            }
        });
        const sortedSteps = sortWorkflowSteps(workflow.steps);
        const results = [];
        for (const step of sortedSteps) {
            try {
                const result = await executeWorkflowStep(step, userInput, results);
                results.push(result);
                if (result.status === 'failed') {
                    console.warn(`Step ${step.id} failed, but continuing with workflow execution`);
                    if (step.engineType === 'database' || step.engineType === 'ai') {
                        console.error(`Critical step ${step.id} failed, workflow may be incomplete`);
                    }
                }
            }
            catch (stepError) {
                console.error(`Unexpected error in step ${step.id}:`, stepError);
                results.push({
                    stepId: step.id,
                    output: null,
                    status: 'failed',
                    error: stepError instanceof Error ? stepError.message : String(stepError),
                    duration: 0,
                    metadata: {
                        engineType: step.engineType,
                        order: step.order,
                        success: false,
                        unexpectedError: true
                    }
                });
            }
        }
        const totalDuration = Date.now() - startTime;
        const successfulSteps = results.filter(r => r.status === 'completed').length;
        const totalSteps = results.length;
        const successRatio = totalSteps > 0 ? successfulSteps / totalSteps : 0;
        const overallSuccess = successRatio >= 0.5;
        if (!overallSuccess) {
            console.warn(`Workflow ${workflowId} execution incomplete: ${successfulSteps}/${totalSteps} steps completed`);
        }
        return {
            workflowId,
            results,
            completedAt: new Date(),
            totalDuration,
            success: overallSuccess,
            metadata: {
                totalSteps,
                successfulSteps,
                successRatio,
                userInputLength: userInput.length
            }
        };
    }
    catch (error) {
        const totalDuration = Date.now() - startTime;
        const asyncErrorHandler = AsyncErrorHandler.getInstance();
        const context = {
            operation: `execute_workflow_${workflowId}`,
            userId: 'unknown',
            sessionId: `session_${Date.now()}`,
            correlationId: `correlation_${Date.now()}`,
            metadata: { workflowId, userInput }
        };
        await asyncErrorHandler.logOperationFailure(context, error, 1);
        return {
            workflowId,
            results: [{
                    stepId: 'system-error',
                    output: null,
                    status: 'failed',
                    error: error instanceof Error ? error.message : String(error),
                    duration: totalDuration,
                    metadata: {
                        error: 'workflow-execution-error',
                        workflowId,
                        userInputLength: userInput.length,
                        timestamp: new Date().toISOString()
                    }
                }],
            completedAt: new Date(),
            totalDuration,
            success: false,
            metadata: {
                systemError: true,
                errorType: error instanceof Error ? error.constructor.name : 'UnknownError'
            }
        };
    }
}
//# sourceMappingURL=executor.js.map