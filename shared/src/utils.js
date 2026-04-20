/**
 * Shared Utilities - 共享工具函数库
 * 
 * 提供跨项目通用的工具函数，包括日期格式化和电子邮件验证等功能。
 * 这些函数被多个项目引用，确保代码复用性和一致性。
 * 
 * @example
 * // 引入工具函数
 * const { formatDate, isValidEmail } = require('./shared/src/utils');
 * 
 * // 使用日期格式化
 * const formatted = formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss');
 * 
 * // 使用邮箱验证
 * const isValid = isValidEmail('user@example.com');
 */

const moment = require('moment');

/**
 * 格式化日期 - 日期时间格式化工具
 * 
 * 使用moment.js库将日期对象格式化为指定的字符串格式。
 * 支持多种日期时间格式，便于在不同场景下统一显示时间信息。
 * 
 * @param {Date|string|number} date - 要格式化的日期，可以是Date对象、日期字符串或时间戳
 * @param {string} [format='YYYY-MM-DD'] - 目标格式字符串，默认为'YYYY-MM-DD'
 *   支持的格式包括：
 *   - 'YYYY-MM-DD': 年-月-日，如 2026-04-13
 *   - 'YYYY-MM-DD HH:mm:ss': 年-月-日 时:分:秒，如 2026-04-13 14:52:00
 *   - 'YYYY年MM月DD日': 中文日期格式，如 2026年04月13日
 *   - 'HH:mm': 24小时制时间，如 14:52
 *   - 'MM/DD/YYYY': 美式日期格式，如 04/13/2026
 * @returns {string} 格式化后的日期字符串
 * @throws {Error} 当输入参数无法解析为有效日期时抛出异常
 * @example
 * // 基本日期格式化
 * const today = new Date();
 * console.log(formatDate(today)); // "2026-04-13"
 * 
 * // 自定义格式
 * console.log(formatDate(today, 'YYYY-MM-DD HH:mm:ss')); // "2026-04-13 14:52:00"
 * console.log(formatDate(today, 'YYYY年MM月DD日')); // "2026年04月13日"
 * 
 * // 处理不同输入类型
 * console.log(formatDate('2026-04-13T06:52:00.000Z')); // "2026-04-13"
 * console.log(formatDate(1713077520000)); // "2026-04-13" (时间戳)
 * 
 * // 在模板中使用
 * const dateStr = formatDate(new Date(), 'YYYY年MM月DD日 HH时mm分');
 * console.log(`当前时间：${dateStr}`); // "当前时间：2026年04月13日 14时52分"
 */
function formatDate(date, format = 'YYYY-MM-DD') {
  try {
    return moment(date).format(format);
  } catch (error) {
    console.error('Date formatting error:', error);
    throw new Error(`Invalid date format: ${date}`);
  }
}

/**
 * 验证电子邮件格式 - 邮箱地址验证器
 * 
 * 使用正则表达式验证输入字符串是否符合标准的电子邮件格式。
 * 支持基本的邮箱格式验证，但不验证域名是否真实存在或邮箱是否可用。
 * 
 * @param {string} email - 待验证的电子邮件地址字符串
 * @returns {boolean} 如果格式正确返回 true，否则返回 false
 * @throws {TypeError} 当输入参数不是字符串类型时抛出异常
 * @example
 * // 验证有效邮箱地址
 * console.log(isValidEmail('user@example.com')); // true
 * console.log(isValidEmail('john.doe@company.co.uk')); // true
 * console.log(isValidEmail('test123@test-domain.com')); // true
 * 
 * // 验证无效邮箱地址
 * console.log(isValidEmail('invalid-email')); // false (缺少@符号)
 * console.log(isValidEmail('@example.com')); // false (缺少用户名)
 * console.log(isValidEmail('user@.com')); // false (域名无效)
 * console.log(isValidEmail('user@com')); // false (缺少顶级域名)
 * console.log(isValidEmail('user@example..com')); // false (连续点号)
 * 
 * // 表单验证示例
 * function validateEmailField(emailInput) {
 *   if (!isValidEmail(emailInput)) {
 *     throw new Error('请输入有效的电子邮件地址');
 *   }
 *   return true;
 * }
 * 
 * // 批量邮箱验证
 * const emails = ['user1@example.com', 'invalid-email', 'user2@test.org'];
 * const validEmails = emails.filter(email => isValidEmail(email));
 * console.log('有效的邮箱:', validEmails); // ["user1@example.com", "user2@test.org"]
 */
function isValidEmail(email) {
  // 验证输入类型
  if (typeof email !== 'string') {
    throw new TypeError('Email must be a string');
  }
  
  // 使用正则表达式验证邮箱格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 验证电子邮件格式（异步版本）
 * 
 * 为未来扩展预留的异步验证函数，支持更复杂的验证逻辑，
 * 如DNS验证、邮箱可用性检查等。
 * 
 * @param {string} email - 待验证的电子邮件地址字符串
 * @returns {Promise<boolean>} 异步验证结果，如果格式正确返回 true，否则返回 false
 * @throws {TypeError} 当输入参数不是字符串类型时抛出异常
 * @example
 * // 异步验证示例
 * async function checkEmailAvailability(email) {
 *   const isValidFormat = await isValidEmailAsync(email);
 *   if (!isValidFormat) {
 *     return false;
 *   }
 *   // 这里可以添加DNS验证或其他异步检查
 *   return true;
 * }
 */
async function isValidEmailAsync(email) {
  if (typeof email !== 'string') {
    throw new TypeError('Email must be a string');
  }
  
  // 基本格式验证
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return false;
  }
  
  // 未来可以在这里添加DNS验证等异步检查
  // 例如：检查域名的MX记录等
  return true;
}

// 导出工具函数
module.exports = {
  formatDate,
  isValidEmail,
  isValidEmailAsync
};