/**
 * 验证输入是否为有效字符串
 * 
 * 通用字符串验证函数，检查输入是否为非空字符串类型。
 * 用于其他验证函数的前置检查，减少重复代码。
 * 
 * @param input 待验证的输入
 * @returns 如果是有效字符串返回 true，否则返回 false
 * @example
 * // 基本验证
 * console.log(isValidString('hello')); // true
 * console.log(isValidString('')); // false
 * console.log(isValidString(null)); // false
 * console.log(isValidString(undefined)); // false
 * 
 * // 在其他函数中使用
 * function isValidEmail(email) {
 *   if (!isValidString(email)) return false;
 *   // 邮箱验证逻辑...
 * }
 */
function isValidString(input) {
  return typeof input === 'string' && input.trim().length > 0;
}

/**
 * 格式化日期为 YYYY-MM-DD 格式
 * 
 * 将 JavaScript Date 对象转换为标准的日期字符串格式，
 * 便于在 API 和数据库中统一使用。
 * 
 * @param {Date} date 要格式化的日期对象
 * @returns {string} 格式化后的日期字符串，格式为 YYYY-MM-DD
 * @throws {TypeError} 当date参数不是Date对象时抛出异常
 * @example
 * // 格式化当前日期
 * const today = new Date();
 * const formatted = formatDate(today);
 * console.log(formatted); // 输出: "2026-04-13"
 * 
 * // 格式化特定日期
 * const specificDate = new Date('2026-12-25');
 * console.log(formatDate(specificDate)); // 输出: "2026-12-25"
 * 
 * // 处理时区问题
 * const utcDate = new Date('2026-04-13T00:00:00.000Z');
 * console.log(formatDate(utcDate)); // 输出: "2026-04-13"
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
  if (!isValidString(email)) return false;
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
 * @param {Function} func 要节流的原始函数
 * @param {number} limit 时间间隔（毫秒），默认 1000ms
 * @returns {Function} 节流后的函数
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
  if (typeof func !== 'function') {
    throw new TypeError('第一个参数必须是函数');
  }
  if (typeof limit !== 'number' || limit <= 0) {
    throw new TypeError('第二个参数必须是正数');
  }
  
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
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

/**
 * 验证URL格式和协议的有效性
 * 
 * 检查输入字符串是否为有效的URL，并验证是否使用了支持的协议（HTTP/HTTPS）。
 * 使用浏览器内置的URL解析器进行验证，确保URL格式正确且可访问。
 * 
 * @param {string} url - 待验证的URL字符串
 * @returns {boolean} 如果是有效的HTTP或HTTPS URL返回true，否则返回false
 * @throws {TypeError} 当url参数不是字符串类型时抛出异常
 * @example
 * // 验证有效的HTTPS URL
 * console.log(isValidUrl('https://example.com')); // true
 * console.log(isValidUrl('https://api.example.com/v1/users')); // true
 * 
 * // 验证有效的HTTP URL
 * console.log(isValidUrl('http://localhost:3000')); // true
 * 
 * // 验证无效URL
 * console.log(isValidUrl('ftp://example.com')); // false (不支持FTP协议)
 * console.log(isValidUrl('example.com')); // false (缺少协议)
 * console.log(isValidUrl('https://')); // false (域名不完整)
 * console.log(isValidUrl(12345)); // false (非字符串类型)
 * 
 * // 使用场景：表单验证
 * function validateUrlField(urlInput) {
 *   if (!isValidUrl(urlInput)) {
 *     throw new Error('请输入有效的网址（必须以http://或https://开头）');
 *   }
 * }
 */
