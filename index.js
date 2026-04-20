/**
 * AI Workspace Orchestrator - Main Server
 * 
 * 轻量级Express服务器，用于演示和测试AI工作流编排器的基本功能。
 * 提供简单的API端点，展示时间格式化和字符串处理能力。
 * 
 * @example
 * // 启动服务器
 * node index.js
 * // 访问 http://localhost:3000 获取响应
 */

const express = require('express');
const _ = require('lodash');
const moment = require('moment');

const app = express();
const port = process.env.PORT || 3000;

/**
 * 健康检查端点 - 返回服务器状态和当前时间
 * 
 * 提供基本的健康检查功能，返回当前服务器状态和格式化的时间戳。
 * 该端点用于验证服务器是否正常运行，并展示基本的字符串处理能力。
 * 
 * @route GET /
 * @param {Request} req - Express请求对象
 * @param {Response} res - Express响应对象
 * @returns {void} 直接发送响应，不返回值
 * @throws {Error} 当moment.js或lodash库出现问题时可能抛出异常
 * @example
 * // 请求示例
 * GET /
 * 
 * // 响应示例
 * // "HELLO WORLD! CURRENT TIME: 2026-04-13 14:52:00"
 * 
 * // 在curl中使用
 * curl http://localhost:3000
 * 
 * // 在浏览器中访问
 * // http://localhost:3000
 */
app.get('/', (req, res) => {
  try {
    // 获取当前时间并格式化
    const currentTime = moment().format('YYYY-MM-DD HH:mm:ss');
    const message = `Hello World! Current time: ${currentTime}`;
    
    // 使用lodash将消息转换为大写
    const upperMessage = _.toUpper(message);
    
    // 发送响应
    res.send(upperMessage);
  } catch (error) {
    // 记录错误并发送500响应
    console.error('Error in health check endpoint:', error);
    res.status(500).send('Internal Server Error');
  }
});

/**
 * 启动Express服务器
 * 
 * 初始化并启动HTTP服务器，监听指定端口。服务器启动后会输出
 * 监听地址和端口信息，方便开发调试和访问验证。
 * 
 * @param {number} port - 监听的端口号，默认3000
 * @param {Function} [callback] - 服务器启动后的回调函数
 * @returns {void} 无返回值
 * @throws {Error} 当端口被占用或权限不足时抛出异常
 * @example
 * // 基本启动方式
 * app.listen(3000, () => {
 *   console.log('Server started on port 3000');
 * });
 * 
 * // 使用环境变量指定端口
 * const port = process.env.PORT || 3000;
 * app.listen(port, () => {
 *   console.log(`Server running at http://localhost:${port}`);
 * });
 * 
 * // 增加错误处理
 * app.listen(port, () => {
 *   console.log(`Server running at http://localhost:${port}`);
 * }).on('error', (err) => {
 *   console.error('Failed to start server:', err);
 * });
 */
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Current environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Press Ctrl+C to stop the server`);
});

/**
 * 优雅关闭服务器
 * 
 * 处理进程终止信号，确保服务器能够优雅关闭。
 * 清理资源、关闭数据库连接等操作可以在此添加。
 * 
 * @example
 * // 监听SIGINT信号（Ctrl+C）
 * process.on('SIGINT', () => {
 *   console.log('Received SIGINT, shutting down gracefully...');
 *   server.close(() => {
 *     console.log('Server closed');
 *     process.exit(0);
 *   });
 * });
 * 
 * // 监听SIGTERM信号（kill命令）
 * process.on('SIGTERM', () => {
 *   console.log('Received SIGTERM, shutting down gracefully...');
 *   server.close(() => {
 *     console.log('Server closed');
 *     process.exit(0);
 *   });
 * });
 */
const server = app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

// 优雅关闭处理
process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// 导出app实例用于测试
module.exports = app;