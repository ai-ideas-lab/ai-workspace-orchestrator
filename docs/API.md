# AI Workspace Orchestrator API 文档

## 概述

AI Workspace Orchestrator 是一个企业级AI工作流自动化平台，通过自然语言界面智能调度多个AI引擎。本文档提供了基于实际代码实现的完整API接口说明，涵盖工作流管理、用户管理、AI引擎调度、执行监控、数据分析等核心功能。

## API 基础信息

- **基础URL**: `/api`
- **内容类型**: `application/json`
- **认证方式**: JWT Bearer Token
- **响应格式**: JSON

---

## 1. 健康检查 API

### 1.1 系统健康状态

**GET** `/api/health`

检查系统整体运行状态，包括数据库连接和服务可用性。

**请求示例**:
```bash
curl -X GET "http://localhost:3000/api/health"
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-04-13T04:10:00Z",
    "version": "1.0.0",
    "uptime": 86400,
    "database": {
      "status": "connected",
      "latencyMs": 15
    },
    "memory": {
      "used": "512MB",
      "total": "2048MB",
      "percentage": 25
    },
    "engines": [
      {
        "name": "text-generation",
        "status": "healthy",
        "latencyMs": 800
      }
    ]
  },
  "message": "系统运行正常"
}
```

**错误码**:
- 500: 服务器内部错误

---

## 2. 用户管理 API

### 2.1 获取用户列表

**GET** `/api/users`

获取所有用户列表，支持分页。

**查询参数**:
- 无特定参数，返回所有用户

**请求示例**:
```bash
curl -X GET "http://localhost:3000/api/users" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": "usr_xxx",
      "name": "张三",
      "email": "zhangsan@example.com",
      "role": "USER",
      "createdAt": "2026-04-13T01:10:00Z",
      "updatedAt": "2026-04-13T01:15:00Z"
    }
  ],
  "message": "获取用户列表成功"
}
```

**错误码**:
- 401: 未授权
- 500: 服务器内部错误

### 2.2 获取用户详情

**GET** `/api/users/{id}`

获取指定用户的详细信息，包括其关联的工作流和执行记录。

**路径参数**:
- `id`: 用户ID

**请求示例**:
```bash
curl -X GET "http://localhost:3000/api/users/usr_xxx" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "usr_xxx",
    "name": "张三",
    "email": "zhangsan@example.com",
    "role": "USER",
    "createdAt": "2026-04-13T01:10:00Z",
    "updatedAt": "2026-04-13T01:15:00Z",
    "workflows": [
      {
        "id": "wf_xxx",
        "name": "AI内容生成流水线",
        "status": "ACTIVE",
        "createdAt": "2026-04-13T01:20:00Z"
      }
    ],
    "executions": [
      {
        "id": "ex_xxx",
        "status": "SUCCESS",
        "createdAt": "2026-04-13T01:25:00Z"
      }
    ]
  },
  "message": "获取用户详情成功"
}
```

**错误码**:
- 401: 未授权
- 404: 用户不存在
- 500: 服务器内部错误

### 2.3 创建用户

**POST** `/api/users`

创建新用户账户。

**请求参数**:
```json
{
  "name": "string",
  "email": "string",
  "role": "USER|ADMIN"
}
```

**请求示例**:
```bash
curl -X POST "http://localhost:3000/api/users" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -d '{
    "name": "李四",
    "email": "lisi@example.com",
    "role": "USER"
  }'
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "usr_yyy",
    "name": "李四",
    "email": "lisi@example.com",
    "role": "USER",
    "createdAt": "2026-04-13T02:00:00Z",
    "updatedAt": "2026-04-13T02:00:00Z"
  },
  "message": "用户创建成功"
}
```

**错误码**:
- 400: 邮箱格式错误
- 401: 未授权
- 409: 邮箱已存在
- 500: 服务器内部错误

### 2.4 更新用户

**PUT** `/api/users/{id}`

更新现有用户信息。

**路径参数**:
- `id`: 用户ID

**请求参数**:
```json
{
  "name": "string",
  "email": "string",
  "role": "USER|ADMIN"
}
```

**请求示例**:
```bash
curl -X PUT "http://localhost:3000/api/users/usr_xxx" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -d '{
    "name": "张三更新",
    "email": "zhangsan.updated@example.com"
  }'
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "usr_xxx",
    "name": "张三更新",
    "email": "zhangsan.updated@example.com",
    "role": "USER",
    "updatedAt": "2026-04-13T02:10:00Z"
  },
  "message": "用户更新成功"
}
```

**错误码**:
- 400: 邮箱格式错误
- 401: 未授权
- 404: 用户不存在
- 409: 邮箱已被其他用户使用
- 500: 服务器内部错误

### 2.5 删除用户

**DELETE** `/api/users/{id}`

删除指定用户。

**路径参数**:
- `id`: 用户ID

