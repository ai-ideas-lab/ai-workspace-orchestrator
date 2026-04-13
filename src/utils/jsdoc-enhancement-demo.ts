/**
 * JSDoc注释增强演示 - 展示完整的JSDoc注释格式
 * 
 * 该文件演示如何为export函数添加完整的JSDoc注释，包括：
 * - @description 功能描述
 * - @param 参数名 参数描述
 * - @returns 返回值描述
 * - @throws 可能抛出的异常
 * - @example 使用示例（代码）
 * 
 * 这些注释将帮助其他开发者更好地理解代码功能、参数和用法。
 */

/**
 * 计算两个数的和
 * 
 * 提供基本的加法运算功能，支持整数和浮点数计算。
 * 该函数是基础数学运算工具，可用于各种数值计算场景。
 * 
 * @param {number} num1 - 第一个加数，可以是整数或浮点数
 * @param {number} num2 - 第二个加数，可以是整数或浮点数
 * @returns {number} 两数之和，类型与输入参数保持一致
 * @throws {TypeError} 当任一参数不是数字类型时抛出异常
 * @example
 * // 基本加法运算
 * const result1 = add(5, 3);
 * console.log(result1); // 输出: 8
 * 
 * // 浮点数运算
 * const result2 = add(2.5, 3.7);
 * console.log(result2); // 输出: 6.2
 * 
 * // 处理负数
 * const result3 = add(-10, 15);
 * console.log(result3); // 输出: 5
 * 
 * // 错误处理示例
 * try {
 *   const result = add('5', 3);
 *   console.log(result);
 * } catch (error) {
 *   console.error('参数类型错误:', error.message);
 *   // 输出: 参数类型错误: 参数必须是数字类型
 * }
 */
export function add(num1: number, num2: number): number {
  if (typeof num1 !== 'number' || typeof num2 !== 'number') {
    throw new TypeError('参数必须是数字类型');
  }
  return num1 + num2;
}

/**
 * 验证用户输入的邮箱地址
 * 
 * 使用正则表达式检查输入的字符串是否符合标准的电子邮件格式。
 * 支持常见的邮箱格式验证，包括用户名@域名.顶级域名的结构。
 * 该函数主要用于表单验证和用户输入预处理。
 * 
 * @param {string} email - 待验证的邮箱地址字符串
 * @param {boolean} [requireTLD=true] - 是否要求必须包含顶级域名（如.com、.cn等），默认为true
 * @returns {boolean} 如果邮箱格式正确返回true，否则返回false
 * @throws {TypeError} 当email参数不是字符串类型时抛出异常
 * @example
 * // 验证标准邮箱格式
 * const isValid1 = validateEmail('user@example.com');
 * console.log(isValid1); // 输出: true
 * 
 * // 验证包含顶级域名的邮箱
 * const isValid2 = validateEmail('john.doe@company.co.uk');
 * console.log(isValid2); // 输出: true
 * 
 * // 验证无效邮箱格式
 * const isValid3 = validateEmail('invalid-email');
 * console.log(isValid3); // 输出: false
 * 
 * // 验证不需要顶级域名的邮箱（本地测试）
 * const isValid4 = validateEmail('test@localhost', false);
 * console.log(isValid4); // 输出: true
 * 
 * // 在表单验证中的使用
 * function validateEmailForm(emailInput) {
 *   if (!validateEmail(emailInput.value)) {
 *     emailInput.setCustomValidity('请输入有效的邮箱地址');
 *     return false;
 *   } else {
 *     emailInput.setCustomValidity('');
 *     return true;
 *   }
 * }
 */
export function validateEmail(email: string, requireTLD: boolean = true): boolean {
  if (typeof email !== 'string') {
    throw new TypeError('email参数必须是字符串类型');
  }

  // 基本邮箱正则表达式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (requireTLD) {
    // 必须包含顶级域名（至少一个点）
    return emailRegex.test(email);
  } else {
    // 允许本地邮箱（如test@localhost）
    const localEmailRegex = /^[^\s@]+@[^\s@]+$/;
    return localEmailRegex.test(email);
  }
}

