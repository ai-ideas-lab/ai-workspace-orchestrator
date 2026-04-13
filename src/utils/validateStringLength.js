/**
 * 验证字符串长度
 * 
 * 检查字符串长度是否在指定范围内，用于表单验证和输入检查。
 * 
 * @param {string} str 待验证的字符串
 * @param {number} minLength 最小长度，默认为0
 * @param {number} maxLength 最大长度，默认为无限制
 * @returns {Object} 验证结果 {isValid: boolean, message: string}
 * 
 * @example
 * // 验证用户名
 * const result = validateStringLength('user123', 3, 20);
 * console.log(result); // {isValid: true, message: ''}
 * 
 * // 验证过短密码
 * const result2 = validateStringLength('pw', 8, 32);
 * console.log(result2); // {isValid: false, message: '长度不能少于8个字符'}
 */
/**
 * 创建验证结果对象
 * @param {boolean} isValid 验证是否通过
 * @param {string} message 错误消息
 * @returns {Object} 验证结果对象
 */
function createValidationResult(isValid, message = '') {
  return { isValid, message };
}

function validateStringLength(str, minLength = 0, maxLength = Infinity) {
  // 检查输入是否为空
  if (str == null) {
    return createValidationResult(false, '输入不能为空');
  }
  
  // 检查输入类型
  if (typeof str !== 'string') {
    return createValidationResult(false, '输入必须是字符串');
  }
  
  const length = str.length;
  
  // 检查最小长度
  if (length < minLength) {
    return createValidationResult(false, `长度不能少于${minLength}个字符`);
  }
  
  // 检查最大长度
  if (length > maxLength) {
    return createValidationResult(false, `长度不能超过${maxLength}个字符`);
  }
  
  // 验证通过
  return createValidationResult(true, '');
}

module.exports = { validateStringLength };
