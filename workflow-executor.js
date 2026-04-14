function createWorkflowExecutor(workflow: Workflow, engine: AIEngine): Promise<ExecutionResult> {
    if (!workflow.steps?.length) return { success: false, error: 'Empty workflow' };
    
    const context = { workspace: workflow.workspace, variables: workflow.variables };
    const results = [];
    
    for (const step of workflow.steps) {
        const result = await engine.execute(step.type, step.config, context);
        results.push(result);
        context.variables = { ...context.variables, ...result.variables };
    }
    
    return { success: true, results, context };
}