"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optimizeWorkflowExecution = optimizeWorkflowExecution;
async function optimizeWorkflowExecution(workflowId, executionConfig) {
    const workflow = await prisma.workflow.findUnique({
        where: { id: workflowId },
        include: { steps: true, aiAgents: true }
    });
    const optimizedSteps = workflow.steps.map(step => ({
        ...step,
        priority: executionConfig.priorityStrategy(step.priority),
        retryCount: 0
    }));
    return await prisma.workflowExecution.create({
        data: {
            workflowId,
            status: 'running',
            steps: optimizedSteps,
            metadata: { strategy: 'priority-based-optimization' }
        }
    });
}
//# sourceMappingURL=workflow-execution.js.map