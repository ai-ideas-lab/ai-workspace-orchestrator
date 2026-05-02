/**
 * 验证配置格式 - 快速配置检查
 * 
 * 验证配置对象的格式和必要字段，确保配置的完整性和有效性
 * 
 * @param config - 要验证的配置对象
 * @returns 如果配置有效返回true，否则返回false
 * 
 * @example
 * // 基本验证
 * const isValid = validateConfig({ version: '1.0.0', name: 'test' });
 * console.log(isValid); // true
 * 
 * // 空配置验证
 * const isEmptyValid = validateConfig(null);
 * console.log(isEmptyValid); // false
 * 
 * // 无版本号验证
 * const noVersion = validateConfig({ name: 'test' });
 * console.log(noVersion); // false
 */
export function validateConfig(config: any): boolean {
  if (!config || typeof config !== 'object') {
    return false;
  }
  
  try {
    // 检查版本号是否存在
    if (!('version' in config) || typeof config.version !== 'string') {
      return false;
    }
    
    // 验证版本号格式（简单的语义化版本检查）
    const versionPattern = /^\d+\.\d+\.\d+(-[\w-]+)?(\+[\w-]+)?$/;
    if (!versionPattern.test(config.version)) {
      return false;
    }
    
    return true;
  } catch (error) {
    // 在开发环境记录错误详情
    if (process.env.NODE_ENV === 'development') {
      console.error('Configuration validation error:', error);
    }
    return false;
  }
}

/**
 * 验证必需字段 - 检查对象是否包含必需的字段
 * 
 * 验证对象是否包含指定的所有必需字段，每个字段都必须存在且有效
 * 
 * @param obj - 要验证的对象
 * @param requiredFields - 必需字段数组
 * @returns 如果所有必需字段都存在且有效返回true，否则返回false
 */
export function validateRequiredFields(obj: any, requiredFields: string[]): boolean {
  try {
    if (!obj || typeof obj !== 'object') {
      return false;
    }
    
    for (const field of requiredFields) {
      if (!(field in obj)) {
        return false;
      }
      
      // 检查字段是否为空值（null, undefined, 空字符串）
      if (obj[field] === null || obj[field] === undefined || (typeof obj[field] === 'string' && obj[field].trim() === '')) {
        return false;
      }
    }
    
    return true;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Required fields validation error:', error);
    }
    return false;
  }
}
