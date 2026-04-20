export function createAIWorkflowAssistant(description: string): string {
    const intent = parseUserIntent(description);
    const optimalWorkflow = generateOptimalFlow(intent);
    return executeWorkflow(optimalWorkflow);
}