/**
 * 格式化文件大小为人类可读的字符串
 * 
 * 将字节数转换为更易读的单位（KB、MB、GB等）。
 * 支持自动选择合适的单位，保持1-3位有效数字。
 * 该函数用于文件管理、上传进度显示等场景。
 * 
 * @param {number} bytes - 文件大小（字节数），必须为非负数
 * @param {number} [decimals=2] - 保留的小数位数，默认为2位
 * @returns {string} 格式化后的大小字符串，如"1.5MB"、"256KB"
 * @throws {TypeError} 当bytes参数不是数字类型时抛出异常
 * @throws {RangeError} 当bytes为负数时抛出异常
 * @example
 * // 格式化小文件
 * const size1 = formatFileSize(1024);
 * console.log(size1); // 输出: "1KB"
 * 
 * // 格式化中等文件
 * const size2 = formatFileSize(1048576); // 1MB
 * console.log(size2); // 输出: "1MB"
 * 
 * // 格式化大文件带小数
 * const size3 = formatFileSize(1572864); // 1.5MB
 * console.log(size3); // 输出: "1.5MB"
 * 
 * // 自定义小数位数
 * const size4 = formatFileSize(1572864, 1);
 * console.log(size4); // 输出: "1.5MB"
 * 
 * // 零字节文件
 * const size5 = formatFileSize(0);
 * console.log(size5); // 输出: "0B"
 * 
 * // 文件管理器中的应用
 * function displayFileInfo(file) {
 *   const formattedSize = formatFileSize(file.size);
 *   console.log(`${file.name}: ${formattedSize}`);
 * }
 */
export function formatFileSize(bytes: number, decimals: number = 2): string {
  if (typeof bytes !== 'number') {
    throw new TypeError('bytes参数必须是数字类型');
  }
  
  if (bytes < 0) {
    throw new RangeError('bytes参数不能为负数');
  }
  
  if (bytes === 0) return '0B';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + sizes[i];
}

/**
 * 生成指定范围内的随机整数
 * 
 * 生成min到max之间的随机整数，包含边界值。
 * 使用Math.random()函数生成随机数，确保结果在指定范围内。
 * 该函数常用于游戏开发、随机抽样等场景。
 * 
 * @param {number} min - 随机数范围的最小值（包含）
 * @param {number} max - 随机数范围的最大值（包含）
 * @returns {number} 在指定范围内的随机整数
 * @throws {TypeError} 当任一参数不是数字类型时抛出异常
 * @throws {RangeError} 当min大于max时抛出异常
 * @example
 * // 生成1-10的随机数
 * const random1 = getRandomInt(1, 10);
 * console.log(random1); // 可能输出: 3, 7, 9等
 * 
 * // 生成0-100的随机数
 * const random2 = getRandomInt(0, 100);
 * console.log(random2); // 可能输出: 0, 42, 100等
 * 
 * // 生成负数范围的随机数
 * const random3 = getRandomInt(-10, -1);
 * console.log(random3); // 可能输出: -5, -8, -10等
 * 
 * // 验证参数边界
 * const random4 = getRandomInt(5, 5); // 只能生成5
 * console.log(random4); // 输出: 5
 * 
 * // 在抽奖程序中的应用
 * function drawLottery(min, max, count) {
 *   const numbers = [];
 *   for (let i = 0; i < count; i++) {
 *     const num = getRandomInt(min, max);
 *     if (!numbers.includes(num)) {
 *       numbers.push(num);
 *     }
 *   }
 *   return numbers;
 * }
 */
