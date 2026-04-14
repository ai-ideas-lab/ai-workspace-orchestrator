# AI Workspace Orchestrator API 文档

## 概述

AI Workspace Orchestrator 是企业级AI工作流自动化平台，提供强大的工作流管理和执行能力。本API文档详细说明了所有可用的端点和功能。

## 基础信息

- **基础URL**: `http://localhost:3000/api`
- **认证方式**: JWT Bearer Token
- **内容类型**: `application/json`
- **响应格式**: JSON

## 系统端点

### 1. 健康检查

**端点**: `GET /health`

**描述**: 检查服务运行状态

**请求**:
```http
GET /health
```

**响应**:
```json
{
  "success": true,
  "message": "服务运行正常",
  "requestId": "req_123456789",
  "timestamp": "2026-04-14T00:10:00Z",
  "uptime": 3600
}
```

**错误码**: 无

### 2. 系统信息

**端点**: `GET /system`

**描述**: 获取系统运行状态和资源信息

**请求**:
```http
GET /system
```

**响应**:
```json
{
  "success": true,
  "message": "系统信息",
  "requestId": "req_123456789",
  "timestamp": "2026-04-14T00:10:00Z",
  "environment": "development",
  "version": "v1.0.0",
  "platform": "darwin",
  "arch": "x64",
  "uptime": {
    "seconds": 3600,
    "formatted": "1h 0m 0s"
  },
  "memory": {
    "rss": "256MB",
    "heapTotal": "128MB",
    "heapUsed": "64MB",
    "external": "32MB"
  },
  "cpu": {
    "user": "1000ms",
    "system": "500ms"
  },
  "port": 3000
}
```

**错误码**: 无

## 工作流管理端点

### 3. 获取工作流列表

**端点**: `GET /api/workflows`

**描述**: 获取用户的工作流列表，支持分页和过滤

**请求**:
```http
GET /api/workflows?page=1&limit=10&status=ACTIVE&search=keyword
```

**查询参数**:
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `page` | number | 否 | 页码，默认为1 |
| `limit` | number | 否 | 每页数量，默认为10，最大100 |
| `status` | string | 否 | 过滤状态：DRAFT, ACTIVE, PAUSED, ARCHIVED |
| `userId` | string | 否 | 过滤用户ID |
| `search` | string | 否 | 搜索关键词 |

**响应**:
```json
{
  "success": true,
  "message": "获取工作流列表成功",
  "data": [
    {
      "id": "wrk_123456789",
      "name": "数据处理工作流",
      "description": "自动处理和分析数据",
      "status": "ACTIVE",
      "createdAt": "2026-04-13T10:00:00Z",
      "updatedAt": "2026-04-13T15:30:00Z",
      "userId": "usr_123456789",
      "executionCount": 25,
      "lastExecution": "2026-04-13T15:30:00Z"
    },
    {
      "id": "wrk_987654321",
      "name": "报告生成流程",
      "description": "自动生成月度报告",
      "status": "DRAFT",
      "createdAt": "2026-04-12T09:00:00Z",
      "updatedAt": "2026-04-12T09:00:00Z",
      "userId": "usr_123456789",
      "executionCount": 0,
      "lastExecution": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 2,
    "totalPages": 1
  }
}
```

**错误码**:
- `400`: 请求参数无效
- `500`: 服务器内部错误

### 4. 创建工作流

**端点**: `POST /api/workflows`

**描述**: 创建新的工作流

**请求**:
```http
POST /api/workflows
```

**请求体**:
```json
{
  "name": "客户数据处理流程",
  "description": "自动处理和分类客户数据",
  "config": {
    "steps": [
      {
        "id": "extract_data",
        "type": "api",
        "name": "提取数据",
        "config": {
          "method": "GET",
          "url": "https://api.example.com/customers",
          "timeout": 30000
        }
      },
      {
        "id": "process_data",
        "type": "script",
        "name": "数据处理",
        "config": {
          "code": "const result = data.map(item => ({...}));"
        }
      },
      {
        "id": "save_results",
        "type": "api",
        "name": "保存结果",
        "config": {
          "method": "POST",
          "url": "https://api.example.com/results",
          "timeout": 30000
        }
      }
    ]
  },
  "variables": {
    "api_key": "your-api-key-here",
    "batch_size": 100
  },
  "userId": "usr_123456789"
}
```