**请求示例**:
```bash
curl -X DELETE "http://localhost:3000/api/users/usr_xxx" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**响应示例**:
```json
{
  "success": true,
  "data": null,
  "message": "用户删除成功"
}
```

**错误码**:
- 401: 未授权
- 404: 用户不存在
- 500: 服务器内部错误

### 2.6 获取用户统计

**GET** `/api/users/{id}/stats`

获取指定用户的统计信息。

**路径参数**:
- `id`: 用户ID

**请求示例**:
```bash
curl -X GET "http://localhost:3000/api/users/usr_xxx/stats" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "totalWorkflows": 5,
    "totalExecutions": 25,
    "successfulExecutions": 23,
    "failedExecutions": 2,
    "successRate": 92.0,
    "lastActivityAt": "2026-04-13T02:15:00Z"
  },
  "message": "获取用户统计信息成功"
}
```

**错误码**:
- 401: 未授权
- 404: 用户不存在
- 500: 服务器内部错误

---

## 3. 工作流管理 API

### 3.1 获取工作流列表

**GET** `/api/workflows`

获取所有工作流列表。

**请求示例**:
```bash
curl -X GET "http://localhost:3000/api/workflows" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": "wf_xxx",
      "name": "AI内容生成流水线",
      "description": "自动生成SEO优化的博客文章",
      "status": "ACTIVE",
      "config": {
        "steps": [
          {
            "id": "research",
            "name": "市场调研",
            "type": "text-generation",
            "config": {"prompt": "调研市场趋势"},
            "dependencies": []
          }
        ],
        "variables": {}
      },
      "steps": [
        {
          "id": "research",
          "name": "市场调研",
          "type": "text-generation",
          "config": {"prompt": "调研市场趋势"},
          "order": 0,
          "dependencies": []
        }
      ],
      "executions": [
        {
          "id": "ex_xxx",
          "status": "COMPLETED",
          "createdAt": "2026-04-13T01:20:00Z"
        }
      ],
      "createdAt": "2026-04-13T01:10:00Z",
      "updatedAt": "2026-04-13T01:15:00Z"
    }
  ],
  "count": 1,
  "message": "获取工作流列表成功"
}
```

**错误码**:
- 401: 未授权
- 500: 服务器内部错误

### 3.2 创建工作流

**POST** `/api/workflows`

创建新的工作流。

**请求参数**:
```json
{
  "name": "string",
  "description": "string",
  "steps": [
    {
      "name": "string",
      "type": "text-generation|api-call|data-processing",
      "config": {},
      "dependencies": []
    }
  ],
  "trigger": {}
}
```

**请求示例**:
```bash
curl -X POST "http://localhost:3000/api/workflows" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -d '{
    "name": "AI内容生成流水线",
    "description": "自动生成SEO优化的博客文章",
    "steps": [
      {
        "name": "市场调研",
        "type": "text-generation",
        "config": {"prompt": "调研 {{topic}} 市场现状和趋势"},
        "dependencies": []
      },
      {
        "name": "文章大纲",
        "type": "text-generation", 
        "config": {"prompt": "基于调研结果，为 {{topic}} 创建详细大纲"},
        "dependencies": ["市场调研"]
      }
    ],
    "trigger": {"type": "manual"}
  }'
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "wf_yyy",
    "name": "AI内容生成流水线",
    "description": "自动生成SEO优化的博客文章",
    "config": {
      "steps": [
        {
          "id": "research",
          "name": "市场调研",
          "type": "text-generation",
          "config": {"prompt": "调研市场趋势"},
          "order": 0,
          "dependencies": []
        }
      ],
      "trigger": {"type": "manual"}
    },
    "steps": [
      {
        "id": "research",
        "name": "市场调研",
        "type": "text-generation",
        "config": {"prompt": "调研市场趋势"},
        "order": 0,
        "dependencies": []
      }
    ],
    "createdAt": "2026-04-13T02:20:00Z",
    "updatedAt": "2026-04-13T02:20:00Z"
  },
  "message": "工作流创建成功"
}
```

**错误码**:
- 400: 请求参数错误
- 401: 未授权
- 500: 服务器内部错误

### 3.3 执行工作流

**POST** `/api/workflows/{workflowId}/execute`

启动指定工作流的执行。

**路径参数**:
- `workflowId`: 工作流ID

**请求参数**:
```json
{
  "inputData": {},
  "userId": "string"
}
```

**请求示例**:
```bash
curl -X POST "http://localhost:3000/api/workflows/wf_xxx/execute" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -d '{
    "inputData": {
      "topic": "人工智能",
      "length": "2000"
    },
    "userId": "usr_xxx"
  }'
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "ex_zzz",
    "workflowId": "wf_xxx",
    "status": "RUNNING",
    "inputData": {
      "topic": "人工智能",
      "length": "2000"
    },
    "userId": "usr_xxx",
    "startedAt": "2026-04-13T02:25:00Z"
  },
  "message": "工作流执行启动成功"
}
```

**错误码**:
- 400: 请求参数错误
- 401: 未授权
- 404: 工作流不存在
- 500: 服务器内部错误

### 3.4 获取工作流执行历史

**GET** `/api/workflows/{workflowId}/executions`

获取指定工作流的执行历史。

**路径参数**:
- `workflowId`: 工作流ID

**请求示例**:
```bash
curl -X GET "http://localhost:3000/api/workflows/wf_xxx/executions" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": "ex_xxx",
      "workflowId": "wf_xxx",
      "status": "COMPLETED",
      "inputData": {
        "topic": "人工智能"
      },
      "steps": [
        {
          "id": "step_xxx",
          "name": "市场调研",
          "status": "COMPLETED",
          "order": 0,
          "execution": {
            "id": "exec_step_xxx",
            "status": "COMPLETED",
            "output": {"result": "调研结果..."},
            "error": null
          }
        }
      ],
      "createdAt": "2026-04-13T01:20:00Z"
    }
  ],
  "count": 1,
  "message": "获取执行历史成功"
}
```

**错误码**:
- 401: 未授权
- 404: 工作流不存在
- 500: 服务器内部错误

---

## 4. AI引擎管理 API

### 4.1 获取所有AI引擎

**GET** `/api/ai-engines`

获取系统中所有可用的AI引擎列表。

**请求示例**:
```bash
curl -X GET "http://localhost:3000/api/ai-engines" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": "text-generation",
      "name": "文本生成引擎",
      "description": "用于生成各类文本内容",
      "capabilities": ["文章写作", "创意生成", "摘要"],
      "status": "HEALTHY",
      "model": "GPT-4"
    },
    {
      "id": "api-integration",
      "name": "API集成引擎", 
      "description": "用于调用外部API服务",
      "capabilities": ["REST API调用", "数据转换", "第三方集成"],
      "status": "HEALTHY",
      "model": "Claude-3"
    }
  ],
  "count": 2,
  "message": "获取AI引擎列表成功"
}
```

**错误码**:
- 401: 未授权
- 500: 服务器内部错误

### 4.2 执行AI任务

**POST** `/api/ai-engines/{engineId}/execute`

使用指定AI引擎执行任务。

**路径参数**:
- `engineId`: AI引擎ID

**请求参数**:
```json
{
  "task": "string",
  "options": {}
}
```

**请求示例**:
```bash
curl -X POST "http://localhost:3000/api/ai-engines/text-generation/execute" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -d '{
    "task": "为人工智能主题写一篇1000字的文章",
    "options": {
      "temperature": 0.7,
      "maxTokens": 1500,
      "promptTemplate": "专业文章写作模板"
    }
  }'
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "taskId": "task_xxx",
    "result": {
      "content": "人工智能（AI）是指由机器展现的智能...",
      "wordCount": 1200,
      "topics": ["AI发展", "机器学习", "未来趋势"],
      "confidence": 0.95
    },
    "executionTime": 2500,
    "engine": "text-generation",
    "timestamp": "2026-04-13T02:30:00Z"
  },
  "error": null,
  "executionTime": 3200,
  "message": "AI任务执行成功"
}
```

**错误响应**:
```json
{
  "success": false,
  "data": null,
  "error": "引擎不可用",
  "executionTime": 100,
  "message": "AI任务执行失败"
}
```

**错误码**:
- 400: 任务参数缺失
- 401: 未授权
- 404: AI引擎不存在
- 500: 服务器内部错误

---

## 5. 执行管理 API

### 5.1 获取执行步骤详情

**GET** `/api/executions/{executionId}/steps`

获取指定执行的所有步骤详情。

**路径参数**:
- `executionId`: 执行ID

**请求示例**:
```bash
curl -X GET "http://localhost:3000/api/executions/ex_xxx/steps" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": "step_xxx",
      "name": "市场调研",
      "order": 0,
      "status": "COMPLETED",
      "step": {
        "id": "research",
        "name": "市场调研",
        "type": "text-generation",
        "config": {"prompt": "调研市场趋势"}
      },
      "execution": {
        "id": "exec_step_xxx",
        "status": "COMPLETED",
        "output": {
          "result": "市场调研完成，发现AI市场增长迅速...",
          "wordCount": 500,
          "keyFindings": ["市场增长", "技术成熟", "需求旺盛"]
        },
        "error": null,
        "durationMs": 1500
      }
    },
    {
      "id": "step_yyy", 
      "name": "文章大纲",
      "order": 1,
      "status": "RUNNING",
      "step": {
        "id": "outline",
        "name": "文章大纲",
        "type": "text-generation",
        "config": {"prompt": "基于调研结果创建大纲"}
      },
      "execution": null
    }
  ],
  "count": 2,
  "message": "获取执行步骤详情成功"
}
```

**错误码**:
- 401: 未授权
- 404: 执行不存在
- 500: 服务器内部错误

### 5.2 获取执行历史

**GET** `/api/executions/history`

获取所有执行历史的分页列表。

**查询参数**:
- `page`: 页码，默认1
- `limit`: 每页数量，默认20

**请求示例**:
```bash
curl -X GET "http://localhost:3000/api/executions/history?page=1&limit=10" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": "ex_xxx",
      "workflowId": "wf_xxx",
      "workflow": {
        "id": "wf_xxx",
        "name": "AI内容生成流水线"
      },
      "status": "COMPLETED",
      "inputData": {
        "topic": "人工智能"
      },
      "steps": [
        {
          "id": "step_xxx",
          "name": "市场调研",
          "status": "COMPLETED",
          "order": 0
        }
      ],
      "createdAt": "2026-04-13T02:35:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  },
  "message": "获取执行历史成功"
}
```

**错误码**:
- 401: 未授权
- 500: 服务器内部错误

---

## 6. 数据分析 API

### 6.1 获取系统指标

**GET** `/api/analytics/metrics`

收集系统运行指标，包括性能、资源使用等。

**请求示例**:
```bash
curl -X GET "http://localhost:3000/api/analytics/metrics" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "cpu": {
      "usage": 45.2,
      "cores": 8,
      "temperature": 65
    },
    "memory": {
      "used": "12GB",
      "total": "32GB", 
      "percentage": 37.5
    },
    "disk": {
      "used": "150GB",
      "total": "500GB",
      "percentage": 30
    },
    "network": {
      "incoming": "1.2MB/s",
      "outgoing": "0.8MB/s"
    },
    "uptime": 86400,
    "timestamp": "2026-04-13T02:40:00Z"
  },
  "timestamp": "2026-04-13T02:40:00Z",
  "message": "收集系统指标成功"
}
```

**错误码**:
- 401: 未授权
- 500: 服务器内部错误

### 6.2 获取指标历史

**GET** `/api/analytics/metrics/history`

获取历史系统指标数据。

**查询参数**:
- `limit`: 返回记录数量，默认20

**请求示例**:
```bash
curl -X GET "http://localhost:3000/api/analytics/metrics/history?limit=50" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "timestamp": "2026-04-13T02:35:00Z",
      "cpu": {"usage": 43.1, "temperature": 63},
      "memory": {"usage": "11.8GB", "percentage": 36.9},
      "disk": {"usage": "149GB", "percentage": 29.8}
    }
  ],
  "count": 20,
  "timestamp": "2026-04-13T02:40:00Z",
  "message": "获取指标历史成功"
}
```

**错误码**:
- 401: 未授权
- 500: 服务器内部错误

### 6.3 获取工作流统计

**GET** `/api/analytics/workflows`

获取工作流相关的统计分析数据。

**请求示例**:
```bash
curl -X GET "http://localhost:3000/api/analytics/workflows" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "totalWorkflows": 15,
    "activeWorkflows": 12,
    "draftWorkflows": 3,
    "averageSteps": 3.2,
    "mostUsedTypes": {
      "text-generation": 8,
      "api-call": 5,
      "data-processing": 2
    },
    "performance": {
      "averageExecutionTime": 45000,
      "successRate": 0.95,
      "slowestWorkflow": "数据清洗流水线"
    }
  },
  "timestamp": "2026-04-13T02:42:00Z",
  "message": "获取工作流统计成功"
}
```

**错误码**:
- 401: 未授权
- 500: 服务器内部错误

### 6.4 获取系统摘要

**GET** `/api/analytics/summary`

获取系统整体运行摘要。

**请求示例**:
```bash
curl -X GET "http://localhost:3000/api/analytics/summary" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "system": {
      "status": "HEALTHY",
      "uptime": "24h",
      "version": "1.0.0"
    },
    "workflows": {
      "total": 15,
      "executionsToday": 45,
      "successRate": 94.2,
      "averageDuration": 42.3
    },
    "engines": {
      "total": 4,
      "active": 4,
      "averageResponseTime": 850
    },
    "users": {
      "total": 8,
      "activeToday": 3
    }
  },
  "timestamp": "2026-04-13T02:45:00Z",
  "message": "获取系统摘要成功"
}
```

**错误码**:
- 401: 未授权
- 500: 服务器内部错误

### 6.5 模拟执行统计

**POST** `/api/analytics/simulate-execution`

用于测试和分析的模拟执行统计。

**请求参数**:
```json
{
  "workflowId": "string",
  "status": "running|completed|failed|pending",
  "executionTime": "number"
}
```

**请求示例**:
```bash
curl -X POST "http://localhost:3000/api/analytics/simulate-execution" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -d '{
    "workflowId": "wf_xxx",
    "status": "completed",
    "executionTime": 45000
  }'
