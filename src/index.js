const { formatDate, isValidEmail, generateSimpleId, isValidUrl } = require('./utils/common');

/**
 * 统一的日志输出函数
 * 
 * 用于测试套件中格式化输出测试结果，提供统一的日志格式和分类显示。
 * 支持多种数据类型的格式化输出，确保测试结果的可读性和一致性。
 * 
 * @param {string} category - 日志分类，用于区分不同类型的测试结果
 * @param {string} message - 日志消息，描述测试的主要内容或目的
 * @param {*} data - 相关数据，可以是任何可序列化的数据类型
 * @returns {void} 该函数不返回值，直接输出到控制台
 * @throws {TypeError} 当category或message参数不是字符串类型时可能抛出异常
 * @example
 * // 基本日志输出
 * logTestResult('日期测试', '当前日期', '2026-04-13');
 * // 输出:
 * // === 日期测试 ===
 * // 当前日期: 2026-04-13
 * 
 * // 复杂数据输出
 * logTestResult('数据分析', '统计结果', { success: true, count: 42, duration: '1.2s' });
 * // 输出:
 * // === 数据分析 ===
 * // 统计结果: [object Object]
 * 
 * // 多行日志输出
 * logTestResult('系统状态', '服务运行状态', [
 *   { service: 'api', status: 'running', port: 3000 },
 *   { service: 'database', status: 'running', port: 5432 }
 * ]);
 * // 输出:
 * // === 系统状态 ===
 * // 服务运行状态: service,service,status,status,port,port
 * 
 * // AI工作流测试日志
 * logTestResult('AI工作流', '意图解析测试', {
 *   input: '生成月度销售报告',
 *   intent: 'report',
 *   confidence: 0.95,
 *   extractedParameters: { period: 'monthly', category: 'sales' }
 * });
 * // 输出:
 * // === AI工作流 ===
 * // 意图解析测试: [object Object]
 * 
 * * 注意事项：
 * // 1. 数据参数会被自动转换为字符串输出
 * // 2. 适用于单元测试、集成测试和系统测试的日志输出
 * // 3. 提供统一的视觉格式，便于测试结果分析
 * // 4. 可以在CI/CD管道中使用，输出格式清晰
 * // 5. 支持复杂对象的调试输出，便于问题定位
 */
function logTestResult(category, message, data = null) {
  // 参数类型验证
  if (typeof category !== 'string') {
    throw new TypeError('category参数必须是字符串类型');
  }
  if (typeof message !== 'string') {
    throw new TypeError('message参数必须是字符串类型');
  }
  
  // 格式化数据输出
  const formattedData = data ? `: ${data}` : '';
  const logMessage = `${message}${formattedData}`;
  
  // 输出格式化的日志
  console.log(`=== ${category} ===`);
  console.log(logMessage);
}

// 主程序入口
console.log('=== AI Workspace Orchestrator Test Suite ===');

// 日期测试
const today = new Date();
logTestResult('日期测试', '当前日期', formatDate(today));

// 邮箱验证测试
const testEmail = 'test@example.com';
const invalidEmail = 'invalid-email';

logTestResult('邮箱验证', '有效邮箱测试', testEmail);
console.log(`验证结果: ${isValidEmail(testEmail)}`);

logTestResult('邮箱验证', '无效邮箱测试', invalidEmail);
console.log(`验证结果: ${isValidEmail(invalidEmail)}`);

// 工具函数测试
logTestResult('工具函数', '默认长度ID', generateSimpleId());
logTestResult('工具函数', '长长度ID', generateSimpleId(12));

// URL验证测试
const validUrl = 'https://example.com';
const invalidUrl = 'not-a-url';

logTestResult('URL验证', '有效URL测试', validUrl);
console.log(`验证结果: ${isValidUrl(validUrl)}`);

logTestResult('URL验证', '无效URL测试', invalidUrl);
console.log(`验证结果: ${isValidUrl(invalidUrl)}`);

console.log('\n✅ 所有测试完成');