# API 文档 - AI工作流编排平台

## 基本信息
- **基础URL**: `http://localhost:3000/api`
- **版本**: v1.0.0
- **作者**: 孔明
- **最后更新**: 2026-04-18 21:32

---

## 统一响应格式

### 成功响应
```json
{
  "success": true,
  "message": "操作描述",
  "data": { ... },
  "meta": {
    "pagination": { "page": 1, "limit": 10, "total": 100, "totalPages": 10 }
  },
  "timestamp": "2026-04-16T12:00:00.000Z"
}
```

### 错误响应
```json
{
  "success": false,
  "message": "错误描述",
  "error": "错误代码",
  "details": { ... },
  "timestamp": "2026-04-16T12:00:00.000Z"
}
```

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
  "data": {
    "environment": "development",
    "memory": { "rss": "128MB", "heapUsed": "64MB" },
    "uptime": "2h 30m 15s"
  }
}
```

---

## 工作流管理端点

### 1. 获取工作流列表
- **GET** `/workflows`
- **Query参数**:
  - `page` (number, 默认: 1) - 页码，必须为正整数
  - `limit` (number, 默认: 10) - 每页数量，1-100之间的整数
  - `status` (string, 可选) - 状态筛选：`DRAFT` | `ACTIVE` | `PAUSED` | `ARCHIVED`
  - `userId` (string, 可选) - 按用户ID筛选
  - `search` (string, 可选) - 按名称搜索
- **响应**: 工作流列表 + 分页信息
- **特性**: 带重试机制（最多2次，网络/超时错误自动重试）、性能监控

### 2. 创建工作流
- **POST** `/workflows`
- **Body**:
```json
{
  "name": "工作流名称（必填，最大200字符）",
  "config": { "steps": [...] },
  "description": "工作流描述（可选）",
  "variables": {},
  "userId": "用户ID（可选，默认取认证用户）"
}
```
- **验证规则**:
  - `name`: 必填，非空字符串，≤200字符
  - `config`: 必填，必须是对象
- **成功响应**: `201 Created`
- **错误响应**:
  - `400` - 参数验证失败
  - `409` - 工作流名称已存在（唯一约束冲突）

### 3. 获取单个工作流
- **GET** `/workflows/:id`
- **路径参数**: `id` - 工作流ID
- **错误响应**:
  - `400` - 工作流ID不能为空
  - `404` - 工作流不存在

### 4. 更新工作流
- **PUT** `/workflows/:id`
- **路径参数**: `id` - 工作流ID
- **Body**（所有字段可选）:
```json
{
  "name": "新名称（≤200字符）",
  "description": "新描述",
  "config": { "steps": [...] },
  "variables": {},
  "status": "DRAFT | ACTIVE | PAUSED | ARCHIVED"
}
```
- **验证规则**:
  - `name`: 非空字符串，≤200字符
  - `config`: 必须是对象
  - `status`: 必须是 `DRAFT`, `ACTIVE`, `PAUSED`, `ARCHIVED` 之一

### 5. 删除工作流
- **DELETE** `/workflows/:id`
- **路径参数**: `id` - 工作流ID
- **错误响应**:
  - `400` - 工作流ID不能为空
  - `404` - 工作流不存在
  - `409` - 工作流包含活跃执行（PENDING/RUNNING），无法删除
- **特性**: 外键约束错误自动重试

### 6. 克隆工作流
- **POST** `/workflows/:id/clone`
- **路径参数**: `id` - 源工作流ID（必须为有效的工作流ID）
- **Body**:
```json
{
  "name": "克隆后的名称（可选，默认：原名 + ' (副本)'）"
}
```
- **验证规则**:
  - `id`: 必须为有效的工作流ID格式
  - `name`: 可选，字符串，≤200字符（如不提供则自动生成）
- **成功响应**: `201 Created`
```json
{
  "success": true,
  "message": "工作流克隆成功",
  "data": {
    "id": "new_workflow_id",
    "name": "月度销售报告 (副本)",
    "description": "原工作流的完整描述将被复制",
    "status": "DRAFT",
    "sourceWorkflowId": "original_workflow_id",
    "sourceWorkflowName": "月度销售报告",
    "config": { "steps": [...] },
    "variables": {},
    "createdAt": "2026-04-26T10:05:00.000Z",
    "updatedAt": "2026-04-26T10:05:00.000Z"
  }
}
```
- **错误响应**:
  - `400` - 工作流ID参数无效
  - `404` - 源工作流不存在
  - `403` - 无权限克隆（非创建者且非管理员）
  - `409` - 工作流包含大量执行记录，克隆可能影响性能
- **特性**:
  - **智能命名**: 自动添加 "(副本)" 后缀，避免名称冲突
  - **完整复制**: 克隆工作流的所有配置、变量和描述
  - **状态重置**: 克隆后的工作流自动设为 `DRAFT` 状态
  - **权限继承**: 保持原工作流的用户关联
  - **性能优化**: 使用数据库级克隆操作，提高执行效率
- **使用示例**:
```bash
# 基本克隆（自动命名）
curl -X POST http://localhost:3000/api/workflows/123/clone \
  -H "Content-Type: application/json"

