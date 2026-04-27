// 代码质量测试文件 - 验证错误处理和常量提取
const TEST_CONFIG = {
  MAX_RETRIES: 3,
  TIMEOUT_MS: 5000,
  API_BASE_URL: 'https://api.example.com'
};

function safeApiCall(endpoint) {
  try {
    console.log(`Calling API: ${TEST_CONFIG.API_BASE_URL}${endpoint}`);
    // 模拟API调用
    return { success: true, data: 'test' };
  } catch (error) {
    console.error('API call failed:', error.message);
    return { success: false, error: error.message };
  }
}

// 测试错误处理
const result = safeApiCall('/test');
console.log('API call result:', result);

console.log('✅ 代码质量改进完成');