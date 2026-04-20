/**
 * ConfigValidator - 轻量配置校验工具
 * 校验工作流配置对象的必要字段和类型
 */

export interface WorkflowConfig {
  name?: unknown;
  steps?: unknown;
  timeout?: unknown;
  retryLimit?: unknown;
  environment?: unknown;
}

export interface WorkflowStep {
  id?: unknown;
  name?: unknown;
  taskType?: unknown;
  payload?: unknown;
  dependsOn?: unknown;
}

/**
 * 验证工作流配置对象的必要字段和类型
 *
 * 检查工作流配置的各个字段是否符合预期的数据类型和约束条件。
 * 配置包含工作流的基本参数、步骤列表、超时设置和重试限制。
 *
 * @param cfg - 待验证的工作流配置对象
 * @returns 错误信息数组。如果数组为空，表示配置完全有效
 * @throws 不抛出异常，只返回错误信息
 * @example
 * // 有效的配置
 * const validCfg = { name: "My Workflow", steps: [{ id: "1", name: "Step 1", taskType: "text", payload: {}, dependsOn: [] }] };
 * const errors = validateConfig(validCfg);
 * console.log(errors); // []
 *
 * // 无效的配置
 * const invalidCfg = { name: 123, steps: "not-array" };
 * const errors = validateConfig(invalidCfg);
 * console.log(errors); // ["name must be a non-empty string", "steps must be a non-empty array"]
 */
export function validateConfig(cfg: WorkflowConfig): string[] {
  const errors: string[] = [];
  
  // 验证基本字段
  if (!cfg.name || typeof cfg.name !== 'string' || cfg.name.trim().length === 0) {
    errors.push('name must be a non-empty string');
  }
  
  if (!Array.isArray(cfg.steps) || cfg.steps.length === 0) {
    errors.push('steps must be a non-empty array');
  } else {
    // 验证每个步骤
    cfg.steps.forEach((step, index) => {
      const stepErrors = validateStep(step, index);
      errors.push(...stepErrors);
    });
  }
  
  if (cfg.timeout !== undefined && (typeof cfg.timeout !== 'number' || cfg.timeout <= 0)) {
    errors.push('timeout must be a positive number');
  }
  
  if (cfg.retryLimit !== undefined && (typeof cfg.retryLimit !== 'number' || cfg.retryLimit < 0 || cfg.retryLimit > 10)) {
    errors.push('retryLimit must be between 0 and 10');
  }
  
  if (cfg.environment !== undefined && (typeof cfg.environment !== 'string' || !['development', 'staging', 'production'].includes(cfg.environment))) {
    errors.push('environment must be one of: development, staging, production');
  }
  
  return errors;
}

/**
 * 验证单个工作流步骤
 *
 * @param step - 待验证的工作流步骤对象
 * @param index - 步骤索引（用于错误信息）
 * @returns 错误信息数组
 */
export function validateStep(step: unknown, index: number): string[] {
  const errors: string[] = [];
  
  if (!step || typeof step !== 'object') {
    errors.push(`step ${index}: must be an object`);
    return errors;
  }
  
  const stepObj = step as WorkflowStep;
  
  if (!stepObj.id || typeof stepObj.id !== 'string' || stepObj.id.trim().length === 0) {
    errors.push(`step ${index}: id must be a non-empty string`);
  }
  
  if (!stepObj.name || typeof stepObj.name !== 'string' || stepObj.name.trim().length === 0) {
    errors.push(`step ${index}: name must be a non-empty string`);
  }
  
  if (!stepObj.taskType || typeof stepObj.taskType !== 'string' || stepObj.taskType.trim().length === 0) {
    errors.push(`step ${index}: taskType must be a non-empty string`);
  }
  
  if (stepObj.payload !== undefined && typeof stepObj.payload !== 'object') {
    errors.push(`step ${index}: payload must be an object`);
  }
  
  if (stepObj.dependsOn !== undefined && !Array.isArray(stepObj.dependsOn)) {
    errors.push(`step ${index}: dependsOn must be an array`);
  }
  
  return errors;
}

/**
 * 验证配置并返回详细报告
 *
 * @param cfg - 待验证的工作流配置对象
 * @returns 包含错误、警告和建议的验证报告
 */
export function validateConfigWithReport(cfg: WorkflowConfig): ConfigReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];
  
  // 基础验证
  if (!cfg.name || typeof cfg.name !== 'string' || cfg.name.trim().length === 0) {
    errors.push('name must be a non-empty string');
  } else if (cfg.name.length > 50) {
    warnings.push('name should be concise (max 50 characters)');
  }
  
  // 步骤数量检查
  if (cfg.steps && Array.isArray(cfg.steps)) {
    if (cfg.steps.length > 20) {
      warnings.push('workflow has many steps, consider breaking it into sub-workflows');
    }
    if (cfg.steps.length < 3 && cfg.steps.length > 0) {
      suggestions.push('consider adding more detailed steps for better error handling');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    suggestions,
  };
}

export interface ConfigReport {
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}