function isValidUrl(url) {
  if (!isValidString(url)) return false;
  
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
 * 规范化字符串格式
 * 
 * 对输入字符串进行基本格式化处理，包括去除首尾空白、
 * 移除多余空格、标准化特殊字符等操作。常用于用户输入预处理。
 * 
 * @param str 待规范化的字符串
 * @returns 规范化后的字符串
 * @example
 * // 基本字符串清理
 * console.log(normalizeString('  hello world  ')); // "hello world"
 * 
 * // 移除多余空格
 * console.log(normalizeString('hello    world')); // "hello world"
 * 
 * // 处理空字符串
 * console.log(normalizeString('')); // ""
 * console.log(normalizeString('   ')); // ""
 * 
 * // 处理null/undefined
 * console.log(normalizeString(null)); // ""
 * console.log(normalizeString(undefined)); // ""
 * 
 * // AI输入预处理场景
 * function preprocessUserInput(input) {
 *   const normalized = normalizeString(input);
 *   if (isEmpty(normalized)) {
 *     throw new Error('输入内容不能为空');
 *   }
 *   return normalized;
 * }
 */
function normalizeString(str) {
  if (!str || typeof str !== 'string') {
    return '';
  }
  
  // 去除首尾空白
  let normalized = str.trim();
  
  // 将多个连续空格替换为单个空格
  normalized = normalized.replace(/\s+/g, ' ');
  
  // 移除换行符和制表符
  normalized = normalized.replace(/[\t\n\r]/g, ' ');
  
  // 再次去除可能产生的多余空格
  normalized = normalized.replace(/\s+/g, ' ').trim();
  
  return normalized;
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
  if (!isValidString(phone)) return false;
  if (phone.length !== 11) return false;
  if (!/^\d+$/.test(phone)) return false;
  if (phone[0] !== '1') return false;
  if (!/^[3-9]$/.test(phone[1])) return false;
  return true;
}

/**
 * 生成AI工作流唯一ID
 * 
 * 创建格式为 'wf_YYYYMMDD_HHMMSS_RRRR' 的工作流标识符，
 * 包含时间戳和随机字符，确保唯一性。
 * 
 * @returns {string} 格式化的工作流ID
 * @example
 * const workflowId = generateWorkflowId();
 * console.log(workflowId); // 输出: "wf_20260413_1445_1234"
 */
function generateWorkflowId() {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:T.]/g, '').slice(0, 14);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `wf_${timestamp}_${random}`;
}

/**
 * 验证AI工作流JSON Schema
 * 
 * 快速验证工作流配置是否包含必需字段且格式正确。
 * 用于AI工作流执行前的预检查。
 * 
 * @param workflow 工作流配置对象
 * @returns {boolean} 是否有效
 * @example
 * const isValid = validateWorkflowSchema({
 *   name: "test",
 *   steps: []
 * });
 */
function validateWorkflowSchema(workflow) {
  return workflow && 
         typeof workflow === 'object' && 
         workflow.name && 
         Array.isArray(workflow.steps);
}

/**
 * 转换字符串为标题格式
 * 
 * 将字符串转换为标题格式，每个单词首字母大写，其余小写。
 * 处理常见的特殊情况（如英文介词、连接词等）。
 * 
 * @param str 待转换的字符串
 * @returns 标题格式的字符串
 * @example
 * // 基本转换
 * console.log(toTitleCase('hello world')); // "Hello World"
 * console.log(toTitleCase('AI WORKFLOW')); // "AI Workflow"
 * 
 * // 处理特殊词
 * console.log(toTitleCase('the quick brown fox')); // "The Quick Brown Fox"
 * console.log(toTitleCase('user authentication system')); // "User Authentication System"
 * 
 * // 数字和符号处理
 * console.log(toTitleCase('version 2.0 release')); // "Version 2.0 Release"
 * 
 * // AI工作流命名场景
 * const workflowName = toTitleCase('customer data processing pipeline');
 * console.log(workflowName); // "Customer Data Processing Pipeline"
 */
function toTitleCase(str) {
  if (!str || typeof str !== 'string') {
    return '';
  }
  
  return str.toLowerCase().split(' ').map(word => {
    // 跳过空字符串
    if (word.length === 0) return '';
    
    // 转换为首字母大写
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
}

/**
 * 将字符串首字母大写
 * 
 * 简单的字符串首字母大写功能，用于格式化标题或名称。
 * 保持字符串其余部分不变，只处理第一个字符。
 * 
 * @param str 待处理的字符串
 * @returns 首字母大写的字符串
 * @example
 * // 基本转换
 * console.log(capitalize('hello')); // "Hello"
 * console.log(capitalize('world')); // "World"
 * 
 * // 处理已经大写的字符串
 * console.log(capitalize('Hello')); // "Hello"
 * 
 * // 空字符串处理
 * console.log(capitalize('')); // ""
 * 
 * // 单字符字符串
 * console.log(capitalize('a')); // "A"
 * 
 * // 在AI工作流中使用
 * const workflowName = capitalize('data processing');
 * console.log(workflowName); // "Data processing"
 */
function capitalize(str) {
  if (!str || typeof str !== 'string' || str.length === 0) {
    return str;
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
}

module.exports = {
  formatDate,
  debounce,
  throttle,
  isValidEmail,
  generateSimpleId,
  isValidUrl,
  isEmpty,
  normalizeString,
  isValidChinesePhone,
  generateWorkflowId,
  validateWorkflowSchema,
  toTitleCase,
  capitalize
};