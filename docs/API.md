# AI Workspace Orchestrator API 文档

## 概述

AI Workspace Orchestrator 是企业级AI工作流自动化平台，通过自然语言界面智能调度多个AI引擎。本文档提供完整的API接口说明。

## 基础信息

- **基础URL**: `http://localhost:3000`
- **API前缀**: `/api`
- **响应格式**: JSON
- **认证方式**: JWT Bearer Token

## 通用响应格式

### 成功响应

```json
{
  "success": true,
  "message": "操作成功",
  "data": {},
  "timestamp": "2026-04-14T10:10:00Z",
  "requestId": "req_123456789"
}
```

### 错误响应

```json
{
  "success": false,
  "message": "错误描述",
  "error": {
    "code": "ERROR_CODE",
    "details": "错误详情"
  },
  "timestamp": "2026-04-14T10:10:00Z",
  "requestId": "req_123456789"
}
```

## 系统端点

### 1. 健康检查

**GET** `/health`

检查服务运行状态。

**请求示例**:
```bash
curl -X GET http://localhost:3000/health
```

**响应示例**:
```json
{
  "success": true,
  "message": "服务运行正常",
  "requestId": "req_123456789",
  "timestamp": "2026-04-14T02:10:00Z",
  "uptime": 3600
}
```

**响应参数**:
- `success`: 服务状态
- `message`: 状态消息
- `requestId`: 请求ID
- `timestamp`: 响应时间戳
- `uptime`: 运行时间（秒）

### 2. 系统信息

**GET** `/system`

获取系统详细信息。

**请求示例**:
```bash
curl -X GET http://localhost:3000/system
```

**响应示例**:
```json
{
  "success": true,
  "message": "系统信息",
  "requestId": "req_123456789",
  "timestamp": "2026-04-14T02:10:00Z",
  "environment": "development",
  "version": "18.17.0",
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
    "user": "500ms",
    "system": "200ms"
  },
  "port": 3000
}
```

**响应参数**:
- `environment`: 运行环境
- `version`: Node.js版本
- `platform`: 操作系统平台
- `arch`: 系统架构
- `uptime`: 运行时间信息
- `memory`: 内存使用情况
- `cpu`: CPU使用情况
- `port`: 服务端口

## 工作流管理API

### 3. 获取工作流列表

**GET** `/api/workflows`

获取工作流列表，支持分页和筛选。

**请求参数**:
| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `page` | number | 否 | 页码，默认1 |
| `limit` | number | 否 | 每页数量，默认10 |
| `status` | string | 否 | 状态筛选 |
| `userId` | string | 否 | 用户ID筛选 |
| `search` | string | 否 | 搜索关键词 |

**请求示例**:
```bash
curl -X GET "http://localhost:3000/api/workflows?page=1&limit=10&status=ACTIVE&search=测试"
```

**响应示例**:
```json
{
  "success": true,
  "message": "获取工作流列表成功",
  "data": [
    {
      "id": "wf_001",
      "name": "数据处理工作流",
      "description": "自动化数据处理和分析",
      "status": "ACTIVE",
      "config": {
        "steps": [
          {
            "id": "step_1",
            "type": "data_extraction",
            "config": {}
          }
        ]
      },
      "variables": {},
      "userId": "user_001",
      "createdAt": "2026-04-14T02:10:00Z",
      "updatedAt": "2026-04-14T02:10:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  },
  "timestamp": "2026-04-14T02:10:00Z"
}
```

**响应参数**:
- `data`: 工作流数据数组
- `pagination`: 分页信息

### 4. 创建工作流

**POST** `/api/workflows`

创建新的工作流。

**请求体**:
```json
{
  "name": "数据处理工作流",
  "description": "自动化数据处理和分析",
  "config": {
    "steps": [
      {
        "id": "step_1",
        "type": "data_extraction",
        "config": {
          "source": "database",
          "table": "users"
        }
      },
      {
        "id": "step_2",
        "type": "data_analysis",
        "config": {
          "algorithm": "统计分析"
        }
      }
    ],
    "triggers": [
      {
        "type": "schedule",
        "config": {
          "cron": "0 0 * * *"
        }
      }
    ]
  },
  "variables": {
    "environment": "production",
    "timeout": 300
  }
}
```

**请求参数**:
| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `name` | string | 是 | 工作流名称 |
| `description` | string | 否 | 工作流描述 |
| `config` | object | 是 | 工作流配置 |
| `variables` | object | 否 | 变量定义 |
| `userId` | string | 否 | 用户ID |

