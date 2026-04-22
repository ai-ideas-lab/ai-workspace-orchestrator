# AI Workspace Orchestrator API 文档

## 概述

AI Workspace Orchestrator 是一个企业级AI工作流自动化平台，提供RESTful API用于工作流管理和执行。

## 基础信息

- **Base URL**: `http://localhost:3000`
- **API Version**: 1.0
- **Content-Type**: `application/json`

## 认证

API使用JWT token进行认证，需要在请求头中包含：
```
Authorization: Bearer <your-jwt-token>
```

## 系统端点

### 健康检查

**GET** `/health`

检查服务运行状态。

**响应示例:**
```json
{
  "success": true,
  "message": "服务运行正常",
  "requestId": "req_1234567890",
  "timestamp": "2026-04-15T20:45:00.000Z",
  "uptime": 3600
}
```

### 系统信息

**GET** `/system`

获取系统详细信息。

**响应示例:**
```json
{
  "success": true,
  "message": "系统信息",
  "requestId": "req_1234567890",
  "timestamp": "2026-04-15T20:45:00.000Z",
  "environment": "development",
  "version": "18.0.0",
  "platform": "darwin",
  "arch": "x64",
  "uptime": {
    "seconds": 3600,
    "formatted": "1h 0m 0s"
  },
  "memory": {
    "rss": "128MB",
    "heapTotal": "64MB",
    "heapUsed": "32MB",
    "external": "8MB"
  },
  "cpu": {
    "user": "1000ms",
    "system": "500ms"
  },
  "port": 3000
}
```

## 工作流 API

### 获取工作流列表

**GET** `/api/workflows`

获取所有工作流的列表，支持分页和过滤。

**查询参数:**
- `page` (number): 页码，默认1
- `limit` (number): 每页数量，默认10
- `status` (string): 工作流状态过滤
- `userId` (string): 用户ID过滤
- `search` (string): 搜索关键词