```

**响应示例**:
```json
{
  "success": true,
  "message": "工作流执行模拟成功",
  "data": {
    "workflowId": "wf_xxx",
    "status": "completed",
    "executionTime": 45000,
    "timestamp": "2026-04-13T02:50:00Z"
  }
}
```

**错误码**:
- 400: 缺少必需字段或状态无效
- 401: 未授权
- 500: 服务器内部错误

### 6.6 获取用户工作流统计

**GET** `/api/analytics/user-stats/{userId}`

获取指定用户的工作流使用统计。

**路径参数**:
- `userId`: 用户ID

**请求示例**:
```bash
curl -X GET "http://localhost:3000/api/analytics/user-stats/usr_xxx" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "userId": "usr_xxx",
    "totalWorkflows": 5,
    "totalExecutions": 25,
    "successfulExecutions": 23,
    "failedExecutions": 2,
    "averageExecutionTime": 38000,
    "mostUsedWorkflows": [
      {
        "workflowId": "wf_xxx",
        "usageCount": 10,
        "successRate": 0.9
      }
    ],
    "lastActivityAt": "2026-04-13T02:45:00Z"
  },
  "timestamp": "2026-04-13T02:50:00Z",
  "message": "获取用户工作流统计成功"
}
```

**错误码**:
- 401: 未授权
- 404: 用户不存在
- 500: 服务器内部错误

### 6.7 获取执行趋势

**GET** `/api/analytics/trends`

获取工作流执行趋势数据。

**查询参数**:
- `days`: 统计天数，默认7

**请求示例**:
```bash
curl -X GET "http://localhost:3000/api/analytics/trends?days=30" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "date": "2026-04-12",
      "executions": 15,
      "successful": 14,
      "failed": 1,
      "successRate": 93.3
    }
  ],
  "period": "30 days",
  "count": 30,
  "timestamp": "2026-04-13T02:52:00Z",
  "message": "获取执行趋势成功"
}
```

**错误码**:
- 401: 未授权
- 500: 服务器内部错误

### 6.8 获取工作流使用统计

**GET** `/api/analytics/workflow-usage`

获取各工作流的使用频率统计。

**请求示例**:
```bash
curl -X GET "http://localhost:3000/api/analytics/workflow-usage" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "workflowId": "wf_xxx",
      "workflowName": "AI内容生成流水线",
      "usageCount": 45,
      "successRate": 0.93,
      "averageDuration": 42000,
      "lastUsedAt": "2026-04-13T02:45:00Z"
    }
  ],
  "count": 10,
  "timestamp": "2026-04-13T02:55:00Z",
  "message": "获取工作流使用统计成功"
}
```

**错误码**:
- 401: 未授权
- 500: 服务器内部错误

### 6.9 获取成功率排名

**GET** `/api/analytics/success-ranking`

获取工作流成功率排名。

**查询参数**:
- `limit`: 返回数量限制，默认10

**请求示例**:
```bash
curl -X GET "http://localhost:3000/api/analytics/success-ranking?limit=5" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "rank": 1,
      "workflowId": "wf_xxx",
      "workflowName": "数据验证流水线",
      "successRate": 0.98,
      "totalExecutions": 50,
      "successfulExecutions": 49
    }
  ],
  "limit": 5,
  "count": 5,
  "timestamp": "2026-04-13T03:00:00Z",
  "message": "获取成功率排名成功"
}
```

**错误码**:
- 401: 未授权
- 500: 服务器内部错误

---

## 7. 统计汇总 API

### 7.1 获取执行统计汇总

**GET** `/api/stats/summary`

获取系统执行统计的总体汇总信息。

**请求示例**:
```bash
curl -X GET "http://localhost:3000/api/stats/summary" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "workflows": {
      "total": 15,
      "active": 12,
      "draft": 3
    },
    "executions": {
      "total": 1250,
      "today": 45,
      "thisWeek": 320,
      "thisMonth": 1250
    },
    "success": {
      "total": 1188,
      "today": 42,
      "rate": 0.9504
    },
    "failed": {
      "total": 62,
      "today": 3,
      "rate": 0.0496
    },
    "performance": {
      "averageDurationMs": 45000,
      "p95DurationMs": 120000,
      "fastestExecution": 8000,
      "slowestExecution": 300000
    },
    "engines": {
      "total": 4,
      "active": 4,
      "averageResponseTimeMs": 850
    }
  },
  "message": "获取执行统计汇总成功"
}
```

**错误码**:
- 401: 未授权
- 500: 服务器内部错误

---

## 8. 性能对比 API

### 8.1 获取优化版用户列表

**GET** `/api/users/optimized`

获取用户列表的优化版本，包含优化查询和缓存。

**请求示例**:
```bash
curl -X GET "http://localhost:3000/api/users/optimized" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": "usr_xxx",
      "name": "张三",
      "email": "zhangsan@example.com",
      "role": "USER",
      "createdAt": "2026-04-13T01:10:00Z",
      "postCount": 5,
      "lastLoginAt": "2026-04-13T02:00:00Z"
    }
  ],
  "message": "获取用户列表成功（优化版本）"
}
```

**错误码**:
- 401: 未授权
- 500: 服务器内部错误

### 8.2 获取原始版用户列表

**GET** `/api/users/original`

获取用户列表的原始版本，用于性能对比。

**请求示例**:
```bash
curl -X GET "http://localhost:3000/api/users/original" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": "usr_xxx",
      "name": "张三",
      "email": "zhangsan@example.com",
      "role": "USER",
      "createdAt": "2026-04-13T01:10:00Z"
    }
  ],
  "message": "获取用户列表成功（原始版本）"
}
```

**错误码**:
- 401: 未授权
- 500: 服务器内部错误

### 8.3 文章搜索

**GET** `/api/posts/search`

搜索文章内容。

**查询参数**:
- `q`: 搜索关键词（必需）

**请求示例**:
```bash
curl -X GET "http://localhost:3000/api/posts/search?q=人工智能" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": "post_xxx",
      "title": "人工智能的未来发展趋势",
      "content": "人工智能技术正在快速发展...",
      "author": "张三",
      "createdAt": "2026-04-13T01:00:00Z",
      "relevanceScore": 0.95
    }
  ],
  "message": "搜索"人工智能"成功"
}
```

**错误码**:
- 400: 搜索关键词不能为空
- 401: 未授权
- 500: 服务器内部错误

---

## 错误码说明

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未授权（令牌无效） |
| 403 | 禁止访问（权限不足） |
| 404 | 资源不存在 |
| 409 | 资源冲突（如名称已存在） |
| 422 | 验证错误 |
| 429 | 请求过于频繁 |
| 500 | 服务器内部错误 |
| 503 | 服务不可用 |

---

## 认证说明

所有API请求（除健康检查外）都需要在请求头中包含有效的JWT令牌：

```
Authorization: Bearer <your-jwt-token>
```

令牌获取方式：
1. 调用登录接口获取访问令牌
2. 令牌默认24小时有效
3. 过期后需要重新登录获取新令牌

---

## 数据模型

### 用户 (User)
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  createdAt: Date;
  updatedAt: Date;
}
```

