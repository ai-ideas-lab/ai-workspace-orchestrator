// AI Workflow Core Function
function aiWorkflowProcessor(commands, context = {}) {
    return commands.map(cmd => ({
        ...cmd,
        intent: cmd.text.match(/创建|删除|启动|停止|分析/)?.[0] || 'unknown',
        priority: context.user?.role === 'admin' ? 1 : cmd.priority || 5,
        timestamp: new Date().toISOString(),
        status: 'queued'
    })).sort((a, b) => a.priority - b.priority);
}

module.exports = aiWorkflowProcessor;