**响应**:
```json
{
  "success": true,
  "message": "工作流创建成功",
  "data": {
    "id": "wrk_987654321",
    "name": "客户数据处理流程",
    "description": "自动处理和分类客户数据",
    "status": "DRAFT",
    "config": {
      "steps": [...]
    },
    "variables": {
      "api_key": "your-api-key-here",
      "batch_size": 100
    },
    "userId": "usr_123456789",
    "createdAt": "2026-04-14T00:10:00Z",
    "updatedAt": "2026-04-14T00:10:00Z"
  }
}
```

**错误码**:
- `400`: 请求参数无效（名称或配置为空）
- `409`: 工作流名称已存在
- `500`: 服务器内部错误

### 5. 获取工作流详情

**端点**: `GET /api/workflows/:id`

**描述**: 获取指定工作流的详细信息

**请求**:
```http
GET /api/workflows/wrk_123456789
```

**路径参数**:
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 工作流ID |

**响应**:
```json
{
  "success": true,
  "message": "获取工作流详情成功",
  "data": {
    "id": "wrk_123456789",
    "name": "客户数据处理流程",
    "description": "自动处理和分类客户数据",
    "status": "ACTIVE",
    "config": {
      "steps": [
        {
          "id": "extract_data",
          "type": "api",
          "name": "提取数据",
          "config": {
            "method": "GET",
            "url": "https://api.example.com/customers",
            "timeout": 30000
          }
        },
        {
          "id": "process_data",
          "type": "script",
          "name": "数据处理",
          "config": {
            "code": "const result = data.map(item => ({...}));"
          }
        }
      ]
    },
    "variables": {
      "api_key": "your-api-key-here",
      "batch_size": 100
    },
    "userId": "usr_123456789",
    "createdAt": "2026-04-13T10:00:00Z",
    "updatedAt": "2026-04-13T15:30:00Z",
    "executionCount": 25,
    "lastExecution": "2026-04-13T15:30:00Z"
  }
}
```

**错误码**:
- `400`: 工作流ID为空
- `404`: 工作流不存在
- `500`: 服务器内部错误

### 6. 更新工作流

**端点**: `PUT /api/workflows/:id`

**描述**: 更新指定工作流的配置或信息

**请求**:
```http
PUT /api/workflows/wrk_123456789
```

**路径参数**:
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 工作流ID |

**请求体**:
```json
{
  "name": "更新后的工作流名称",
  "description": "更新后的工作流描述",
  "config": {
    "steps": [
      {
        "id": "extract_data",
        "type": "api",
        "name": "提取数据",
        "config": {
          "method": "GET",
          "url": "https://api.example.com/customers",
          "timeout": 30000
        }
      }
    ]
  },
  "variables": {
    "api_key": "updated-api-key",
    "batch_size": 200
  },
  "status": "ACTIVE"
}
```

**响应**:
```json
{
  "success": true,
  "message": "工作流更新成功",
  "data": {
    "id": "wrk_123456789",
    "name": "更新后的工作流名称",
    "description": "更新后的工作流描述",
    "status": "ACTIVE",
    "config": {
      "steps": [...]
    },
    "variables": {
      "api_key": "updated-api-key",
      "batch_size": 200
    },
    "userId": "usr_123456789",
    "updatedAt": "2026-04-14T00:10:00Z"
  }
}
```

**错误码**:
- `400`: 工作流ID为空或请求参数无效
- `404`: 工作流不存在
- `500`: 服务器内部错误

### 7. 删除工作流

**端点**: `DELETE /api/workflows/:id`

**描述**: 删除指定工作流

**请求**:
```http
DELETE /api/workflows/wrk_123456789
```

**路径参数**:
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 工作流ID |

**响应**:
```json
{
  "success": true,
  "message": "工作流删除成功"
}
```