### 工作流 (Workflow)
```typescript
interface Workflow {
  id: string;
  name: string;
  description: string;
  config: WorkflowConfig;
  steps: WorkflowStep[];
  executions: Execution[];
  createdAt: Date;
  updatedAt: Date;
}
```

### 工作流配置 (WorkflowConfig)
```typescript
interface WorkflowConfig {
  steps: WorkflowStep[];
  trigger: TriggerConfig;
}
```

### 工作流步骤 (WorkflowStep)
```typescript
interface WorkflowStep {
  id: string;
  name: string;
  type: 'text-generation' | 'api-call' | 'data-processing';
  config: Record<string, unknown>;
  order: number;
  dependencies: string[];
}
```

### 执行 (Execution)
```typescript
interface Execution {
  id: string;
  workflowId: string;
  workflow: Workflow;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  inputData: Record<string, unknown>;
  steps: ExecutionStep[];
  createdAt: Date;
}
```

### 执行步骤 (ExecutionStep)
```typescript
interface ExecutionStep {
  id: string;
  name: string;
  order: number;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  step: WorkflowStep;
  execution?: ExecutionStepDetails;
}
```

### 执行步骤详情 (ExecutionStepDetails)
```typescript
interface ExecutionStepDetails {
  id: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  output?: Record<string, unknown>;
  error?: string;
  durationMs?: number;
}
```

