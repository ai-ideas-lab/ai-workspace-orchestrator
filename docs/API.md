# AI Workspace Orchestrator API 文档

## 概述

AI Workspace Orchestrator 是一个企业级AI工作流自动化平台，通过自然语言界面智能调度多个AI引擎。本文档提供了完整的API接口说明，包括工作流管理、用户认证、AI调度、实时监控等核心功能。

## API 基础信息

- **基础URL**: `/api`
- **内容类型**: `application/json`
- **认证方式**: JWT Bearer Token
- **响应格式**: JSON

---

## 1. 用户认证 API

### 1.1 用户注册

**POST** `/api/auth/register`

创建新用户账户。

**请求参数**:
```json
{
  "username": "string",
  "password": "string",
  "role": "admin|editor|viewer"
}
```

**请求示例**:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "zhangsan",
    "password": "password123",
    "role": "editor"
  }'
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "usr_xxx",
    "username": "zhangsan",
    "role": "editor",
    "active": true,
    "createdAt": "2026-04-13T01:10:00Z"
  },
  "message": "用户注册成功"
}
```

**错误码**:
- 400: 用户名或密码格式错误
- 409: 用户名已存在

### 1.2 用户登录

**POST** `/api/auth/login`

用户登录验证，返回JWT访问令牌。

**请求参数**:
```json
{
  "username": "string",
  "password": "string"
}
```

**请求示例**:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "zhangsan",
    "password": "password123"
  }'
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "usr_xxx",
      "username": "zhangsan",
      "role": "editor",
      "active": true
    }
  },
  "message": "登录成功"
}
```

**错误码**:
- 401: 用户名或密码错误
- 403: 账号已被禁用

### 1.3 令牌验证

**POST** `/api/auth/verify`

验证JWT令牌有效性。

**请求参数**:
```json
{
  "token": "string"
}
```

**请求示例**:
```bash
curl -X POST http://localhost:3000/api/auth/verify \
  -H "Content-Type: application/json" \
  -d '{
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }'
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "sub": "usr_xxx",
    "username": "zhangsan",
    "role": "editor",
    "iat": 1713010200,
    "exp": 1713096600
  },
  "message": "令牌验证成功"
}
```

---

## 2. 工作流管理 API

### 2.1 获取工作流列表

**GET** `/api/workflows`

获取工作流列表，支持分页和过滤。

**查询参数**:
- `page`: 页码，默认1
- `limit`: 每页数量，默认10
- `status`: 状态过滤（DRAFT|ACTIVE|PAUSED|COMPLETED）
- `userId`: 用户ID过滤
- `search`: 搜索关键词

