# AI Workspace Orchestrator API 文档

## 概述

本文档详细描述了 AI Workspace Orchestrator 的所有 API 接口，包括工作流管理、执行、导入导出等功能。每个接口都包含详细的请求参数、响应格式、错误码说明和完整的示例。

## 基础信息

- **基础URL**: `http://localhost:3000/api`
- **内容类型**: `application/json`
- **认证方式**: JWT Bearer Token
- **版本**: v2.0

## 通用响应格式

### 成功响应

```json
{
  "success": true,
  "message": "操作成功",
  "data": {},
  "timestamp": "2026-04-14T04:10:00Z",
  "requestId": "req-123456789"
}
```

### 分页响应

```json
{
  "success": true,
  "message": "获取数据成功",
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3,
    "hasNext": true,
    "hasPrev": false
  },
  "timestamp": "2026-04-14T04:10:00Z"
}
```

### 错误响应

```json
{
  "success": false,
  "message": "错误描述",
  "error": {
    "code": "ERROR_CODE",
    "details": "详细错误信息"
  },
  "timestamp": "2026-04-14T04:10:00Z",
  "requestId": "req-123456789"
}
```

## 1. 系统健康检查

### 1.1 服务健康检查

**GET** `/health`

检查服务运行状态和基本连接。

#### 请求参数

- 无

#### 响应格式

```json
{
  "success": true,
  "message": "服务运行正常",
  "requestId": "req-123456789",
  "timestamp": "2026-04-14T04:10:00Z",
  "uptime": 3600
}
```

#### 响应说明

- `requestId`: 唯一请求标识符
- `timestamp`: 当前时间戳
- `uptime`: 服务运行时间（秒）

### 1.2 系统信息

**GET** `/system`

获取系统详细信息，包括内存、CPU使用情况等。

#### 请求参数

- 无

#### 响应格式

```json
{
  "success": true,
  "message": "系统信息",
  "requestId": "req-123456789",
  "timestamp": "2026-04-14T04:10:00Z",
  "environment": "development",
  "version": "18.18.0",
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
    "external": "4MB"
  },
  "cpu": {
    "user": "1000ms",
    "system": "500ms"
  },
  "port": 3000
}
```

## 2. 工作流管理

### 2.1 获取工作流列表

**GET** `/workflows`

获取工作流列表，支持分页和过滤。

#### 请求参数

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `page` | number | 否 | 页码，默认为1 |
| `limit` | number | 否 | 每页数量，默认为10 |
| `status` | string | 否 | 状态过滤：DRAFT、ACTIVE、PAUSED |
| `userId` | string | 否 | 用户ID过滤 |
| `search` | string | 否 | 搜索关键词 |

#### 请求示例

