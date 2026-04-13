# AI Workspace Orchestrator API 文档

## 概述

本文档详细描述了 AI Workspace Orchestrator 的所有 API 接口，包括工作流管理、执行、导入导出等功能。

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
  "timestamp": "2026-04-13T08:10:00Z",
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
  "timestamp": "2026-04-13T08:10:00Z",
  "requestId": "req-123456789"
}
```

## API 接口详情

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
  "timestamp": "2026-04-13T08:10:00Z",
  "uptime": 1234.56
}
```

#### 错误码

- `500`: 服务内部错误

---

### 2. 获取工作流列表

**GET** `/workflows`

获取所有工作流列表，支持分页和筛选。

#### 请求参数

| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| page | number | 否 | 页码，默认为1 |
| limit | number | 否 | 每页数量，默认为10 |
| status | string | 否 | 工作流状态筛选 |
| userId | string | 否 | 用户ID筛选 |
| search | string | 否 | 搜索关键词 |

#### 请求示例

```bash
curl -X GET "http://localhost:3000/api/workflows?page=1&limit=10&status=ACTIVE" \
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
      "name": "用户数据同步工作流",
      "description": "定期同步用户数据到数据库",
      "status": "ACTIVE",
      "config": {
        "steps": [
          {
            "type": "HTTP",
            "url": "https://api.example.com/users",
            "method": "GET"
          }
        ]
      },
      "variables": {},
      "userId": "user-001",
      "createdAt": "2026-04-13T08:10:00Z",
      "updatedAt": "2026-04-13T08:10:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  },
  "timestamp": "2026-04-13T08:10:00Z"
}
```

#### 错误码

- `401`: 未授权
- `500`: 服务器内部错误

---

### 3. 创建工作流

**POST** `/workflows`

创建新的工作流。

#### 请求参数

| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| name | string | 是 | 工作流名称 |
| description | string | 否 | 工作流描述 |
| config | object | 是 | 工作流配置 |
| variables | object | 否 | 变量定义 |
| userId | string | 否 | 用户ID |

#### 请求示例

```json
{
  "name": "订单处理工作流",
  "description": "自动处理新订单",
  "config": {
    "steps": [
      {
        "type": "HTTP",
        "name": "验证订单",
        "url": "https://api.example.com/validate",
        "method": "POST",
        "headers": {
          "Content-Type": "application/json"
        },
        "timeout": 30000
      },
      {
        "type": "AI",
        "name": "智能分析",
        "model": "gpt-4",
        "prompt": "分析订单风险等级"
      },
      {
        "type": "DATABASE",
        "name": "保存订单",
        "table": "orders",
        "operation": "INSERT"
      }
    ],
    "variables": {
      "order_id": "${step1.response.id}",
      "status": "PROCESSING"
    }
  },
  "variables": {
    "priority": "HIGH",
    "retry_count": 3
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
    "name": "订单处理工作流",
    "description": "自动处理新订单",
    "status": "DRAFT",
    "config": {
      "steps": [
        {
          "type": "HTTP",
          "name": "验证订单",
          "url": "https://api.example.com/validate",
          "method": "POST"
        }
      ]
    },
    "variables": {
      "priority": "HIGH",
      "retry_count": 3
    },
    "userId": "user-001",
    "createdAt": "2026-04-13T08:10:00Z",
    "updatedAt": "2026-04-13T08:10:00Z"
  },
  "timestamp": "2026-04-13T08:10:00Z"
}
```

#### 错误码

- `400`: 请求参数错误
- `401`: 未授权
- `409`: 工作流名称已存在
- `500`: 服务器内部错误

---

### 4. 获取工作流详情

**GET** `/workflows/:id`

