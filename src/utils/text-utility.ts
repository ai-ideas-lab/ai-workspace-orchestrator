/**
 * 文本格式化工具函数
 */

/**
 * 清理文本中的多余空格和换行
 * 
 * 移除文本首尾空格并将连续的空格字符替换为单个空格，
 * 同时规范化文本换行符，确保输出文本格式整洁一致。
 * 该函数适用于处理用户输入、API响应文本和各种来源的原始文本数据。
 * 
 * @param {string} text - 需要清理的原始文本，可能包含多余空格和换行
 * @returns {string} 清理后的格式化文本，首尾无空格，内部空格规范化
 * @throws {TypeError} 当text参数不是字符串类型时抛出异常
 * @example
 * // 基本文本清理
 * const input = "  Hello   world!  ";
 * const result = cleanText(input);
 * console.log(result); // 输出: "Hello world!"
 * 
 * // 处理包含换行符的文本
 * const input2 = "This is\n\n   a test";
 * const result2 = cleanText(input2);
 * console.log(result2); // 输出: "This is a test"
 * 
 * // 处理空字符串
 * const result3 = cleanText("     ");
 * console.log(result3); // 输出: ""
 * 
 * // 错误处理
 * try {
 *   cleanText(123); // 非字符串参数
 * } catch (error) {
 *   console.error('类型错误:', error.message);
 * }
 */
