# AI Workspace Orchestrator API 文档

## 概述

本文档详细描述了AI Workspace Orchestrator项目的所有API端点。该API提供工作流管理、用户管理、性能优化等功能。

## 基础信息

- **基础URL**: `http://localhost:3000/api`
- **内容类型**: `application/json`
- **认证**: JWT Token (部分端点需要)
- **响应格式**: JSON

## 通用响应格式

### 成功响应
```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

### 错误响应
```json
{
  "success": false,
  "error": "错误描述",
  "message": "详细错误信息"
}
```

## 用户管理 API

### 1. 获取所有用户
**端点**: `GET /api/users`

**请求参数**:
- 无

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": "user-123",
      "name": "张三",
      "email": "zhangsan@example.com",
      "role": "USER",
      "createdAt": "2026-04-12T14:10:00Z",
      "updatedAt": "2026-04-12T14:10:00Z"
    }
  ],
  "message": "获取用户列表成功"
}
```

**错误码**:
- 500: 服务器内部错误


### 2. 获取用户详情
**端点**: `GET /api/users/:id`

**路径参数**:
- `id`: 用户ID

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "user-123",
    "name": "张三",
    "email": "zhangsan@example.com",
    "role": "USER",
    "createdAt": "2026-04-12T14:10:00Z",
    "updatedAt": "2026-04-12T14:10:00Z",
    "workflows": [
      {
        "id": "workflow-456",
        "name": "数据处理工作流",
        "status": "ACTIVE",
        "createdAt": "2026-04-12T14:15:00Z"
      }
    ],
    "executions": [
      {
        "id": "exec-789",
        "status": "SUCCESS",
        "createdAt": "2026-04-12T14:20:00Z"
      }
    ]
  },
  "message": "获取用户详情成功"
}
```

**错误码**:
- 404: 用户不存在
- 500: 服务器内部错误


### 3. 创建用户
**端点**: `POST /api/users`

**请求体**:
```json
{
  "name": "张三",
  "email": "zhangsan@example.com",
  "role": "USER"
}
```

**参数说明**:
- `name`: 用户姓名 (必填, 1-50字符)
- `email`: 用户邮箱 (必填, 有效邮箱格式)
- `role`: 用户角色 (可选, 默认"USER", 可选"USER"、"ADMIN")

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "user-123",
    "name": "张三",
    "email": "zhangsan@example.com",
    "role": "USER",
    "createdAt": "2026-04-12T14:10:00Z",
    "updatedAt": "2026-04-12T14:10:00Z"
  },
  "message": "用户创建成功"
}
```

**错误码**:
- 400: 数据验证失败
- 400: 邮箱已存在
- 500: 服务器内部错误


### 4. 更新用户
**端点**: `PUT /api/users/:id`

**路径参数**:
- `id`: 用户ID

**请求体**:
```json
{
  "name": "李四",
  "email": "lisi@example.com",
  "role": "ADMIN"
}
```

**参数说明**:
- `name`: 用户姓名 (可选, 1-50字符)
- `email`: 用户邮箱 (可选, 有效邮箱格式)
- `role`: 用户角色 (可选, "USER"、"ADMIN")

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "user-123",
    "name": "李四",
    "email": "lisi@example.com",
    "role": "ADMIN",
    "createdAt": "2026-04-12T14:10:00Z",
    "updatedAt": "2026-04-12T14:25:00Z"
  },
  "message": "用户更新成功"
}
```

**错误码**:
- 400: 数据验证失败
- 400: 邮箱已被使用
- 404: 用户不存在
- 500: 服务器内部错误


### 5. 删除用户
**端点**: `DELETE /api/users/:id`

**路径参数**:
- `id`: 用户ID

**响应示例**:
```json
{
  "success": true,
  "message": "用户删除成功"
}
```

**错误码**:
- 404: 用户不存在
- 500: 服务器内部错误


### 6. 获取用户统计信息
**端点**: `GET /api/users/:id/stats`

**路径参数**:
- `id`: 用户ID

**响应示例**:
```json
{
  "success": true,
  "data": {
    "totalWorkflows": 5,
    "activeWorkflows": 3,
    "completedExecutions": 15,
    "failedExecutions": 2,
    "averageExecutionTime": 120
  },
  "message": "获取用户统计信息成功"
}
```

**错误码**:
- 404: 用户不存在
- 500: 服务器内部错误


### 7. 获取优化版本用户列表
**端点**: `GET /api/users/optimized`

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": "user-123",
      "name": "张三",
      "email": "zhangsan@example.com",
      "posts": [
        {
          "id": "post-456",
          "title": "示例文章",
          "content": "文章内容"
        }
      ]
    }
  ],
  "message": "获取用户列表成功（优化版本）"
}
```

