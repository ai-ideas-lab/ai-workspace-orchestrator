"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateCompletionProbability = calculateCompletionProbability;
exports.getProbabilityLevel = getProbabilityLevel;
function calculateCompletionProbability(taskWeight, agentCapacity, complexity = 1.0) {
    if (taskWeight < 1 || taskWeight > 20) {
        throw new Error('Task weight must be between 1 and 20');
    }
    if (agentCapacity < 1 || agentCapacity > 100) {
        throw new Error('Agent capacity must be between 1 and 100');
    }
    if (complexity < 0.5 || complexity > 2.0) {
        throw new Error('Complexity factor must be between 0.5 and 2.0');
    }
    const baseProbability = Math.min(agentCapacity / taskWeight, 1.0);
    const adjustedProbability = baseProbability / complexity;
    return Math.max(0, Math.min(1, adjustedProbability));
}
function getProbabilityLevel(probability) {
    if (probability >= 0.9)
        return '极高';
    if (probability >= 0.7)
        return '高';
    if (probability >= 0.5)
        return '中';
    if (probability >= 0.3)
        return '中低';
    return '低';
}
//# sourceMappingURL=taskProbability.js.map