# AI Workspace Orchestrator API 文档 (更新版)

## 概述

本文档详细描述了 AI Workspace Orchestrator 的最新 API 接口，基于当前源代码分析生成，包含所有工作流管理、执行、导入导出等功能。

## 基础信息

- **基础URL**: `http://localhost:3000/api`
- **内容类型**: `application/json`
- **认证方式**: JWT Bearer Token

## 通用响应格式

### 成功响应

```json
{
  "success": true,
  "message": "操作成功",
  "data": {},
  "timestamp": "2026-04-14T06:11:00Z",
  "requestId": "req-123456789"
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
  "timestamp": "2026-04-14T06:11:00Z",
  "requestId": "req-123456789"
}
```

## 系统管理接口

### 1. 健康检查

**GET** `/health`

检查服务运行状态。

#### 请求参数

无

#### 响应示例

```json
{
  "success": true,
  "message": "服务运行正常",
  "requestId": "req-123456789",
  "timestamp": "2026-04-14T06:11:00Z",
  "uptime": 1234.56
}
```

#### 错误码

- `500`: 服务内部错误

---

### 2. 系统信息

**GET** `/system`

获取系统详细信息，包括内存、CPU、运行时间等。

#### 请求参数

无

#### 响应示例

```json
{
  "success": true,
  "message": "系统信息",
  "requestId": "req-123456789",
  "timestamp": "2026-04-14T06:11:00Z",
  "environment": "development",
  "version": "20.15.1",
  "platform": "darwin",
  "arch": "x64",
  "uptime": {
    "seconds": 1234,
    "formatted": "20m 34s"
  },
  "memory": {
    "rss": "125MB",
    "heapTotal": "45MB",
    "heapUsed": "32MB",
    "external": "5MB"
  },
  "cpu": {
    "user": "1250ms",
    "system": "800ms"
  },
  "port": 3000
}
```

#### 错误码

- `500`: 服务内部错误

---

## 工作流管理接口

### 3. 获取工作流列表

**GET** `/workflows`

获取工作流列表，支持分页、状态筛选、用户筛选等功能。

#### 请求参数

| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| page | number | 否 | 页码，默认为1 |
| limit | number | 否 | 每页数量，默认为10，最大100 |
| status | string | 否 | 工作流状态：DRAFT, ACTIVE, PAUSED, ARCHIVED |
| userId | string | 否 | 用户ID筛选 |
| search | string | 否 | 搜索关键词，匹配名称和描述 |

#### 请求示例