**错误码**:
- 500: 服务器内部错误


### 8. 获取原始版本用户列表
**端点**: `GET /api/users/original`

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": "user-123",
      "name": "张三",
      "email": "zhangsan@example.com",
      "posts": [
        {
          "id": "post-456",
          "title": "示例文章",
          "content": "文章内容"
        }
      ]
    }
  ],
  "message": "获取用户列表成功（原始版本）"
}
```

**错误码**:
- 500: 服务器内部错误


### 9. 搜索文章
**端点**: `GET /api/posts/search`

**查询参数**:
- `q`: 搜索关键词 (必填)

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": "post-456",
      "title": "AI工作流优化",
      "content": "关于AI工作流优化的详细说明",
      "author": "张三",
      "createdAt": "2026-04-12T14:30:00Z"
    }
  ],
  "message": "搜索"AI工作流优化"成功"
}
```

**错误码**:
- 400: 搜索关键词不能为空
- 500: 服务器内部错误

## 工作流管理 API

### 1. 获取工作流列表
**端点**: `GET /api/workflows`

**请求参数**:
- 无

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": "workflow-123",
      "name": "数据处理工作流",
      "description": "用于处理和转换数据",
      "status": "ACTIVE",
      "createdAt": "2026-04-12T14:10:00Z",
      "updatedAt": "2026-04-12T14:25:00Z"
    }
  ],
  "message": "获取工作流列表成功"
}
```

**错误码**:
- 500: 服务器内部错误


### 2. 创建工作流
**端点**: `POST /api/workflows`

**请求体**:
```json
{
  "name": "数据处理工作流",
  "description": "用于处理和转换数据",
  "config": {
    "steps": [
      {
        "type": "extract",
        "source": "database",
        "config": {}
      }
    ]
  },
  "variables": [
    {
      "name": "input_path",
      "type": "string",
      "value": "/data/input"
    }
  ]
}
```

**参数说明**:
- `name`: 工作流名称 (必填)
- `description`: 工作流描述 (可选)
- `config`: 工作流配置 (必填, JSON格式)
- `variables`: 工作流变量 (可选, 数组格式)

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "workflow-123",
    "name": "数据处理工作流",
    "description": "用于处理和转换数据",
    "status": "DRAFT",
    "config": { /* 配置内容 */ },
    "variables": [ /* 变量列表 */ ],
    "userId": "user-123",
    "createdAt": "2026-04-12T14:10:00Z",
    "updatedAt": "2026-04-12T14:10:00Z"
  },
  "message": "工作流创建成功"
}
```

**错误码**:
- 400: 数据验证失败
- 500: 服务器内部错误


### 3. 获取工作流详情
**端点**: `GET /api/workflows/:id`

