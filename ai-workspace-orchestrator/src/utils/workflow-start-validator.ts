export function canStartWorkflow(workflow: any): boolean {
    return workflow && 
           workflow.status === 'ready' && 
           workflow.steps.length > 0 &&
           !workflow.isRunning;
}