**响应示例**:
```json
{
  "success": true,
  "message": "工作流创建成功",
  "data": {
    "id": "wf_002",
    "name": "数据处理工作流",
    "description": "自动化数据处理和分析",
    "status": "DRAFT",
    "config": {
      "steps": [
        {
          "id": "step_1",
          "type": "data_extraction",
          "config": {
            "source": "database",
            "table": "users"
          }
        }
      ]
    },
    "variables": {
      "environment": "production",
      "timeout": 300
    },
    "userId": "user_001",
    "createdAt": "2026-04-14T02:10:00Z",
    "updatedAt": "2026-04-14T02:10:00Z"
  },
  "timestamp": "2026-04-14T02:10:00Z"
}
```

### 5. 获取工作流详情

**GET** `/api/workflows/{id}`

获取单个工作流的详细信息。

**路径参数**:
| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `id` | string | 是 | 工作流ID |

**请求示例**:
```bash
curl -X GET http://localhost:3000/api/workflows/wf_001
```

**响应示例**:
```json
{
  "success": true,
  "message": "获取工作流详情成功",
  "data": {
    "id": "wf_001",
    "name": "数据处理工作流",
    "description": "自动化数据处理和分析",
    "status": "ACTIVE",
    "config": {
      "steps": [
        {
          "id": "step_1",
          "type": "data_extraction",
          "config": {
            "source": "database",
            "table": "users"
          },
          "nextStep": "step_2"
        }
      ],
      "triggers": [
        {
          "type": "schedule",
          "config": {
            "cron": "0 0 * * *"
          }
        }
      ]
    },
    "variables": {
      "environment": "production",
      "timeout": 300
    },
    "userId": "user_001",
    "executions": [
      {
        "id": "exec_001",
        "status": "COMPLETED",
        "startedAt": "2026-04-14T02:10:00Z",
        "completedAt": "2026-04-14T02:15:00Z"
      }
    ],
    "createdAt": "2026-04-14T02:10:00Z",
    "updatedAt": "2026-04-14T02:10:00Z"
  },
  "timestamp": "2026-04-14T02:10:00Z"
}
```

### 6. 更新工作流

**PUT** `/api/workflows/{id}`

更新现有工作流的信息。

**路径参数**:
| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `id` | string | 是 | 工作流ID |

**请求体**:
```json
{
  "name": "更新后的数据处理工作流",
  "description": "改进的自动化数据处理和分析",
  "config": {
    "steps": [
      {
        "id": "step_1",
        "type": "data_extraction",
        "config": {
          "source": "database",
          "table": "users",
          "limit": 1000
        }
      }
    ]
  },
  "variables": {
    "environment": "production",
    "timeout": 600
  },
  "status": "ACTIVE"
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "工作流更新成功",
  "data": {
    "id": "wf_001",
    "name": "更新后的数据处理工作流",
    "description": "改进的自动化数据处理和分析",
    "status": "ACTIVE",
    "config": {
      "steps": [
        {
          "id": "step_1",
          "type": "data_extraction",
          "config": {
            "source": "database",
            "table": "users",
            "limit": 1000
          }
        }
      ]
    },
    "variables": {
      "environment": "production",
      "timeout": 600
    },
    "userId": "user_001",
    "createdAt": "2026-04-14T02:10:00Z",
    "updatedAt": "2026-04-14T02:20:00Z"
  },
  "timestamp": "2026-04-14T02:20:00Z"
}
```

### 7. 删除工作流

**DELETE** `/api/workflows/{id}`

删除指定的工作流。

**路径参数**:
| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `id` | string | 是 | 工作流ID |

**请求示例**:
```bash
curl -X DELETE http://localhost:3000/api/workflows/wf_001
```

**响应示例**:
```json
{
  "success": true,
  "message": "工作流删除成功",
  "timestamp": "2026-04-14T02:25:00Z"
}
```

### 8. 克隆工作流

**POST** `/api/workflows/{id}/clone`

复制现有工作流创建新工作流。

**路径参数**:
| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `id` | string | 是 | 源工作流ID |

**请求体**:
```json
{
  "name": "数据处理工作流副本"
}
```

**请求参数**:
| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `name` | string | 否 | 新工作流名称 |

**响应示例**:
```json
{
  "success": true,
  "message": "工作流克隆成功",
  "data": {
    "id": "wf_003",
    "name": "数据处理工作流副本",
    "description": "自动化数据处理和分析",
    "status": "DRAFT",
    "config": {
      "steps": [
        {
          "id": "step_1",
          "type": "data_extraction",
          "config": {
            "source": "database",
            "table": "users"
          }
        }
      ]
    },
    "variables": {
      "environment": "production",
      "timeout": 300
    },
    "userId": "user_001",
    "sourceWorkflowId": "wf_001",
    "sourceWorkflowName": "数据处理工作流",
    "createdAt": "2026-04-14T02:30:00Z"
  },
  "timestamp": "2026-04-14T02:30:00Z"
}
```

### 9. 执行工作流