获取指定工作流的详细信息。

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
    "name": "订单处理工作流",
    "description": "自动处理新订单",
    "status": "ACTIVE",
    "config": {
      "steps": [
        {
          "type": "HTTP",
          "name": "验证订单",
          "url": "https://api.example.com/validate",
          "method": "POST",
          "timeout": 30000,
          "retryPolicy": {
            "maxAttempts": 3,
            "delay": 1000
          }
        },
        {
          "type": "AI",
          "name": "智能分析",
          "model": "gpt-4",
          "prompt": "分析订单风险等级",
          "temperature": 0.7
        },
        {
          "type": "DATABASE",
          "name": "保存订单",
          "table": "orders",
          "operation": "INSERT",
          "fields": {
            "order_id": "${step1.response.id}",
            "status": "${step2.analysis.risk_level}",
            "created_at": "${timestamp}"
          }
        }
      ],
      "timeout": 300000,
      "errorHandling": {
        "continueOnError": true,
        "errorStep": "notification"
      }
    },
    "variables": {
      "priority": "HIGH",
      "retry_count": 3,
      "auto_approve": false
    },
    "userId": "user-001",
    "executions": [
      {
        "id": "exec-001",
        "status": "COMPLETED",
        "startedAt": "2026-04-13T08:10:00Z",
        "completedAt": "2026-04-13T08:15:00Z",
        "result": "订单处理成功"
      }
    ],
    "createdAt": "2026-04-13T08:10:00Z",
    "updatedAt": "2026-04-13T08:10:00Z"
  },
  "timestamp": "2026-04-13T08:10:00Z"
}
```

#### 错误码

- `400`: 工作流ID不能为空
- `404`: 工作流不存在
- `401`: 未授权
- `500`: 服务器内部错误

---

### 5. 更新工作流

**PUT** `/workflows/:id`

更新指定工作流的信息。

#### 路径参数

| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| id | string | 是 | 工作流ID |

#### 请求参数

| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| name | string | 否 | 工作流名称 |
| description | string | 否 | 工作流描述 |
| config | object | 否 | 工作流配置 |
| variables | object | 否 | 变量定义 |
| status | string | 否 | 工作流状态 |

#### 请求示例

```json
{
  "name": "订单处理工作流 v2",
  "description": "增强版订单处理流程",
  "status": "ACTIVE",
  "config": {
    "steps": [
      {
        "type": "HTTP",
        "name": "验证订单",
        "url": "https://api.example.com/validate",
        "method": "POST"
      },
      {
        "type": "AI",
        "name": "增强智能分析",
        "model": "gpt-4-turbo",
        "prompt": "深度分析订单风险和用户价值"
      }
    ]
  },
  "variables": {
    "priority": "HIGH",
    "retry_count": 5,
    "auto_approve": true
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
    "name": "订单处理工作流 v2",
    "description": "增强版订单处理流程",
    "status": "ACTIVE",
    "config": {
      "steps": [
        {
          "type": "HTTP",
          "name": "验证订单",
          "url": "https://api.example.com/validate",
          "method": "POST"
        },
        {
          "type": "AI",
          "name": "增强智能分析",
          "model": "gpt-4-turbo",
          "prompt": "深度分析订单风险和用户价值"
        }
      ]
    },
    "variables": {
      "priority": "HIGH",
      "retry_count": 5,
      "auto_approve": true
    },
    "userId": "user-001",
    "createdAt": "2026-04-13T08:10:00Z",
    "updatedAt": "2026-04-13T08:15:00Z"
  },
  "timestamp": "2026-04-13T08:15:00Z"
}
```

#### 错误码

- `400`: 工作流ID不能为空
- `404`: 工作流不存在
- `401`: 未授权
- `409`: 工作流名称已存在
- `500`: 服务器内部错误

---

### 6. 删除工作流

**DELETE** `/workflows/:id`

删除指定工作流。

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
  "timestamp": "2026-04-13T08:15:00Z"
}
```

#### 错误码

- `400`: 工作流ID不能为空
- `404`: 工作流不存在
- `401`: 未授权
- `500`: 服务器内部错误

---

### 7. 克隆工作流

**POST** `/workflows/:id/clone`

复制指定工作流创建新版本。

#### 路径参数

| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| id | string | 是 | 源工作流ID |

#### 请求参数

| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| name | string | 否 | 新工作流名称 |

#### 请求示例

```json
{
  "name": "订单处理工作流 - 副本"
}
```

#### 响应示例

