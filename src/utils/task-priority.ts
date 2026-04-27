export function calculatePriorityScore(urgency: number, importance: number, complexity: number): number {
    const urgencyWeight = 0.4;
    const importanceWeight = 0.4;
    const complexityWeight = -0.2;
    const rawScore = (urgency * urgencyWeight) + (importance * importanceWeight) + (complexity * complexityWeight);
    return Math.max(0, Math.min(100, Math.round(rawScore * 10)));
}