**POST** `/api/workflows/{id}/execute`

启动工作流执行。

**路径参数**:
| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `id` | string | 是 | 工作流ID |

**请求体**:
```json
{
  "inputVariables": {
    "startDate": "2026-04-01",
    "endDate": "2026-04-30",
    "department": "sales"
  },
  "priority": "high"
}
```

**请求参数**:
| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `inputVariables` | object | 否 | 输入变量 |
| `priority` | string | 否 | 执行优先级 |

**响应示例**:
```json
{
  "success": true,
  "message": "工作流执行启动成功",
  "data": {
    "id": "exec_002",
    "workflowId": "wf_001",
    "status": "RUNNING",
    "inputVariables": {
      "startDate": "2026-04-01",
      "endDate": "2026-04-30",
      "department": "sales"
    },
    "priority": "high",
    "startedAt": "2026-04-14T02:35:00Z",
    "estimatedDuration": 300
  },
  "timestamp": "2026-04-14T02:35:00Z"
}
```

### 10. 获取执行历史

**GET** `/api/workflows/{id}/executions`

获取指定工作流的执行历史。

**路径参数**:
| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `id` | string | 是 | 工作流ID |

**请求参数**:
| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `page` | number | 否 | 页码，默认1 |
| `limit` | number | 否 | 每页数量，默认10 |
| `status` | string | 否 | 状态筛选 |
| `startDate` | string | 否 | 开始日期 |
| `endDate` | string | 否 | 结束日期 |

**请求示例**:
```bash
curl -X GET "http://localhost:3000/api/workflows/wf_001/executions?page=1&limit=5&status=COMPLETED"
```

**响应示例**:
```json
{
  "success": true,
  "message": "获取执行历史成功",
  "data": [
    {
      "id": "exec_001",
      "workflowId": "wf_001",
      "status": "COMPLETED",
      "inputVariables": {
        "startDate": "2026-04-01",
        "endDate": "2026-04-30"
      },
      "priority": "normal",
      "startedAt": "2026-04-14T02:10:00Z",
      "completedAt": "2026-04-14T02:15:00Z",
      "duration": 300,
      "result": {
        "processedRecords": 1000,
        "successRate": "95%"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 15,
    "pages": 3
  },
  "timestamp": "2026-04-14T02:40:00Z"
}
```

### 11. 验证工作流配置

**POST** `/api/workflows/validate`

验证工作流配置的有效性。

**请求体**:
```json
{
  "config": {
    "steps": [
      {
        "id": "step_1",
        "type": "data_extraction",
        "config": {
          "source": "database",
          "table": "users"
        }
      },
      {
        "id": "step_2",
        "type": "data_analysis",
        "config": {
          "algorithm": "统计分析"
        }
      }
    ],
    "triggers": [
      {
        "type": "schedule",
        "config": {
          "cron": "0 0 * * *"
        }
      }
    ]
  }
}
```

**请求参数**:
| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `config` | object | 是 | 工作流配置 |

**响应示例**:
```json
{
  "success": true,
  "message": "工作流配置验证成功",
  "data": {
    "valid": true,
    "warnings": [],
    "errors": []
  },
  "timestamp": "2026-04-14T02:45:00Z"
}
```

### 12. 获取执行路径

**POST** `/api/workflows/execution-path`

获取工作流的执行路径预览。

**请求体**:
```json
{
  "config": {
    "steps": [
      {
        "id": "step_1",
        "type": "data_extraction",
        "config": {
          "source": "database",
          "table": "users"
        },
        "nextStep": "step_2"
      },
      {
        "id": "step_2",
        "type": "data_analysis",
        "config": {
          "algorithm": "统计分析"
        },
        "nextStep": "step_3"
      },
      {
        "id": "step_3",
        "type": "report_generation",
        "config": {
          "format": "pdf"
        }
      }
    ]
  }
}
```

**请求参数**:
| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `config` | object | 是 | 工作流配置 |

**响应示例**:
```json
{
  "success": true,
  "message": "获取执行路径成功",
  "data": {
    "steps": [
      {
        "id": "step_1",
        "type": "data_extraction",
        "description": "数据提取步骤",
        "estimatedDuration": 60,
        "dependencies": []
      },
      {
        "id": "step_2",
        "type": "data_analysis",
        "description": "数据分析步骤",
        "estimatedDuration": 120,
        "dependencies": ["step_1"]
      },
      {
        "id": "step_3",
        "type": "report_generation",
        "description": "报告生成步骤",
        "estimatedDuration": 120,
        "dependencies": ["step_2"]
      }
    ],
    "totalEstimatedDuration": 300,
    "parallelSteps": [],
    "criticalPath": ["step_1", "step_2", "step_3"]
  },
  "timestamp": "2026-04-14T02:50:00Z"
}
```

