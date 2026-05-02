/**
 * 验证配置格式 - 快速配置检查
 */
export function validateConfig(config: any): boolean {
  return config && typeof config === 'object' && 'version' in config;
}