```http
GET /api/workflows?page=1&limit=10&status=ACTIVE&search=marketing HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 响应格式

```json
{
  "success": true,
  "message": "获取工作流列表成功",
  "data": [
    {
      "id": "wf-001",
      "name": "市场营销自动化流程",
      "description": "自动化社交媒体发布和客户互动",
      "status": "ACTIVE",
      "config": {
        "steps": [
          {
            "type": "ai-content-generator",
            "config": {
              "prompt": "生成周一的社交媒体内容",
              "model": "gpt-4"
            }
          },
          {
            "type": "social-media-poster",
            "config": {
              "platforms": ["twitter", "linkedin"]
            }
          }
        ]
      },
      "variables": {
        "brand_name": "TechCorp",
        "industry": "technology"
      },
      "userId": "user-001",
      "createdAt": "2026-04-13T10:00:00Z",
      "updatedAt": "2026-04-13T15:30:00Z",
      "executionCount": 25,
      "lastExecutedAt": "2026-04-13T08:45:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3,
    "hasNext": true,
    "hasPrev": false
  },
  "timestamp": "2026-04-14T04:10:00Z"
}
```

#### 错误码

- `401`: 未认证或认证失败
- `500`: 服务器内部错误

### 2.2 创建工作流

**POST** `/workflows`

创建新的工作流。

#### 请求参数

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `name` | string | 是 | 工作流名称 |
| `description` | string | 否 | 工作流描述 |
| `config` | object | 是 | 工作流配置JSON |
| `variables` | object | 否 | 全局变量 |
| `userId` | string | 否 | 用户ID |

#### 请求示例

```json
{
  "name": "客户反馈处理流程",
  "description": "自动收集、分类和响应客户反馈",
  "config": {
    "steps": [
      {
        "type": "data-collector",
        "config": {
          "sources": ["email", "social-media"],
          "query": "customer feedback last 7 days"
        }
      },
      {
        "type": "ai-classifier",
        "config": {
          "categories": ["bug", "feature-request", "complaint", "praise"],
          "model": "gpt-4"
        }
      },
      {
        "type": "response-generator",
        "config": {
          "templates": {
            "bug": "感谢您的反馈，我们已记录并正在修复此问题",
            "feature-request": "感谢您的建议，我们会将其加入产品路线图",
            "complaint": "非常抱歉给您带来不便，我们会立即处理",
            "praise": "感谢您的认可，我们会继续提供优质服务"
          }
        }
      },
      {
        "type": "notifier",
        "config": {
          "channels": ["email", "slack"],
          "recipients": ["support@company.com"]
        }
      }
    ],
    "timeout": 300000,
    "retryPolicy": {
      "maxRetries": 3,
      "delayMs": 5000
    }
  },
  "variables": {
    "company_name": "TechCorp",
    "support_email": "support@techcorp.com",
    "response_time": "24h"
  }
}
```

#### 响应格式

```json
{
  "success": true,
  "message": "工作流创建成功",
  "data": {
    "id": "wf-002",
    "name": "客户反馈处理流程",
    "description": "自动收集、分类和响应客户反馈",
    "status": "DRAFT",
    "config": {
      "steps": [...],
      "timeout": 300000,
      "retryPolicy": {
        "maxRetries": 3,
        "delayMs": 5000
      }
    },
    "variables": {
      "company_name": "TechCorp",
      "support_email": "support@techcorp.com",
      "response_time": "24h"
    },
    "userId": "user-001",
    "createdAt": "2026-04-14T04:10:00Z",
    "updatedAt": "2026-04-14T04:10:00Z",
    "executionCount": 0,
    "lastExecutedAt": null
  },
  "timestamp": "2026-04-14T04:10:00Z"
}
```

#### 错误码

- `400`: 请求参数验证失败
- `401`: 未认证或认证失败
- `409`: 工作流名称已存在
- `500`: 服务器内部错误

### 2.3 获取工作流详情

**GET** `/workflows/{id}`

获取指定工作流的详细信息。

#### 路径参数

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 工作流ID |

#### 请求示例

```http
GET /api/workflows/wf-002 HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 响应格式

```json
{
  "success": true,
  "message": "获取工作流详情成功",
  "data": {
    "id": "wf-002",
    "name": "客户反馈处理流程",
    "description": "自动收集、分类和响应客户反馈",
    "status": "DRAFT",
    "config": {
      "steps": [
        {
          "type": "data-collector",
          "config": {
            "sources": ["email", "social-media"],
            "query": "customer feedback last 7 days"
          },
          "id": "step-001",
          "name": "数据收集",
          "timeout": 60000
        },
        {
          "type": "ai-classifier",
          "config": {
            "categories": ["bug", "feature-request", "complaint", "praise"],
            "model": "gpt-4"
          },
          "id": "step-002",
          "name": "AI分类",
          "timeout": 30000,
          "dependsOn": ["step-001"]
        }
      ],
      "timeout": 300000,
      "retryPolicy": {
        "maxRetries": 3,
        "delayMs": 5000
      }
    },
    "variables": {
      "company_name": "TechCorp",
      "support_email": "support@techcorp.com",
      "response_time": "24h"
    },
    "userId": "user-001",
    "createdAt": "2026-04-14T04:10:00Z",
    "updatedAt": "2026-04-14T04:10:00Z",
    "executionCount": 0,
    "lastExecutedAt": null,
    "tags": ["customer-service", "automation"],
    "metadata": {
      "version": "1.0",
      "author": "product-team"
    }
  },
  "timestamp": "2026-04-14T04:10:00Z"
}
```

#### 错误码

- `400`: 工作流ID无效
- `401`: 未认证或认证失败
- `404`: 工作流不存在
- `500`: 服务器内部错误

### 2.4 更新工作流

**PUT** `/workflows/{id}`

更新现有工作流信息。

#### 路径参数

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 工作流ID |

#### 请求参数

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `name` | string | 否 | 工作流名称 |
| `description` | string | 否 | 工作流描述 |
| `config` | object | 否 | 工作流配置JSON |
| `variables` | object | 否 | 全局变量 |
| `status` | string | 否 | 状态：DRAFT、ACTIVE、PAUSED |

#### 请求示例

```json
{
  "name": "客户反馈处理流程 v2.0",
  "description": "增强版客户反馈处理流程，包含多语言支持",
  "config": {
    "steps": [
      {
        "type": "data-collector",
        "config": {
          "sources": ["email", "social-media", "web-forms"],
          "query": "customer feedback last 7 days",
          "languages": ["zh", "en"]
        }
      },
      {
        "type": "ai-classifier",
        "config": {
          "categories": ["bug", "feature-request", "complaint", "praise", "other"],
          "model": "gpt-4",
          "multilingual": true
        }
      },
      {
        "type": "response-generator",
        "config": {
          "templates": {
            "bug": "感谢您的反馈，我们已记录并正在修复此问题",
            "feature-request": "感谢您的建议，我们会将其加入产品路线图",
            "complaint": "非常抱歉给您带来不便，我们会立即处理",
            "praise": "感谢您的认可，我们会继续提供优质服务",
            "other": "感谢您的反馈，我们会仔细阅读并回复"
          },
          "multilingual": true
        }
      },
      {
        "type": "notifier",
        "config": {
          "channels": ["email", "slack", "sms"],
          "recipients": ["support@company.com", "product-team@company.com"]
        }
      }
    ],
    "timeout": 600000,
    "retryPolicy": {
      "maxRetries": 5,
      "delayMs": 3000,
      "backoffMultiplier": 2
    }
  },
  "variables": {
    "company_name": "TechCorp",
    "support_email": "support@techcorp.com",
    "response_time": "24h",
    "sla_hours": 24
  },
  "status": "ACTIVE"
}
```

#### 响应格式

```json
{
  "success": true,
  "message": "工作流更新成功",
  "data": {
    "id": "wf-002",
    "name": "客户反馈处理流程 v2.0",
    "description": "增强版客户反馈处理流程，包含多语言支持",
    "status": "ACTIVE",
    "config": {
      "steps": [...],
      "timeout": 600000,
      "retryPolicy": {
        "maxRetries": 5,
        "delayMs": 3000,
        "backoffMultiplier": 2
      }
    },
    "variables": {
      "company_name": "TechCorp",
      "support_email": "support@techcorp.com",
      "response_time": "24h",
      "sla_hours": 24
    },
    "userId": "user-001",
    "createdAt": "2026-04-14T04:10:00Z",
    "updatedAt": "2026-04-14T04:12:00Z",
    "executionCount": 0,
    "lastExecutedAt": null
  },
  "timestamp": "2026-04-14T04:12:00Z"
}
```

#### 错误码

- `400`: 请求参数验证失败
- `401`: 未认证或认证失败
- `404`: 工作流不存在
- `409`: 工作流名称已存在
- `500`: 服务器内部错误

### 2.5 删除工作流

**DELETE** `/workflows/{id}`

删除指定工作流。

#### 路径参数

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 工作流ID |

#### 请求示例

```http
DELETE /api/workflows/wf-002 HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 响应格式

```json
{
  "success": true,
  "message": "工作流删除成功",
  "data": null,
  "timestamp": "2026-04-14T04:15:00Z"
}
```

#### 错误码

- `400`: 工作流ID无效
- `401`: 未认证或认证失败
- `404`: 工作流不存在
- `409`: 工作流包含活跃执行，无法删除
- `500`: 服务器内部错误

## 3. 工作流执行管理

### 3.1 执行工作流

**POST** `/workflows/{id}/execute`

启动指定工作流的执行。

#### 路径参数

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 工作流ID |

#### 请求参数

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `inputVariables` | object | 否 | 输入变量（覆盖全局变量） |
| `priority` | string | 否 | 执行优先级：LOW、MEDIUM、HIGH、URGENT |
| `timeout` | number | 否 | 超时时间（毫秒），默认30000 |

#### 请求示例

```json
{
  "inputVariables": {
    "customer_name": "张三",
    "feedback_type": "feature-request",
    "feedback_content": "希望能增加批量导出功能",
    "customer_email": "zhangsan@example.com",
    "priority": "high"
  },
  "priority": "HIGH",
  "timeout": 60000
}
```

#### 响应格式

```json
{
  "success": true,
  "message": "工作流执行启动成功",
  "data": {
    "id": "exec-001",
    "workflowId": "wf-002",
    "workflowName": "客户反馈处理流程 v2.0",
    "status": "PENDING",
    "priority": "HIGH",
    "inputVariables": {
      "customer_name": "张三",
      "feedback_type": "feature-request",
      "feedback_content": "希望能增加批量导出功能",
      "customer_email": "zhangsan@example.com",
      "priority": "high"
    },
    "startTime": "2026-04-14T04:15:00Z",
    "estimatedDuration": 45000,
    "retryCount": 0,
    "userId": "user-001"
  },
  "timestamp": "2026-04-14T04:15:00Z"
}
```

#### 错误码

- `400`: 请求参数验证失败
- `401`: 未认证或认证失败
- `404`: 工作流不存在
- `422`: 工作流配置无效
- `429`: 执行队列已满
- `500`: 服务器内部错误

### 3.2 获取执行历史

**GET** `/workflows/{id}/executions`

获取指定工作流的执行历史。

#### 路径参数

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 工作流ID |

#### 查询参数

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `page` | number | 否 | 页码，默认为1 |
| `limit` | number | 否 | 每页数量，默认为10 |
| `status` | string | 否 | 状态过滤：PENDING、RUNNING、SUCCESS、FAILED |
| `startDate` | string | 否 | 开始日期（ISO格式） |
| `endDate` | string | 否 | 结束日期（ISO格式） |

#### 请求示例

```http
GET /api/workflows/wf-002/executions?page=1&limit=5&status=SUCCESS&startDate=2026-04-01T00:00:00Z&endDate=2026-04-14T23:59:59Z HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 响应格式

```json
{
  "success": true,
  "message": "获取执行历史成功",
  "data": [
    {
      "id": "exec-001",
      "workflowId": "wf-002",
      "workflowName": "客户反馈处理流程 v2.0",
      "status": "SUCCESS",
      "priority": "HIGH",
      "inputVariables": {
        "customer_name": "张三",
        "feedback_type": "feature-request",
        "feedback_content": "希望能增加批量导出功能"
      },
      "output": {
        "classification": "feature-request",
        "response_template": "感谢您的建议，我们会将其加入产品路线图",
        "recipients": ["support@company.com", "product-team@company.com"],
        "sent_at": "2026-04-14T04:15:30Z"
      },
      "startTime": "2026-04-14T04:15:00Z",
      "endTime": "2026-04-14T04:15:30Z",
      "duration": 30000,
      "retryCount": 0,
      "error": null,
      "userId": "user-001"
    },
    {
      "id": "exec-002",
      "workflowId": "wf-002",
      "workflowName": "客户反馈处理流程 v2.0",
      "status": "FAILED",
      "priority": "MEDIUM",
      "inputVariables": {
        "customer_name": "李四",
        "feedback_type": "bug",
        "feedback_content": "登录页面无法加载"
      },
      "output": null,
      "startTime": "2026-04-14T04:10:00Z",
      "endTime": "2026-04-14T04:12:00Z",
      "duration": 120000,
      "retryCount": 2,
      "error": {
        "step": "step-001",
        "message": "数据收集超时",
        "details": "连接邮件服务器超时，请检查网络连接"
      },
      "userId": "user-001"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 25,
    "pages": 5,
    "hasNext": true,
    "hasPrev": false
  },
  "timestamp": "2026-04-14T04:16:00Z"
}
```

#### 错误码

- `400`: 工作流ID无效或查询参数验证失败
- `401`: 未认证或认证失败
- `404`: 工作流不存在
- `500`: 服务器内部错误

## 4. 工作流验证和工具

### 4.1 验证工作流配置

**POST** `/workflows/validate`

验证工作流配置的语法和逻辑正确性。

#### 请求参数

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `config` | object | 是 | 工作流配置JSON |

#### 请求示例

```json
{
  "config": {
    "steps": [
      {
        "type": "data-collector",
        "config": {
          "sources": ["email", "social-media"],
          "query": "customer feedback"
        },
        "id": "collect-data",
        "name": "数据收集"
      },
      {
        "type": "ai-classifier",
        "config": {
          "categories": ["bug", "feature", "complaint"],
          "model": "gpt-4"
        },
        "id": "classify-feedback",
        "name": "分类反馈",
        "dependsOn": ["collect-data"]
      }
    ],
    "timeout": 300000,
    "retryPolicy": {
      "maxRetries": 3,
      "delayMs": 5000
    }
  }
}
```

#### 响应格式

**验证成功时：**

```json
{
  "success": true,
  "message": "工作流配置验证成功",
  "data": {
    "valid": true,
    "stepCount": 2,
    "hasCircularDependencies": false,
    "executionPath": [
      "collect-data",
      "classify-feedback"
    ],
    "estimatedDuration": 45000,
    "memoryEstimate": "64MB",
    "warnings": [],
    "suggestions": [
      "建议为分类步骤添加超时设置",
      "建议添加重试机制以提高可靠性"
    ]
  },
  "timestamp": "2026-04-14T04:20:00Z"
}
```

**验证失败时：**

```json
{
  "success": false,
  "message": "工作流配置验证失败",
  "data": {
    "valid": false,
    "errors": [
      {
        "stepId": "classify-feedback",
        "message": "依赖的步骤不存在: collect-data",
        "severity": "error"
      },
      {
        "stepId": "classify-feedback",
        "message": "缺少必需的配置参数: model",
        "severity": "error"
      }
    ],
    "warnings": [
      {
        "stepId": "collect-data",
        "message": "未设置超时时间",
        "severity": "warning"
      }
    ]
  },
  "timestamp": "2026-04-14T04:20:00Z"
}
```

#### 错误码

- `400`: 请求参数验证失败
- `401`: 未认证或认证失败
- `422`: 工作流配置无效
- `500`: 服务器内部错误

### 4.2 获取执行路径

**POST** `/workflows/execution-path`

获取工作流的执行路径和步骤顺序。

#### 请求参数

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `config` | object | 是 | 工作流配置JSON |

#### 请求示例

```json
{
  "config": {
    "steps": [
      {
        "type": "data-collector",
        "config": {
          "sources": ["email", "social-media"],
          "query": "customer feedback"
        },
        "id": "collect-data",
        "name": "数据收集"
      },
      {
        "type": "ai-classifier",
        "config": {
          "categories": ["bug", "feature", "complaint"],
          "model": "gpt-4"
        },
        "id": "classify-feedback",
        "name": "分类反馈",
        "dependsOn": ["collect-data"]
      },
      {
        "type": "response-generator",
        "config": {
          "templates": {
            "bug": "感谢反馈",
            "feature": "感谢建议",
            "complaint": "抱歉问题"
          }
        },
        "id": "generate-response",
        "name": "生成响应",
        "dependsOn": ["classify-feedback"]
      },
      {
        "type": "notifier",
        "config": {
          "channels": ["email"]
        },
        "id": "send-notification",
        "name": "发送通知",
        "dependsOn": ["generate-response"]
      }
    ]
  }
}
```

#### 响应格式

```json
{
  "success": true,
  "message": "获取执行路径成功",
  "data": {
    "executionPath": [
      {
        "stepId": "collect-data",
        "stepName": "数据收集",
        "stepType": "data-collector",
        "position": 0,
        "dependencies": [],
        "estimatedDuration": 60000
      },
      {
        "stepId": "classify-feedback",
        "stepName": "分类反馈",
        "stepType": "ai-classifier",
        "position": 1,
        "dependencies": ["collect-data"],
        "estimatedDuration": 30000
      },
      {
        "stepId": "generate-response",
        "stepName": "生成响应",
        "stepType": "response-generator",
        "position": 2,
        "dependencies": ["classify-feedback"],
        "estimatedDuration": 15000
      },
      {
        "stepId": "send-notification",
        "stepName": "发送通知",
        "stepType": "notifier",
        "position": 3,
        "dependencies": ["generate-response"],
        "estimatedDuration": 10000
      }
    ],
    "totalEstimatedDuration": 115000,
    "criticalPath": [
      "collect-data",
      "classify-feedback",
      "generate-response",
      "send-notification"
    ],
    "parallelizableSteps": [
      {
        "stepId": "collect-data",
        "canRunInParallel": true,
        "parallelizableWith": []
      }
    ],
    "bottlenecks": [
      {
        "stepId": "collect-data",
        "reason": "数据收集步骤耗时较长，可能成为性能瓶颈"
      }
    ]
  },
  "timestamp": "2026-04-14T04:25:00Z"
}
```

#### 错误码

- `400`: 请求参数验证失败
- `401`: 未认证或认证失败
- `422`: 工作流配置无效
- `500`: 服务器内部错误

## 5. 工作流导入导出

### 5.1 导出工作流

**GET** `/workflows/{id}/export`

将工作流导出为JSON格式文件。

#### 路径参数

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 工作流ID |

#### 请求示例

```http
GET /api/workflows/wf-002/export HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 响应格式

响应为JSON文件下载，Content-Type: application/json

```json
{
  "workflow": {
    "id": "wf-002",
    "name": "客户反馈处理流程 v2.0",
    "description": "增强版客户反馈处理流程，包含多语言支持",
    "status": "ACTIVE",
    "config": {
      "steps": [...],
      "timeout": 600000,
      "retryPolicy": {
        "maxRetries": 5,
        "delayMs": 3000,
        "backoffMultiplier": 2
      }
    },
    "variables": {
      "company_name": "TechCorp",
      "support_email": "support@techcorp.com",
      "response_time": "24h",
      "sla_hours": 24
    },
    "userId": "user-001",
    "createdAt": "2026-04-14T04:10:00Z",
    "updatedAt": "2026-04-14T04:12:00Z"
  },
  "exportInfo": {
    "exportedAt": "2026-04-14T04:30:00Z",
    "exportedBy": "user-001",
    "version": "2.0",
    "format": "json",
    "checksum": "sha256:abc123..."
  }
}
```

#### 错误码

- `400`: 工作流ID无效
- `401`: 未认证或认证失败
- `404`: 工作流不存在
- `500`: 服务器内部错误

### 5.2 导入工作流

**POST** `/workflows/import`

从JSON文件导入工作流。

#### 请求参数

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `workflow` | object | 是 | 工作流数据 |
| `options` | object | 否 | 导入选项 |

#### 请求示例

```json
{
  "workflow": {
    "id": "wf-imported-001",
    "name": "社交媒体监控流程",
    "description": "自动监控社交媒体上的品牌提及",
    "status": "DRAFT",
    "config": {
      "steps": [
        {
          "type": "social-media-monitor",
          "config": {
            "platforms": ["twitter", "facebook", "instagram"],
            "keywords": ["TechCorp", "our product"],
            "monitoring_radius": "100km"
          },
          "id": "monitor-social",
          "name": "社交媒体监控",
          "timeout": 300000
        },
        {
          "type": "sentiment-analyzer",
          "config": {
            "model": "gpt-4",
            "languages": ["zh", "en"]
          },
          "id": "analyze-sentiment",
          "name": "情感分析",
          "timeout": 60000,
          "dependsOn": ["monitor-social"]
        },
        {
          "type": "alert-generator",
          "config": {
            "thresholds": {
              "negative": 0.7,
              "urgent": 0.9
            },
            "recipients": ["pr@company.com", "social@company.com"]
          },
          "id": "generate-alerts",
          "name": "生成警报",
          "timeout": 30000,
          "dependsOn": ["analyze-sentiment"]
        }
      ],
      "timeout": 600000,
      "retryPolicy": {
        "maxRetries": 3,
        "delayMs": 5000
      }
    },
    "variables": {
      "company_name": "TechCorp",
      "alert_email": "alerts@techcorp.com",
      "monitoring_frequency": "15m"
    }
  },
  "options": {
    "name": "社交媒体监控流程 (导入版)",
    "draft": true,
    "overwrite": false
  }
}
```

#### 响应格式

```json
{
  "success": true,
  "message": "工作流导入成功",
  "data": {
    "id": "wf-imported-001",
    "name": "社交媒体监控流程 (导入版)",
    "description": "自动监控社交媒体上的品牌提及",
    "status": "DRAFT",
    "config": {
      "steps": [...],
      "timeout": 600000,
      "retryPolicy": {
        "maxRetries": 3,
        "delayMs": 5000
      }
    },
    "variables": {
      "company_name": "TechCorp",
      "alert_email": "alerts@techcorp.com",
      "monitoring_frequency": "15m"
    },
    "userId": "user-001",
    "createdAt": "2026-04-14T04:35:00Z",
    "updatedAt": "2026-04-14T04:35:00Z",
    "executionCount": 0,
    "lastExecutedAt": null,
    "importInfo": {
      "originalId": "wf-imported-001",
      "importedAt": "2026-04-14T04:35:00Z",
      "importedBy": "user-001",
      "version": "1.0"
    }
  },
  "timestamp": "2026-04-14T04:35:00Z"
}
```

#### 错误码

- `400`: 请求参数验证失败
- `401`: 未认证或认证失败
- `409`: 工作流ID已存在且不允许覆盖
- `422`: 工作流配置无效
- `500`: 服务器内部错误

### 5.3 克隆工作流

**POST** `/workflows/{id}/clone`

复制现有工作流。

#### 路径参数

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 原始工作流ID |

#### 请求参数

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `name` | string | 否 | 新工作流名称，默认为原名称+"(副本)" |

#### 请求示例

```json
{
  "name": "客户反馈处理流程 v2.1 (实验版)"
}
```

#### 响应格式

```json
{
  "success": true,
  "message": "工作流克隆成功",
  "data": {
    "id": "wf-cloned-001",
    "name": "客户反馈处理流程 v2.1 (实验版)",
    "description": "增强版客户反馈处理流程，包含多语言支持",
    "status": "DRAFT",
    "config": {
      "steps": [...],
      "timeout": 600000,
      "retryPolicy": {
        "maxRetries": 5,
        "delayMs": 3000,
        "backoffMultiplier": 2
      }
    },
    "variables": {
      "company_name": "TechCorp",
      "support_email": "support@techcorp.com",
      "response_time": "24h",
      "sla_hours": 24
    },
    "userId": "user-001",
    "createdAt": "2026-04-14T04:40:00Z",
    "updatedAt": "2026-04-14T04:40:00Z",
    "executionCount": 0,
    "lastExecutedAt": null,
    "sourceWorkflowId": "wf-002",
    "sourceWorkflowName": "客户反馈处理流程 v2.0"
  },
  "timestamp": "2026-04-14T04:40:00Z"
}
```

#### 错误码

- `400`: 工作流ID无效或请求参数验证失败
- `401`: 未认证或认证失败
- `404`: 原始工作流不存在
- `500`: 服务器内部错误

## 6. 仪表板和监控

### 6.1 获取仪表板摘要

**GET** `/dashboard/summary`

获取系统运行状态的总体摘要信息。

#### 请求参数

- 无

#### 响应格式

```json
{
  "success": true,
  "message": "获取仪表板摘要成功",
  "data": {
    "generatedAt": "2026-04-14T04:45:00Z",
    "health": {
      "status": "healthy",
      "score": 95,
      "components": {
        "database": "healthy",
        "cache": "healthy",
        "externalServices": "healthy"
      }
    },
    "engines": [
      {
        "engineId": "ai-gpt-4",
        "status": "healthy",
        "successRate": 0.98,
        "avgResponseTimeMs": 1200,
        "totalRequests": 1520,
        "lastActivityAt": "2026-04-14T04:44:30Z"
      },
      {
        "engineId": "ai-claude",
        "status": "degraded",
        "successRate": 0.75,
        "avgResponseTimeMs": 3500,
        "totalRequests": 890,
        "lastActivityAt": "2026-04-14T04:40:15Z"
      }
    ],
    "queue": {
      "totalEnqueued": 250,
      "totalDequeued": 240,
      "totalFailed": 5,
      "avgWaitTimeMs": 1200,
      "maxWaitTimeMs": 4500
    },
    "activeAlerts": [
      {
        "id": "alert-001",
        "severity": "warning",
        "type": "low_success_rate",
        "title": "Claude引擎成功率偏低",
        "message": "Claude引擎当前成功率为75%，低于阈值90%",
        "engineId": "ai-claude",
        "currentValue": 0.75,
        "threshold": 0.9,
        "triggeredAt": "2026-04-14T04:35:00Z"
      }
    ],
    "alertCount": 1
  },
  "timestamp": "2026-04-14T04:45:00Z"
}
```

#### 错误码

- `401`: 未认证或认证失败
- `500`: 服务器内部错误

### 6.2 获取告警信息

**GET** `/dashboard/alerts`

获取系统的当前告警列表。

#### 请求参数

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `severity` | string | 否 | 告警级别过滤：info、warning、critical |
| `type` | string | 否 | 告警类型过滤 |
| `limit` | number | 否 | 返回数量限制，默认为20 |
| `page` | number | 否 | 页码，默认为1 |

#### 请求示例

```http
GET /dashboard/alerts?severity=warning&limit=10&page=1 HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 响应格式

```json
{
  "success": true,
  "message": "获取告警信息成功",
  "data": [
    {
      "id": "alert-001",
      "severity": "warning",
      "type": "low_success_rate",
      "title": "Claude引擎成功率偏低",
      "message": "Claude引擎当前成功率为75%，低于阈值90%",
      "engineId": "ai-claude",
      "currentValue": 0.75,
      "threshold": 0.9,
      "triggeredAt": "2026-04-14T04:35:00Z",
      "resolvedAt": null
    },
    {
      "id": "alert-002",
      "severity": "critical",
      "type": "high_response_time",
      "title": "队列响应时间过高",
      "message": "当前队列平均等待时间为6500ms，超过阈值5000ms",
      "currentValue": 6500,
      "threshold": 5000,
      "triggeredAt": "2026-04-14T04:30:00Z",
      "resolvedAt": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 2,
    "pages": 1,
    "hasNext": false,
    "hasPrev": false
  },
  "timestamp": "2026-04-14T04:45:00Z"
}
```

#### 错误码

- `401`: 未认证或认证失败
- `500`: 服务器内部错误

## 7. 错误码说明

### 7.1 认证错误

| 错误码 | HTTP状态码 | 说明 |
|--------|-------------|------|
| `AUTH_REQUIRED` | 401 | 需要身份验证 |
| `INVALID_TOKEN` | 401 | 无效的JWT令牌 |
| `TOKEN_EXPIRED` | 401 | JWT令牌已过期 |

### 7.2 输入验证错误

| 错误码 | HTTP状态码 | 说明 |
|--------|-------------|------|
| `INVALID_INPUT` | 400 | 无效的输入参数 |
| `MISSING_REQUIRED_FIELD` | 400 | 缺少必需字段 |
| `INVALID_FORMAT` | 400 | 数据格式错误 |
| `INVALID_ENUM_VALUE` | 400 | 枚举值无效 |

### 7.3 资源错误

| 错误码 | HTTP状态码 | 说明 |
|--------|-------------|------|
| `RESOURCE_NOT_FOUND` | 404 | 资源不存在 |
| `WORKFLOW_NOT_FOUND` | 404 | 工作流不存在 |
| `EXECUTION_NOT_FOUND` | 404 | 执行记录不存在 |

### 7.4 业务逻辑错误

| 错误码 | HTTP状态码 | 说明 |
|--------|-------------|------|
| `WORKFLOW_INVALID` | 422 | 工作流配置无效 |
| `DEPENDENCY_ERROR` | 422 | 依赖关系错误 |
| `CIRCULAR_DEPENDENCY` | 422 | 循环依赖 |
| `EXECUTION_FAILED` | 422 | 执行失败 |
| `QUEUE_FULL` | 429 | 执行队列已满 |
| `RATE_LIMITED` | 429 | 请求频率限制 |

### 7.5 服务器错误

| 错误码 | HTTP状态码 | 说明 |
|--------|-------------|------|
| `INTERNAL_ERROR` | 500 | 服务器内部错误 |
| `DATABASE_ERROR` | 500 | 数据库错误 |
| `EXTERNAL_SERVICE_ERROR` | 500 | 外部服务错误 |
| `TIMEOUT_ERROR` | 504 | 请求超时 |

## 8. API使用建议

### 8.1 请求最佳实践

1. **HTTPS协议**: 所有API请求都应使用HTTPS协议
2. **请求重试**: 实现自动重试机制，特别是网络相关错误
3. **超时设置**: 设置适当的请求超时时间
4. **连接池**: 使用连接池管理数据库和外部服务连接

### 8.2 错误处理

1. **状态码检查**: 始终检查HTTP状态码
2. **重试策略**: 实现指数退避重试
3. **错误日志**: 记录详细的错误信息
4. **用户友好**: 提供用户友好的错误消息

### 8.3 性能优化

1. **响应缓存**: 对静态数据使用缓存
2. **分页**: 大数据集使用分页查询
3. **异步处理**: 支持异步执行的接口
4. **性能监控**: 监控API响应时间和成功率

### 8.4 安全考虑

1. **JWT认证**: 使用JWT进行身份验证
2. **权限控制**: 实现基于角色的访问控制
3. **数据加密**: 敏感数据加密传输
4. **API密钥管理**: 定期更新和管理API密钥

## 9. 认证和授权

所有API端点都需要JWT Bearer Token认证。

### 9.1 获取Token

通过用户登录获取JWT令牌：

```http
POST /auth/login HTTP/1.1
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

响应示例：

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresAt": "2026-04-14T05:10:00Z",
    "user": {
      "id": "user-001",
      "email": "user@example.com",
      "role": "admin"
    }
  }
}
```

### 9.2 使用Token

在API请求中包含Authorization头：

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 10. 版本历史

### v2.0 (当前版本)
- 增强版API控制器，使用装饰器模式
- 统一的错误处理和重试机制
- 性能监控和指标收集
- 更严格的输入验证和类型检查
- 仪表板和监控功能
- 工作流导入导出功能

### v1.0
- 基础工作流管理API
- 简单的CRUD操作
- 基础错误处理
- 手动重试机制

---

*本文档最后更新时间：2026-04-14T04:10:00Z*