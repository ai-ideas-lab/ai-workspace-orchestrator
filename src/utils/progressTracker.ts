/**
 * 快速工作流进度追踪器
 * @param stepId - 步骤ID
 * @param progress - 进度百分比 (0-100)
 * @returns 当前步骤状态
 */
export function trackStepProgress(stepId: string, progress: number): string {
  const status = progress >= 100 ? 'completed' : progress >= 50 ? 'in_progress' : 'pending';
  return `步骤 ${stepId}: ${status} (${progress}%)`;
}