**错误码**:
- `400`: 工作流ID为空
- `409`: 工作流包含活跃的执行，无法删除
- `404`: 工作流不存在
- `500`: 服务器内部错误

## 工作流执行端点

### 8. 执行工作流

**端点**: `POST /api/workflows/:id/execute`

**描述**: 执行指定工作流

**请求**:
```http
POST /api/workflows/wrk_123456789/execute
```

**路径参数**:
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 工作流ID |

**请求体**:
```json
{
  "variables": {
    "input_data": [...],
    "api_key": "your-api-key",
    "timeout": 60000
  },
  "priority": "NORMAL",
  "timeout": 300000
}
```

**请求体参数**:
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `variables` | object | 否 | 执行变量，覆盖工作流默认变量 |
| `priority` | string | 否 | 执行优先级：LOW, NORMAL, HIGH, URGENT，默认NORMAL |
| `timeout` | number | 否 | 超时时间（秒），1-3600秒，默认300秒 |

**响应**:
```json
{
  "success": true,
  "message": "工作流执行已启动",
  "data": {
    "id": "exe_123456789",
    "workflowId": "wrk_123456789",
    "status": "PENDING",
    "priority": "NORMAL",
    "timeout": 300000,
    "createdAt": "2026-04-14T00:10:00Z",
    "estimatedDuration": 120000
  }
}
```

**错误码**:
- `400`: 工作流ID为空或请求参数无效
- `404`: 工作流不存在
- `500`: 服务器内部错误

### 9. 获取执行历史

**端点**: `GET /api/workflows/:id/executions`

**描述**: 获取指定工作流的执行历史

**请求**:
```http
GET /api/workflows/wrk_123456789/executions?page=1&limit=20&status=COMPLETED&startDate=2026-04-01&endDate=2026-04-14
```

**路径参数**:
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 工作流ID |

**查询参数**:
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `page` | number | 否 | 页码，默认为1 |
| `limit` | number | 否 | 每页数量，默认为20，最大100 |
| `status` | string | 否 | 过滤状态：PENDING, RUNNING, COMPLETED, FAILED, CANCELLED |
| `startDate` | string | 否 | 开始日期（ISO格式） |
| `endDate` | string | 否 | 结束日期（ISO格式） |

**响应**:
```json
{
  "success": true,
  "message": "获取执行历史成功",
  "data": [
    {
      "id": "exe_123456789",
      "workflowId": "wrk_123456789",
      "status": "COMPLETED",
      "priority": "NORMAL",
      "duration": 120000,
      "startedAt": "2026-04-13T15:30:00Z",
      "completedAt": "2026-04-13T15:32:00Z",
      "inputVariables": {
        "api_key": "your-api-key"
      },
      "output": {
        "processed": 1000,
        "success": true
      },
      "error": null
    },
    {
      "id": "exe_987654321",
      "workflowId": "wrk_123456789",
      "status": "FAILED",
      "priority": "HIGH",
      "duration": 45000,
      "startedAt": "2026-04-13T14:00:00Z",
      "completedAt": "2026-04-13T14:00:45Z",
      "inputVariables": {},
      "output": null,
      "error": {
        "code": "API_TIMEOUT",
        "message": "API请求超时",
        "details": "请求 https://api.example.com/customers 超时"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 25,
    "totalPages": 2
  }
}
```

**错误码**:
- `400`: 工作流ID为空或请求参数无效
- `404`: 工作流不存在
- `500`: 服务器内部错误

## 工作流工具端点

### 10. 验证工作流配置

**端点**: `POST /api/workflows/validate`

**描述**: 验证工作流配置的有效性

**请求**:
```http
POST /api/workflows/validate
```

**请求体**:
```json
{
  "config": {
    "steps": [
      {
        "id": "extract_data",
        "type": "api",
        "name": "提取数据",
        "config": {
          "method": "GET",
          "url": "https://api.example.com/customers",
          "timeout": 30000
        }
      },
      {
        "id": "process_data",
        "type": "script",
        "name": "数据处理",
        "config": {
          "code": "const result = data.map(item => ({...}));"
        }
      },
      {
        "id": "save_results",
        "type": "api",
        "name": "保存结果",
        "config": {
          "method": "POST",
          "url": "https://api.example.com/results",
          "timeout": 30000
        }
      }
    ]
  }
}
```

