const { formatDate, isValidEmail, generateSimpleId, isValidUrl } = require('./utils/common');

/**
 * 统一的日志输出函数
 * @param {string} category 日志分类
 * @param {string} message 日志消息
 * @param {*} data 相关数据
 */
function logTestResult(category, message, data = null) {
  const logMessage = `${message}: ${data}`;
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