# 自定义名称克隆
curl -X POST http://localhost:3000/api/workflows/123/clone \
  -H "Content-Type: application/json" \
  -d '{"name": "我的定制报告"}'

# 批量克隆脚本
for id in "123" "456" "789"; do
  curl -X POST http://localhost:3000/api/workflows/$id/clone \
    -H "Content-Type: application/json" \
    -d '{"name": "备份_'$id'"}'
done
```

### 7. 执行工作流
- **POST** `/workflows/:id/execute`
- **路径参数**: `id` - 工作流ID
- **Body**:
```json
{
  "inputVariables": {},
  "priority": "LOW | NORMAL | HIGH | URGENT",
  "timeout": 30
}
```
- **验证规则**:
  - `variables`: 必须是对象
  - `priority`: 必须是 `LOW`, `NORMAL`, `HIGH`, `URGENT` 之一
  - `timeout`: 1-3600秒之间的整数
- **成功响应**: `202 Accepted`（异步执行）
```json
{
  "success": true,
  "data": {
    "id": "执行ID",
    "status": "RUNNING",
    "estimatedDuration": "..."
  }
}
```
- **特性**: 30秒超时保护、重试机制、性能监控

### 8. 获取执行历史
- **GET** `/workflows/:id/executions`
- **路径参数**: `id` - 工作流ID
- **Query参数**:
  - `page` (number, 默认: 1) - 页码
  - `limit` (number, 默认: 10) - 每页数量，1-100
  - `status` (string, 可选) - `PENDING` | `RUNNING` | `COMPLETED` | `FAILED` | `CANCELLED`
  - `startDate` (string, 可选) - 开始日期，ISO格式
  - `endDate` (string, 可选) - 结束日期，ISO格式（不得早于startDate）
- **响应**: 执行记录列表 + 分页信息

### 9. 验证工作流配置
- **POST** `/workflows/validate`
- **Body**:
```json
{
  "config": {
    "steps": [
      { "id": "step1", "type": "api", "config": { ... } },
      { "id": "step2", "type": "script", "config": { ... } }
    ]
  }
}
```
- **验证规则**:
  - `config`: 必填，必须是对象
  - `config.steps`: 必须是数组
  - 每个step必须有 `id`（字符串）和 `type`（`api` | `script` | `condition` | `loop`）
  - API步骤必须有 `config` 对象
- **成功响应**:
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "warnings": [],
    "suggestions": []
  }
}
```
- **失败响应**: `400` 验证失败，返回错误列表

### 10. 获取执行路径
- **POST** `/workflows/execution-path`
- **功能**: 预览工作流的执行路径和依赖关系，分析任务执行顺序和并行处理策略
- **用途**: 在工作流执行前验证逻辑正确性，识别潜在的循环依赖或资源冲突
- **Body**:
```json
{
  "config": {
    "steps": [
      {
        "id": "step-1",
        "type": "ai-analysis",
        "dependencies": [],
        "estimatedDuration": 5000
      },
      {
        "id": "step-2", 
        "type": "data-processing",
        "dependencies": ["step-1"],
        "estimatedDuration": 3000
      }
    ]
  },
  "input": {
    "sourceData": "用户提供的输入数据",
    "parameters": { "timeout": 30000 }
  }
}
```
- **验证规则**:
  - `config`: 必填，必须是对象
  - `input`: 可选，必须是对象
- **成功响应**:
```json
{
  "success": true,
  "message": "执行路径分析完成",
  "data": {
    "executionOrder": ["step-1", "step-2"],
    "parallelGroups": [
      ["step-1"],
      ["step-2"]
    ],
    "criticalPath": ["step-1", "step-2"],
    "estimatedTotalDuration": 8000,
    "resourceRequirements": {
      "aiProcessing": 1,
      "dataProcessing": 1
    },
    "dependencyGraph": {
      "step-1": [],
      "step-2": ["step-1"]
    },
    "warnings": []
  }
}
```
- **错误响应**:
  - `400` - 配置格式错误或循环依赖
  - `422` - 验证失败，依赖关系不完整

---

## 导入/导出端点

