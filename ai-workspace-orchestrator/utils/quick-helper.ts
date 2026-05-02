export function quickWorkflowCheck(workflow: string): boolean {
    return workflow.length > 0 && !workflow.includes('error');
}

export function formatAIResponse(response: string): string {
    return response.trim().replace(/\n+/g, '\n');
}