```json
{
  "success": true,
  "message": "工作流克隆成功",
  "data": {
    "id": "workflow-003",
    "name": "订单处理工作流 - 副本",
    "description": "自动处理新订单",
    "status": "DRAFT",
    "config": {
      "steps": [
        {
          "type": "HTTP",
          "name": "验证订单",
          "url": "https://api.example.com/validate",
          "method": "POST"
        },
        {
          "type": "AI",
          "name": "增强智能分析",
          "model": "gpt-4-turbo",
          "prompt": "深度分析订单风险和用户价值"
        }
      ]
    },
    "variables": {
      "priority": "HIGH",
      "retry_count": 5,
      "auto_approve": true
    },
    "userId": "user-001",
    "sourceWorkflowId": "workflow-002",
    "sourceWorkflowName": "订单处理工作流 v2",
    "createdAt": "2026-04-13T08:15:00Z",
    "updatedAt": "2026-04-13T08:15:00Z"
  },
  "timestamp": "2026-04-13T08:15:00Z"
}
```

#### 错误码

- `400`: 请求参数错误
- `404`: 源工作流不存在
- `401`: 未授权
- `500`: 服务器内部错误

---

### 8. 执行工作流

**POST** `/workflows/:id/execute`

执行指定工作流。

#### 路径参数

| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| id | string | 是 | 工作流ID |

#### 请求参数

| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| inputVariables | object | 否 | 输入变量 |
| priority | string | 否 | 执行优先级 |

#### 请求示例

```json
{
  "inputVariables": {
    "order_id": "ORD-2026-001",
    "customer_id": "CUST-001",
    "amount": 299.99,
    "currency": "CNY"
  },
  "priority": "HIGH"
}
```

#### 响应示例

```json
{
  "success": true,
  "message": "工作流执行启动成功",
  "data": {
    "id": "exec-002",
    "workflowId": "workflow-002",
    "workflowName": "订单处理工作流 v2",
    "status": "RUNNING",
    "priority": "HIGH",
    "inputVariables": {
      "order_id": "ORD-2026-001",
      "customer_id": "CUST-001",
      "amount": 299.99,
      "currency": "CNY"
    },
    "startedAt": "2026-04-13T08:15:00Z",
    "estimatedDuration": 300000,
    "steps": [
      {
        "id": "step-1",
        "name": "验证订单",
        "status": "PENDING",
        "type": "HTTP",
        "url": "https://api.example.com/validate",
        "method": "POST",
        "timeout": 30000
      },
      {
        "id": "step-2",
        "name": "增强智能分析",
        "status": "PENDING",
        "type": "AI",
        "model": "gpt-4-turbo",
        "prompt": "深度分析订单风险和用户价值"
      },
      {
        "id": "step-3",
        "name": "保存订单",
        "status": "PENDING",
        "type": "DATABASE",
        "table": "orders",
        "operation": "INSERT"
      }
    ],
    "progress": 0,
    "requestId": "exec-req-123456789"
  },
  "timestamp": "2026-04-13T08:15:00Z"
}
```

#### 错误码

- `400`: 工作流ID不能为空
- `404`: 工作流不存在
- `422`: 工作流状态不正确（如已删除）
- `401`: 未授权
- `429`: 工作流执行队列已满
- `500`: 服务器内部错误

---

### 9. 获取工作流执行历史

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
| limit | number | 否 | 每页数量，默认为10 |
| status | string | 否 | 执行状态筛选 |
| startDate | string | 否 | 开始日期 (ISO 8601) |
| endDate | string | 否 | 结束日期 (ISO 8601) |

#### 请求示例