**请求示例**:
```bash
curl -X GET "http://localhost:3000/api/workflows?page=1&limit=10&status=ACTIVE" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": "wf_xxx",
      "name": "内容生成流水线",
      "description": "自动生成博客文章内容",
      "status": "ACTIVE",
      "createdAt": "2026-04-13T01:10:00Z",
      "updatedAt": "2026-04-13T01:15:00Z",
      "stepCount": 3,
      "lastExecutedAt": "2026-04-13T01:10:00Z"
    }
  ],
  "message": "获取工作流列表成功",
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

### 2.2 创建工作流

**POST** `/api/workflows`

创建新的工作流。

**请求参数**:
```json
{
  "name": "string",
  "description": "string",
  "config": {
    "steps": [
      {
        "id": "string",
        "name": "string",
        "taskType": "text-generation|api-call|data-processing",
        "payload": {},
        "dependsOn": []
      }
    ],
    "variables": {}
  },
  "variables": {},
  "userId": "string"
}
```

**请求示例**:
```bash
curl -X POST http://localhost:3000/api/workflows \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -d '{
    "name": "AI内容生成流水线",
    "description": "自动生成SEO优化的博客文章",
    "config": {
      "steps": [
        {
          "id": "research",
          "name": "市场调研",
          "taskType": "text-generation",
          "payload": {
            "prompt": "分析 {{topic}} 市场现状和趋势",
            "temperature": 0.7
          },
          "dependsOn": []
        },
        {
          "id": "outline",
          "name": "文章大纲",
          "taskType": "text-generation",
          "payload": {
            "prompt": "基于调研结果，为 {{topic}} 创建详细大纲",
            "temperature": 0.5
          },
          "dependsOn": ["research"]
        }
      ],
      "variables": {
        "topic": {
          "description": "文章主题",
          "required": true
        }
      }
    },
    "variables": {
      "topic": "人工智能"
    }
  }'
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "wf_xxx",
    "name": "AI内容生成流水线",
    "description": "自动生成SEO优化的博客文章",
    "status": "DRAFT",
    "config": {...},
    "variables": {...},
    "userId": "usr_xxx",
    "createdAt": "2026-04-13T01:20:00Z",
    "updatedAt": "2026-04-13T01:20:00Z"
  },
  "message": "工作流创建成功"
}
```

**错误码**:
- 400: 工作流名称和配置不能为空
- 409: 工作流名称已存在

### 2.3 获取工作流详情

**GET** `/api/workflows/{id}`

获取单个工作流的详细信息。

**路径参数**:
- `id`: 工作流ID

**请求示例**:
```bash
curl -X GET "http://localhost:3000/api/workflows/wf_xxx" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "wf_xxx",
    "name": "AI内容生成流水线",
    "description": "自动生成SEO优化的博客文章",
    "status": "ACTIVE",
    "config": {
      "steps": [
        {
          "id": "research",
          "name": "市场调研",
          "taskType": "text-generation",
          "payload": {...},
          "dependsOn": []
        }
      ],
      "variables": {
        "topic": {
          "description": "文章主题",
          "required": true
        }
      }
    },
    "variables": {
      "topic": "人工智能"
    },
    "userId": "usr_xxx",
    "createdAt": "2026-04-13T01:20:00Z",
    "updatedAt": "2026-04-13T01:25:00Z",
    "executionCount": 15,
    "lastExecutedAt": "2026-04-13T01:20:00Z"
  },
  "message": "获取工作流详情成功"
}
```

### 2.4 更新工作流

**PUT** `/api/workflows/{id}`

更新现有工作流的配置或状态。

**路径参数**:
- `id`: 工作流ID

**请求参数**:
```json
{
  "name": "string",
  "description": "string",
  "config": {},
  "variables": {},
  "status": "DRAFT|ACTIVE|PAUSED|COMPLETED"
}
```

**请求示例**:
```bash
curl -X PUT "http://localhost:3000/api/workflows/wf_xxx" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -d '{
    "name": "更新的AI内容生成流水线",
    "description": "生成更高质量的博客文章",
    "status": "ACTIVE"
  }'
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "wf_xxx",
    "name": "更新的AI内容生成流水线",
    "description": "生成更高质量的博客文章",
    "status": "ACTIVE",
    "updatedAt": "2026-04-13T01:30:00Z"
  },
  "message": "工作流更新成功"
}
```

### 2.5 删除工作流

**DELETE** `/api/workflows/{id}`

删除指定工作流。

**路径参数**:
- `id`: 工作流ID

**请求示例**:
```bash
curl -X DELETE "http://localhost:3000/api/workflows/wf_xxx" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**响应示例**:
```json
{
  "success": true,
  "data": null,
  "message": "工作流删除成功"
}
```

### 2.6 克隆工作流

**POST** `/api/workflows/{id}/clone`

克隆现有工作流，创建副本。

**路径参数**:
- `id`: 原始工作流ID

**请求参数**:
```json
{
  "name": "string"
}
```

**请求示例**:
```bash
curl -X POST "http://localhost:3000/api/workflows/wf_xxx/clone" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -d '{
    "name": "AI内容生成流水线 (副本)"
  }'
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "wf_yyy",
    "name": "AI内容生成流水线 (副本)",
    "description": "自动生成SEO优化的博客文章",
    "status": "DRAFT",
    "sourceWorkflowId": "wf_xxx",
    "sourceWorkflowName": "AI内容生成流水线",
    "createdAt": "2026-04-13T01:35:00Z"
  },
  "message": "工作流克隆成功"
}
```

### 2.7 执行工作流

**POST** `/api/workflows/{id}/execute`

启动工作流执行。

**路径参数**:
- `id`: 工作流ID

**请求参数**:
```json
{
  "inputVariables": {},
  "priority": "low|medium|high"
}
```

**请求示例**:
```bash
curl -X POST "http://localhost:3000/api/workflows/wf_xxx/execute" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -d '{
    "inputVariables": {
      "topic": "机器学习",
      "length": "2000"
    },
    "priority": "high"
  }'
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "ex_xxx",
    "workflowId": "wf_xxx",
    "status": "RUNNING",
    "inputVariables": {
      "topic": "机器学习",
      "length": "2000"
    },
    "priority": "high",
    "startedAt": "2026-04-13T01:40:00Z",
    "estimatedDuration": 300000
  },
  "message": "工作流执行启动成功"
}
```