**路径参数**:
- `id`: 工作流ID

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "workflow-123",
    "name": "数据处理工作流",
    "description": "用于处理和转换数据",
    "status": "ACTIVE",
    "config": {
      "steps": [
        {
          "type": "extract",
          "source": "database",
          "config": {}
        }
      ]
    },
    "variables": [
      {
        "name": "input_path",
        "type": "string",
        "value": "/data/input"
      }
    ],
    "userId": "user-123",
    "createdAt": "2026-04-12T14:10:00Z",
    "updatedAt": "2026-04-12T14:25:00Z",
    "executions": [
      {
        "id": "exec-456",
        "status": "SUCCESS",
        "startedAt": "2026-04-12T14:30:00Z",
        "completedAt": "2026-04-12T14:35:00Z"
      }
    ]
  },
  "message": "获取工作流详情成功"
}
```

**错误码**:
- 404: 工作流不存在
- 500: 服务器内部错误


### 4. 更新工作流
**端点**: `PUT /api/workflows/:id`

**路径参数**:
- `id`: 工作流ID

**请求体**:
```json
{
  "name": "更新后的数据处理工作流",
  "description": "更新后的描述",
  "config": {
    "steps": [
      {
        "type": "extract",
        "source": "database",
        "config": { "table": "users" }
      }
    ]
  }
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "workflow-123",
    "name": "更新后的数据处理工作流",
    "description": "更新后的描述",
    "status": "ACTIVE",
    "config": { /* 更新后的配置 */ },
    "updatedAt": "2026-04-12T14:40:00Z"
  },
  "message": "工作流更新成功"
}
```

**错误码**:
- 400: 数据验证失败
- 404: 工作流不存在
- 500: 服务器内部错误


### 5. 删除工作流
**端点**: `DELETE /api/workflows/:id`

**路径参数**:
- `id`: 工作流ID

**响应示例**:
```json
{
  "success": true,
  "message": "工作流删除成功"
}
```

**错误码**:
- 404: 工作流不存在
- 500: 服务器内部错误


### 6. 克隆工作流
**端点**: `POST /api/workflows/:id/clone`

**路径参数**:
- `id`: 原始工作流ID

**请求体**:
```json
{
  "name": "克隆的工作流"
}
```

**参数说明**:
- `name`: 克隆后的工作流名称 (可选, 默认为原名称+"副本")

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "workflow-456",
    "name": "克隆的工作流",
    "description": "原始描述",
    "status": "DRAFT",
    "sourceWorkflowId": "workflow-123",
    "sourceWorkflowName": "数据处理工作流",
    "createdAt": "2026-04-12T14:45:00Z"
  },
  "message": "工作流克隆成功"
}
```

**错误码**:
- 404: 原始工作流不存在
- 500: 服务器内部错误


### 7. 执行工作流
**端点**: `POST /api/workflows/:id/execute`

**路径参数**:
- `id`: 工作流ID

**请求体**:
```json
{
  "variables": {
    "input_path": "/data/input",
    "output_path": "/data/output"
  },
  "async": true
}
```

**参数说明**:
- `variables`: 执行变量 (可选, JSON格式)
- `async`: 是否异步执行 (可选, 默认false)

**响应示例**:
```json
{
  "success": true,
  "data": {
    "executionId": "exec-789",
    "status": "PENDING",
    "startedAt": "2026-04-12T14:50:00Z",
    "estimatedDuration": 300
  },
  "message": "工作流执行已启动"
}
```

**错误码**:
- 404: 工作流不存在
- 400: 工作流配置无效
- 500: 服务器内部错误


### 8. 获取执行历史
**端点**: `GET /api/workflows/:id/executions`

**路径参数**:
- `id`: 工作流ID

**查询参数**:
- `page`: 页码 (可选, 默认1)
- `limit`: 每页数量 (可选, 默认10)
- `status`: 状态过滤 (可选, 如SUCCESS, FAILED, RUNNING)

**响应示例**:
```json
{
  "success": true,
  "data": {
    "executions": [
      {
        "id": "exec-789",
        "status": "SUCCESS",
        "startedAt": "2026-04-12T14:50:00Z",
        "completedAt": "2026-04-12T14:55:00Z",
        "duration": 300,
        "result": { /* 执行结果 */ }
      }
    ]
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25
    }
  },
  "message": "获取执行历史成功"
}
```

**错误码**:
- 404: 工作流不存在
- 500: 服务器内部错误


### 9. 验证工作流
**端点**: `POST /api/workflows/validate`

**请求体**:
```json
{
  "name": "测试工作流",
  "config": {
    "steps": [
      {
        "type": "extract",
        "source": "database",
        "config": {}
      }
    ]
  }
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "valid": true,
    "errors": [],
    "warnings": [],
    "suggestions": [
      "建议添加错误处理步骤"
    ]
  },
  "message": "工作流验证成功"
}
```

**错误码**:
- 400: 数据验证失败
- 500: 服务器内部错误