```bash
curl -X GET "http://localhost:3000/api/workflows/workflow-002/executions?page=1&limit=10&status=COMPLETED&startDate=2026-04-13T00:00:00Z&endDate=2026-04-13T23:59:59Z" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 响应示例

```json
{
  "success": true,
  "message": "获取执行历史成功",
  "data": [
    {
      "id": "exec-002",
      "workflowId": "workflow-002",
      "workflowName": "订单处理工作流 v2",
      "status": "COMPLETED",
      "priority": "HIGH",
      "inputVariables": {
        "order_id": "ORD-2026-001",
        "customer_id": "CUST-001",
        "amount": 299.99,
        "currency": "CNY"
      },
      "output": {
        "result": "SUCCESS",
        "order_status": "PROCESSING",
        "risk_level": "LOW"
      },
      "steps": [
        {
          "id": "step-1",
          "name": "验证订单",
          "status": "COMPLETED",
          "duration": 1250,
          "result": {
            "valid": true,
            "order_id": "ORD-2026-001"
          }
        },
        {
          "id": "step-2",
          "name": "增强智能分析",
          "status": "COMPLETED",
          "duration": 3500,
          "result": {
            "risk_level": "LOW",
            "customer_value": "HIGH",
            "recommendations": ["立即处理", "优先配送"]
          }
        },
        {
          "id": "step-3",
          "name": "保存订单",
          "status": "COMPLETED",
          "duration": 800,
          "result": {
            "inserted_id": "ORD-2026-001",
            "timestamp": "2026-04-13T08:15:00Z"
          }
        }
      ],
      "startedAt": "2026-04-13T08:15:00Z",
      "completedAt": "2026-04-13T08:19:30Z",
      "duration": 275000,
      "errorCount": 0,
      "requestId": "exec-req-123456789"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  },
  "timestamp": "2026-04-13T08:15:00Z"
}
```

#### 错误码

- `400`: 工作流ID不能为空
- `404`: 工作流不存在
- `401`: 未授权
- `500`: 服务器内部错误

---

### 10. 验证工作流配置

**POST** `/workflows/validate`

验证工作流配置的语法和逻辑。

#### 请求参数

| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| config | object | 是 | 工作流配置 |

#### 请求示例

```json
{
  "config": {
    "steps": [
      {
        "type": "HTTP",
        "name": "验证订单",
        "url": "https://api.example.com/validate",
        "method": "POST",
        "timeout": 30000,
        "retryPolicy": {
          "maxAttempts": 3,
          "delay": 1000
        }
      },
      {
        "type": "AI",
        "name": "智能分析",
        "model": "gpt-4",
        "prompt": "分析订单风险等级",
        "temperature": 0.7
      },
      {
        "type": "DATABASE",
        "name": "保存订单",
        "table": "orders",
        "operation": "INSERT",
        "fields": {
          "order_id": "${step1.response.id}",
          "status": "${step2.analysis.risk_level}",
          "created_at": "${timestamp}"
        }
      }
    ],
    "timeout": 300000,
    "errorHandling": {
      "continueOnError": true,
      "errorStep": "notification"
    }
  }
}
```

#### 响应示例

**验证成功:**

```json
{
  "success": true,
  "message": "工作流配置验证成功",
  "data": {
    "valid": true,
    "warnings": [],
    "steps": [
      {
        "id": "step-1",
        "name": "验证订单",
        "type": "HTTP",
        "status": "VALID",
        "validation": {
          "urlAccessible": true,
          "methodSupported": true,
          "timeoutValid": true
        }
      },
      {
        "id": "step-2",
        "name": "智能分析",
        "type": "AI",
        "status": "VALID",
        "validation": {
          "modelSupported": true,
          "temperatureValid": true
        }
      },
      {
        "id": "step-3",
        "name": "保存订单",
        "type": "DATABASE",
        "status": "VALID",
        "validation": {
          "tableExists": true,
          "operationSupported": true,
          "fieldMappingComplete": true
        }
      }
    ],
    "variables": {
      "timestamp": "自动生成",
      "step1.response.id": "HTTP响应引用",
      "step2.analysis.risk_level": "AI输出引用"
    },
    "estimatedDuration": "2-5 分钟"
  },
  "timestamp": "2026-04-13T08:20:00Z"
}
```

**验证失败:**

```json
{
  "success": false,
  "message": "工作流配置验证失败",
  "data": {
    "valid": false,
    "errors": [
      {
        "step": "step-2",
        "field": "prompt",
        "message": "AI提示词不能为空",
        "code": "PROMPT_REQUIRED"
      },
      {
        "step": "step-3",
        "field": "table",
        "message": "数据表名称格式不正确",
        "code": "INVALID_TABLE_NAME"
      },
      {
        "field": "timeout",
        "message": "超时时间不能超过 600000 毫秒",
        "code": "TIMEOUT_TOO_LARGE"
      }
    ],
    "warnings": [
      {
        "step": "step-1",
        "field": "retryPolicy",
        "message": "重试策略中的延迟时间小于推荐值",
        "code": "RETRY_DELAY_TOO_SMALL"
      }
    ]
  },
  "timestamp": "2026-04-13T08:20:00Z"
}
```

#### 错误码

- `400`: 工作流配置不能为空
- `422`: 工作流配置验证失败
- `401`: 未授权
- `500`: 服务器内部错误

---

### 11. 获取工作流执行路径

**POST** `/workflows/execution-path`

预览工作流的执行路径和时间预估。

#### 请求参数

| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| config | object | 是 | 工作流配置 |

#### 请求示例

```json
{
  "config": {
    "steps": [
      {
        "type": "HTTP",
        "name": "获取用户信息",
        "url": "https://api.example.com/users/${userId}",
        "method": "GET",
        "timeout": 10000
      },
      {
        "type": "AI",
        "name": "分析用户行为",
        "model": "gpt-4",
        "prompt": "分析用户购买历史和行为模式"
      },
      {
        "type": "HTTP",
        "name": "更新推荐",
        "url": "https://api.example.com/recommendations",
        "method": "POST",
        "body": {
          "user_id": "${step1.response.id}",
          "preferences": "${step2.analysis.preferences}"
        }
      }
    ],
    "variables": {
      "userId": "user-001"
    }
  }
}
```

#### 响应示例

```json
{
  "success": true,
  "message": "获取执行路径成功",
  "data": {
    "executionPath": [
      {
        "stepId": "step-1",
        "stepName": "获取用户信息",
        "stepType": "HTTP",
        "estimatedDuration": 1500,
        "dependencies": [],
        "parallelizable": false
      },
      {
        "stepId": "step-2",
        "stepName": "分析用户行为",
        "stepType": "AI",
        "estimatedDuration": 4500,
        "dependencies": ["step-1"],
        "parallelizable": false,
        "inputVariables": ["${step1.response.id}", "${step1.response.history}"]
      },
      {
        "stepId": "step-3",
        "stepName": "更新推荐",
        "stepType": "HTTP",
        "estimatedDuration": 2000,
        "dependencies": ["step-2"],
        "parallelizable": false,
        "inputVariables": ["${step2.analysis.preferences}", "${step2.analysis.score}"]
      }
    ],
    "totalEstimatedDuration": 8000,
    "criticalPath": ["step-1", "step-2", "step-3"],
    "bottleneckSteps": [
      {
        "stepId": "step-2",
        "reason": "AI模型推理时间较长",
        "impact": "延迟整个执行过程"
      }
    ],
    "optimizationSuggestions": [
      "将步骤1和步骤2的请求并行处理",
      "考虑使用AI模型缓存来减少推理时间",
      "为HTTP步骤添加缓存机制"
    ],
    "resourceRequirements": {
      "cpu": "中等",
      "memory": "低",
      "network": "中高",
      "concurrent_limit": 1
    }
  },
  "timestamp": "2026-04-13T08:25:00Z"
}
```

#### 错误码

- `400`: 工作流配置不能为空
- `422`: 工作流配置分析失败
- `401`: 未授权
- `500`: 服务器内部错误

---

### 12. 导出工作流

**GET** `/workflows/:id/export`

将指定工作流导出为JSON格式。

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
      "name": "订单处理工作流 v2",
      "description": "增强版订单处理流程",
      "status": "ACTIVE",
      "config": {
        "steps": [
          {
            "type": "HTTP",
            "name": "验证订单",
            "url": "https://api.example.com/validate",
            "method": "POST",
            "timeout": 30000,
            "retryPolicy": {
              "maxAttempts": 3,
              "delay": 1000
            },
            "headers": {
              "Content-Type": "application/json",
              "Authorization": "Bearer ${token}"
            }
          },
          {
            "type": "AI",
            "name": "增强智能分析",
            "model": "gpt-4-turbo",
            "prompt": "深度分析订单风险和用户价值",
            "temperature": 0.7,
            "maxTokens": 1000
          },
          {
            "type": "DATABASE",
            "name": "保存订单",
            "table": "orders",
            "operation": "INSERT",
            "fields": {
              "order_id": "${step1.response.id}",
              "customer_id": "${input.customer_id}",
              "amount": "${input.amount}",
              "status": "PROCESSING",
              "risk_level": "${step2.analysis.risk_level}",
              "created_at": "${timestamp}",
              "updated_at": "${timestamp}"
            }
          }
        ],
        "timeout": 300000,
        "errorHandling": {
          "continueOnError": true,
          "errorStep": "notification",
          "maxRetries": 2
        },
        "variables": {
          "timestamp": "自动生成",
          "token": "${env.API_TOKEN}"
        }
      },
      "variables": {
        "priority": "HIGH",
        "retry_count": 5,
        "auto_approve": true,
        "notifications": {
          "email": "admin@example.com",
          "slack": "#alerts"
        }
      },
      "tags": ["order", "processing", "risk-management"],
      "version": "1.2.0",
      "metadata": {
        "createdBy": "user-001",
        "lastUpdatedBy": "user-001",
        "exportedAt": "2026-04-13T08:30:00Z"
      }
    },
    "exportInfo": {
      "exportedAt": "2026-04-13T08:30:00Z",
      "version": "1.0.0",
      "format": "JSON",
      "includedData": ["workflow", "variables", "config", "metadata"]
    }
  },
  "timestamp": "2026-04-13T08:30:00Z"
}
```

#### 错误码

- `400`: 工作流ID不能为空
- `404`: 工作流不存在
- `401`: 未授权
- `500`: 服务器内部错误

---

### 13. 导入工作流

**POST** `/workflows/import`

从JSON数据导入工作流。

#### 请求参数

| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| workflow | object | 是 | 工作流数据 |
| options | object | 否 | 导入选项 |

#### 请求示例

```json
{
  "workflow": {
    "name": "用户注册工作流",
    "description": "新用户注册和验证流程",
    "config": {
      "steps": [
        {
          "type": "HTTP",
          "name": "验证邮箱",
          "url": "https://api.example.com/validate-email",
          "method": "POST",
          "body": {
            "email": "${input.email}"
          }
        },
        {
          "type": "AI",
          "name": "风险评估",
          "model": "gpt-4",
          "prompt": "分析新用户注册风险",
          "temperature": 0.3
        },
        {
          "type": "DATABASE",
          "name": "创建用户",
          "table": "users",
          "operation": "INSERT",
          "fields": {
            "email": "${input.email}",
            "name": "${input.name}",
            "status": "ACTIVE",
            "created_at": "${timestamp}",
            "ip_address": "${input.ip_address}",
            "risk_score": "${step2.analysis.score}"
          }
        },
        {
          "type": "EMAIL",
          "name": "发送欢迎邮件",
          "to": "${input.email}",
          "template": "welcome",
          "subject": "欢迎加入我们的平台"
        }
      ],
      "timeout": 120000,
      "errorHandling": {
        "continueOnError": true,
        "errorStep": "log_error"
      }
    },
    "variables": {
      "max_retry_attempts": 3,
      "require_email_verification": true,
      "welcome_email_enabled": true
    },
    "tags": ["user", "registration", "verification"],
    "metadata": {
      "source": "export",
      "version": "1.0.0"
    }
  },
  "options": {
    "name": "用户注册工作流 v2",
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
    "name": "用户注册工作流 v2",
    "description": "新用户注册和验证流程",
    "status": "DRAFT",
    "config": {
      "steps": [
        {
          "type": "HTTP",
          "name": "验证邮箱",
          "url": "https://api.example.com/validate-email",
          "method": "POST",
          "body": {
            "email": "${input.email}"
          }
        },
        {
          "type": "AI",
          "name": "风险评估",
          "model": "gpt-4",
          "prompt": "分析新用户注册风险",
          "temperature": 0.3
        },
        {
          "type": "DATABASE",
          "name": "创建用户",
          "table": "users",
          "operation": "INSERT",
          "fields": {
            "email": "${input.email}",
            "name": "${input.name}",
            "status": "ACTIVE",
            "created_at": "${timestamp}",
            "ip_address": "${input.ip_address}",
            "risk_score": "${step2.analysis.score}"
          }
        },
        {
          "type": "EMAIL",
          "name": "发送欢迎邮件",
          "to": "${input.email}",
          "template": "welcome",
          "subject": "欢迎加入我们的平台"
        }
      ],
      "timeout": 120000,
      "errorHandling": {
        "continueOnError": true,
        "errorStep": "log_error"
      }
    },
    "variables": {
      "max_retry_attempts": 3,
      "require_email_verification": true,
      "welcome_email_enabled": true
    },
    "tags": ["user", "registration", "verification"],
    "metadata": {
      "source": "import",
      "version": "2.0.0",
      "importedAt": "2026-04-13T08:35:00Z",
      "originalId": "workflow-export-123"
    },
    "userId": "user-001",
    "createdAt": "2026-04-13T08:35:00Z",
    "updatedAt": "2026-04-13T08:35:00Z"
  },
  "summary": {
    "importedSteps": 4,
    "importedVariables": 3,
    "importedTags": 3,
    "importTime": 2500,
    "validationStatus": "PASSED",
    "notes": ["工作流以草稿状态创建", "建议测试后再激活"]
  },
  "timestamp": "2026-04-13T08:35:00Z"
}
```

#### 错误码

- `400`: 请求体中缺少workflow数据
- `422`: 工作流数据无效
- `409`: 工作流名称已存在（当设置overwrite为false时）
- `401`: 未授权
- `500`: 服务器内部错误

---

## 错误码说明

| HTTP状态码 | 错误码 | 说明 |
|-----------|--------|------|
| 400 | BAD_REQUEST | 请求参数错误 |
| 401 | UNAUTHORIZED | 未授权或JWT令牌无效 |
| 404 | NOT_FOUND | 资源不存在 |
| 409 | CONFLICT | 资源冲突（如工作流名称重复） |
| 422 | UNPROCESSABLE_ENTITY | 请求格式正确但语义错误 |
| 429 | TOO_MANY_REQUESTS | 请求过于频繁或队列已满 |
| 500 | INTERNAL_SERVER_ERROR | 服务器内部错误 |

## 认证要求

所有API端点（除了健康检查）都需要在请求头中包含有效的JWT令牌：

```
Authorization: Bearer YOUR_JWT_TOKEN
```

## 数据类型定义

### 工作流配置 (WorkflowConfig)

```typescript
interface WorkflowConfig {
  steps: WorkflowStep[];
  timeout?: number;
  errorHandling?: ErrorHandlingConfig;
  variables?: Record<string, string>;
}

interface WorkflowStep {
  type: 'HTTP' | 'AI' | 'DATABASE' | 'EMAIL' | 'NOTIFICATION';
  name: string;
  description?: string;
  timeout?: number;
  retryPolicy?: RetryPolicy;
  [key: string]: any; // 其他特定类型的参数
}

interface ErrorHandlingConfig {
  continueOnError?: boolean;
  errorStep?: string;
  maxRetries?: number;
}

interface RetryPolicy {
  maxAttempts: number;
  delay: number;
  backoffMultiplier?: number;
}
```

### 工作流执行记录 (ExecutionRecord)

```typescript
interface ExecutionRecord {
  id: string;
  workflowId: string;
  workflowName: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  inputVariables: Record<string, any>;
  output?: Record<string, any>;
  steps: ExecutionStep[];
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  errorCount: number;
  requestId: string;
}

interface ExecutionStep {
  id: string;
  name: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
  duration?: number;
  result?: any;
  error?: string;
}
```

## 性能指标

- **API响应时间**: < 200ms (正常情况下)
- **工作流执行启动**: < 50ms
- **工作流查询响应**: < 100ms
- **并发工作流执行**: 根据服务器配置，通常为 10-100
- **最大工作流超时**: 600000ms (10分钟)

## 限制

- **单次工作流配置大小**: 10MB
- **单次请求参数大小**: 10MB
- **工作流步骤数量**: 最多50个步骤
- **工作流执行时间**: 最长10分钟
- **历史记录保留时间**: 30天
- **API请求频率**: 每分钟100次

## 版本历史

- **v1.0.0** - 初始版本，包含基础工作流管理功能
- **v1.1.0** - 添加工作流导入导出功能
- **v1.2.0** - 增强AI步骤支持和执行路径预览
- **v1.3.0** - 添加工作流克隆和批量操作功能

## 支持与反馈

如有问题或建议，请通过以下方式联系：

- 邮箱: support@ai-workspace-orchestrator.com
- GitHub Issues: https://github.com/ai-ideas-lab/ai-workspace-orchestrator/issues
- 文档: https://docs.ai-workspace-orchestrator.com

---

*本文档最后更新时间：2026-04-13 08:10 UTC*