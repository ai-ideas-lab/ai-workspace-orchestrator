function aiWorkflowProcessor(commands, context = {}) {
    try {
        return commands.map(cmd => ({
            ...cmd,
            intent: extractIntent(cmd.text),
            priority: getValidatedPriority(context.user, cmd.priority),
            timestamp: new Date().toISOString(),
            status: 'queued'
        })).sort((a, b) => a.priority - b.priority);
    } catch (error) {
        console.error('工作流处理失败:', error);
        return commands.map(cmd => ({
            ...cmd,
            intent: 'unknown',
            priority: 999,
            timestamp: new Date().toISOString(),
            status: 'error'
        }));
    }
}