### 10. 获取执行路径
**端点**: `POST /api/workflows/execution-path`

**请求体**:
```json
{
  "config": {
    "steps": [
      {
        "type": "extract",
        "source": "database",
        "config": {}
      },
      {
        "type": "transform",
        "source": "python",
        "config": { "script": "transform.py" }
      }
    ]
  },
  "inputData": { /* 输入数据示例 */ }
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "path": [
      {
        "step": 1,
        "type": "extract",
        "description": "从数据库提取数据",
        "estimatedDuration": 60
      },
      {
        "step": 2,
        "type": "transform",
        "description": "数据转换处理",
        "estimatedDuration": 120
      }
    ],
    "totalDuration": 180,
    "dependencies": [1, 2]
  },
  "message": "获取执行路径成功"
}
```

**错误码**:
- 400: 数据验证失败
- 500: 服务器内部错误


### 11. 导出工作流
**端点**: `GET /api/workflows/:id/export`

**路径参数**:
- `id`: 工作流ID

**响应**: 
返回JSON文件下载，包含完整的工作流配置信息

**响应示例**:
```json
{
  "workflow": {
    "id": "workflow-123",
    "name": "数据处理工作流",
    "description": "用于处理和转换数据",
    "config": { /* 完整配置 */ },
    "variables": [ /* 变量列表 */ ],
    "status": "ACTIVE",
    "createdAt": "2026-04-12T14:10:00Z"
  },
  "exportedAt": "2026-04-12T15:00:00Z"
}
```

**错误码**:
- 404: 工作流不存在
- 500: 服务器内部错误


### 12. 导入工作流
**端点**: `POST /api/workflows/import`

**请求体**:
```json
{
  "workflow": {
    "name": "导入的工作流",
    "description": "从外部导入的工作流",
    "config": { /* 工作流配置 */ },
    "variables": [ /* 变量列表 */ ]
  },
  "options": {
    "name": "自定义名称",
    "draft": true,
    "overwrite": false
  }
}
```

**参数说明**:
- `workflow`: 工流数据 (必填)
- `options`: 导入选项 (可选)
  - `name`: 自定义名称
  - `draft`: 是否设为草稿 (默认false)
  - `overwrite`: 是否覆盖同名工作流 (默认false)

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "workflow-456",
    "name": "导入的工作流",
    "description": "从外部导入的工作流",
    "status": "DRAFT",
    "createdAt": "2026-04-12T15:05:00Z"
  },
  "message": "工作流导入成功"
}
```

**错误码**:
- 400: 工作流数据无效
- 400: 工作流已存在且不允许覆盖
- 500: 服务器内部错误

## 系统管理 API

### 1. 健康检查
**端点**: `GET /api/health`

**响应示例**:
```json
{
  "success": true,
  "message": "API服务正常运行",
  "timestamp": "2026-04-12T15:10:00Z",
  "version": "1.0.0"
}
```

**错误码**:
- 500: 服务不可用

## 错误码说明

| HTTP状态码 | 错误类型 | 描述 |
|-----------|---------|------|
| 200 | SUCCESS | 请求成功 |
| 201 | CREATED | 资源创建成功 |
| 400 | BAD REQUEST | 请求参数错误或验证失败 |
| 401 | UNAUTHORIZED | 未授权或认证失败 |
| 403 | FORBIDDEN | 权限不足 |
| 404 | NOT FOUND | 请求的资源不存在 |
| 429 | TOO MANY REQUESTS | 请求频率超过限制 |
| 500 | INTERNAL SERVER ERROR | 服务器内部错误 |

## 认证要求

大多数API端点需要JWT Token认证，需要在请求头中包含：
```
Authorization: Bearer <your-jwt-token>
```

## 速率限制

- 默认限制：每15分钟最多100次请求
- 限制针对IP地址和用户ID的组合

## 更新日志

- **2026-04-12**: 初始版本发布，包含完整的工作流和用户管理API
- **2026-04-12**: 添加工作流导入/导出功能
- **2026-04-12**: 优化用户查询性能，支持分页和过滤


*本文档最后更新时间：2026-04-12*
*本文档最后更新时间：2026-04-12*
