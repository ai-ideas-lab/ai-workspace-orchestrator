/**
 * 验证必要的环境变量配置
 * 
 * 检查应用运行所必需的环境变量是否都已正确设置。
 * 这些环境变量对于应用的正常运行、安全和功能至关重要。
 * 
 * @returns 错误信息数组。如果数组为空，表示所有环境变量都已正确配置
 * @example
 * // 验证环境变量
 * const errors = validateEnvironmentVariables();
 * if (errors.length > 0) {
 *   console.error('环境变量配置错误:', errors);
 *   process.exit(1);
 * }
 * 
 * // 在应用启动时调用
 * function checkEnvironment() {
 *   const missingVars = validateEnvironmentVariables();
 *   if (missingVars.length === 0) {
 *     console.log('✅ 环境变量配置正确');
 *   } else {
 *     console.error('❌ 缺少环境变量:', missingVars.join(', '));
 *   }
 * }
 */
export function validateEnvironmentVariables(): string[] {
  const requiredVars = ['NODE_ENV', 'PORT', 'JWT_SECRET'];
  const errors: string[] = [];
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      errors.push(`${varName} is required`);
    }
  }
  
  return errors;
}

/**
 * 验证数据库环境变量配置
 * 
 * 检查数据库连接所需的环境变量是否正确设置。
 * 包括数据库连接字符串、用户名和密码等敏感信息。
 * 
 * @returns 错误信息数组。数组为空表示数据库配置完整
 * @example
 * // 验证数据库配置
 * const dbErrors = validateDatabaseEnvironment();
 * if (dbErrors.length > 0) {
 *   console.error('数据库配置错误:', dbErrors);
 * }
 * 
 * // 结合主环境变量验证使用
 * function validateAllEnvironment() {
 *   const envErrors = validateEnvironmentVariables();
 *   const dbErrors = validateDatabaseEnvironment();
 *   
 *   const allErrors = [...envErrors, ...dbErrors];
 *   return allErrors;
 * }
 */
export function validateDatabaseEnvironment(): string[] {
  const dbRequiredVars = [
    'DATABASE_URL',
    'DATABASE_USERNAME', 
    'DATABASE_PASSWORD'
  ];
  const errors: string[] = [];
  
  for (const varName of dbRequiredVars) {
    if (!process.env[varName]) {
      errors.push(`${varName} is required for database connection`);
    }
  }
  
  return errors;
}

/**
 * 验证AI服务环境变量配置
 * 
 * 检查AI服务集成所需的环境变量，包括API密钥和配置参数。
 * 确保所有AI引擎能够正常访问第三方服务。
 * 
 * @returns 错误信息数组。数组为空表示AI服务配置完整
 * @example
 * // 验证AI服务配置
 * const aiErrors = validateAIEnvironment();
 * if (aiErrors.length > 0) {
 *   console.warn('AI服务配置不完整，部分功能可能不可用:', aiErrors);
 * }
 * 
 * // 根据配置决定启用的AI服务
 * function getAvailableAIServices() {
 *   const errors = validateAIEnvironment();
 *   const availableServices = [];
 *   
 *   if (!errors.includes('OPENAI_API_KEY')) {
 *     availableServices.push('OpenAI');
 *   }
 *   if (!errors.includes('ANTHROPIC_API_KEY')) {
 *     availableServices.push('Anthropic');
 *   }
 *   
 *   return availableServices;
 * }
 */
export function validateAIEnvironment(): string[] {
  const aiRequiredVars = [
    'OPENAI_API_KEY',
    'ANTHROPIC_API_KEY',
    'AI_MODEL_TYPE'
  ];
  const errors: string[] = [];
  
  for (const varName of aiRequiredVars) {
    if (!process.env[varName]) {
      // AI服务配置部分缺失时给出温和的提示
      const serviceName = varName.split('_')[0];
      errors.push(`${serviceName} service may not be available - ${varName} is missing`);
    }
  }
  
  return errors;
}
}