**响应**:
```json
{
  "success": true,
  "message": "工作流配置验证通过",
  "data": {
    "isValid": true,
    "warnings": [
      {
        "code": "STEP_DEPRECATION",
        "message": "脚本步骤类型即将弃用，建议使用新的代码执行步骤",
        "severity": "warning",
        "affectedSteps": ["process_data"]
      }
    ],
    "suggestions": [
      {
        "code": "PERFORMANCE_OPTIMIZATION",
        "message": "建议将数据处理步骤拆分为多个较小的步骤以提高性能",
        "affectedSteps": ["process_data"]
      }
    ]
  }
}
```

**错误码**:
- `400`: 请求体无效或工作流配置验证失败
- `500`: 服务器内部错误

### 11. 获取执行路径

**端点**: `POST /api/workflows/execution-path`

**描述**: 分析工作流配置的执行路径，用于调试和优化

**请求**:
```http
POST /api/workflows/execution-path
```

**请求体**:
```json
{
  "config": {
    "steps": [
      {
        "id": "extract_data",
        "type": "api",
        "name": "提取数据",
        "config": {
          "method": "GET",
          "url": "https://api.example.com/customers",
          "timeout": 30000
        }
      },
      {
        "id": "filter_data",
        "type": "condition",
        "name": "数据过滤",
        "config": {
          "condition": "data.length > 0",
          "trueStep": "process_data",
          "falseStep": "empty_result"
        }
      },
      {
        "id": "process_data",
        "type": "script",
        "name": "数据处理",
        "config": {
          "code": "return data.filter(item => item.active);"
        }
      },
      {
        "id": "empty_result",
        "type": "api",
        "name": "空结果处理",
        "config": {
          "method": "POST",
          "url": "https://api.example.com/empty",
          "timeout": 30000
        }
      }
    ]
  },
  "input": {
    "filter_criteria": "active",
    "limit": 1000
  }
}
```

**响应**:
```json
{
  "success": true,
  "message": "执行路径分析成功",
  "data": {
    "executionPath": [
      {
        "stepId": "extract_data",
        "stepName": "提取数据",
        "stepType": "api",
        "status": "required",
        "output": "customers",
        "dependencies": []
      },
      {
        "stepId": "filter_data",
        "stepName": "数据过滤",
        "stepType": "condition",
        "status": "conditional",
        "condition": "data.length > 0",
        "output": "filtered_customers",
        "dependencies": ["extract_data"],
        "branches": {
          "true": {
            "nextStep": "process_data",
            "condition": "data.length > 0"
          },
          "false": {
            "nextStep": "empty_result",
            "condition": "data.length === 0"
          }
        }
      },
      {
        "stepId": "process_data",
        "stepName": "数据处理",
        "stepType": "script",
        "status": "conditional",
        "output": "processed_customers",
        "dependencies": ["filter_data"]
      },
      {
        "stepId": "empty_result",
        "stepName": "空结果处理",
        "stepType": "api",
        "status": "conditional",
        "output": "empty_result",
        "dependencies": ["filter_data"]
      }
    ],
    "estimatedDuration": "2-5分钟",
    "complexity": "medium",
    "criticalPath": ["extract_data", "filter_data", "process_data"]
  }
}
```

**错误码**:
- `400`: 请求体无效
- `500`: 服务器内部错误

## 工作流导入/导出端点

### 12. 导出工作流

**端点**: `GET /api/workflows/:id/export`

**描述**: 将工作流导出为JSON文件

**请求**:
```http
GET /api/workflows/wrk_123456789/export
```

**路径参数**:
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 工作流ID |

**响应**:
Content-Type: application/json  
Content-Disposition: attachment; filename="workflow-客户数据处理流程-1678901234567.json"

