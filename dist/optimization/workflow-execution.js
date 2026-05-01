"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optimizeWorkflowExecution = optimizeWorkflowExecution;
async function optimizeWorkflowExecution(workflowId, executionConfig) {
    try {
        const workflow = await prisma.workflow.findUnique({
            where: { id: workflowId },
            include: { steps: true, aiAgents: true }
        });
        if (!workflow) {
            throw new Error(`Workflow not found: ${workflowId}`);
        }
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
    catch (error) {
        console.error(`Error optimizing workflow execution for ${workflowId}:`, error);
        throw new Error(`Failed to optimize workflow execution: ${error instanceof Error ? error.message : String(error)}`);
    }
}
//# sourceMappingURL=workflow-execution.js.map