### AI引擎 (AIEngine)
```typescript
interface AIEngine {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  status: 'HEALTHY' | 'UNHEALTHY' | 'MAINTENANCE';
  model: string;
}
```

### 系统指标 (SystemMetrics)
```typescript
interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
    temperature: number;
  };
  memory: {
    used: string;
    total: string;
    percentage: number;
  };
  disk: {
    used: string;
    total: string;
    percentage: number;
  };
  network: {
    incoming: string;
    outgoing: string;
  };
  uptime: number;
}
```

---

## 更新日志

### v1.0.0 (2026-04-13)
- 初始版本发布
- 实现完整的用户管理API
- 实现工作流管理核心功能
- 实现AI引擎调度API
- 实现执行管理API
- 实现数据分析API
- 实现性能对比API
- 支持JWT认证和权限控制
- 提供完整的健康检查和监控功能

---

## 版本历史

### v1.0.0 (2026-04-13)
- 首次发布，包含完整的API文档
- 基于实际代码实现的所有端点
- 支持工作流全生命周期管理
- 集成AI引擎调度系统
- 提供实时监控和分析功能

---

## 7. 执行历史管理 API

### 7.1 创建执行记录

**POST** `/api/executions`

创建新的工作流执行记录，用于跟踪工作流的执行状态和结果。

**请求参数**:
```json
{
  "workflowId": "wrk_123456789",
  "status": "running",
  "triggerData": {
    "source": "webhook",
    "timestamp": "2026-04-13T04:26:00Z"
  },
  "result": {},
  "errorMessage": "",
  "executionTimeMs": 0
}
```

**请求示例**:
```bash
curl -X POST "http://localhost:3000/api/executions" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "workflowId": "wrk_123456789",
    "status": "running",
    "triggerData": {
      "source": "webhook",
      "timestamp": "2026-04-13T04:26:00Z"
    }
  }'
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "exe_123456789",
    "workflowId": "wrk_123456789",
    "status": "running",
    "triggerData": {
      "source": "webhook",
      "timestamp": "2026-04-13T04:26:00Z"
    },
    "createdAt": "2026-04-13T04:26:00Z",
    "updatedAt": "2026-04-13T04:26:00Z"
  },
  "message": "执行记录创建成功"
}
```

**错误码**:
- 400: 请求参数格式错误
- 401: 未授权
- 500: 服务器内部错误