```bash
curl -X GET "http://localhost:3000/api/workflows?page=1&limit=10&status=ACTIVE&search=订单" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 响应示例

```json
{
  "success": true,
  "message": "获取工作流列表成功",
  "data": [
    {
      "id": "workflow-001",
      "name": "订单处理工作流",
      "description": "自动处理新订单",
      "status": "ACTIVE",
      "config": {
        "steps": [
          {
            "type": "api",
            "name": "验证订单",
            "config": {
              "url": "https://api.example.com/validate",
              "method": "POST",
              "headers": {
                "Content-Type": "application/json"
              }
            }
          }
        ],
        "timeout": 300000,
        "errorHandling": {
          "continueOnError": true
        }
      },
      "variables": {
        "priority": "HIGH",
        "retry_count": 3
      },
      "userId": "user-001",
      "createdAt": "2026-04-14T06:11:00Z",
      "updatedAt": "2026-04-14T06:11:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  },
  "timestamp": "2026-04-14T06:11:00Z"
}
```

#### 错误码

- `400`: 分页参数无效
- `401`: 未授权
- `500`: 服务器内部错误

---

### 4. 创建工作流

**POST** `/workflows`

创建新的工作流，包含配置验证和默认状态设置。

#### 请求参数

| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| name | string | 是 | 工作流名称，最大200字符 |
| description | string | 否 | 工作流描述 |
| config | object | 是 | 工作流配置对象，必须包含steps数组 |
| variables | object | 否 | 全局变量定义 |
| userId | string | 否 | 用户ID，默认从认证信息获取 |

#### 请求示例

```json
{
  "name": "数据同步工作流",
  "description": "自动同步外部API数据到本地数据库",
  "config": {
    "steps": [
      {
        "type": "api",
        "name": "获取外部数据",
        "config": {
          "url": "https://api.example.com/data",
          "method": "GET",
          "timeout": 30000,
          "retryPolicy": {
            "maxAttempts": 3,
            "delay": 1000
          }
        }
      },
      {
        "type": "api",
        "name": "数据验证",
        "config": {
          "url": "https://api.example.com/validate",
          "method": "POST",
          "body": {
            "data": "${step1.response.data}"
          }
        }
      },
      {
        "type": "api",
        "name": "保存到数据库",
        "config": {
          "url": "https://api.example.com/save",
          "method": "POST",
          "body": {
            "validated_data": "${step2.response.validated_data}"
          }
        }
      }
    ],
    "timeout": 300000,
    "errorHandling": {
      "continueOnError": false,
      "errorStep": "notification"
    }
  },
  "variables": {
    "sync_interval": "24h",
    "retry_count": 3,
    "auto_backup": true
  }
}
```

#### 响应示例

```json
{
  "success": true,
  "message": "工作流创建成功",
  "data": {
    "id": "workflow-002",
    "name": "数据同步工作流",
    "description": "自动同步外部API数据到本地数据库",
    "status": "DRAFT",
    "config": {
      "steps": [
        {
          "type": "api",
          "name": "获取外部数据",
          "config": {
            "url": "https://api.example.com/data",
            "method": "GET",
            "timeout": 30000,
            "retryPolicy": {
              "maxAttempts": 3,
              "delay": 1000
            }
          }
        }
      ],
      "timeout": 300000,
      "errorHandling": {
        "continueOnError": false,
        "errorStep": "notification"
      }
    },
    "variables": {
      "sync_interval": "24h",
      "retry_count": 3,
      "auto_backup": true
    },
    "userId": "user-001",
    "createdAt": "2026-04-14T06:11:00Z",
    "updatedAt": "2026-04-14T06:11:00Z"
  },
  "timestamp": "2026-04-14T06:11:00Z"
}
```

#### 错误码

- `400`: 请求参数验证失败
- `401`: 未授权
- `409`: 工作流名称已存在
- `500`: 服务器内部错误

---

### 5. 获取工作流详情

**GET** `/workflows/:id`

获取指定工作流的详细信息，包括执行历史。

#### 路径参数

| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| id | string | 是 | 工作流ID |

#### 请求示例

```bash
curl -X GET "http://localhost:3000/api/workflows/workflow-002" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 响应示例

```json
{
  "success": true,
  "message": "获取工作流详情成功",
  "data": {
    "id": "workflow-002",
    "name": "数据同步工作流",
    "description": "自动同步外部API数据到本地数据库",
    "status": "ACTIVE",
    "config": {
      "steps": [
        {
          "type": "api",
          "name": "获取外部数据",
          "config": {
            "url": "https://api.example.com/data",
            "method": "GET",
            "timeout": 30000,
            "retryPolicy": {
              "maxAttempts": 3,
              "delay": 1000
            }
          }
        },
        {
          "type": "api",
          "name": "数据验证",
          "config": {
            "url": "https://api.example.com/validate",
            "method": "POST",
            "body": {
              "data": "${step1.response.data}"
            }
          }
        }
      ],
      "timeout": 300000,
      "errorHandling": {
        "continueOnError": false,
        "errorStep": "notification"
      }
    },
    "variables": {
      "sync_interval": "24h",
      "retry_count": 3,
      "auto_backup": true
    },
    "userId": "user-001",
    "executions": [
      {
        "id": "exec-001",
        "status": "COMPLETED",
        "startedAt": "2026-04-14T06:11:00Z",
        "completedAt": "2026-04-14T06:15:00Z",
        "result": "数据同步成功"
      }
    ],
    "createdAt": "2026-04-14T06:11:00Z",
    "updatedAt": "2026-04-14T06:11:00Z"
  },
  "timestamp": "2026-04-14T06:11:00Z"
}
```

#### 错误码

- `400`: 工作流ID不能为空
- `404`: 工作流不存在
- `401`: 未授权
- `500`: 服务器内部错误

---

### 6. 更新工作流

**PUT** `/workflows/:id`

更新指定工作流的信息，支持部分更新。

#### 路径参数

| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| id | string | 是 | 工作流ID |

#### 请求参数

| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| name | string | 否 | 工作流名称，最大200字符 |
| description | string | 否 | 工作流描述 |
| config | object | 否 | 工作流配置对象 |
| variables | object | 否 | 变量定义 |
| status | string | 否 | 工作流状态：DRAFT, ACTIVE, PAUSED, ARCHIVED |

#### 请求示例

```json
{
  "name": "数据同步工作流 v2",
  "description": "增强版数据同步流程",
  "status": "ACTIVE",
  "config": {
    "steps": [
      {
        "type": "api",
        "name": "获取外部数据",
        "config": {
          "url": "https://api.example.com/data/v2",
          "method": "GET",
          "timeout": 45000
        }
      },
      {
        "type": "api",
        "name": "增强数据验证",
        "config": {
          "url": "https://api.example.com/validate",
          "method": "POST",
          "body": {
            "data": "${step1.response.data}",
            "strict_mode": true
          }
        }
      }
    ],
    "timeout": 450000,
    "errorHandling": {
      "continueOnError": false,
      "errorStep": "enhanced_notification"
    }
  },
  "variables": {
    "sync_interval": "12h",
    "retry_count": 5,
    "auto_backup": true,
    "data_validation": "strict"
  }
}
```

#### 响应示例

```json
{
  "success": true,
  "message": "工作流更新成功",
  "data": {
    "id": "workflow-002",
    "name": "数据同步工作流 v2",
    "description": "增强版数据同步流程",
    "status": "ACTIVE",
    "config": {
      "steps": [
        {
          "type": "api",
          "name": "获取外部数据",
          "config": {
            "url": "https://api.example.com/data/v2",
            "method": "GET",
            "timeout": 45000
          }
        }
      ],
      "timeout": 450000,
      "errorHandling": {
        "continueOnError": false,
        "errorStep": "enhanced_notification"
      }
    },
    "variables": {
      "sync_interval": "12h",
      "retry_count": 5,
      "auto_backup": true,
      "data_validation": "strict"
    },
    "userId": "user-001",
    "createdAt": "2026-04-14T06:11:00Z",
    "updatedAt": "2026-04-14T06:20:00Z"
  },
  "timestamp": "2026-04-14T06:20:00Z"
}
```

#### 错误码

- `400`: 请求参数验证失败
- `404`: 工作流不存在
- `401`: 未授权
- `500`: 服务器内部错误

---

### 7. 删除工作流

**DELETE** `/workflows/:id`

删除指定工作流，包含活跃执行检查。

#### 路径参数

| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| id | string | 是 | 工作流ID |

#### 请求示例

```bash
curl -X DELETE "http://localhost:3000/api/workflows/workflow-002" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 响应示例

```json
{
  "success": true,
  "message": "工作流删除成功",
  "data": null,
  "timestamp": "2026-04-14T06:25:00Z"
}
```

#### 错误码

- `400`: 工作流ID不能为空
- `404`: 工作流不存在
- `409`: 工作流包含活跃执行，无法删除
- `401`: 未授权
- `500`: 服务器内部错误

---

### 8. 执行工作流

**POST** `/workflows/:id/execute`

异步执行指定工作流，返回执行ID和状态。

#### 路径参数

| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| id | string | 是 | 工作流ID |

#### 请求参数

| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| variables | object | 否 | 执行时变量覆盖 |
| priority | string | 否 | 优先级：LOW, NORMAL, HIGH, URGENT |
| timeout | number | 否 | 超时时间（秒），1-3600 |

#### 请求示例

```json
{
  "variables": {
    "input_data": "sample_data_123",
    "batch_mode": true
  },
  "priority": "HIGH",
  "timeout": 1800
}
```

#### 响应示例

```json
{
  "success": true,
  "message": "工作流执行启动成功",
  "data": {
    "id": "exec-003",
    "status": "PENDING",
    "workflowId": "workflow-002",
    "inputVariables": {
      "input_data": "sample_data_123",
      "batch_mode": true
    },
    "priority": "HIGH",
    "estimatedDuration": 1800,
    "startedAt": "2026-04-14T06:30:00Z"
  },
  "timestamp": "2026-04-14T06:30:00Z"
}
```

#### 错误码

- `400`: 请求参数验证失败
- `404`: 工作流不存在
- `401`: 未授权
- `429`: 工作流队列已满
- `500`: 服务器内部错误

---

### 9. 获取执行历史

**GET** `/workflows/:id/executions`

获取指定工作流的执行历史记录。

#### 路径参数

| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| id | string | 是 | 工作流ID |

#### 请求参数

| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| page | number | 否 | 页码，默认为1 |
| limit | number | 否 | 每页数量，默认为20，最大100 |
| status | string | 否 | 执行状态：PENDING, RUNNING, COMPLETED, FAILED, CANCELLED |
| startDate | string | 否 | 开始日期，ISO格式 |
| endDate | string | 否 | 结束日期，ISO格式 |

#### 请求示例

```bash
curl -X GET "http://localhost:3000/api/workflows/workflow-002/executions?status=COMPLETED&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 响应示例

```json
{
  "success": true,
  "message": "获取执行历史成功",
  "data": [
    {
      "id": "exec-003",
      "workflowId": "workflow-002",
      "status": "COMPLETED",
      "inputVariables": {
        "input_data": "sample_data_123",
        "batch_mode": true
      },
      "priority": "HIGH",
      "startedAt": "2026-04-14T06:30:00Z",
      "completedAt": "2026-04-14T06:35:00Z",
      "duration": 300,
      "result": "执行成功",
      "error": null,
      "logs": ["步骤1完成", "步骤2完成", "步骤3完成"]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  },
  "timestamp": "2026-04-14T06:40:00Z"
}
```

#### 错误码

- `400`: 分页参数或日期格式错误
- `404`: 工作流不存在
- `401`: 未授权
- `500`: 服务器内部错误

---

### 10. 验证工作流配置

**POST** `/workflows/validate`

静态验证工作流配置，不执行实际操作。

#### 请求参数

| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| config | object | 是 | 工作流配置对象 |

#### 请求示例

```json
{
  "config": {
    "steps": [
      {
        "type": "api",
        "name": "数据获取",
        "config": {
          "url": "https://api.example.com/data",
          "method": "GET"
        }
      },
      {
        "type": "api",
        "name": "数据处理",
        "config": {
          "url": "https://api.example.com/process",
          "method": "POST",
          "body": {
            "data": "${step1.response.data}"
          }
        }
      }
    ],
    "timeout": 300000
  }
}
```

#### 响应示例

```json
{
  "success": true,
  "message": "工作流配置验证通过",
  "data": {
    "isValid": true,
    "warnings": [
      "建议添加重试策略以提高可靠性",
      "建议添加错误处理步骤"
    ],
    "suggestions": [
      "为API步骤添加超时设置",
      "建议添加条件判断步骤"
    ]
  },
  "timestamp": "2026-04-14T06:45:00Z"
}
```

#### 错误码

- `400`: 配置验证失败，包含详细错误信息
- `401`: 未授权
- `500`: 服务器内部错误

---

### 11. 获取执行路径

**POST** `/workflows/execution-path`

分析工作流配置，返回可能的执行路径。

#### 请求参数

| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| config | object | 是 | 工作流配置对象 |
| input | object | 否 | 输入变量，用于路径分析 |

#### 请求示例

```json
{
  "config": {
    "steps": [
      {
        "type": "api",
        "name": "条件判断",
        "config": {
          "url": "https://api.example.com/condition",
          "method": "POST",
          "body": {
            "data": "${input}"
          }
        }
      },
      {
        "type": "api",
        "name": "分支A",
        "config": {
          "url": "https://api.example.com/branch-a",
          "method": "POST",
          "condition": "${step1.response.condition} == 'A'"
        }
      },
      {
        "type": "api",
        "name": "分支B",
        "config": {
          "url": "https://api.example.com/branch-b",
          "method": "POST",
          "condition": "${step1.response.condition} == 'B'"
        }
      }
    ]
  },
  "input": {
    "test_data": "sample_input"
  }
}
```

#### 响应示例

```json
{
  "success": true,
  "message": "执行路径分析成功",
  "data": {
    "possiblePaths": [
      {
        "id": "path-001",
        "name": "条件为A时的路径",
        "steps": ["条件判断", "分支A"],
        "condition": "${step1.response.condition} == 'A'",
        "estimatedDuration": 60000
      },
      {
        "id": "path-002", 
        "name": "条件为B时的路径",
        "steps": ["条件判断", "分支B"],
        "condition": "${step1.response.condition} == 'B'",
        "estimatedDuration": 45000
      }
    ],
    "dependencies": [
      {
        "step": "分支A",
        "dependsOn": ["条件判断"],
        "variable": "${step1.response.condition}"
      }
    ],
    "estimatedTotalDuration": 60000,
    "parallelExecution": false
  },
  "timestamp": "2026-04-14T07:00:00Z"
}
```

#### 错误码

- `400`: 配置分析失败
- `401`: 未授权
- `500`: 服务器内部错误

---

### 12. 克隆工作流

**POST** `/workflows/:id/clone`

基于现有工作流创建副本，支持自定义名称。

#### 路径参数

| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| id | string | 是 | 原始工作流ID |

#### 请求参数

| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| name | string | 否 | 新工作流名称，默认为"原名称(副本)" |

#### 请求示例

```json
{
  "name": "数据同步工作流 - 测试环境"
}
```

#### 响应示例

```json
{
  "success": true,
  "message": "工作流克隆成功",
  "data": {
    "id": "workflow-003",
    "name": "数据同步工作流 - 测试环境",
    "description": "自动同步外部API数据到本地数据库",
    "status": "DRAFT",
    "config": {
      "steps": [
        {
          "type": "api",
          "name": "获取外部数据",
          "config": {
            "url": "https://api.example.com/data",
            "method": "GET"
          }
        }
      ]
    },
    "variables": {
      "sync_interval": "24h",
      "retry_count": 3,
      "auto_backup": true
    },
    "sourceWorkflowId": "workflow-002",
    "sourceWorkflowName": "数据同步工作流 v2",
    "userId": "user-001",
    "createdAt": "2026-04-14T07:05:00Z",
    "updatedAt": "2026-04-14T07:05:00Z"
  },
  "timestamp": "2026-04-14T07:05:00Z"
}
```

#### 错误码

- `400`: 工作流ID不能为空
- `404`: 原始工作流不存在
- `403`: 没有权限克隆此工作流
- `401`: 未授权
- `500`: 服务器内部错误

---

### 13. 导出工作流

**GET** `/workflows/:id/export`

将工作流导出为JSON格式文件。

#### 路径参数

| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| id | string | 是 | 工作流ID |

#### 请求示例

```bash
curl -X GET "http://localhost:3000/api/workflows/workflow-002/export" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 响应示例

```json
{
  "success": true,
  "message": "工作流导出成功",
  "data": {
    "workflow": {
      "id": "workflow-002",
      "name": "数据同步工作流 v2",
      "description": "增强版数据同步流程",
      "status": "ACTIVE",
      "config": {
        "steps": [
          {
            "type": "api",
            "name": "获取外部数据",
            "config": {
              "url": "https://api.example.com/data/v2",
              "method": "GET"
            }
          }
        ],
        "timeout": 450000
      },
      "variables": {
        "sync_interval": "12h",
        "retry_count": 5,
        "auto_backup": true
      },
      "createdAt": "2026-04-14T06:11:00Z",
      "updatedAt": "2026-04-14T06:20:00Z"
    },
    "exportMetadata": {
      "version": "1.0",
      "exportedAt": "2026-04-14T07:10:00Z",
      "format": "json",
      "includeExecutions": false
    }
  },
  "timestamp": "2026-04-14T07:10:00Z"
}
```

#### 错误码

- `400`: 工作流ID不能为空
- `404`: 工作流不存在
- `401`: 未授权
- `500`: 服务器内部错误

---

### 14. 导入工作流

**POST** `/workflows/import`

从JSON文件导入工作流，支持选项配置。

#### 请求参数

| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| workflow | object | 是 | 工作流数据对象 |
| options | object | 否 | 导入选项 |

#### 选项参数

| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| name | string | 否 | 自定义工作流名称 |
| draft | boolean | 否 | 导入后设置为草稿状态，默认false |
| overwrite | boolean | 否 | 是否覆盖同名工作流，默认false |

#### 请求示例

```json
{
  "workflow": {
    "id": "imported-workflow-001",
    "name": "已导入的工作流",
    "description": "从外部导入的工作流",
    "status": "ACTIVE",
    "config": {
      "steps": [
        {
          "type": "api",
          "name": "数据获取",
          "config": {
            "url": "https://api.example.com/data",
            "method": "GET"
          }
        }
      ],
      "timeout": 300000
    },
    "variables": {
      "source": "import"
    }
  },
  "options": {
    "name": "自定义导入名称",
    "draft": true,
    "overwrite": false
  }
}
```

#### 响应示例

```json
{
  "success": true,
  "message": "工作流导入成功",
  "data": {
    "id": "workflow-004",
    "name": "自定义导入名称",
    "description": "从外部导入的工作流",
    "status": "DRAFT",
    "config": {
      "steps": [
        {
          "type": "api",
          "name": "数据获取",
          "config": {
            "url": "https://api.example.com/data",
            "method": "GET"
          }
        }
      ],
      "timeout": 300000
    },
    "variables": {
      "source": "import"
    },
    "importMetadata": {
      "originalId": "imported-workflow-001",
      "importedAt": "2026-04-14T07:15:00Z",
      "version": "1.0"
    },
    "userId": "user-001",
    "createdAt": "2026-04-14T07:15:00Z",
    "updatedAt": "2026-04-14T07:15:00Z"
  },
  "timestamp": "2026-04-14T07:15:00Z"
}
```

#### 错误码

- `400`: 请求体中缺少workflow数据或选项验证失败
- `409`: 工作流名称已存在且overwrite为false
- `401`: 未授权
- `500`: 服务器内部错误

---

## 错误码说明

### 4xx - 客户端错误

| 错误码 | 说明 | 解决方案 |
|--------|------|----------|
| 400 | 请求参数验证失败 | 检查请求数据格式和必需字段 |
| 401 | 未授权或认证失败 | 检查JWT Token有效性 |
| 403 | 权限不足 | 检查用户权限设置 |
| 404 | 资源不存在 | 检查ID是否正确 |
| 409 | 资源冲突（如名称重复） | 使用不同的名称或启用覆盖选项 |
| 429 | 请求频率超限 | 降低请求频率或重试 |

### 5xx - 服务器错误

| 错误码 | 说明 | 解决方案 |
|--------|------|----------|
| 500 | 服务器内部错误 | 检查服务器日志并重启服务 |
| 502 | 网关错误 | 检查依赖服务状态 |
| 503 | 服务暂时不可用 | 等待服务恢复后重试 |
| 504 | 网关超时 | 增加超时时间或优化性能 |

---

## 认证要求

所有API请求（除了健康检查）都需要在请求头中包含JWT Token：

```
Authorization: Bearer YOUR_JWT_TOKEN
```

Token可以通过用户登录接口获取，并在过期前刷新。

---

## 最佳实践

### 1. API调用建议

- **使用HTTPS**: 确保数据传输安全
- **实现重试机制**: 对于网络错误使用指数退避重试
- **设置合理超时**: 根据业务需求设置请求超时
- **连接池管理**: 复用HTTP连接以提高性能

### 2. 错误处理

- **检查状态码**: 始终检查HTTP状态码
- **解析错误响应**: 解析错误详情并记录日志
- **用户友好提示**: 向用户提供清晰的错误信息
- **监控错误频率**: 监控错误率以发现潜在问题

### 3. 性能优化

- **分页使用**: 大量数据查询时使用分页
- **缓存策略**: 对频繁访问的数据进行缓存
- **异步处理**: 使用异步API以避免阻塞
- **批量操作**: 支持批量操作以减少网络往返

### 4. 数据安全

- **输入验证**: 验证所有输入数据
- **输出转义**: 转义输出数据以防止XSS攻击
- **权限控制**: 实施细粒度的访问控制
- **敏感数据保护**: 避免在日志中记录敏感信息

---

## 版本历史

### v2.1 (当前版本)
- 新增工作流克隆功能
- 新增执行路径分析功能
- 新增工作流导入/导出功能
- 增强错误处理和重试机制
- 新增系统信息端点

### v2.0
- 增强版API控制器
- 装饰器模式错误处理
- 自动重试机制
- 性能监控功能
- 更严格的输入验证

### v1.0
- 基础工作流管理API
- 简单的CRUD操作
- 基础错误处理
- 手动重试机制

---

## 联系支持

如有问题或建议，请联系：
- 邮箱：support@ai-orchestrator.com
- 文档：https://docs.ai-orchestrator.com
- 社区：https://community.ai-orchestrator.com
- Issue报告：https://github.com/ai-ideas-lab/ai-workspace-orchestrator/issues