/**
 * 测试orchestrator模块中的验证和日志函数
 * 
 * 针对validateUserRequest和logRequestTimestamp函数的单元测试，
 * 确保用户请求验证和时间戳记录功能正常工作。
 */

import { validateUserRequest, logRequestTimestamp } from '../orchestrator';

describe('validateUserRequest', () => {
  test('应该验证有效的用户请求', () => {
    const validRequests = [
      '创建月度销售报告',
      '分析客户反馈',
      '生成销售数据报告',
      '检查系统状态'
    ];
    
    validRequests.forEach(request => {
      const result = validateUserRequest(request);
      expect(result).toBe(true);
    });
  });

  test('应该拒绝空请求', () => {
    const result = validateUserRequest('');
    expect(result).toBe(false);
  });

  test('应该只包含空格的请求', () => {
    const result = validateUserRequest('   ');
    expect(result).toBe(false);
  });

  test('应该拒绝过长的请求', () => {
    const longRequest = 'a'.repeat(1001);
    const result = validateUserRequest(longRequest);
    expect(result).toBe(false);
  });

  test('应该接受刚好在长度限制内的请求', () => {
    const maxLengthRequest = 'a'.repeat(1000);
    const result = validateUserRequest(maxLengthRequest);
    expect(result).toBe(true);
  });

  test('应该拒绝非字符串类型的输入', () => {
    const invalidInputs = [
      null,
      undefined,
      123,
      true,
      false,
      {},
      []
    ];
    
    invalidInputs.forEach(input => {
      const result = validateUserRequest(input as any);
      expect(result).toBe(false);
    });
  });

  test('应该正确处理带有前后空格的请求', () => {
    const requestWithSpaces = '  创建月度销售报告  ';
    const result = validateUserRequest(requestWithSpaces);
    expect(result).toBe(true);
  });
});

describe('logRequestTimestamp', () => {
  let consoleSpy: jest.SpyInstance;
  
  beforeEach(() => {
    // 模拟console.log来避免实际的日志输出
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    // 恢复原始的console.log
    consoleSpy.mockRestore();
  });

  test('应该正确记录短请求的时间戳', () => {
    const request = '创建月度销售报告';
    logRequestTimestamp(request);
    
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z\]/)
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('处理请求: 创建月度销售报告')
    );
  });

  test('应该正确截断长请求并在末尾添加省略号', () => {
    const longRequest = '这是一个非常长的用户请求，用于测试函数是否正确处理超过100字符的请求内容，确保能够正确截断并显示省略号';
    logRequestTimestamp(longRequest);
    
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('处理请求: 这是一个非常长的用户请求，用于测试函数是否正确处理超过100字符的请求内容，确保能够正确截断并显示省略...')
    );
  });

  test('应该正确处理空请求', () => {
    logRequestTimestamp('');
    
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('处理请求: ')
    );
  });

  test('应该使用ISO 8601格式的时间戳', () => {
    const request = '测试时间戳格式';
    logRequestTimestamp(request);
    
    const logCall = consoleSpy.mock.calls[0][0];
    expect(logCall).toMatch(/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z\]/);
  });

  test('应该在同一个日志调用中同时包含时间戳和处理请求信息', () => {
    const request = '测试单次调用';
    logRequestTimestamp(request);
    
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    const logMessage = consoleSpy.mock.calls[0][0];
    expect(logMessage).toMatch(/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z\] 处理请求: 测试单次调用$/);
  });
});