---

### 7.2 获取执行记录列表

**GET** `/api/executions`

获取执行记录列表，支持分页和筛选条件。

**查询参数**:
- `workflowId`: 工作流ID (可选)
- `status`: 执行状态 (可选，可选值: running, completed, failed, cancelled)
- `page`: 页码，默认1
- `limit`: 每页数量，默认10，最大100
- `startDate`: 开始时间 (ISO格式，可选)
- `endDate`: 结束时间 (ISO格式，可选)
- `userId`: 用户ID (可选)
- `sortBy`: 排序字段，默认created_at，可选: created_at, started_at
- `sortOrder`: 排序方式，默认desc，可选: asc, desc

**请求示例**:
```bash
curl -X GET "http://localhost:3000/api/executions?workflowId=wrk_123456789&status=running&page=1&limit=10" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": "exe_123456789",
      "workflowId": "wrk_123456789",
      "status": "running",
      "triggerData": {
        "source": "webhook",
        "timestamp": "2026-04-13T04:26:00Z"
      },
      "result": {},
      "errorMessage": "",
      "executionTimeMs": 5000,
      "createdAt": "2026-04-13T04:26:00Z",
      "updatedAt": "2026-04-13T04:26:00Z"
    }
  ],
  "message": "获取执行记录列表成功"
}
```

**错误码**:
- 400: 查询参数格式错误
- 401: 未授权
- 500: 服务器内部错误

---

### 7.3 获取单个执行记录

**GET** `/api/executions/:id`

根据执行记录ID获取详细信息。

**请求示例**:
```bash
curl -X GET "http://localhost:3000/api/executions/exe_123456789" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "exe_123456789",
    "workflowId": "wrk_123456789",
    "status": "completed",
    "triggerData": {
      "source": "webhook",
      "timestamp": "2026-04-13T04:26:00Z"
    },
    "result": {
      "output": "任务完成",
      "processedItems": 100
    },
    "errorMessage": "",
    "executionTimeMs": 8500,
    "createdAt": "2026-04-13T04:26:00Z",
    "updatedAt": "2026-04-13T04:26:00Z"
  },
  "message": "获取执行记录详情成功"
}
```

**错误码**:
- 404: 执行记录不存在
- 401: 未授权
- 500: 服务器内部错误

---

### 7.4 更新执行记录

**PUT** `/api/executions/:id`

更新执行记录的状态和相关信息。

**请求参数**:
```json
{
  "status": "completed",
  "result": {
    "output": "任务完成",
    "processedItems": 100
  },
  "errorMessage": "",
  "executionTimeMs": 8500
}
```

**请求示例**:
```bash
curl -X PUT "http://localhost:3000/api/executions/exe_123456789" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed",
    "result": {
      "output": "任务完成",
      "processedItems": 100
    },
    "executionTimeMs": 8500
  }'
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "exe_123456789",
    "workflowId": "wrk_123456789",
    "status": "completed",
    "triggerData": {},
    "result": {
      "output": "任务完成",
      "processedItems": 100
    },
    "errorMessage": "",
    "executionTimeMs": 8500,
    "createdAt": "2026-04-13T04:26:00Z",
    "updatedAt": "2026-04-13T04:30:00Z"
  },
  "message": "执行记录更新成功"
}
```

**错误码**:
- 400: 请求参数格式错误
- 404: 执行记录不存在
- 401: 未授权
- 500: 服务器内部错误

---

### 7.5 删除执行记录

**DELETE** `/api/executions/:id`

删除指定的执行记录。

**请求示例**:
```bash
curl -X DELETE "http://localhost:3000/api/executions/exe_123456789" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**响应示例**:
```json
{
  "success": true,
  "data": null,
  "message": "执行记录删除成功"
}
```

**错误码**:
- 404: 执行记录不存在
- 401: 未授权
- 500: 服务器内部错误

---

### 7.6 获取执行统计信息

**GET** `/api/executions/stats`

获取工作流执行的统计信息，包括总数、成功率、平均执行时间等。

**请求示例**:
```bash
curl -X GET "http://localhost:3000/api/executions/stats" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "totalExecutions": 1250,
    "completedExecutions": 1100,
    "failedExecutions": 100,
    "runningExecutions": 50,
    "averageExecutionTime": 8500,
    "successRate": 88.0,
    "totalExecutionTime": 9625000,
    "executionsByDay": [
      {
        "date": "2026-04-13",
        "count": 50,
        "success": 45
      }
    ]
  },
  "message": "获取执行统计信息成功"
}
```

**错误码**:
- 401: 未授权
- 500: 服务器内部错误

---

### 7.7 创建执行步骤记录

**POST** `/api/executions/:id/steps`

为指定执行记录创建步骤执行记录。

**请求参数**:
```json
{
  "stepId": "step_123456789",
  "status": "running",
  "inputData": {
    "param1": "value1",
    "param2": "value2"
  },
  "outputData": {},
  "errorMessage": "",
  "durationMs": 1000
}
```

**请求示例**:
```bash
curl -X POST "http://localhost:3000/api/executions/exe_123456789/steps" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "stepId": "step_123456789",
    "status": "completed",
    "inputData": {
      "param1": "value1"
    },
    "outputData": {
      "result": "处理完成"
    },
    "durationMs": 1200
  }'
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "step_exe_123456789",
    "executionId": "exe_123456789",
    "stepId": "step_123456789",
    "status": "completed",
    "inputData": {
      "param1": "value1"
    },
    "outputData": {
      "result": "处理完成"
    },
    "errorMessage": "",
    "durationMs": 1200,
    "createdAt": "2026-04-13T04:26:00Z",
    "updatedAt": "2026-04-13T04:26:00Z"
  },
  "message": "执行步骤创建成功"
}
```

**错误码**:
- 400: 请求参数格式错误
- 404: 执行记录不存在
- 401: 未授权
- 500: 服务器内部错误

---

## 8. 告警管理 API

### 8.1 获取告警列表

**GET** `/api/alerts`

获取系统告警列表，支持按状态筛选。

**查询参数**:
- `status`: 告警状态 (可选，可选值: active, resolved, all)

**请求示例**:
```bash
curl -X GET "http://localhost:3000/api/alerts?status=active" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": "alert_123456789",
      "name": "CPU使用率过高",
      "description": "系统CPU使用率超过90%",
      "status": "active",
      "severity": "warning",
      "metric": "cpu",
      "threshold": 90,
      "condition": "greater_than",
      "value": 95.5,
      "createdAt": "2026-04-13T04:26:00Z",
      "updatedAt": "2026-04-13T04:26:00Z"
    }
  ],
  "count": 1,
  "timestamp": "2026-04-13T04:26:00Z"
}
```

**错误码**:
- 500: 服务器内部错误

---

### 8.2 获取告警摘要

**GET** `/api/alerts/summary`

获取告警的统计摘要信息。

**请求示例**:
```bash
curl -X GET "http://localhost:3000/api/alerts/summary" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "totalAlerts": 25,
    "activeAlerts": 8,
    "resolvedAlerts": 17,
    "criticalAlerts": 2,
    "warningAlerts": 5,
    "infoAlerts": 1,
    "alertsBySeverity": {
      "critical": 2,
      "warning": 5,
      "info": 1
    }
  },
  "timestamp": "2026-04-13T04:26:00Z"
}
```

**错误码**:
- 500: 服务器内部错误

---

### 8.3 解决告警

**POST** `/api/alerts/:id/resolve`

将指定的告警标记为已解决状态。

**请求示例**:
```bash
curl -X POST "http://localhost:3000/api/alerts/alert_123456789/resolve" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**响应示例**:
```json
{
  "success": true,
  "message": "Alert alert_123456789 resolved successfully",
  "timestamp": "2026-04-13T04:26:00Z"
}
```

