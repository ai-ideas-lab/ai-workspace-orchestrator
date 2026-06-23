"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateCompletionProbability = calculateCompletionProbability;
exports.getProbabilityLevel = getProbabilityLevel;
const constants_1 = require("./constants");
function calculateCompletionProbability(taskWeight, agentCapacity, complexity = 1.0) {
    try {
        if (taskWeight < constants_1.PROBABILITY_CONFIG.TASK_WEIGHT_MIN || taskWeight > constants_1.PROBABILITY_CONFIG.TASK_WEIGHT_MAX) {
            throw new Error(`Task weight must be between ${constants_1.PROBABILITY_CONFIG.TASK_WEIGHT_MIN} and ${constants_1.PROBABILITY_CONFIG.TASK_WEIGHT_MAX}`);
        }
        if (agentCapacity < constants_1.PROBABILITY_CONFIG.AGENT_CAPACITY_MIN || agentCapacity > constants_1.PROBABILITY_CONFIG.AGENT_CAPACITY_MAX) {
            throw new Error(`Agent capacity must be between ${constants_1.PROBABILITY_CONFIG.AGENT_CAPACITY_MIN} and ${constants_1.PROBABILITY_CONFIG.AGENT_CAPACITY_MAX}`);
        }
        if (complexity < constants_1.PROBABILITY_CONFIG.COMPLEXITY_MIN || complexity > constants_1.PROBABILITY_CONFIG.COMPLEXITY_MAX) {
            throw new Error(`Complexity factor must be between ${constants_1.PROBABILITY_CONFIG.COMPLEXITY_MIN} and ${constants_1.PROBABILITY_CONFIG.COMPLEXITY_MAX}`);
        }
        const baseProbability = Math.min(agentCapacity / taskWeight, 1.0);
        const adjustedProbability = baseProbability / complexity;
        return Math.max(constants_1.PROBABILITY_CONFIG.MIN_PROBABILITY, Math.min(constants_1.PROBABILITY_CONFIG.MAX_PROBABILITY, adjustedProbability));
    }
    catch (error) {
        console.error('Error calculating completion probability:', error);
        throw error;
    }
}
function getProbabilityLevel(probability) {
    if (probability >= constants_1.PROBABILITY_CONFIG.PROBABILITY_EXTREMELY_HIGH)
        return '极高';
    if (probability >= constants_1.PROBABILITY_CONFIG.PROBABILITY_HIGH)
        return '高';
    if (probability >= constants_1.PROBABILITY_CONFIG.PROBABILITY_MEDIUM)
        return '中';
    if (probability >= constants_1.PROBABILITY_CONFIG.PROBABILITY_LOW_MEDIUM)
        return '中低';
    return '低';
}
//# sourceMappingURL=taskProbability.js.map