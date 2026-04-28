export const quickValidate = (input: string): boolean => {
    return input && input.trim().length > 0;
};

export const isEmpty = (str: string): boolean => {
    return !str || str.trim() === '';
};

/**
 * 快速请求验证函数
 * 
 * 对用户请求进行基础格式验证，确保内容有效且长度适中
 * 用于在进入复杂处理前快速过滤无效请求
 * 
 * @param {string} userRequest - 用户输入的自然语言请求
 * @returns {Object} 返回验证结果 {valid: boolean, message: string}
 * @example
 * const result = quickValidateRequest("创建月度销售报告");
 * console.log(result.valid); // true
 * 
 * const invalid = quickValidateRequest("");
 * console.log(invalid.message); // "请求内容不能为空"
 */
export function quickValidateRequest(userRequest: string): {valid: boolean, message: string} {
  if (!userRequest || userRequest.trim().length === 0) {
    return {valid: false, message: "请求内容不能为空"};
  }
  if (userRequest.length > 500) {
    return {valid: false, message: "请求内容过长，请简化后重试"};
  }
  return {valid: true, message: "请求格式验证通过"};
}// Test comment