### 13. 导出工作流

**GET** `/api/workflows/{id}/export`

将工作流导出为JSON文件。

**路径参数**:
| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `id` | string | 是 | 工作流ID |

**请求示例**:
```bash
curl -X GET "http://localhost:3000/api/workflows/wf_001/export"
```

**响应示例**:
```json
{
  "success": true,
  "message": "工作流导出成功",
  "data": {
    "workflow": {
      "id": "wf_001",
      "name": "数据处理工作流",
      "description": "自动化数据处理和分析",
      "status": "ACTIVE",
      "config": {
        "steps": [
          {
            "id": "step_1",
            "type": "data_extraction",
            "config": {
              "source": "database",
              "table": "users"
            }
          }
        ]
      },
      "variables": {
        "environment": "production",
        "timeout": 300
      },
      "createdAt": "2026-04-14T02:10:00Z",
      "updatedAt": "2026-04-14T02:10:00Z"
    },
    "exportedAt": "2026-04-14T02:55:00Z",
    "version": "1.0"
  },
  "timestamp": "2026-04-14T02:55:00Z"
}
```

### 14. 导入工作流

**POST** `/api/workflows/import`

从JSON文件导入工作流。

**请求体**:
```json
{
  "workflow": {
    "name": "导入的数据处理工作流",
    "description": "从外部导入的工作流",
    "config": {
      "steps": [
        {
          "id": "step_1",
          "type": "data_extraction",
          "config": {
            "source": "api",
            "endpoint": "https://api.example.com/data"
          }
        }
      ]
    },
    "variables": {
      "environment": "staging",
      "timeout": 600
    }
  },
  "options": {
    "name": "自定义导入名称",
    "draft": true,
    "overwrite": false
  }
}
```

**请求参数**:
| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `workflow` | object | 是 | 工作流数据 |
| `options` | object | 否 | 导入选项 |

**响应示例**:
```json
{
  "success": true,
  "message": "工作流导入成功",
  "data": {
    "id": "wf_004",
    "name": "自定义导入名称",
    "description": "从外部导入的工作流",
    "status": "DRAFT",
    "config": {
      "steps": [
        {
          "id": "step_1",
          "type": "data_extraction",
          "config": {
            "source": "api",
            "endpoint": "https://api.example.com/data"
          }
        }
      ]
    },
    "variables": {
      "environment": "staging",
      "timeout": 600
    },
    "importedFrom": "external",
    "createdAt": "2026-04-14T03:00:00Z"
  },
  "timestamp": "2026-04-14T03:00:00Z"
}
```

## 错误码说明

### 常见错误码

| 错误码 | HTTP状态码 | 描述 |
|--------|------------|------|
| `WORKFLOW_NOT_FOUND` | 404 | 工作流不存在 |
| `WORKFLOW_INVALID_CONFIG` | 400 | 工作流配置无效 |
| `WORKFLOW_NAME_REQUIRED` | 400 | 工作流名称不能为空 |
| `WORKFLOW_NAME_CONFLICT` | 409 | 工作流名称已存在 |
| `EXECUTION_FAILED` | 500 | 工作流执行失败 |
| `VALIDATION_ERROR` | 400 | 参数验证失败 |
| `UNAUTHORIZED` | 401 | 未授权访问 |
| `FORBIDDEN` | 403 | 权限不足 |
| `INTERNAL_SERVER_ERROR` | 500 | 服务器内部错误 |

## 认证要求

大部分API端点需要JWT Bearer Token认证。需要在请求头中添加：

```
Authorization: Bearer <your_jwt_token>
```

## 限流说明

- 所有API端点默认限流：100请求/分钟
- 工作流执行端点限流：10请求/分钟
- 超过限制将返回429状态码

## 示例使用

### 使用curl创建工作流

```bash
curl -X POST http://localhost:3000/api/workflows \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "name": "测试工作流",
    "description": "这是一个测试工作流",
    "config": {
      "steps": [
        {
          "id": "step_1",
          "type": "data_extraction",
          "config": {
            "source": "database",
            "table": "test_table"
          }
        }
      ]
    }
  }'
```

### 使用JavaScript调用API

```javascript
const response = await fetch('/api/workflows', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your_jwt_token'
  },
  body: JSON.stringify({
    name: '测试工作流',
    description: '这是一个测试工作流',
    config: {
      steps: [
        {
          id: 'step_1',
          type: 'data_extraction',
          config: {
            source: 'database',
            table: 'test_table'
          }
        }
      ]
    }
  })
});

const data = await response.json();
console.log(data);
```

## 版本信息

- **API版本**: 1.0
- **文档版本**: 1.0
- **最后更新**: 2026-04-14

---

*本文档由AI Workspace Orchestrator自动生成，如有疑问请联系开发团队。*