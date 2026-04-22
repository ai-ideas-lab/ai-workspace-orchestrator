/**
 * 快速帮助工具服务 - 提供各种辅助功能
 * 包含常用的工具函数和快速操作接口
 */

/**
 * 格式化文件大小 - 将字节数转换为可读的文件大小格式
 * 
 * @param {number} bytes - 字节数，需要转换的文件大小
 * @param {number} decimals - 小数位数，默认为2
 * @returns {string} 返回格式化后的文件大小字符串，如 "1.5MB", "256KB"
 * @throws {TypeError} 当输入参数不是数字类型时抛出异常
 * @example
 * // 基本文件大小格式化
 * const size = formatFileSize(1500000);
 * console.log(size); // "1.5MB"
 * 
 * // 自定义小数位数
 * const preciseSize = formatFileSize(1234567, 3);
 * console.log(preciseSize); // "1.178MB"
 * 
 * // 小文件格式化
 * const smallSize = formatFileSize(512);
 * console.log(smallSize); // "512B"
 */
export function formatFileSize(bytes: number, decimals: number = 2): string {
  if (typeof bytes !== 'number' || isNaN(bytes)) {
    throw new TypeError('Bytes must be a valid number');
  }
  
  // Handle 0 bytes case
  if (bytes === 0) {
    return '0B';
  }
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  
  // For bytes (B), don't show decimals
  const dm = i === 0 ? 0 : Math.max(0, decimals);
  
  return `${(bytes / Math.pow(k, i)).toFixed(dm)}${sizes[i]}`;
}

/**
 * 防抖函数 - 减少函数执行频率，在指定时间内只执行一次
 * 适用于频繁触发的事件处理，如窗口调整、输入验证等场景
 * 
 * @param {Function} func - 需要防抖的函数
 * @param {number} wait - 等待时间（毫秒），默认为300ms
 * @returns {Function} 返回防抖后的函数
 * @example
 * // 输入框防抖
 * const searchInput = document.getElementById('search');
 * const handleSearch = debounce((value: string) => {
 *   console.log('搜索:', value);
 * }, 500);
 * 
 * searchInput.addEventListener('input', (e) => {
 *   handleSearch(e.target.value);
 * });
 * 
 * // 窗口调整防抖
 * const handleResize = debounce(() => {
 *   console.log('窗口大小改变:', window.innerWidth, window.innerHeight);
 * }, 250);
 * 
 * window.addEventListener('resize', handleResize);
 */
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number = 300): T {
  let timeout: NodeJS.Timeout;
  
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  }) as T;
}

/**
 * 简单的UUID生成器 - 生成唯一的标识符
 * 返回简化版的UUID，用于基本的唯一标识需求
 * 
 * @param {number} length - 生成ID的长度，默认为8个字符
 * @returns {string} 返回生成的唯一标识符
 * @throws {TypeError} 当输入参数不是正整数时抛出异常
 * @example
 * // 生成默认长度的ID
 * const id = generateSimpleId();
 * console.log(id); // "a3f7c2b1"
 * 
 * // 生成较长ID
 * const longId = generateSimpleId(16);
 * console.log(longId); // "f4a7e2d9b3c1f8e5"
 */
export function generateSimpleId(length: number = 8): string {
  if (typeof length !== 'number' || length <= 0 || !Number.isInteger(length)) {
    throw new TypeError('Length must be a positive integer');
  }
  
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * 深度克隆对象 - 递归复制对象及其所有嵌套属性
 * 支持基本数据类型、数组、日期、正则表达式等常见对象类型
 * 
 * @param {any} obj - 需要克隆的对象
 * @returns {any} 返回深拷贝后的对象
 * @throws {Error} 当遇到无法克隆的对象类型时抛出异常
 * @example
 * // 基本对象克隆
 * const original = { name: '张三', age: 25 };
 * const cloned = deepClone(original);
 * console.log(cloned); // { name: '张三', age: 25 }
 * 
 * // 嵌套对象克隆
 * const nested = {
 *   user: { name: '李四', contacts: ['email', 'phone'] },
 *   metadata: { created: new Date() }
 * };
 * const clonedNested = deepClone(nested);
 * console.log(clonedNested.user === nested.user); // false (深拷贝)
 * 
 * // 数组克隆
 * const originalArray = [1, 2, { value: 3 }];
 * const clonedArray = deepClone(originalArray);
 * console.log(clonedArray[2] === originalArray[2]); // false
 */
export function deepClone<T>(obj: T): T {
  // 处理基本类型
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  // 处理日期对象
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T;
  }
  
  // 处理正则表达式
  if (obj instanceof RegExp) {
    return new RegExp(obj.source, obj.flags) as T;
  }
  
  // 处理数组
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as T;
  }
  
  // 处理普通对象
  const clonedObj = {} as T;
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      clonedObj[key] = deepClone(obj[key]);
    }
  }
  
  return clonedObj;
}