**错误码**:
- 404: 告警不存在或已解决
- 500: 服务器内部错误

---

### 8.4 解决所有告警

**POST** `/api/alerts/resolve-all`

将所有活动告警批量标记为已解决。

**请求示例**:
```bash
curl -X POST "http://localhost:3000/api/alerts/resolve-all" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**响应示例**:
```json
{
  "success": true,
  "message": "8 alerts resolved successfully",
  "resolvedCount": 8,
  "timestamp": "2026-04-13T04:26:00Z"
}
```

**错误码**:
- 500: 服务器内部错误

---

### 8.5 获取告警规则列表

**GET** `/api/alerts/rules`

获取所有告警规则配置。

**请求示例**:
```bash
curl -X GET "http://localhost:3000/api/alerts/rules" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": "rule_123456789",
      "name": "CPU使用率监控",
      "description": "监控CPU使用率是否超过阈值",
      "metric": "cpu",
      "threshold": 80,
      "condition": "greater_than",
      "severity": "warning",
      "enabled": true,
      "createdAt": "2026-04-13T04:26:00Z",
      "updatedAt": "2026-04-13T04:26:00Z"
    }
  ],
  "count": 1,
  "timestamp": "2026-04-13T04:26:00Z"
}
```

**错误码**:
- 500: 服务器内部错误

---

### 8.6 创建告警规则

**POST** `/api/alerts/rules`

创建新的告警规则。

**请求参数**:
```json
{
  "name": "内存使用率监控",
  "description": "监控内存使用率是否超过阈值",
  "metric": "memory",
  "threshold": 85,
  "condition": "greater_than",
  "severity": "critical",
  "enabled": true
}
```

**请求示例**:
```bash
curl -X POST "http://localhost:3000/api/alerts/rules" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "内存使用率监控",
    "description": "监控内存使用率是否超过阈值",
    "metric": "memory",
    "threshold": 85,
    "condition": "greater_than",
    "severity": "critical",
    "enabled": true
  }'
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "rule_987654321",
    "name": "内存使用率监控",
    "description": "监控内存使用率是否超过阈值",
    "metric": "memory",
    "threshold": 85,
    "condition": "greater_than",
    "severity": "critical",
    "enabled": true,
    "createdAt": "2026-04-13T04:26:00Z",
    "updatedAt": "2026-04-13T04:26:00Z"
  },
  "message": "Alert rule created successfully",
  "timestamp": "2026-04-13T04:26:00Z"
}
```

**错误码**:
- 400: 缺少必填字段或参数格式错误
- 500: 服务器内部错误

**有效字段说明**:
- `metric`: 监控指标，可选值: cpu, memory, responseTime, activeWorkflows, activeConnections
- `condition`: 比较条件，可选值: greater_than, less_than
- `severity`: 告警级别，可选值: info, warning, error, critical

---

### 8.7 更新告警规则

**PUT** `/api/alerts/rules/:id`

更新指定的告警规则。

**请求示例**:
```bash
curl -X PUT "http://localhost:3000/api/alerts/rules/rule_123456789" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "threshold": 75,
    "severity": "warning",
    "enabled": false
  }'
```

**响应示例**:
```json
{
  "success": true,
  "message": "Alert rule rule_123456789 updated successfully",
  "timestamp": "2026-04-13T04:26:00Z"
}
```

**错误码**:
- 404: 告警规则不存在
- 500: 服务器内部错误

---

### 8.8 删除告警规则

**DELETE** `/api/alerts/rules/:id`

删除指定的告警规则。

**请求示例**:
```bash
curl -X DELETE "http://localhost:3000/api/alerts/rules/rule_123456789" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**响应示例**:
```json
{
  "success": true,
  "message": "Alert rule rule_123456789 deleted successfully",
  "timestamp": "2026-04-13T04:26:00Z"
}
```

**错误码**:
- 404: 告警规则不存在
- 500: 服务器内部错误

---

### 8.9 清除告警历史

**DELETE** `/api/alerts/history`

清除告警历史记录，可选择保留最近的记录。

**查询参数**:
- `keepRecent`: 保留最近的N条记录 (可选)