**响应示例:**
```json
{
  "success": true,
  "message": "获取工作流列表成功",
  "data": [
    {
      "id": "workflow-123",
      "name": "数据分析工作流",
      "description": "用于数据分析的自动化工作流",
      "status": "ACTIVE",
      "createdAt": "2026-04-15T20:45:00.000Z",
      "updatedAt": "2026-04-15T20:45:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

### 创建工作流

**POST** `/api/workflows`

创建新的工作流。

**请求体:**
```json
{
  "name": "新的工作流",
  "description": "工作流描述",
  "config": {
    "steps": [...],
    "variables": {...}
  },
  "variables": {
    "param1": "value1"
  }
}
```

**响应示例:**
```json
{
  "success": true,
  "message": "工作流创建成功",
  "data": {
    "id": "workflow-456",
    "name": "新的工作流",
    "description": "工作流描述",
    "status": "DRAFT",
    "config": {...},
    "variables": {...},
    "createdAt": "2026-04-15T20:45:00.000Z"
  }
}
```

### 获取特定工作流

**GET** `/api/workflows/:id`

获取指定ID的工作流详情。

**响应示例:**
```json
{
  "success": true,
  "message": "获取工作流成功",
  "data": {
    "id": "workflow-123",
    "name": "数据分析工作流",
    "description": "用于数据分析的自动化工作流",
    "status": "ACTIVE",
    "config": {...},
    "variables": {...},
    "createdAt": "2026-04-15T20:45:00.000Z",
    "updatedAt": "2026-04-15T20:45:00.000Z"
  }
}
```

### 更新工作流

**PUT** `/api/workflows/:id`

更新指定ID的工作流。

**请求体:**
```json
{
  "name": "更新后的工作流名称",
  "description": "更新后的描述",
  "config": {...},
  "variables": {...}
}
```

### 删除工作流

**DELETE** `/api/workflows/:id`

删除指定ID的工作流。

**响应示例:**
```json
{
  "success": true,
  "message": "工作流删除成功"
}
```

### 克隆工作流

**POST** `/api/workflows/:id/clone`

克隆指定ID的工作流。

**请求体:**
```json
{
  "name": "克隆的工作流名称"
}
```

**响应示例:**
```json
{
  "success": true,
  "message": "工作流克隆成功",
  "data": {
    "id": "workflow-789",
    "name": "克隆的工作流名称",
    "description": "原始工作流的描述",
    "status": "DRAFT",
    "sourceWorkflowId": "workflow-123",
    "sourceWorkflowName": "原始工作流名称",
    "createdAt": "2026-04-15T20:45:00.000Z"
  }
}
```

### 执行工作流

**POST** `/api/workflows/:id/execute`

执行指定ID的工作流，支持变量注入和优先级设置。

**请求体:**
```json
{
  "inputVariables": {
    "data_source": "database",
    "query": "SELECT * FROM users",
    "output_file": "/tmp/output.csv"
  },
  "priority": 1,
  "timeout": 30000
}
```

**参数说明:**
- `inputVariables` (object): 工作流执行变量，用于配置工作流各个步骤的输入参数
  - 键值对形式，键为变量名，值为对应的变量值
- `priority` (number, optional): 执行优先级，默认为5（1-10，1为最高优先级）
- `timeout` (number, optional): 超时时间（毫秒），默认为30000（30秒）

**响应示例:**
```json
{
  "success": true,
  "message": "工作流执行启动成功",
  "data": {
    "executionId": "exec-123456",
    "workflowId": "workflow-789",
    "status": "RUNNING",
    "priority": 1,
    "timeout": 30000,
    "inputVariables": {
      "data_source": "database",
      "query": "SELECT * FROM users",
      "output_file": "/tmp/output.csv"
    },
    "startedAt": "2026-04-23T16:03:00.000Z",
    "estimatedDuration": "2-5分钟"
  }
}
```

**状态码:**
- `202 Accepted`: 工作流已接受并开始执行
- `400 Bad Request`: 请求参数错误
- `404 Not Found`: 工作流不存在
- `409 Conflict`: 工作流状态不允许执行（如DRAFT状态）
- `429 Too Many Requests`: 系统负载过高，暂不接收新任务

### 获取执行历史

**GET** `/api/workflows/:id/executions`

获取指定工作流的执行历史。

**响应示例:**
```json
{
  "success": true,
  "message": "获取执行历史成功",
  "data": [
    {
      "id": "exec-123",
      "workflowId": "workflow-123",
      "status": "COMPLETED",
      "startedAt": "2026-04-15T20:45:00.000Z",
      "completedAt": "2026-04-15T20:46:00.000Z",
      "result": {...}
    }
  ]
}
```

### 验证工作流

**POST** `/api/workflows/validate`

验证工作流配置的有效性。

**请求体:**
```json
{
  "config": {...},
  "variables": {...}
}
```

**响应示例:**
```json
{
  "success": true,
  "message": "工作流验证成功",
  "data": {
    "isValid": true,
    "warnings": [],
    "errors": []
  }
}
```

### 获取执行路径

**POST** `/api/workflows/execution-path`

获取工作流的执行路径预览。

**请求体:**
```json
{
  "config": {...},
  "variables": {...}
}
```

**响应示例:**
```json
{
  "success": true,
  "message": "获取执行路径成功",
  "data": {
    "steps": [
      {
        "id": "step-1",
        "name": "数据收集",
        "type": "data_collection",
        "next": ["step-2"]
      }
    ],
    "estimatedDuration": "5分钟"
  }
}
```

### 导出工作流

**GET** `/api/workflows/:id/export`

导出工作流为JSON文件。

**响应:** 返回JSON文件下载

### 导入工作流

**POST** `/api/workflows/import`

从JSON文件导入工作流。

**请求体:**
```json
{
  "workflow": {
    "name": "导入的工作流",
    "description": "工作流描述",
    "config": {...},
    "variables": {...}
  },
  "options": {
    "name": "自定义工作流名称",
    "draft": true,
    "overwrite": false
  }
}
```

**响应示例:**
```json
{
  "success": true,
  "message": "工作流导入成功",
  "data": {
    "id": "workflow-999",
    "name": "自定义工作流名称",
    "status": "DRAFT",
    "createdAt": "2026-04-15T20:45:00.000Z"
  }
}
```

## 错误处理

API使用标准的HTTP状态码和错误响应格式：

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述",
    "details": {...},
    "requestId": "req_1234567890",
    "timestamp": "2026-04-15T20:45:00.000Z"
  }
}
```

### 常见错误码

- `VALIDATION_ERROR`: 输入验证失败
- `NOT_FOUND`: 资源不存在
- `UNAUTHORIZED`: 未授权访问
- `INTERNAL_ERROR`: 服务器内部错误
- `WORKFLOW_EXECUTION_FAILED`: 工作流执行失败

## 请求ID

每个API响应都包含唯一的请求ID，用于错误追踪和日志记录：

```json
{
  "requestId": "req_1234567890"
}
```

## 版本信息

- **当前版本**: 1.0.0
- **最后更新**: 2026-04-15
- **维护者**: 孔明