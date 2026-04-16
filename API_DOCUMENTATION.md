# API 文档 - AI工作流编排平台

## 基本信息
- **基础URL**: `http://localhost:3000/api`
- **版本**: v1.0.0
- **作者**: 孔明
- **最后更新**: 2026-04-16

---

## 系统端点

### 1. 健康检查
- **GET** `/health`
- **功能**: 检查服务状态
- **响应示例**:
```json
{
  "success": true,
  "message": "服务运行正常",
  "timestamp": "2026-04-16T03:05:00.000Z",
  "uptime": "2h 30m 15s"
}
```

### 2. 系统信息
- **GET** `/system`
- **功能**: 获取系统运行信息
- **响应示例**:
```json
{
  "success": true,
  "message": "系统信息",
  "environment": "development",
  "memory": {
    "rss": "128MB",
    "heapUsed": "64MB"
  },
  "uptime": "2h 30m 15s"
}
```

---

## 工作流管理端点

### 1. 获取工作流列表
- **GET** `/workflows`
- **参数**: 
  - `page`: 页码 (默认: 1)
  - `limit`: 每页数量 (默认: 10)
  - `status`: 状态筛选
  - `search`: 搜索关键词
- **响应**: 工作流列表和分页信息

### 2. 创建工作流
- **POST** `/workflows`
- **Body**: 
```json
{
  "name": "工作流名称",
  "description": "工作流描述",
  "config": {...},
  "variables": {...},
  "userId": "用户ID"
}
```

### 3. 获取单个工作流
- **GET** `/workflows/:id`
- **参数**: `id` - 工作流ID

### 4. 更新工作流
- **PUT** `/workflows/:id`
- **参数**: `id` - 工作流ID
- **Body**: 同创建工作流字段

### 5. 删除工作流
- **DELETE** `/workflows/:id`
- **参数**: `id` - 工作流ID

### 6. 克隆工作流
- **POST** `/workflows/:id/clone`
- **参数**: `id` - 源工作流ID
- **Body**: 
```json
{
  "name": "克隆后的名称（可选）"
}
```

### 7. 执行工作流
- **POST** `/workflows/:id/execute`
- **参数**: `id` - 工作流ID

### 8. 获取执行历史
- **GET** `/workflows/:id/executions`
- **参数**: `id` - 工作流ID

### 9. 验证工作流
- **POST** `/workflows/validate`
- **Body**: 工作流配置对象

### 10. 获取执行路径
- **POST** `/workflows/execution-path`
- **Body**: 工作流配置对象

---

## 导入/导出端点

### 1. 导出工作流
- **GET** `/workflows/:id/export`
- **参数**: `id` - 工作流ID
- **响应**: JSON文件下载

### 2. 导入工作流
- **POST** `/workflows/import`
- **Body**:
```json
{
  "workflow": {...},
  "options": {
    "name": "新名称（可选）",
    "draft": true,
    "overwrite": false
  }
}
```

---

## 错误处理

### 常见错误码
- `400` - 请求参数错误
- `401` - 未授权
- `403` - 禁止访问
- `404` - 资源不存在
- `422` - 验证失败
- `500` - 服务器内部错误

### 响应格式
```json
{
  "success": false,
  "message": "错误描述",
  "error": "错误代码",
  "timestamp": "2026-04-16T03:05:00.000Z"
}
```

---

## 使用示例

### 基础使用
```bash
# 健康检查
curl http://localhost:3000/health

# 获取工作流列表
curl http://localhost:3000/api/workflows

# 创建工作流
curl -X POST http://localhost:3000/api/workflows \
  -H "Content-Type: application/json" \
  -d '{"name": "示例工作流", "config": {...}}'

# 执行工作流
curl -X POST http://localhost:3000/api/workflows/123/execute
```

### 完整示例
```javascript
// 获取工作流列表并执行
const response = await fetch('http://localhost:3000/api/workflows');
const workflows = await response.json();

if (workflows.success) {
  const executeResponse = await fetch(
    `http://localhost:3000/api/workflows/${workflows.data[0].id}/execute`,
    { method: 'POST' }
  );
  const result = await executeResponse.json();
  console.log('执行结果:', result);
}
```

---

## 安全特性

- **CORS**: 已配置跨域访问
- **Helmet**: 安全头信息
- **请求ID**: 每个请求都有唯一ID
- **错误监控**: 统一错误处理和日志记录
- **输入验证**: Joi验证框架
- **限流**: 可配置的请求限制

---

## 监控和维护

### 日志系统
- 使用 Winston 日志库
- 分级日志记录 (info, warn, error)
- 请求ID追踪

### 性能监控
- 内存使用监控
- CPU使用率监控
- 请求响应时间统计
- 错误聚合告警

### 健康检查
- 系统健康状态检查
- 优雅关闭机制
- 自动重启机制