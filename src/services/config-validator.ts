/**
 * ConfigValidator - 轻量配置校验工具
 * 校验工作流配置对象的必要字段和类型
 */

export interface WorkflowConfig {
  name?: unknown;
  steps?: unknown;
  timeout?: unknown;
  retryLimit?: unknown;
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
  if (!cfg.name || typeof cfg.name !== 'string') errors.push('name must be a non-empty string');
  if (!Array.isArray(cfg.steps) || cfg.steps.length === 0) errors.push('steps must be a non-empty array');
  if (cfg.timeout !== undefined && (typeof cfg.timeout !== 'number' || cfg.timeout < 0))
    errors.push('timeout must be a positive number');
  if (cfg.retryLimit !== undefined && (typeof cfg.retryLimit !== 'number' || cfg.retryLimit < 0 || cfg.retryLimit > 10))
    errors.push('retryLimit must be between 0 and 10');
  return errors;
}
