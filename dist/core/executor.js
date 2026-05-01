"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeWorkflow = executeWorkflow;
const constants_1 = require("../constants");
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
    try {
        return steps.sort((a, b) => a.order - b.order);
    }
    catch (error) {
        console.error("Error sorting workflow steps:", error);
        return steps;
    }
}
async function executeWorkflowStep(step, userInput, previousResults) {
    const startTime = Date.now();
    try {
        const engine = getEngine(step.engineType);
        const output = await engine.execute(step, userInput, previousResults);
        return {
            stepId: step.id,
            output,
            status: constants_1.WORKFLOW_STATUS.COMPLETED,
            duration: Date.now() - startTime,
            metadata: {
                [constants_1.METADATA_KEYS.ENGINE_TYPE]: step.engineType,
                [constants_1.METADATA_KEYS.ORDER]: step.order,
                [constants_1.METADATA_KEYS.SUCCESS]: true
            }
        };
    }
    catch (error) {
        const asyncErrorHandler = AsyncErrorHandler.getInstance();
        const context = {
            operation: `workflow_step_${step.id}`,
            userId: previousResults[0]?.metadata?.userId || 'unknown',
            sessionId: `${constants_1.ID_PATTERNS.SESSION_PREFIX}${Date.now()}`,
            correlationId: `${constants_1.ID_PATTERNS.CORRELATION_PREFIX}${Date.now()}`,
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
                maxRetries: constants_1.TIMING.DEFAULT_MAX_RETRIES,
                baseDelayMs: constants_1.TIMING.BASE_DELAY_MS,
                maxDelayMs: constants_1.TIMING.MAX_DELAY_MS,
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
                status: constants_1.WORKFLOW_STATUS.COMPLETED,
                duration: Date.now() - startTime,
                metadata: {
                    [constants_1.METADATA_KEYS.ENGINE_TYPE]: step.engineType,
                    [constants_1.METADATA_KEYS.ORDER]: step.order,
                    [constants_1.METADATA_KEYS.SUCCESS]: true,
                    retries: constants_1.TIMING.DEFAULT_MAX_RETRIES
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
                status: constants_1.WORKFLOW_STATUS.FAILED,
                error: finalError instanceof Error ? finalError.message : String(finalError),
                duration: Date.now() - startTime,
                metadata: {
                    [constants_1.METADATA_KEYS.ENGINE_TYPE]: step.engineType,
                    [constants_1.METADATA_KEYS.ORDER]: step.order,
                    [constants_1.METADATA_KEYS.SUCCESS]: false,
                    retries: constants_1.TIMING.DEFAULT_MAX_RETRIES,
                    [constants_1.METADATA_KEYS.FINAL_ERROR]: finalError instanceof Error ? finalError.constructor.name : String(finalError)
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
            sessionId: `${constants_1.ID_PATTERNS.SESSION_PREFIX}${Date.now()}`,
            correlationId: `${constants_1.ID_PATTERNS.CORRELATION_PREFIX}${Date.now()}`,
            metadata: { workflowId, userInput }
        }, {
            maxRetries: constants_1.TIMING.WORKFLOW_FETCH_MAX_RETRIES,
            baseDelayMs: constants_1.TIMING.BASE_DELAY_MS,
            maxDelayMs: constants_1.TIMING.MAX_DELAY_MS,
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
                if (result.status === constants_1.WORKFLOW_STATUS.FAILED) {
                    console.warn(`Step ${step.id} failed, but continuing with workflow execution`);
                    if (step.engineType === constants_1.STEP_TYPE.DATABASE || step.engineType === constants_1.STEP_TYPE.AI) {
                        console.error(`Critical step ${step.id} failed, workflow may be incomplete`);
                    }
                }
            }
            catch (stepError) {
                console.error(`Unexpected error in step ${step.id}:`, stepError);
                results.push({
                    stepId: step.id,
                    output: null,
                    status: constants_1.WORKFLOW_STATUS.FAILED,
                    error: stepError instanceof Error ? stepError.message : String(stepError),
                    duration: 0,
                    metadata: {
                        [constants_1.METADATA_KEYS.ENGINE_TYPE]: step.engineType,
                        [constants_1.METADATA_KEYS.ORDER]: step.order,
                        [constants_1.METADATA_KEYS.SUCCESS]: false,
                        [constants_1.METADATA_KEYS.UNEXPECTED_ERROR]: true
                    }
                });
            }
        }
        const totalDuration = Date.now() - startTime;
        const successfulSteps = results.filter(r => r.status === constants_1.WORKFLOW_STATUS.COMPLETED).length;
        const totalSteps = results.length;
        const successRatio = totalSteps > 0 ? successfulSteps / totalSteps : 0;
        const overallSuccess = successRatio >= constants_1.TIMING.SUCCESS_THRESHOLD_RATIO;
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
            sessionId: `${constants_1.ID_PATTERNS.SESSION_PREFIX}${Date.now()}`,
            correlationId: `${constants_1.ID_PATTERNS.CORRELATION_PREFIX}${Date.now()}`,
            metadata: { workflowId, userInput }
        };
        await asyncErrorHandler.logOperationFailure(context, error, 1);
        return {
            workflowId,
            results: [{
                    stepId: constants_1.ID_PATTERNS.SYSTEM_ERROR_ID,
                    output: null,
                    status: constants_1.WORKFLOW_STATUS.FAILED,
                    error: error instanceof Error ? error.message : String(error),
                    duration: totalDuration,
                    metadata: {
                        [constants_1.METADATA_KEYS.ERROR]: constants_1.ERROR_TYPES.WORKFLOW_EXECUTION_ERROR,
                        workflowId,
                        userInputLength: userInput.length,
                        [constants_1.METADATA_KEYS.TIMESTAMP]: new Date().toISOString()
                    }
                }],
            completedAt: new Date(),
            totalDuration,
            success: false,
            metadata: {
                [constants_1.METADATA_KEYS.SYSTEM_ERROR]: true,
                [constants_1.METADATA_KEYS.ERROR]: error instanceof Error ? error.constructor.name : 'UnknownError'
            }
        };
    }
}
//# sourceMappingURL=executor.js.map