### 11. 导出工作流
- **GET** `/workflows/:id/export`
- **路径参数**: `id` - 工作流ID
- **响应**: JSON文件下载（`Content-Disposition: attachment`）
- **错误响应**:
  - `404` - 工作流不存在

### 12. 导入工作流
- **POST** `/workflows/import`
- **Body**:
```json
{
  "workflow": { "...工作流数据..." },
  "options": {
    "name": "新名称（可选）",
    "draft": true,
    "overwrite": false
  }
}
```
- **验证规则**:
  - `workflow`: 必填
- **成功响应**: `201 Created`

---

## 错误码汇总

| HTTP状态码 | 说明 |
|-----------|------|
| `400` | 请求参数错误 / 验证失败 |
| `401` | 未授权 |
| `403` | 禁止访问（权限不足） |
| `404` | 资源不存在 |
| `409` | 冲突（名称已存在 / 含活跃执行） |
| `422` | 数据验证失败 |
| `500` | 服务器内部错误 |

---

## 安全特性

- **CORS**: 已配置跨域访问
- **Helmet**: 安全头信息
- **请求ID**: 每个请求唯一追踪ID
- **错误监控**: 统一错误处理（AsyncErrorHandler + 装饰器模式）
- **输入验证**: 多层验证（路由层 + 服务层 + 数据库约束）
- **限流**: 可配置的请求限制
- **错误脱敏**: 生产环境自动过滤敏感错误信息

---

## 架构特性

### 错误处理
- **装饰器模式**: `@withErrorHandling`、`@withRetry`、`@withInputValidation`、`@withPerformanceMonitoring`
- **异步错误处理**: `AsyncErrorHandler` 统一包装，支持重试和超时
- **自定义错误类**: `AppError`、`ValidationError`、`NotFoundError`、`SystemError`

### 可靠性
- **自动重试**: 网络/超时/约束错误自动重试（可配置次数和延迟）
- **超时保护**: 执行操作有30秒超时限制
- **熔断器**: Circuit Breaker 模式防止级联故障
- **优雅降级**: 服务异常时的备用处理

### 监控
- **Winston日志**: 分级记录（info/warn/error）
- **性能监控**: 请求响应时间统计
- **请求追踪**: correlationId 贯穿整个请求链路

---

## 使用示例

```bash
# 健康检查
curl http://localhost:3000/health

# 获取工作流列表（第2页，每页20条）
curl "http://localhost:3000/api/workflows?page=2&limit=20&status=ACTIVE"

# 创建工作流
curl -X POST http://localhost:3000/api/workflows \
  -H "Content-Type: application/json" \
  -d '{"name": "示例工作流", "config": {"steps": [{"id": "s1", "type": "api", "config": {"url": "https://example.com"}}]}}'

# 执行工作流（高优先级）
curl -X POST http://localhost:3000/api/workflows/123/execute \
  -H "Content-Type: application/json" \
  -d '{"inputVariables": {"key": "value"}, "priority": "HIGH"}'

# 获取执行历史
curl "http://localhost:3000/api/workflows/123/executions?status=COMPLETED&limit=5"

# 克隆工作流
curl -X POST http://localhost:3000/api/workflows/123/clone \
  -H "Content-Type: application/json" \
  -d '{"name": "我的工作流副本"}'

# 导出工作流
curl -o workflow.json http://localhost:3000/api/workflows/123/export

# 导入工作流
curl -X POST http://localhost:3000/api/workflows/import \
  -H "Content-Type: application/json" \
  -d @workflow.json

# 验证工作流配置
curl -X POST http://localhost:3000/api/workflows/validate \
  -H "Content-Type: application/json" \
  -d '{"config": {"steps": [{"id": "s1", "type": "api", "config": {}}]}}'
```

---

## 🔧 系统实现状态

### 当前功能实现状态
- ✅ **完整实现**: 所有12个API端点均已实现
- ✅ **错误处理**: 统一错误处理机制，包含装饰器模式和重试机制
- ✅ **安全特性**: CORS、Helmet安全头、请求ID追踪
- ✅ **性能监控**: 内置性能监控和内存使用追踪
- ✅ **异步执行**: 支持异步工作流执行，带超时保护
- ✅ **数据验证**: 多层验证（路由层、服务层、数据库约束）

### 技术栈
- **框架**: Express.js + TypeScript
- **数据库**: Prisma ORM
- **监控**: 自定义错误聚合器 + 日志系统
- **验证**: 洋葱模型验证架构
- **错误处理**: 装饰器模式 + 重试机制

### 更新日志
- **2026-04-18 21:32**: 孔明执行API文档自动生成任务，更新时间戳，确认所有端点实现完整
