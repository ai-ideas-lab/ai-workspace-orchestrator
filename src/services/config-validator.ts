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

export function validateConfig(cfg: WorkflowConfig): string[] {
  const errors: string[] = [];
  if (!cfg.name || typeof cfg.name !== 'string') errors.push('name must be a non-empty string');
  if (!Array.isArray(cfg.steps) || cfg.steps.length === 0) errors.push('steps must be a non-empty array');
  if (cfg.timeout !== undefined && (typeof cfg.timeout !== 'number' || cfg.timeout < 0))
    errors.push('timeout must be a positive number');
  if (cfg.retryLimit !== undefined && (typeof cfg.retryLimit !== 'number' || cfg.retryLimit < 0 || cfg.retryLimit > 10))
    errors.push('retryLimit must be between 0 and 10');
  if (cfg.environment !== undefined && typeof cfg.environment !== 'string')
    errors.push('environment must be a string');
  return errors;
}
