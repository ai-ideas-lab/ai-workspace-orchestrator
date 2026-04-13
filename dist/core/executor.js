"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeWorkflow = executeWorkflow;
async function executeWorkflow(workflowId, userInput) {
    const workflow = await prisma.workflow.findUnique({ where: { id: workflowId } });
    if (!workflow)
        throw new Error('Workflow not found');
    const steps = workflow.steps.sort((a, b) => a.order - b.order);
    const results = [];
    for (const step of steps) {
        const engine = getEngine(step.engineType);
        const result = await engine.execute(step, userInput, results);
        results.push(result);
    }
    return { workflowId, results, completedAt: new Date() };
}
//# sourceMappingURL=executor.js.map