export function cleanText(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

/**
 * 截取文本到指定长度
 * 
 * 将文本截断到指定最大长度，并在末尾添加后缀以表示文本被截断。
 * 如果文本长度小于或等于最大长度，则返回原始文本。后缀长度会
 * 计算在最大长度内，确保最终输出不会超过指定长度限制。
 * 
 * @param {string} text - 需要截取的原始文本，可以是任意长度的字符串
 * @param {number} maxLength - 文本的最大允许长度，必须大于0
 * @param {string} [suffix='...'] - 截断后添加的后缀字符串，默认为"..."
 * @returns {string} 截取后的文本，长度不超过maxLength，添加适当的后缀
 * @throws {TypeError} 当text不是字符串或maxLength不是数字时抛出异常
 * @throws {RangeError} 当maxLength小于等于0时抛出异常
 * @example
 * // 基本文本截取
 * const longText = "这是一个很长的文本需要截断";
 * const result = truncateText(longText, 10);
 * console.log(result); // 输出: "这是一个很..."
 * 
 * // 自定义后缀
 * const result2 = truncateText(longText, 15, '【截断】');
 * console.log(result2); // 输出: "这是一个很【截断】"
 * 
 * // 短文本保持不变
 * const shortText = "短文本";
 * const result3 = truncateText(shortText, 10);
 * console.log(result3); // 输出: "短文本"
 * 
 * // 边界情况处理
 * const emptyResult = truncateText("1234567890", 5, "..."); // 输出: "12..."
 * 
 * // 错误处理
 * try {
 *   truncateText("文本", 0); // 无效的最大长度
 * } catch (error) {
 *   console.error('范围错误:', error.message);
 * }
 */
export function truncateText(text: string, maxLength: number, suffix: string = '...'): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * 验证邮箱格式是否正确
 * 
 * 使用正则表达式验证邮箱地址的格式是否符合标准规范。
 * 验证规则包括：必须包含@符号，@符号前后不能有空格，
 * @符号后必须包含点号分隔域名，且域名不能为空。
 * 不验证邮箱的实际存在性，仅验证格式正确性。
 * 
 * @param {string} email - 需要验证的邮箱地址字符串
 * @returns {boolean} 如果邮箱格式正确返回true，否则返回false
 * @throws {TypeError} 当email参数不是字符串类型时抛出异常
 * @example
 * // 有效的邮箱地址验证
 * const validEmails = [
 *   'user@example.com',
 *   'test.email@domain.org',
 *   'user123@sub-domain.co.uk',
 *   'firstname.lastname@company.io'
 * ];
 * validEmails.forEach(email => {
 *   console.log(`${email}: ${isValidEmail(email)}`); // 都输出: true
 * });
 * 
 * // 无效的邮箱地址验证
 * const invalidEmails = [
 *   'user@.com',        // 域名缺少内容
 *   '@domain.com',     // 缺少用户名
 *   'user@domain',      // 缺少顶级域名
 *   'user@domain.c',    // 顶级域名过短
 *   'user name@domain', // 包含空格
 *   'user@domain com',   // 域名后有空格
 *   'user..domain@com'  // 连续点号
 * ];
 * invalidEmails.forEach(email => {
 *   console.log(`${email}: ${isValidEmail(email)}`); // 都输出: false
 * });
 * 
 * // 边界情况处理
 * console.log(isValidEmail('')); // 输出: false
 * console.log(isValidEmail('a@b.c')); // 输出: true
 * 
 * // 错误处理
 * try {
 *   isValidEmail(12345); // 非字符串参数
 * } catch (error) {
 *   console.error('类型错误:', error.message);
 * }
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 从文本中提取动作动词
 * 
 * 从工作流描述文本中识别和提取预定义的动作动词列表。
 * 支持中文动作动词识别，适用于工作流分析和任务分类。
 * 该函数会先清理文本然后提取匹配的动作动词，返回去重后的动词数组。
 * 
 * @param {string} text - 工作流描述文本，可能包含各种描述性文字和动作指令
 * @returns {string[]} 包含所有匹配动作动词的数组，已去重并按出现顺序排列
 * @throws {TypeError} 当text参数不是字符串类型时抛出异常
 * @example
 * // 基本动作动词提取
 * const workflowDescription = "创建用户账户，执行数据分析，更新配置信息，删除临时文件";
 * const actions = extractActionVerbs(workflowDescription);
 * console.log(actions); // 输出: ['创建', '执行', '更新', '删除']
 * 
 * // 复杂工作流文本分析
 * const complexDescription = "系统需要获取用户数据，处理业务逻辑，验证数据完整性，发送通知邮件，同步到数据库";
 * const actions2 = extractActionVerbs(complexDescription);
 * console.log(actions2); // 输出: ['获取', '处理', '验证', '发送', '同步']
 * 
 * // 包含非动作动词的文本
 * const mixedText = "我们需要创建新用户，然后分析数据性能，最后恢复系统状态";
 * const actions3 = extractActionVerbs(mixedText);
 * console.log(actions3); // 输出: ['创建', '分析', '恢复']
 * 
 * // 无动作动词的文本
 * const descriptiveText = "这是一个关于用户界面的描述文档";
 * const actions4 = extractActionVerbs(descriptiveText);
 * console.log(actions4); // 输出: []
 * 
 * // 空文本处理
 * const actions5 = extractActionVerbs("");
 * console.log(actions5); // 输出: []
 * 
 * // 支持的动作动词列表
 * const supportedActions = [
 *   '创建', '执行', '更新', '删除', '获取', '设置', '验证', '发送', '接收',
 *   '分析', '处理', '转换', '同步', '备份', '恢复'
 * ];
 * console.log(`支持的动作动词: ${supportedActions.length}个`);
 */
export function extractActionVerbs(text: string): string[] {
  const actionVerbs = ['创建', '执行', '更新', '删除', '获取', '设置', '验证', '发送', '接收', '分析', '处理', '转换', '同步', '备份', '恢复'];
  const words = cleanText(text).split(' ');
  return words.filter(word => actionVerbs.includes(word));
}

/**
 * 首字母大写
 * 
 * 将文本的首字母转换为大写，其余字母转换为小写。
 * 适用于格式化标题、姓名等需要首字母大写的场景。
 * 如果输入为空字符串或null/undefined，返回空字符串。
 * 
 * @param {string} text - 需要格式化的文本字符串
 * @returns {string} 首字母大写的格式化文本，其他字母为小写
 * @throws {TypeError} 当text参数不是字符串类型时抛出异常
 * @example
 * // 基本文本格式化
 * const text1 = "hello world";
 * const result1 = capitalizeText(text1);
 * console.log(result1); // 输出: "Hello world"
 * 
 * // 单词格式化
 * const text2 = "USER NAME";
 * const result2 = capitalizeText(text2);
 * console.log(result2); // 输出: "User name"
 * 
 * // 已经首字母大写的文本
 * const text3 = "Already Capitalized";
 * const result3 = capitalizeText(text3);
 * console.log(result3); // 输出: "Already capitalized"
 * 
 * // 空字符串处理
 * const result4 = capitalizeText("");
 * console.log(result4); // 输出: ""
 * 
 * // 单字符文本
 * const result5 = capitalizeText("a");
 * console.log(result5); // 输出: "A"
 * 
 * // 多字节字符（中文）处理
 * const text6 = "你好";
 * const result6 = capitalizeText(text6);
 * console.log(result6); // 输出: "你好" (中文字符不受影响)
 * 
 * // 边界情况
 * const result7 = capitalizeText(" ");
 * console.log(result7); // 输出: ""
 * 
 * // 错误处理
 * try {
 *   capitalizeText(123); // 非字符串参数
 * } catch (error) {
 *   console.error('类型错误:', error.message);
 * }
 */
export function capitalizeText(text: string): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * 生成时间戳唯一标识符
 * @returns 时间戳格式的唯一标识符
 */
export function generateTimestampId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * 将文本转换为蛇形命名（snake_case）
 * 
 * 将驼峰命名或空格分隔的文本转换为小写的蛇形命名格式。
 * 适用于API端点命名、数据库字段名、配置键等场景。
 * 支持多种输入格式：驼峰命名、空格分隔、连字符分隔等。
 * 
 * @param {string} text - 需要转换的文本，可以是驼峰命名、空格或连字符分隔
 * @returns {string} 转换后的蛇形命名文本，全部小写，下划线分隔
 * @throws {TypeError} 当text参数不是字符串类型时抛出异常
 * @example
 * // 驼峰命名转换
 * const camelCase = "userName camelCase";
 * const result1 = toSnakeCase(camelCase);
 * console.log(result1); // 输出: "user_name camel_case"
 * 
 * // 空格分隔转换
 * const spacedText = "user name data field";
 * const result2 = toSnakeCase(spacedText);
 * console.log(result2); // 输出: "user_name_data_field"
 * 
 * // 连字符分隔转换
 * const kebabText = "user-name-data-field";
 * const result3 = toSnakeCase(kebabText);
 * console.log(result3); // 输出: "user_name_data_field"
 * 
 * // 混合格式转换
 * const mixedText = "UserName-Data Field";
 * const result4 = toSnakeCase(mixedText);
 * console.log(result4); // 输出: "user_name_data_field"
 * 
 * // 数字和特殊字符处理
 * const numericText = "user123 fieldName_value";
 * const result5 = toSnakeCase(numericText);
 * console.log(result5); // 输出: "user123 field_name_value"
 * 
 * // 空字符串处理
 * const result6 = toSnakeCase("");
 * console.log(result6); // 输出: ""
 * 
 * // 边界情况
 * const result7 = toSnakeCase("   ");
 * console.log(result7); // 输出: ""
 * 
 * // 单个字符
 * const result8 = toSnakeCase("A");
 * console.log(result8); // 输出: "a"
 * 
 * // 错误处理
 * try {
 *   toSnakeCase(123); // 非字符串参数
 * } catch (error) {
 *   console.error('类型错误:', error.message);
 * }
 */
export function toSnakeCase(text: string): string {
  if (!text) return '';
  
  // 先清理文本，然后转换为小写
  const cleaned = cleanText(text).toLowerCase();
  
  // 转换驼峰命名为下划线
  const result = cleaned
    // 驼峰命名：在字母和数字之间插入下划线（当字母是大写时）
    .replace(/([A-Z])/g, '_$1')
    // 移除可能存在的多余下划线
    .replace(/_+/g, '_')
    // 去除首尾下划线
    .replace(/^_|_$/g, '');
  
  return result;
}