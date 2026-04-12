// Priority configuration mapping
const PRIORITY_CONFIG = {
    admin: 1,
    default: 5
};

// Intent detection patterns
const INTENT_PATTERNS = {
    create: /创建/,
    delete: /删除/,
    start: /启动/,
    stop: /停止/,
    analyze: /分析/
};

/**
 * Extract intent from command text
 * @param {string} text - Command text
 * @returns {string} Detected intent
 */
function extractIntent(text) {
    for (const [intent, pattern] of Object.entries(INTENT_PATTERNS)) {
        if (pattern.test(text)) {
            return intent;
        }
    }
    return 'unknown';
}

/**
 * Calculate priority based on user role and command priority
 * @param {Object} user - User object with role
 * @param {number} commandPriority - Command priority (optional)
 * @returns {number} Calculated priority
 */
function calculatePriority(user, commandPriority) {
    if (user?.role === 'admin') {
        return PRIORITY_CONFIG.admin;
    }
    return commandPriority || PRIORITY_CONFIG.default;
}

/**
 * AI Workflow Core Function
 * @param {Array} commands - Array of commands to process
 * @param {Object} context - Context with user information
 * @returns {Array} Processed and sorted commands
 */
function aiWorkflowProcessor(commands, context = {}) {
    return commands.map(cmd => ({
        ...cmd,
        intent: extractIntent(cmd.text),
        priority: calculatePriority(context.user, cmd.priority),
        timestamp: new Date().toISOString(),
        status: 'queued'
    })).sort((a, b) => a.priority - b.priority);
}

module.exports = { aiWorkflowProcessor, extractIntent, calculatePriority };