**错误码**:
- 400: 工作流ID不能为空
- 404: 工作流不存在
- 429: 工作流正在执行中，请稍后重试

### 2.8 获取执行历史

**GET** `/api/workflows/{id}/executions`

获取工作流的执行历史记录。

**路径参数**:
- `id`: 工作流ID

**查询参数**:
- `page`: 页码，默认1
- `limit`: 每页数量，默认10
- `status`: 状态过滤
- `startDate`: 开始日期（ISO格式）
- `endDate`: 结束日期（ISO格式）

**请求示例**:
```bash
curl -X GET "http://localhost:3000/api/workflows/wf_xxx/executions?page=1&limit=5&status=SUCCESS&startDate=2026-04-13T00:00:00Z" \
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
      "status": "SUCCESS",
      "inputVariables": {
        "topic": "人工智能"
      },
      "output": {
        "article": "生成的文章内容...",
        "wordCount": 2500
      },
      "durationMs": 45000,
      "startedAt": "2026-04-13T01:40:00Z",
      "completedAt": "2026-04-13T01:45:00Z"
    }
  ],
  "message": "获取执行历史成功",
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 15,
    "totalPages": 3
  }
}
```

### 2.9 验证工作流配置

**POST** `/api/workflows/validate`

验证工作流配置的有效性。

**请求参数**:
```json
{
  "config": {
    "steps": [...],
    "variables": {}
  }
}
```

**请求示例**:
```bash
curl -X POST http://localhost:3000/api/workflows/validate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -d '{
    "config": {
      "steps": [
        {
          "id": "step1",
          "name": "第一步",
          "taskType": "text-generation",
          "payload": {"prompt": "Hello world"},
          "dependsOn": []
        }
      ],
      "variables": {}
    }
  }'
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "valid": true,
    "errors": [],
    "warnings": []
  },
  "message": "工作流配置验证成功"
}
```

**错误响应**:
```json
{
  "success": false,
  "data": {
    "valid": false,
    "errors": [
      "步骤 'step1' 的依赖 'missing-step' 不存在"
    ],
    "warnings": [
      "工作流没有输出变量定义"
    ]
  },
  "message": "工作流配置验证失败"
}
```

### 2.10 获取执行路径

**POST** `/api/workflows/execution-path`

分析工作流的执行路径和依赖关系。

**请求参数**:
```json
{
  "config": {
    "steps": [...],
    "variables": {}
  }
}
```

**请求示例**:
```bash
curl -X POST http://localhost:3000/api/workflows/execution-path \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -d '{
    "config": {
      "steps": [
        {
          "id": "research",
          "name": "市场调研",
          "taskType": "text-generation",
          "payload": {},
          "dependsOn": []
        },
        {
          "id": "outline",
          "name": "文章大纲",
          "taskType": "text-generation",
          "payload": {},
          "dependsOn": ["research"]
        }
      ]
    }
  }'
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "executionOrder": ["research", "outline"],
    "parallelGroups": [["research"], ["outline"]],
    "dependencies": {
      "research": [],
      "outline": ["research"]
    },
    "criticalPath": ["research", "outline"],
    "totalDuration": 120000
  },
  "message": "获取执行路径成功"
}
```

---

## 3. 工作流模板 API

### 3.1 创建模板

**POST** `/api/templates`

创建可重用的工作流模板。

**请求参数**:
```json
{
  "name": "string",
  "description": "string",
  "steps": [
    {
      "id": "string",
      "name": "string",
      "taskType": "string",
      "payload": {},
      "dependsOn": []
    }
  ],
  "variables": {
    "variableName": {
      "description": "string",
      "required": boolean,
      "default": "string"
    }
  },
  "tags": ["string"]
}
```

**请求示例**:
```bash
curl -X POST http://localhost:3000/api/templates \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -d '{
    "name": "内容生成模板",
    "description": "用于生成各种类型内容的通用模板",
    "steps": [
      {
        "id": "research",
        "name": "背景调研",
        "taskType": "text-generation",
        "payload": {
          "prompt": "调研 {{topic}} 的相关背景信息"
        },
        "dependsOn": []
      },
      {
        "id": "create",
        "name": "内容创作",
        "taskType": "text-generation",
        "payload": {
          "prompt": "基于调研结果，创作 {{topic}} 相关的 {{contentType}} 内容"
        },
        "dependsOn": ["research"]
      }
    ],
    "variables": {
      "topic": {
        "description": "主题",
        "required": true
      },
      "contentType": {
        "description": "内容类型",
        "required": false,
        "default": "文章"
      }
    },
    "tags": ["内容", "模板", "AI"]
  }'
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "tpl_xxx",
    "name": "内容生成模板",
    "description": "用于生成各种类型内容的通用模板",
    "version": 1,
    "steps": [...],
    "variables": {
      "topic": {
        "description": "主题",
        "required": true
      },
      "contentType": {
        "description": "内容类型",
        "required": false,
        "default": "文章"
      }
    },
    "tags": ["内容", "模板", "AI"],
    "usageCount": 0,
    "createdAt": "2026-04-13T02:00:00Z",
    "updatedAt": "2026-04-13T02:00:00Z"
  },
  "message": "模板创建成功"
}
```

