export function quickWorkflowStatus(): "idle" | "running" | "completed" | "error" {
    // Simple mock implementation - in production this would check actual workflow state
    return "idle";
}

export function isWorkflowActive(): boolean {
    return quickWorkflowStatus() === "running";
}
