/**
 * 格式化日期为 YYYY-MM-DD 格式
 * 
 * 将 JavaScript Date 对象转换为标准的日期字符串格式，
 * 便于在 API 和数据库中统一使用。
 * 
 * @param date 要格式化的日期对象
 * @returns 格式化后的日期字符串，格式为 YYYY-MM-DD
 * @example
 * // 格式化当前日期
 * const today = new Date();
 * const formatted = formatDate(today);
 * console.log(formatted); // 输出: "2026-04-13"
 * 
 * // 格式化特定日期
 * const specificDate = new Date('2026-12-25');
 * console.log(formatDate(specificDate)); // 输出: "2026-12-25"
 */
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

/**
 * 验证电子邮件地址格式
 * 
 * 使用正则表达式验证输入字符串是否符合标准的电子邮件格式。
 * 支持基本的邮箱格式验证，但不验证域名是否真实存在。
 * 
 * @param email 待验证的电子邮件地址字符串
 * @returns 如果格式正确返回 true，否则返回 false
 * @example
 * // 验证有效邮箱
 * console.log(isValidEmail('user@example.com')); // true
 * console.log(isValidEmail('john.doe@company.co.uk')); // true
 * 
 * // 验证无效邮箱
 * console.log(isValidEmail('invalid-email')); // false
 * console.log(isValidEmail('@example.com')); // false
 * console.log(isValidEmail('user@.com')); // false
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 创建防抖函数
 * 
 * 创建一个新函数，该函数会在调用后等待指定的时间才执行。
 * 如果在这段时间内再次调用，则会重置计时器。
 * 常用于处理频繁触发的事件，如窗口大小调整、搜索输入等。
 * 
 * @param func 要防抖的原始函数
 * @param wait 等待时间（毫秒），默认 500ms
 * @returns 防抖后的函数
 * @example
 * // 使用防抖处理窗口大小调整
 * const handleResize = debounce(() => {
 *   console.log('窗口大小已调整');
 * }, 300);
 * 
 * window.addEventListener('resize', handleResize);
 * 
 * // 使用防抖处理搜索输入
 * const handleSearch = debounce((query) => {
 *   console.log('搜索:', query);
 * }, 500);
 * 
 * searchInput.addEventListener('input', (e) => handleSearch(e.target.value));
 */
function debounce(func, wait = 500) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * 创建节流函数
 * 
 * 创建一个新函数，该函数在指定的时间间隔内最多执行一次。
 * 防止函数被频繁调用，常用于滚动事件、鼠标移动等高频触发场景。
 * 
 * @param func 要节流的原始函数
 * * @param limit 时间间隔（毫秒），默认 1000ms
 * @returns 节流后的函数
 * @example
 * // 使用节流处理滚动事件
 * const handleScroll = throttle(() => {
 *   console.log('页面滚动中');
 * }, 200);
 * 
 * window.addEventListener('scroll', handleScroll);
 * 
 * // 使用节流处理鼠标移动
 * const handleMouseMove = throttle((event) => {
 *   console.log('鼠标位置:', event.clientX, event.clientY);
 * }, 100);
 * 
 * document.addEventListener('mousemove', handleMouseMove);
 */
function throttle(func, limit = 1000) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * 生成简单的唯一标识符
 * 
 * 使用 Math.random() 生成简短的随机字符串，用于需要简单标识符的场景。
 * 注意：此方法不适用于需要高安全性的场景，可能产生冲突。
 * 
 * @param length 生成的ID长度，默认为8个字符
 * @returns 随机生成的字符串ID
 * @example
 * // 生成默认长度的ID
 * const id = generateSimpleId();
 * console.log(id); // 例如: "a1b2c3d4"
 * 
 * // 生成指定长度的ID
 * const longId = generateSimpleId(16);
 * console.log(longId); // 例如: "a1b2c3d4e5f6g7h8"
 * 
 * // 为多个对象生成ID
 * const items = Array.from({length: 5}, (_, i) => ({
 *   id: generateSimpleId(),
 *   name: `项目${i + 1}`
 * }));
 */
function generateSimpleId(length = 8) {
  return Math.random().toString(36).substring(2, length + 2);
}

function isValidUrl(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * 验证字符串是否为空或只包含空白字符
 * 
 * 检查输入字符串是否为null、undefined或只包含空格、制表符、换行符等空白字符。
 * 常用于表单验证和数据处理前的输入检查。
 * 
 * @param str 待验证的字符串
 * @returns 如果为空或只包含空白字符返回true，否则返回false
 * @example
 * // 验证空字符串
 * console.log(isEmpty('')); // true
 * console.log(isEmpty('   ')); // true
 * console.log(isEmpty('\n\t ')); // true
 * 
 * // 验证非空字符串
 * console.log(isEmpty('hello')); // false
 * console.log(isEmpty('  hello  ')); // false
 * 
 * // 使用场景：表单验证
 * function validateRequiredField(value) {
 *   if (isEmpty(value)) {
 *     throw new Error('此字段不能为空');
 *   }
 * }
 */

function isEmpty(str) {
  return str == null || str.trim().length === 0;
}

/**
 * 验证中国手机号码格式
 * 
 * 验证输入字符串是否符合中国大陆手机号码的格式规范。
 * 支持常见的11位手机号码格式，以1开头，第二位为3-9。
 * 
 * @param phone 待验证的手机号码字符串
 * @returns 如果格式正确返回 true，否则返回 false
 * @example
 * // 验证有效手机号
 * console.log(isValidChinesePhone('13812345678')); // true
 * console.log(isValidChinesePhone('15987654321')); // true
 * console.log(isValidChinesePhone('18611112222')); // true
 * 
 * // 验证无效手机号
 * console.log(isValidChinesePhone('12345678901')); // false (第二位不是3-9)
 * console.log(isValidChinesePhone('1381234567'));  // false (位数不对)
 * console.log(isValidChinesePhone('abc1234567'));  // false (包含非数字)
 * console.log(isValidChinesePhone('138123456789')); // false (位数过多)
 */
function isValidChinesePhone(phone) {
  if (typeof phone !== 'string') return false;
  if (phone.length !== 11) return false;
  if (!/^\d+$/.test(phone)) return false;
  if (phone[0] !== '1') return false;
  if (!/^[3-9]$/.test(phone[1])) return false;
  return true;
}

module.exports = {
  formatDate,
  debounce,
  throttle,
  isValidEmail,
  generateSimpleId,
  isValidUrl,
  isEmpty,
  isValidChinesePhone
};