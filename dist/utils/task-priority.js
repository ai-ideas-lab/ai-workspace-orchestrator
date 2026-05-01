"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculatePriorityScore = calculatePriorityScore;
function calculatePriorityScore(urgency, importance, complexity) {
    const urgencyWeight = 0.4;
    const importanceWeight = 0.4;
    const complexityWeight = -0.2;
    const rawScore = (urgency * urgencyWeight) + (importance * importanceWeight) + (complexity * complexityWeight);
    return Math.max(0, Math.min(100, Math.round(rawScore * 10)));
}
//# sourceMappingURL=task-priority.js.map