```json
{
  "workflow": {
    "id": "wrk_123456789",
    "name": "客户数据处理流程",
    "description": "自动处理和分类客户数据",
    "status": "ACTIVE",
    "config": {
      "steps": [...]
    },
    "variables": {
      "api_key": "your-api-key",
      "batch_size": 100
    },
    "userId": "usr_123456789",
    "createdAt": "2026-04-13T10:00:00Z",
    "updatedAt": "2026-04-13T15:30:00Z"
  },
  "metadata": {
    "exportedAt": "2026-04-14T00:10:00Z",
    "version": "1.0.0",
    "exporter": "system"
  }
}
```

**错误码**:
- `400`: 工作流ID为空
- `404`: 工作流不存在
- `500`: 服务器内部错误

### 13. 导入工作流

**端点**: `POST /api/workflows/import`

**描述**: 从JSON文件导入工作流

**请求**:
```http
POST /api/workflows/import
```

**请求体**:
```json
{
  "workflow": {
    "id": "wrk_123456789",
    "name": "客户数据处理流程",
    "description": "自动处理和分类客户数据",
    "status": "ACTIVE",
    "config": {
      "steps": [...]
    },
    "variables": {
      "api_key": "your-api-key",
      "batch_size": 100
    },
    "userId": "usr_123456789",
    "createdAt": "2026-04-13T10:00:00Z",
    "updatedAt": "2026-04-13T15:30:00Z"
  },
  "options": {
    "name": "新的工作流名称",
    "draft": true,
    "overwrite": false
  }
}
```

**请求体参数**:
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `workflow` | object | 是 | 工作流数据对象 |
| `options` | object | 否 | 导入选项 |
| `options.name` | string | 否 | 自定义名称，不使用原名称 |
| `options.draft` | boolean | 否 | 导入为草稿状态，默认false |
| `options.overwrite` | boolean | 否 | 覆盖同名工作流，默认false |

**响应**:
```json
{
  "success": true,
  "message": "工作流导入成功",
  "data": {
    "id": "wrk_987654321",
    "name": "新的工作流名称",
    "description": "自动处理和分类客户数据",
    "status": "DRAFT",
    "config": {
      "steps": [...]
    },
    "variables": {
      "api_key": "your-api-key",
      "batch_size": 100
    },
    "userId": "usr_123456789",
    "createdAt": "2026-04-14T00:10:00Z",
    "sourceWorkflowId": "wrk_123456789",
    "sourceWorkflowName": "客户数据处理流程"
  }
}
```

**错误码**:
- `400`: 请求体无效或工作流数据错误
- `409`: 同名工作流已存在且不允许覆盖
- `500`: 服务器内部错误

### 14. 克隆工作流

**端点**: `POST /api/workflows/:id/clone`

**描述**: 克隆指定工作流

**请求**:
```http
POST /api/workflows/wrk_123456789/clone
```

**路径参数**:
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 原工作流ID |

**请求体**:
```json
{
  "name": "客户数据处理流程（副本）"
}
```

**请求体参数**:
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `name` | string | 否 | 新工作流名称，默认为原名称+"（副本）" |

**响应**:
```json
{
  "success": true,
  "message": "工作流克隆成功",
  "data": {
    "id": "wrk_987654321",
    "name": "客户数据处理流程（副本）",
    "description": "自动处理和分类客户数据",
    "status": "DRAFT",
    "config": {
      "steps": [...]
    },
    "variables": {
      "api_key": "your-api-key",
      "batch_size": 100
    },
    "userId": "usr_123456789",
    "createdAt": "2026-04-14T00:10:00Z",
    "sourceWorkflowId": "wrk_123456789",
    "sourceWorkflowName": "客户数据处理流程"
  }
}
```