### 3.2 列出模板

**GET** `/api/templates`

获取所有可用的模板。

**查询参数**:
- `tag`: 标签过滤

**请求示例**:
```bash
curl -X GET "http://localhost:3000/api/templates?tag=内容" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": "tpl_xxx",
      "name": "内容生成模板",
      "description": "用于生成各种类型内容的通用模板",
      "version": 1,
      "usageCount": 0,
      "tags": ["内容", "模板", "AI"],
      "createdAt": "2026-04-13T02:00:00Z"
    }
  ],
  "message": "获取模板列表成功"
}
```

### 3.3 从模板实例化工作流

**POST** `/api/templates/{id}/instantiate`

从模板创建可执行的工作流实例。

**路径参数**:
- `id`: 模板ID

**请求参数**:
```json
{
  "variables": {
    "variableName": "value"
  },
  "workflowId": "string",
  "workflowName": "string"
}
```

**请求示例**:
```bash
curl -X POST "http://localhost:3000/api/templates/tpl_xxx/instantiate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -d '{
    "variables": {
      "topic": "人工智能",
      "contentType": "博客文章"
    },
    "workflowName": "AI博客生成2026"
  }'
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "wf_yyy",
    "name": "AI博客生成2026",
    "steps": [
      {
        "id": "research_164988...",
        "name": "背景调研",
        "taskType": "text-generation",
        "payload": {
          "prompt": "调研 人工智能 的相关背景信息"
        },
        "dependsOn": []
      }
    ]
  },
  "message": "模板实例化成功"
}
```

---

## 4. 工作流导入导出 API

### 4.1 导出工作流

**GET** `/api/workflows/{id}/export`

将工作流导出为JSON文件。

**路径参数**:
- `id`: 工作流ID