export function getRandomInt(min: number, max: number): number {
  if (typeof min !== 'number' || typeof max !== 'number') {
    throw new TypeError('参数必须是数字类型');
  }
  
  if (min > max) {
    throw new RangeError('min参数不能大于max参数');
  }
  
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 防抖函数 - 高频事件优化
 * 
 * 创建一个防抖版本的函数，在短时间内多次调用时只会执行最后一次。
 * 常用于窗口调整、搜索输入、滚动事件等高频触发场景，提高性能。
 * 该函数返回一个新的函数，保留了原始函数的上下文和参数。
 * 
 * @param {Function} func - 需要防抖的函数
 * @param {number} wait - 等待时间（毫秒），默认500ms
 * @param {boolean} [immediate=false] - 是否立即执行第一次调用，默认false
 * @returns {Function} 防抖后的函数
 * @throws {TypeError} 当func参数不是函数类型时抛出异常
 * @example
 * // 搜索输入防抖
 * const handleSearch = debounce((query: string) => {
 *   console.log('搜索:', query);
 *   // 执行搜索逻辑
 * }, 300);
 * 
 * // 在输入框中使用
 * searchInput.addEventListener('input', (e) => {
 *   handleSearch(e.target.value);
 * });
 * 
 * // 窗口大小调整防抖
 * const handleResize = debounce(() => {
 *   console.log('窗口大小已调整');
 *   // 重新计算布局
 * }, 250);
 * 
 * window.addEventListener('resize', handleResize);
 * 
 * // 立即执行模式
 * const handleButtonClick = debounce(() => {
 *   console.log('按钮点击');
 * }, 1000, true);
 * 
 * button.addEventListener('click', handleButtonClick);
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number = 500,
  immediate: boolean = false
): (...args: Parameters<T>) => void {
  if (typeof func !== 'function') {
    throw new TypeError('func参数必须是函数类型');
  }
  
  let timeout: NodeJS.Timeout | null = null;
  
  return function(this: any, ...args: Parameters<T>): void {
    const context = this;
    
    const later = () => {
      timeout = null;
      if (!immediate) {
        func.apply(context, args);
      }
    };
    
    const callNow = immediate && !timeout;
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(later, wait);
    
    if (callNow) {
      func.apply(context, args);
    }
  };
}

/**
 * 节流函数 - 频率控制
 * 
 * 创建一个节流版本的函数，在指定时间间隔内最多执行一次。
 * 防止函数被高频调用，常用于滚动事件、鼠标移动、API请求限制等场景。
 * 该函数返回一个新的函数，保留了原始函数的上下文和参数。
 * 
 * @param {Function} func - 需要节流的函数
 * @param {number} limit - 时间间隔（毫秒），默认1000ms
 * @returns {Function} 节流后的函数
 * @throws {TypeError} 当func参数不是函数类型时抛出异常
 * @example
 * // 滚动事件节流
 * const handleScroll = throttle(() => {
 *   console.log('页面滚动中');
 *   // 更新滚动位置相关UI
 * }, 200);
 * 
 * window.addEventListener('scroll', handleScroll);
 * 
 * // 鼠标移动节流
 * const handleMouseMove = throttle((event: MouseEvent) => {
 *   console.log('鼠标位置:', event.clientX, event.clientY);
 *   // 更新鼠标跟随元素位置
 * }, 100);
 * 
 * document.addEventListener('mousemove', handleMouseMove);
 * 
 * // API请求节流
 * const fetchData = throttle((page: number) => {
 *   console.log('请求数据:', page);
 *   // 发送API请求
 * }, 2000);
 * 
 * // 用户点击分页按钮
 * paginationButtons.forEach(button => {
 *   button.addEventListener('click', () => {
 *     const page = parseInt(button.dataset.page || '1');
 *     fetchData(page);
 *   });
 * });
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number = 1000
): (...args: Parameters<T>) => void {
  if (typeof func !== 'function') {
    throw new TypeError('func参数必须是函数类型');
  }
  
  let inThrottle: boolean = false;
  
  return function(this: any, ...args: Parameters<T>): void {
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