**错误码**:
- `400`: 工作流ID为空或请求参数无效
- `404**: 原工作流不存在
- `403**: 没有权限克隆此工作流
- `409**: 工作流名称已存在
- `500`: 服务器内部错误

## 错误码说明

### 通用错误码
| 状态码 | 错误码 | 说明 |
|--------|--------|------|
| 400 | `INVALID_REQUEST` | 请求参数无效 |
| 400 | `VALIDATION_ERROR` | 数据验证失败 |
| 401 | `UNAUTHORIZED` | 未授权访问 |
| 403 | `FORBIDDEN` | 访问被禁止 |
| 404 | `NOT_FOUND` | 资源不存在 |
| 409 | `CONFLICT` | 资源冲突（如名称重复） |
| 500 | `INTERNAL_ERROR` | 服务器内部错误 |
| 502 | `SERVICE_UNAVAILABLE` | 服务不可用 |
| 503 | `TIMEOUT` | 请求超时 |

### 工作流特定错误码
| 错误码 | 说明 | 解决方案 |
|--------|------|----------|
| `WORKFLOW_NOT_FOUND` | 工作流不存在 | 检查工作流ID是否正确 |
| `WORKFLOW_INVALID_CONFIG` | 工作流配置无效 | 验证配置结构和语法 |
| `WORKFLOW_CONFLICT` | 工作流冲突 | 修改工作流名称或状态 |
| `WORKFLOW_HAS_ACTIVE_EXECUTIONS` | 工作流包含活跃执行 | 等待执行完成或取消执行 |
| `EXECUTION_TIMEOUT` | 工作流执行超时 | 增加超时时间或优化工作流 |
| `STEP_EXECUTION_FAILED` | 步骤执行失败 | 检查步骤配置和依赖 |

### 认证错误码
| 错误码 | 说明 | 解决方案 |
|--------|------|----------|
| `INVALID_CREDENTIALS` | 无效的登录凭据 | 检查用户名和密码 |
| `INVALID_TOKEN` | 无效的访问令牌 | 重新登录获取新令牌 |
| `TOKEN_EXPIRED` | 访问令牌已过期 | 使用刷新令牌重新获取 |
| `ACCESS_DENIED` | 访问被拒绝 | 检查用户权限 |

## 使用示例

### 1. 创建并执行工作流

```bash
# 1. 登录获取token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "password"}'

# 2. 创建工作流
curl -X POST http://localhost:3000/api/workflows \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "测试工作流",
    "description": "用于测试的基本工作流",
    "config": {
      "steps": [
        {
          "id": "hello_step",
          "type": "api",
          "name": "问候API",
          "config": {
            "method": "GET",
            "url": "https://api.example.com/hello",
            "timeout": 10000
          }
        }
      ]
    }
  }'

# 3. 执行工作流
curl -X POST http://localhost:3000/api/workflows/wrk_123456789/execute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "variables": {
      "message": "Hello World"
    },
    "priority": "NORMAL"
  }'

# 4. 查看执行历史
curl -X GET "http://localhost:3000/api/workflows/wrk_123456789/executions?limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. 工作流导入导出

```bash
# 导出工作流
curl -X GET http://localhost:3000/api/workflows/wrk_123456789/export \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o workflow-export.json

# 导入工作流
curl -X POST http://localhost:3000/api/workflows/import \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d @workflow-export.json
```

## 性能和限制

### 限制说明
- **分页限制**: 每页最多100条记录
- **超时限制**: 工作流执行最长3600秒（1小时）
- **文件大小**: 上传文件大小限制10MB
- **并发限制**: 每个用户最多同时执行5个工作流
- **API频率限制**: 每分钟最多60次API调用

### 性能优化建议
1. **批量操作**: 使用批量导入/导出功能
2. **分页查询**: 大量数据时分页查询
3. **缓存策略**: 缓存频繁访问的工作流配置
4. **异步执行**: 长时间任务使用异步执行
5. **错误重试**: 配置自动重试机制

## 更新日志

### v1.0.0 (2026-04-14)
- 初始版本发布
- 支持基本工作流管理功能
- 提供完整的API文档
- 支持工作流导入/导出
- 实现错误处理和重试机制
- 添加性能监控和日志记录

## 支持和反馈

如有问题或建议，请通过以下方式联系：
- 邮箱: support@ai-workspace-orchestrator.com
- GitHub Issues: https://github.com/ai-ideas-lab/ai-workspace-orchestrator/issues
- 文档: https://docs.ai-workspace-orchestrator.com