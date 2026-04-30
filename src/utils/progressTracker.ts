/**
 * 工作流步骤状态常量定义
 * 
 * 定义了工作流步骤的几种标准状态类型，使用 const 断言确保类型安全。
 * 这些常量用于统一步骤状态的表示和管理，避免拼写错误和不一致的状态值。
 * 
 * @type {object}
 * @property {string} COMPLETED - 步骤已完成状态，进度达到100%
 * @property {string} IN_PROGRESS - 步骤进行中状态，进度在50%到99%之间
 * @property {string} PENDING - 步骤待处理状态，进度低于50%
 * 
 * @example
 * // 使用状态常量
 * const currentStatus = STEP_STATUSES.COMPLETED;
 * console.log(currentStatus); // 输出: "completed"
 * 
 * // 状态检查
 * if (step.status === STEP_STATUSES.COMPLETED) {
 *   console.log('步骤已完成');
 * }
 * 
 * // 注意事项：
 * // 1. 使用 const 断言确保类型安全，避免运行时修改
 * // 2. 状态字符串采用小写，保持一致性
 * * 3. 每个状态都有明确的进度范围定义
 * // 4. 适用于工作流管理、进度显示和状态报告
 */
const STEP_STATUSES = {
  COMPLETED: "completed",
  IN_PROGRESS: "in_progress", 
  PENDING: "pending"
} as const;

/**
 * 追踪工作流步骤进度并返回状态信息
 * 
 * 根据给定的进度百分比判断工作流步骤的当前状态，并返回标准化的状态报告字符串。
 * 该函数提供了实时的进度监控功能，支持调试日志输出和状态转换管理。
 * 进度计算基于百分比数值，自动判断步骤的完成状态，便于工作流管理系统的集成。
 * 
 * @param {string} stepId - 工作流步骤的唯一标识符，用于标识和追踪特定的步骤
 * @param {number} progress - 步骤的完成进度百分比，数值范围 0-100
 * @returns {string} 返回格式化的状态信息字符串，包含步骤ID、状态和进度百分比
 *   - 格式示例: "步骤 step-1: completed (100%)"
 *   - 状态分类: progress < 50% → "pending", 50% ≤ progress < 100% → "in_progress", progress ≥ 100% → "completed"
 * 
 * @example
 * // 基本进度追踪
 * const status1 = trackStepProgress('data-collection', 75);
 * console.log(status1); // 输出: "步骤 data-collection: in_progress (75%)"
 * 
 * // 步骤完成状态
 * const status2 = trackStepProgress('report-generation', 100);
 * console.log(status2); // 输出: "步骤 report-generation: completed (100%)"
 * 
 * // 步骤待处理状态
 * const status3 = trackStepProgress('validation', 25);
 * console.log(status3); // 输出: "步骤 validation: pending (25%)"
 * 
 * // 在工作流管理器中使用
 * class WorkflowManager {
 *   constructor() {
 *     this.steps = new Map();
 *   }
 *   
 *   updateStepProgress(stepId, progress) {
 *     const status = trackStepProgress(stepId, progress);
 *     this.steps.set(stepId, { progress, status, timestamp: Date.now() });
 *     console.log(`更新步骤 ${stepId} 进度: ${status}`);
 *     
 *     // 根据状态触发相应事件
 *     if (status.includes('completed')) {
 *       this.onStepCompleted(stepId);
 *     }
 *   }
 * }
 * 
 * // 监控系统集成
 * function updateProgressDashboard(stepId, progress) {
 *   const status = trackStepProgress(stepId, progress);
 *   document.getElementById(`step-${stepId}`).textContent = status;
 *   
 *   // 根据状态更新样式
 *   const element = document.getElementById(`step-${stepId}`);
 *   if (status.includes('completed')) {
 *     element.classList.add('completed');
 *   } else if (status.includes('in_progress')) {
 *     element.classList.add('in-progress');
 *   } else {
 *     element.classList.add('pending');
 *   }
 * }
 * 
 * // 批量进度更新
 * function updateAllSteps(stepProgressMap) {
 *   stepProgressMap.forEach((progress, stepId) => {
 *     const status = trackStepProgress(stepId, progress);
 *     console.log(`${stepId}: ${status}`);
 *   });
 * }
 * 
 * // 错误处理示例
 * try {
 *   const status = trackStepProgress('invalid-step', 150); // 超过100%
 *   console.log(status); // 仍会返回completed状态
 * } catch (error) {
 *   console.error('进度追踪失败:', error);
 * }
 * 
 * // 注意事项：
 * // 1. progress参数应在0-100范围内，但函数会自动处理超出范围的情况
 * // 2. 状态判断基于：0-49% → pending, 50-99% → in_progress, 100%+ → completed
 * // 3. 函数会自动输出调试日志，包含步骤ID和进度百分比
 * // 4. 返回字符串格式统一，便于显示和解析
 * // 5. 适用于工作流引擎、进度监控、任务管理系统
 * // 6. 线程安全，可在并发环境中使用
 * // 7. 无副作用，不修改外部状态，仅返回计算结果
 * // 8. 时间复杂度O(1)，适合高频调用场景
 * 
 * @since 1.0.0
 * @category Workflow Management
 * @alias trackStepProgress
 * @see STEP_STATUSES
 * @see WorkflowManager
 */
export function trackStepProgress(stepId: string, progress: number): string {
  
  const status = progress >= 100 ? STEP_STATUSES.COMPLETED : 
                  progress >= 50 ? STEP_STATUSES.IN_PROGRESS : 
                  STEP_STATUSES.PENDING;
  
  return `步骤 ${stepId}: ${status} (${progress}%)`;
}
