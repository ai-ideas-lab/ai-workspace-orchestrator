"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateWorkflowScheduler = void 0;
const generateWorkflowScheduler = async (workflow) => {
    const execution = await prisma.workflowExecution.create({
        data: {
            workflowId: workflow.id,
            status: 'pending',
            steps: workflow.steps.map(step => ({
                stepId: step.id,
                status: 'pending',
                output: null
            }))
        }
    });
    const taskQueue = new PriorityQueue();
    workflow.steps.forEach(step => taskQueue.enqueue(step, step.priority || 1));
    return executeNextStep(taskQueue, execution);
};
exports.generateWorkflowScheduler = generateWorkflowScheduler;
const validateStep = (step) => {
    if (!step.id || !step.name) {
        console.error(`Invalid step: missing ${!step.id ? 'id' : 'name'} - Step: ${JSON.stringify(step)}`);
        return false;
    }
    if (!Array.isArray(step.parameters) && step.parameters !== undefined) {
        console.error(`Invalid step: parameters must be an array, got ${typeof step.parameters} - Step: ${step.name}`);
        return false;
    }
    return true;
};
const executeNextStep = async (queue, execution) => {
    const step = queue.dequeue();
    if (!step)
        return execution;
    try {
        if (!validateStep(step)) {
            throw new Error('Invalid workflow step configuration');
        }
        await executeStep(step, execution.id);
        return executeNextStep(queue, execution);
    }
    catch (error) {
        console.error(`Failed to execute step ${step.name}:`, error);
        throw error;
    }
};
//# sourceMappingURL=scheduler.js.map