**请求示例**:
```bash
curl -X DELETE "http://localhost:3000/api/alerts/history?keepRecent=100" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**响应示例**:
```json
{
  "success": true,
  "message": "Alert history cleared successfully",
  "timestamp": "2026-04-13T04:26:00Z"
}
```

**错误码**:
- 500: 服务器内部错误

---

### 8.10 获取系统健康状态

**GET** `/api/alerts/health`

获取系统整体健康状态评估。

**请求示例**:
```bash
curl -X GET "http://localhost:3000/api/alerts/health" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "health": "excellent",
    "timestamp": "2026-04-13T04:26:00Z",
    "status": "system is running excellently"
  }
}
```

**健康状态说明**:
- `excellent`: 系统运行优秀
- `good`: 系统运行正常
- `warning`: 系统有一些问题，建议监控
- `critical`: 系统有严重问题，需要立即关注

**错误码**:
- 500: 服务器内部错误

---

### 8.11 执行系统监控

**POST** `/api/alerts/monitor`

手动触发系统监控，模拟系统指标采集。

**请求示例**:
```bash
curl -X POST "http://localhost:3000/api/alerts/monitor" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**响应示例**:
```json
{
  "success": true,
  "message": "System monitoring completed",
  "data": {
    "monitoredMetrics": {
      "cpu": 75.2,
      "memory": 62.8,
      "responseTime": 342,
      "activeWorkflows": 12,
      "activeConnections": 89
    },
    "timestamp": "2026-04-13T04:26:00Z"
  }
}
```

**错误码**:
- 500: 服务器内部错误

---

## 9. 分析统计 API

### 9.1 收集系统指标

**GET** `/api/analytics/metrics`

实时收集系统运行指标数据。

**请求示例**:
```bash
curl -X GET "http://localhost:3000/api/analytics/metrics" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "cpu": {
      "usage": 75.2,
      "cores": 8,
      "temperature": 65.5
    },
    "memory": {
      "used": "12.5GB",
      "total": "32GB",
      "percentage": 39.1
    },
    "disk": {
      "used": "450GB",
      "total": "1TB",
      "percentage": 45.0
    },
    "network": {
      "incoming": "1.2MB/s",
      "outgoing": "0.8MB/s"
    },
    "uptime": 86400
  },
  "timestamp": "2026-04-13T04:26:00Z"
}
```

**错误码**:
- 500: 服务器内部错误

---

### 9.2 获取指标历史

**GET** `/api/analytics/metrics/history`

获取系统指标的历史记录。

**查询参数**:
- `limit`: 返回记录数量，默认20

**请求示例**:
```bash
curl -X GET "http://localhost:3000/api/analytics/metrics/history?limit=50" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "timestamp": "2026-04-13T04:20:00Z",
      "cpu": {
        "usage": 72.3,
        "cores": 8,
        "temperature": 64.2
      },
      "memory": {
        "used": "12.3GB",
        "total": "32GB",
        "percentage": 38.4
      }
    }
  ],
  "count": 50,
  "timestamp": "2026-04-13T04:26:00Z"
}
```

**错误码**:
- 500: 服务器内部错误

---

### 9.3 获取工作流统计

**GET** `/api/analytics/workflows`

获取工作流相关的统计信息。

**请求示例**:
```bash
curl -X GET "http://localhost:3000/api/analytics/workflows" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "totalWorkflows": 150,
    "activeWorkflows": 25,
    "completedWorkflows": 110,
    "failedWorkflows": 15,
    "averageExecutionTime": 8500,
    "successRate": 88.0,
    "workflowsByStatus": {
      "ACTIVE": 25,
      "COMPLETED": 110,
      "FAILED": 15
    },
    "executionsByDay": [
      {
        "date": "2026-04-13",
        "executions": 50,
        "completed": 44,
        "failed": 6
      }
    ]
  },
  "timestamp": "2026-04-13T04:26:00Z"
}
```

**错误码**:
- 500: 服务器内部错误

---

### 9.4 获取系统摘要

**GET** `/api/analytics/summary`

获取系统运行的整体摘要信息。

**请求示例**:
```bash
curl -X GET "http://localhost:3000/api/analytics/summary" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "systemInfo": {
      "version": "1.0.0",
      "uptime": 86400,
      "lastRestart": "2026-04-13T00:00:00Z"
    },
    "performance": {
      "avgResponseTime": 342,
      "cpuUsage": 75.2,
      "memoryUsage": 39.1,
      "diskUsage": 45.0
    },
    "workflows": {
      "total": 150,
      "active": 25,
      "successRate": 88.0
    },
    "alerts": {
      "total": 25,
      "active": 8,
      "critical": 2
    },
    "engines": {
      "total": 5,
      "healthy": 4,
      "unhealthy": 1
    }
  },
  "timestamp": "2026-04-13T04:26:00Z"
}
```

**错误码**:
- 500: 服务器内部错误

---

### 9.5 模拟工作流执行

**POST** `/api/analytics/simulate-execution`

模拟工作流执行，用于测试和分析目的。

**请求参数**:
```json
{
  "workflowId": "wrk_123456789",
  "status": "completed",
  "executionTime": 8500
}
```

**请求示例**:
```bash
curl -X POST "http://localhost:3000/api/analytics/simulate-execution" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "workflowId": "wrk_123456789",
    "status": "completed",
    "executionTime": 8500
  }'
```

**响应示例**:
```json
{
  "success": true,
  "message": "Workflow execution simulated successfully",
  "data": {
    "workflowId": "wrk_123456789",
    "status": "completed",
    "executionTime": 8500,
    "timestamp": "2026-04-13T04:26:00Z"
  }
}
```

**错误码**:
- 400: 缺少必填字段或参数格式错误
- 500: 服务器内部错误

**有效状态值**:
- running: 正在运行
- completed: 已完成
- failed: 失败
- pending: 等待中

---

## 联系方式

如有问题或建议，请联系开发团队：
- 邮箱: support@ai-workspace-orchestrator.com
- 文档: https://docs.ai-workspace-orchestrator.com
- 社区: https://community.ai-workspace-orchestrator.com
- GitHub: https://github.com/ai-ideas-lab/ai-workspace-orchestrator