**请求示例**:
```bash
curl -X GET "http://localhost:3000/api/workflows/wf_xxx/export" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**响应类型**: application/json (文件下载)

**响应内容**:
```json
{
  "workflow": {
    "id": "wf_xxx",
    "name": "AI内容生成流水线",
    "description": "自动生成SEO优化的博客文章",
    "config": {...},
    "variables": {...},
    "status": "ACTIVE",
    "createdAt": "2026-04-13T01:20:00Z"
  },
  "exportedAt": "2026-04-13T02:30:00Z",
  "exporter": "API"
}
```

### 4.2 导入工作流

**POST** `/api/workflows/import`

从JSON文件导入工作流。

**请求参数**:
```json
{
  "workflow": {
    "id": "string",
    "name": "string",
    "description": "string",
    "config": {},
    "variables": {},
    "status": "string"
  },
  "options": {
    "name": "string",
    "draft": true,
    "overwrite": false
  }
}
```

**请求示例**:
```bash
curl -X POST http://localhost:3000/api/workflows/import \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -d '{
    "workflow": {
      "id": "wf_imported",
      "name": "导入的内容生成流水线",
      "description": "从外部导入的AI内容生成工作流",
      "config": {
        "steps": [...],
        "variables": {...}
      },
      "variables": {...},
      "status": "DRAFT"
    },
    "options": {
      "draft": true,
      "overwrite": false
    }
  }'
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "wf_zzz",
    "name": "导入的内容生成流水线",
    "description": "从外部导入的AI内容生成工作流",
    "status": "DRAFT",
    "sourceWorkflowId": "wf_imported",
    "importedAt": "2026-04-13T02:35:00Z"
  },
  "message": "工作流导入成功"
}
```

---

## 5. 监控和仪表板 API

### 5.1 获取仪表板摘要

**GET** `/api/dashboard/summary`

获取系统运行状态的总体摘要。

**请求示例**:
```bash
curl -X GET "http://localhost:3000/api/dashboard/summary" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "generatedAt": "2026-04-13T02:40:00Z",
    "health": {
      "status": "HEALTHY",
      "successRate": 0.95,
      "avgResponseTimeMs": 1200,
      "totalRequests": 15420,
      "activeEngines": 4,
      "uptimeMs": 86400000
    },
    "engines": [
      {
        "engineId": "text-generation",
        "status": "HEALTHY",
        "successRate": 0.98,
        "avgResponseTimeMs": 800,
        "totalRequests": 8200,
        "lastActivityAt": "2026-04-13T02:39:00Z"
      }
    ],
    "queue": {
      "totalEnqueued": 15420,
      "totalDequeued": 15350,
      "totalFailed": 70,
      "avgWaitTimeMs": 150,
      "maxWaitTimeMs": 2500
    },
    "activeAlerts": [
      {
        "id": "alert_1",
        "severity": "warning",
        "type": "high_response_time",
        "title": "响应时间偏高",
        "message": "当前平均响应时间 1200ms，接近阈值 3000ms",
        "currentValue": 1200,
        "threshold": 3000,
        "triggeredAt": "2026-04-13T02:35:00Z"
      }
    ],
    "alertCount": 1
  },
  "message": "获取仪表板摘要成功"
}
```

### 5.2 获取告警信息

**GET** `/api/dashboard/alerts`

获取系统告警列表。

**查询参数**:
- `severity`: 告警级别过滤（info|warning|critical）
- `limit`: 返回数量限制，默认50

**请求示例**:
```bash
curl -X GET "http://localhost:3000/api/dashboard/alerts?severity=critical&limit=10" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": "alert_1",
      "severity": "critical",
      "type": "engine_down",
      "title": "引擎 text-generation 无响应",
      "message": "引擎 text-generation 已超过 300s 无活动",
      "engineId": "text-generation",
      "currentValue": 450,
      "threshold": 300,
      "triggeredAt": "2026-04-13T02:40:00Z"
    }
  ],
  "message": "获取告警信息成功"
}
```

### 5.3 获取执行统计

**GET** `/api/dashboard/stats/execution`

获取工作流执行统计信息。

**查询参数**:
- `period`: 统计周期（hour|day|week|month），默认day

**请求示例**:
```bash
curl -X GET "http://localhost:3000/api/dashboard/stats/execution?period=day" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "period": "day",
    "total": 156,
    "success": 148,
    "failed": 8,
    "successRate": 0.9487,
    "avgDurationMs": 45000,
    "p95DurationMs": 62000,
    "byHour": [
      {
        "hour": "14:00",
        "executions": 12,
        "success": 11,
        "failed": 1,
        "avgDurationMs": 42000
      }
    ]
  },
  "message": "获取执行统计成功"
}
```

---

## 6. 系统健康检查 API

### 6.1 健康检查

**GET** `/api/health`

系统健康状态检查。

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
    "timestamp": "2026-04-13T02:45:00Z",
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
1. 调用 `/api/auth/login` 获取访问令牌
2. 令牌默认24小时有效
3. 过期后需要重新登录获取新令牌

---

## 数据模型

### 工作流 (Workflow)
```typescript
interface Workflow {
  id: string;
  name: string;
  description: string;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  config: WorkflowConfig;
  variables: Record<string, Variable>;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### 工作流配置 (WorkflowConfig)
```typescript
interface WorkflowConfig {
  steps: WorkflowStep[];
  variables: Record<string, Variable>;
}
```

### 工作流步骤 (WorkflowStep)
```typescript
interface WorkflowStep {
  id: string;
  name: string;
  taskType: 'text-generation' | 'api-call' | 'data-processing';
  payload: Record<string, unknown>;
  dependsOn: string[];
}
```

### 执行记录 (Execution)
```typescript
interface Execution {
  id: string;
  workflowId: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  inputVariables: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  durationMs?: number;
  startedAt: Date;
  completedAt?: Date;
}
```

### 变量 (Variable)
```typescript
interface Variable {
  description: string;
  required?: boolean;
  default?: string;
}
```

---

## 更新日志

### v1.0.0 (2026-04-13)
- 初始版本发布
- 实现核心工作流管理功能
- 支持用户认证和权限管理
- 提供完整的监控和告警功能
- 支持工作流模板和导入导出

---

## 联系方式

如有问题或建议，请联系开发团队：
- 邮箱: support@ai-workspace-orchestrator.com
- 文档: https://docs.ai-workspace-orchestrator.com
- 社区: https://community.ai-workspace-orchestrator.com