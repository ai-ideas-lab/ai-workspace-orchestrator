export function trackStepProgress(stepId: string, progress: number): string {
  console.log(`[DEBUG] Progress tracking - Step ${stepId}: ${progress}%`);
  const status = progress >= 100 ? "completed" : progress >= 50 ? "in_progress" : "pending";
  return `步骤 ${stepId}: ${status} (${progress}%)`;
}
