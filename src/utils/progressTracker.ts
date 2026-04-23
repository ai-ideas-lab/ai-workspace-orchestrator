const STEP_STATUSES = {
  COMPLETED: "completed",
  IN_PROGRESS: "in_progress", 
  PENDING: "pending"
} as const;

export function trackStepProgress(stepId: string, progress: number): string {
  console.log(`[DEBUG] Progress tracking - Step ${stepId}: ${progress}%`);
  
  const status = progress >= 100 ? STEP_STATUSES.COMPLETED : 
                  progress >= 50 ? STEP_STATUSES.IN_PROGRESS : 
                  STEP_STATUSES.PENDING;
  
  return `步骤 ${stepId}: ${status} (${progress}%)`;
}
