# AI Workspace Orchestrator API 文档

## 概述

本文档详细描述了 AI Workspace Orchestrator 的所有 API 接口，包括工作流管理、执行、导入导出、审计日志等功能。

## 基础信息

- **基础URL**: `http://localhost:3000/api`
- **内容类型**: `application/json`
- **认证方式**: JWT Bearer Token
- **版本**: 2.0

## 通用响应格式

### 成功响应

```json
{
  "success": true,
  "message": "操作成功",
  "data": {},
  "timestamp": "2026-04-14T18:10:00Z",
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
  "timestamp": "2026-04-14T18:10:00Z",
  "requestId": "req-123456789"
}
```

### 分页响应

```json
{
  "success": true,
  "message": "获取成功",
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  },
  "timestamp": "2026-04-14T18:10:00Z"
}
```

## API 接口详情

### 1. 健康检查

**GET** `/health`

检查服务运行状态和系统健康度。

#### 请求参数

无

#### 响应示例

```json
{
  "success": true,
  "message": "服务运行正常",
  "requestId": "req-123456789",
  "timestamp": "2026-04-14T18:10:00Z",
  "uptime": 1234.56
}
```

#### 错误码

- `500`: 服务内部错误

---

### 2. 工作流管理 API

#### 2.1 获取工作流列表

**GET** `/workflows`

获取所有工作流列表，支持分页和筛选。

#### 请求参数

| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| page | number | 否 | 页码，默认为1 |
| limit | number | 否 | 每页数量，默认为10，最大100 |
| status | string | 否 | 工作流状态筛选：DRAFT, ACTIVE, PAUSED, ARCHIVED |
| userId | string | 否 | 用户ID筛选 |
| search | string | 否 | 搜索关键词 |

#### 请求示例

```bash
curl -X GET "http://localhost:3000/api/workflows?page=1&limit=10&status=ACTIVE&search=订单" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
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
            "id": "step1",
            "type": "api",
            "name": "获取用户数据",
            "config": {
              "method": "GET",
              "url": "https://api.example.com/users",
              "headers": {
                "Content-Type": "application/json"
              }
            }
          },
          {
            "id": "step2", 
            "type": "api",
            "name": "保存到数据库",
            "config": {
              "method": "POST",
              "url": "https://api.example.com/save",
              "body": "${step1.response.data}"
            }
          }
        ]
      },
      "variables": {
        "priority": "NORMAL",
        "retry_count": 3
      },
      "userId": "user-001",
      "createdAt": "2026-04-14T18:10:00Z",
      "updatedAt": "2026-04-14T18:10:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  },
  "timestamp": "2026-04-14T18:10:00Z"
}
```

#### 错误码

- `401`: 未授权
- `500`: 服务器内部错误

---

#### 2.2 创建工作流

**POST** `/workflows`

创建新的工作流，使用增强版控制器，包含自动重试和错误处理。

#### 请求参数

| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| name | string | 是 | 工作流名称，1-200字符 |
| description | string | 否 | 工作流描述 |
| config | object | 是 | 工作流配置对象 |
| variables | object | 否 | 变量定义 |
| userId | string | 否 | 用户ID |

#### 请求示例

```json
{
  "name": "订单处理工作流",
  "description": "自动处理新订单，包括验证、分析、存储",
  "config": {
    "steps": [
      {
        "id": "validate_order",
        "type": "api",
        "name": "验证订单信息",
        "config": {
          "method": "POST",
          "url": "https://api.example.com/validate-order",
          "headers": {
            "Content-Type": "application/json",
            "Authorization": "Bearer ${api_key}"
          },
          "body": {
            "order_id": "${input.order_id}",
            "customer_id": "${input.customer_id}",
            "amount": "${input.amount}"
          },
          "timeout": 30000,
          "retryPolicy": {
            "maxAttempts": 3,
            "delay": 1000,
            "backoff": "exponential"
          }
        }
      },
      {
        "id": "analyze_risk",
        "type": "ai",
        "name": "智能风险分析",
        "config": {
          "model": "gpt-4",
          "prompt": "根据订单信息分析风险等级，返回JSON格式：{risk_level: 'LOW|MEDIUM|HIGH', risk_score: number, factors: string[]}",
          "temperature": 0.7,
          "maxTokens": 500
        },
        "dependsOn": ["validate_order"]
      },
      {
        "id": "save_order",
        "type": "api",
        "name": "保存订单到数据库",
        "config": {
          "method": "POST",
          "url": "https://api.example.com/orders",
          "headers": {
            "Content-Type": "application/json"
          },
          "body": {
            "order_id": "${input.order_id}",
            "customer_id": "${input.customer_id}",
            "amount": "${input.amount}",
            "status": "${validate_order.response.status}",
            "risk_level": "${analyze_risk.response.risk_level}",
            "risk_score": "${analyze_risk.response.risk_score}",
            "created_at": "${timestamp}"
          }
        },
        "dependsOn": ["analyze_risk"]
      }
    ],
    "variables": {
      "api_key": "${env.API_KEY}",
      "timeout": 30000,
      "retry_attempts": 3
    }
  },
  "variables": {
    "priority": "HIGH",
    "auto_approve": false,
    "notification_enabled": true
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
    "description": "自动处理新订单，包括验证、分析、存储",
    "status": "DRAFT",
    "config": {
      "steps": [
        {
          "id": "validate_order",
          "type": "api",
          "name": "验证订单信息",
          "config": {
            "method": "POST",
            "url": "https://api.example.com/validate-order",
            "headers": {
              "Content-Type": "application/json",
              "Authorization": "Bearer ${api_key}"
            },
            "timeout": 30000,
            "retryPolicy": {
              "maxAttempts": 3,
              "delay": 1000,
              "backoff": "exponential"
            }
          }
        },
        {
          "id": "analyze_risk",
          "type": "ai",
          "name": "智能风险分析",
          "config": {
            "model": "gpt-4",
            "prompt": "根据订单信息分析风险等级，返回JSON格式：{risk_level: 'LOW|MEDIUM|HIGH', risk_score: number, factors: string[]}",
            "temperature": 0.7,
            "maxTokens": 500
          },
          "dependsOn": ["validate_order"]
        },
        {
          "id": "save_order",
          "type": "api",
          "name": "保存订单到数据库",
          "config": {
            "method": "POST",
            "url": "https://api.example.com/orders",
            "headers": {
              "Content-Type": "application/json"
            },
            "body": {
              "order_id": "${input.order_id}",
              "customer_id": "${input.customer_id}",
              "amount": "${input.amount}",
              "status": "${validate_order.response.status}",
              "risk_level": "${analyze_risk.response.risk_level}",
              "risk_score": "${analyze_risk.response.risk_score}",
              "created_at": "${timestamp}"
            }
          },
          "dependsOn": ["analyze_risk"]
        }
      ],
      "variables": {
        "api_key": "${env.API_KEY}",
        "timeout": 30000,
        "retry_attempts": 3
      }
    },
    "variables": {
      "priority": "HIGH",
      "auto_approve": false,
      "notification_enabled": true
    },
    "userId": "user-001",
    "createdAt": "2026-04-14T18:10:00Z",
    "updatedAt": "2026-04-14T18:10:00Z"
  },
  "timestamp": "2026-04-14T18:10:00Z"
}
```

#### 错误码

- `400`: 请求参数错误，配置格式不正确
- `401`: 未授权
- `409`: 工作流名称已存在
- `422`: 输入验证失败，工作流配置有误
- `500`: 服务器内部错误

---

#### 2.3 获取工作流详情

**GET** `/workflows/:id`

获取指定工作流的详细信息，包含完整的配置和元数据。

#### 路径参数

| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| id | string | 是 | 工作流ID |

#### 请求示例

```bash
curl -X GET "http://localhost:3000/api/workflows/workflow-002" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

#### 响应示例

```json
{
  "success": true,
  "message": "获取工作流详情成功",
  "data": {
    "id": "workflow-002",
    "name": "订单处理工作流",
    "description": "自动处理新订单，包括验证、分析、存储",
    "status": "ACTIVE",
    "config": {
      "steps": [
        {
          "id": "validate_order",
          "type": "api",
          "name": "验证订单信息",
          "config": {
            "method": "POST",
            "url": "https://api.example.com/validate-order",
            "headers": {
              "Content-Type": "application/json",
              "Authorization": "Bearer ${api_key}"
            },
            "timeout": 30000,
            "retryPolicy": {
              "maxAttempts": 3,
              "delay": 1000,
              "backoff": "exponential"
            }
          },
          "dependsOn": [],
          "timeout": 30000,
          "retryPolicy": {
            "maxAttempts": 3,
            "delay": 1000,
            "backoff": "exponential"
          }
        },
        {
          "id": "analyze_risk",
          "type": "ai",
          "name": "智能风险分析",
          "config": {
            "model": "gpt-4",
            "prompt": "根据订单信息分析风险等级，返回JSON格式：{risk_level: 'LOW|MEDIUM|HIGH', risk_score: number, factors: string[]}",
            "temperature": 0.7,
            "maxTokens": 500
          },
          "dependsOn": ["validate_order"],
          "timeout": 60000,
          "retryPolicy": {
            "maxAttempts": 2,
            "delay": 2000,
            "backoff": "linear"
          }
        },
        {
          "id": "save_order",
          "type": "api",
          "name": "保存订单到数据库",
          "config": {
            "method": "POST",
            "url": "https://api.example.com/orders",
            "headers": {
              "Content-Type": "application/json"
            },
            "body": {
              "order_id": "${input.order_id}",
              "customer_id": "${input.customer_id}",
              "amount": "${input.amount}",
              "status": "${validate_order.response.status}",
              "risk_level": "${analyze_risk.response.risk_level}",
              "risk_score": "${analyze_risk.response.risk_score}",
              "created_at": "${timestamp}"
            }
          },
          "dependsOn": ["analyze_risk"],
          "timeout": 30000,
          "retryPolicy": {
            "maxAttempts": 3,
            "delay": 1000,
            "backoff": "exponential"
          }
        }
      ],
      "variables": {
        "api_key": "${env.API_KEY}",
        "timeout": 30000,
        "retry_attempts": 3
      }
    },
    "variables": {
      "priority": "HIGH",
      "auto_approve": false,
      "notification_enabled": true
    },
    "userId": "user-001",
    "createdAt": "2026-04-14T18:10:00Z",
    "updatedAt": "2026-04-14T18:10:00Z",
    "executionCount": 156,
    "lastExecutionTime": "2026-04-14T17:45:00Z"
  },
  "timestamp": "2026-04-14T18:10:00Z"
}
```

#### 错误码

- `401`: 未授权
- `404`: 工作流不存在
- `500`: 服务器内部错误

---

#### 2.4 更新工作流

**PUT** `/workflows/:id`

更新现有工作流的配置和元数据。支持乐观锁和级联更新。

#### 路径参数

| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| id | string | 是 | 工作流ID |

#### 请求参数

| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| name | string | 否 | 工作流名称，1-200字符 |
| description | string | 否 | 工作流描述 |
| config | object | 否 | 工作流配置对象 |
| variables | object | 否 | 变量定义 |
| status | string | 否 | 工作流状态：DRAFT, ACTIVE, PAUSED, ARCHIVED |

#### 请求示例

```json
{
  "name": "订单处理工作流 v2",
  "description": "增强版订单处理工作流，支持实时风险监控",
  "status": "ACTIVE",
  "config": {
    "steps": [
      {
        "id": "validate_order",
        "type": "api",
        "name": "验证订单信息",
        "config": {
          "method": "POST",
          "url": "https://api.example.com/validate-order",
          "headers": {
            "Content-Type": "application/json",
            "Authorization": "Bearer ${api_key}"
          },
          "timeout": 30000,
          "retryPolicy": {
            "maxAttempts": 3,
            "delay": 1000,
            "backoff": "exponential"
          }
        }
      },
      {
        "id": "realtime_monitoring",
        "type": "ai",
        "name": "实时风险监控",
        "config": {
          "model": "gpt-4",
          "prompt": "实时监控订单处理过程中的风险变化，提供实时预警",
          "temperature": 0.5,
          "maxTokens": 300
        },
        "dependsOn": ["validate_order"]
      },
      {
        "id": "save_order",
        "type": "api",
        "name": "保存订单到数据库",
        "config": {
          "method": "POST",
          "url": "https://api.example.com/orders",
          "headers": {
            "Content-Type": "application/json"
          },
          "body": {
            "order_id": "${input.order_id}",
            "customer_id": "${input.customer_id}",
            "amount": "${input.amount}",
            "status": "${validate_order.response.status}",
            "risk_level": "${realtime_monitoring.response.risk_level}",
            "risk_score": "${realtime_monitoring.response.risk_score}",
            "created_at": "${timestamp}"
          }
        },
        "dependsOn": ["realtime_monitoring"]
      }
    ]
  },
  "variables": {
    "priority": "URGENT",
    "auto_approve": true,
    "notification_enabled": true,
    "monitoring_interval": 5000
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
    "description": "增强版订单处理工作流，支持实时风险监控",
    "status": "ACTIVE",
    "config": {
      "steps": [
        {
          "id": "validate_order",
          "type": "api",
          "name": "验证订单信息",
          "config": {
            "method": "POST",
            "url": "https://api.example.com/validate-order",
            "headers": {
              "Content-Type": "application/json",
              "Authorization": "Bearer ${api_key}"
            },
            "timeout": 30000,
            "retryPolicy": {
              "maxAttempts": 3,
              "delay": 1000,
              "backoff": "exponential"
            }
          }
        },
        {
          "id": "realtime_monitoring",
          "type": "ai",
          "name": "实时风险监控",
          "config": {
            "model": "gpt-4",
            "prompt": "实时监控订单处理过程中的风险变化，提供实时预警",
            "temperature": 0.5,
            "maxTokens": 300
          },
          "dependsOn": ["validate_order"]
        },
        {
          "id": "save_order",
          "type": "api",
          "name": "保存订单到数据库",
          "config": {
            "method": "POST",
            "url": "https://api.example.com/orders",
            "headers": {
              "Content-Type": "application/json"
            },
            "body": {
              "order_id": "${input.order_id}",
              "customer_id": "${input.customer_id}",
              "amount": "${input.amount}",
              "status": "${validate_order.response.status}",
              "risk_level": "${realtime_monitoring.response.risk_level}",
              "risk_score": "${realtime_monitoring.response.risk_score}",
              "created_at": "${timestamp}"
            }
          },
          "dependsOn": ["realtime_monitoring"]
        }
      ]
    },
    "variables": {
      "priority": "URGENT",
      "auto_approve": true,
      "notification_enabled": true,
      "monitoring_interval": 5000
    },
    "userId": "user-001",
    "createdAt": "2026-04-14T18:10:00Z",
    "updatedAt": "2026-04-14T18:15:00Z",
    "version": 2
  },
  "timestamp": "2026-04-14T18:15:00Z"
}
```

#### 错误码

- `400`: 请求参数错误
- `401`: 未授权
- `403`: 没有权限更新此工作流
- `404`: 工作流不存在
- `409`: 工作流名称已存在
- `422`: 输入验证失败，工作流配置有误
- `409`: 工作流包含活跃执行，无法删除
- `500`: 服务器内部错误

---

#### 2.5 删除工作流

**DELETE** `/workflows/:id`

删除指定工作流。级联删除相关的执行记录，但不能删除包含活跃执行的工作流。

#### 路径参数

| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| id | string | 是 | 工作流ID |

#### 请求示例

```bash
curl -X DELETE "http://localhost:3000/api/workflows/workflow-002" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

#### 响应示例

```json
{
  "success": true,
  "message": "工作流删除成功",
  "timestamp": "2026-04-14T18:16:00Z"
}
```

#### 错误码

- `400`: 请求参数错误
- `401`: 未授权
- `403`: 没有权限删除此工作流
- `404`: 工作流不存在
- `409`: 工作流包含活跃执行，无法删除
- `500`: 服务器内部错误

---

#### 2.6 工作流克隆

**POST** `/workflows/:id/clone`

克隆现有工作流，创建副本并生成新的ID。支持自定义克隆名称。

#### 路径参数

| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| id | string | 是 | 要克隆的工作流ID |

#### 请求参数

| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| name | string | 否 | 克隆后的工作流名称，默认为"原名称 (副本)" |

#### 请求示例

```json
{
  "name": "订单处理工作流 - 测试版本"
}
```

#### 响应示例

```json
{
  "success": true,
  "message": "工作流克隆成功",
  "data": {
    "id": "workflow-003",
    "name": "订单处理工作流 - 测试版本",
    "description": "自动处理新订单，包括验证、分析、存储",
    "status": "DRAFT",
    "config": {
      "steps": [
        {
          "id": "validate_order",
          "type": "api",
          "name": "验证订单信息",
          "config": {
            "method": "POST",
            "url": "https://api.example.com/validate-order",
            "headers": {
              "Content-Type": "application/json",
              "Authorization": "Bearer ${api_key}"
            },
            "timeout": 30000,
            "retryPolicy": {
              "maxAttempts": 3,
              "delay": 1000,
              "backoff": "exponential"
            }
          }
        },
        {
          "id": "analyze_risk",
          "type": "ai",
          "name": "智能风险分析",
          "config": {
            "model": "gpt-4",
            "prompt": "根据订单信息分析风险等级，返回JSON格式：{risk_level: 'LOW|MEDIUM|HIGH', risk_score: number, factors: string[]}",
            "temperature": 0.7,
            "maxTokens": 500
          },
          "dependsOn": ["validate_order"]
        },
        {
          "id": "save_order",
          "type": "api",
          "name": "保存订单到数据库",
          "config": {
            "method": "POST",
            "url": "https://api.example.com/orders",
            "headers": {
              "Content-Type": "application/json"
            },
            "body": {
              "order_id": "${input.order_id}",
              "customer_id": "${input.customer_id}",
              "amount": "${input.amount}",
              "status": "${validate_order.response.status}",
              "risk_level": "${analyze_risk.response.risk_level}",
              "risk_score": "${analyze_risk.response.risk_score}",
              "created_at": "${timestamp}"
            }
          },
          "dependsOn": ["analyze_risk"]
        }
      ],
      "variables": {
        "api_key": "${env.API_KEY}",
        "timeout": 30000,
        "retry_attempts": 3
      }
    },
    "variables": {
      "priority": "HIGH",
      "auto_approve": false,
      "notification_enabled": true
    },
    "userId": "user-001",
    "createdAt": "2026-04-14T18:17:00Z",
    "updatedAt": "2026-04-14T18:17:00Z",
    "sourceWorkflowId": "workflow-002",
    "sourceWorkflowName": "订单处理工作流 v2"
  },
  "timestamp": "2026-04-14T18:17:00Z"
}
```

#### 错误码

- `400`: 请求参数错误
- `401`: 未授权
- `403`: 没有权限克隆此工作流
- `404`: 源工作流不存在
- `409`: 工作流名称已存在
- `500`: 服务器内部错误

---

#### 2.7 执行工作流

**POST** `/workflows/:id/execute`

异步执行指定工作流。返回执行ID，可通过执行ID跟踪执行状态。

#### 路径参数

| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| id | string | 是 | 工作流ID |

#### 请求参数

| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| variables | object | 否 | 执行时输入变量 |
| priority | string | 否 | 执行优先级：LOW, NORMAL, HIGH, URGENT，默认为NORMAL |
| timeout | number | 否 | 超时时间（秒），1-3600，默认为300 |

#### 请求示例

```json
{
  "variables": {
    "order_id": "ORD-2026-001",
    "customer_id": "CUST-001",
    "amount": 299.99,
    "currency": "CNY",
    "items": [
      {
        "product_id": "PROD-001",
        "quantity": 1,
        "price": 299.99
      }
    ]
  },
  "priority": "HIGH",
  "timeout": 600
}
```

#### 响应示例

```json
{
  "success": true,
  "message": "工作流执行已启动",
  "executionId": "execution-001",
  "status": "PENDING",
  "estimatedDuration": 45,
  "timestamp": "2026-04-14T18:18:00Z"
}
```

#### 错误码

- `400`: 请求参数错误
- `401`: 未授权
- `403`: 没有权限执行此工作流
- `404`: 工作流不存在
- `422`: 输入验证失败
- `429: 工作流队列已满，请稍后重试
- `500`: 服务器内部错误

---

#### 2.8 获取工作流执行历史

**GET** `/workflows/:id/executions`

获取指定工作流的执行历史记录，支持分页和状态筛选。

#### 路径参数

| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| id | string | 是 | 工作流ID |

#### 请求参数

| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| page | number | 否 | 页码，默认为1 |
| limit | number | 否 | 每页数量，默认为20，最大100 |
| status | string | 否 | 执行状态筛选：PENDING, RUNNING, COMPLETED, FAILED, CANCELLED |
| startDate | string | 否 | 开始日期（ISO格式） |
| endDate | string | 否 | 结束日期（ISO格式） |

#### 请求示例

```bash
curl -X GET "http://localhost:3000/api/workflows/workflow-002/executions?page=1&limit=10&status=COMPLETED&startDate=2026-04-14T00:00:00Z&endDate=2026-04-14T23:59:59Z" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

#### 响应示例

```json
{
  "success": true,
  "message": "获取执行历史成功",
  "data": [
    {
      "id": "execution-001",
      "workflowId": "workflow-002",
      "workflowName": "订单处理工作流 v2",
      "status": "COMPLETED",
      "inputVariables": {
        "order_id": "ORD-2026-001",
        "customer_id": "CUST-001",
        "amount": 299.99
      },
      "output": {
        "result": "SUCCESS",
        "order_id": "ORD-2026-001",
        "status": "COMPLETED",
        "processing_time": 45.2,
        "steps": [
          {
            "stepId": "validate_order",
            "status": "COMPLETED",
            "duration": 12.5,
            "result": {
              "valid": true,
              "order_data": {...}
            }
          },
          {
            "stepId": "analyze_risk",
            "status": "COMPLETED",
            "duration": 18.3,
            "result": {
              "risk_level": "LOW",
              "risk_score": 2.5,
              "factors": ["amount_low", "customer_verified"]
            }
          },
          {
            "stepId": "save_order",
            "status": "COMPLETED",
            "duration": 14.4,
            "result": {
              "order_id": "ORD-2026-001",
              "saved": true
            }
          }
        ]
      },
      "priority": "HIGH",
      "duration": 45.2,
      "startedAt": "2026-04-14T18:18:00Z",
      "completedAt": "2026-04-14T18:18:45Z",
      "error": null
    },
    {
      "id": "execution-002",
      "workflowId": "workflow-002",
      "workflowName": "订单处理工作流 v2",
      "status": "FAILED",
      "inputVariables": {
        "order_id": "ORD-2026-002",
        "customer_id": "CUST-002",
        "amount": 9999.99
      },
      "output": null,
      "priority": "URGENT",
      "duration": 23.7,
      "startedAt": "2026-04-14T18:20:00Z",
      "completedAt": "2026-04-14T18:20:24Z",
      "error": {
        "code": "VALIDATION_ERROR",
        "message": "订单金额超过限制",
        "details": {
          "max_amount": 5000,
          "actual_amount": 9999.99
        }
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 156,
    "totalPages": 16
  },
  "timestamp": "2026-04-14T18:25:00Z"
}
```

#### 错误码

- `401`: 未授权
- `404`: 工作流不存在
- `500`: 服务器内部错误

---

#### 2.9 验证工作流配置

**POST** `/workflows/validate`

验证工作流配置的语法和逻辑正确性，返回详细的验证结果。

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
        "id": "step1",
        "type": "api",
        "name": "获取用户信息",
        "config": {
          "method": "GET",
          "url": "https://api.example.com/users/${user_id}",
          "headers": {
            "Content-Type": "application/json",
            "Authorization": "Bearer ${api_key}"
          },
          "timeout": 30000
        }
      },
      {
        "id": "step2",
        "type": "ai",
        "name": "分析用户行为",
        "config": {
          "model": "gpt-4",
          "prompt": "分析用户的购买行为模式",
          "temperature": 0.7
        },
        "dependsOn": ["step1"]
      },
      {
        "id": "step3",
        "type": "api",
        "name": "更新用户画像",
        "config": {
          "method": "POST",
          "url": "https://api.example.com/users/${user_id}/profile",
          "headers": {
            "Content-Type": "application/json"
          },
          "body": {
            "behavior_analysis": "${step2.response.analysis}",
            "updated_at": "${timestamp}"
          }
        },
        "dependsOn": ["step2"]
      }
    ],
    "variables": {
      "api_key": "${env.API_KEY}",
      "timeout": 30000
    }
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
      {
        "type": "PERFORMANCE",
        "message": "步骤step1的timeout设置较低，在高并发情况下可能超时",
        "severity": "MEDIUM",
        "suggestion": "建议增加timeout至60000或启用重试机制"
      },
      {
        "type": "DEPENDENCY",
        "message": "步骤step3依赖于step2，建议在step2失败时有回滚机制",
        "severity": "LOW",
        "suggestion": "添加error handling步骤处理失败情况"
      }
    ],
    "suggestions": [
      {
        "type": "OPTIMIZATION",
        "message": "可以并行执行某些独立步骤以提高效率",
        "target": "step1和step2可以并行执行，因为它们没有依赖关系"
      },
      {
        "type": "SECURITY",
        "message": "API调用中包含敏感信息，建议使用加密传输",
        "target": "body中的敏感字段应该加密"
      }
    ],
    "validationTime": 2.45,
    "checkedSteps": 3,
    "passedChecks": 3,
    "failedChecks": 0
  },
  "timestamp": "2026-04-14T18:26:00Z"
}
```

#### 错误码

- `400`: 请求参数错误
- `422`: 工作流配置验证失败，包含详细错误信息
- `500`: 服务器内部错误

---

#### 2.10 获取工作流执行路径

**POST** `/workflows/execution-path`

分析工作流配置的执行路径，返回步骤执行顺序和依赖关系。

#### 请求参数

| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| config | object | 是 | 工作流配置对象 |
| input | object | 否 | 输入变量，用于分析具体执行路径 |

#### 请求示例

```json
{
  "config": {
    "steps": [
      {
        "id": "data_validation",
        "type": "condition",
        "name": "数据验证",
        "config": {
          "condition": "${input.amount} > 1000",
          "truePath": "high_value_processing",
          "falsePath": "standard_processing"
        }
      },
      {
        "id": "high_value_processing",
        "type": "api",
        "name": "高价值订单处理",
        "config": {
          "method": "POST",
          "url": "https://api.example.com/high-value-orders",
          "body": "${input}"
        },
        "dependsOn": ["data_validation"]
      },
      {
        "id": "standard_processing",
        "type": "api",
        "name": "标准订单处理",
        "config": {
          "method": "POST",
          "url": "https://api.example.com/standard-orders",
          "body": "${input}"
        },
        "dependsOn": ["data_validation"]
      },
      {
        "id": "notification",
        "type": "api",
        "name": "发送通知",
        "config": {
          "method": "POST",
          "url": "https://api.example.com/notifications",
          "body": {"message": "订单处理完成"}
        },
        "dependsOn": ["high_value_processing", "standard_processing"]
      }
    ]
  },
  "input": {
    "order_id": "ORD-2026-001",
    "amount": 2999.99,
    "customer_id": "CUST-001"
  }
}
```

#### 响应示例

```json
{
  "success": true,
  "message": "执行路径分析成功",
  "data": {
    "executionPath": [
      {
        "stepId": "data_validation",
        "stepName": "数据验证",
        "stepType": "condition",
        "position": 1,
        "executionTime": 0.5,
        "conditionResult": true,
        "nextSteps": ["high_value_processing"]
      },
      {
        "stepId": "high_value_processing",
        "stepName": "高价值订单处理",
        "stepType": "api",
        "position": 2,
        "executionTime": 15.3,
        "dependsOn": ["data_validation"],
        "nextSteps": ["notification"]
      },
      {
        "stepId": "notification",
        "stepName": "发送通知",
        "stepType": "api",
        "position": 3,
        "executionTime": 2.1,
        "dependsOn": ["high_value_processing"],
        "nextSteps": []
      }
    ],
    "dependencyGraph": {
      "nodes": [
        {"id": "data_validation", "type": "condition"},
        {"id": "high_value_processing", "type": "api"},
        {"id": "standard_processing", "type": "api"},
        {"id": "notification", "type": "api"}
      ],
      "edges": [
        {"from": "data_validation", "to": "high_value_processing"},
        {"from": "data_validation", "to": "standard_processing"},
        {"from": "high_value_processing", "to": "notification"},
        {"from": "standard_processing", "to": "notification"}
      ]
    },
    "parallelBranches": [
      {
        "branchId": "high_value_branch",
        "steps": ["high_value_processing", "notification"],
        "executionTime": 17.4
      }
    ],
    "criticalPath": ["data_validation", "high_value_processing", "notification"],
    "totalEstimatedTime": 17.9,
    "maxParallelSteps": 1,
    "complexityScore": 0.75
  },
  "timestamp": "2026-04-14T18:27:00Z"
}
```

#### 错误码

- `400`: 请求参数错误
- `422`: 工作流配置分析失败
- `500`: 服务器内部错误

---

### 3. 工作流导入导出 API

#### 3.1 导出工作流

**GET** `/workflows/:id/export`

将指定工作流导出为JSON格式，包含完整的配置和元数据。

#### 路径参数

| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| id | string | 是 | 工作流ID |

#### 请求示例

```bash
curl -X GET "http://localhost:3000/api/workflows/workflow-002/export" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

#### 响应示例

```json
{
  "success": true,
  "message": "工作流导出成功",
  "workflow": {
    "id": "workflow-002",
    "name": "订单处理工作流 v2",
    "description": "增强版订单处理工作流，支持实时风险监控",
    "version": "2.0",
    "status": "ACTIVE",
    "config": {
      "steps": [
        {
          "id": "validate_order",
          "type": "api",
          "name": "验证订单信息",
          "config": {
            "method": "POST",
            "url": "https://api.example.com/validate-order",
            "headers": {
              "Content-Type": "application/json",
              "Authorization": "Bearer ${api_key}"
            },
            "timeout": 30000,
            "retryPolicy": {
              "maxAttempts": 3,
              "delay": 1000,
              "backoff": "exponential"
            }
          }
        },
        {
          "id": "realtime_monitoring",
          "type": "ai",
          "name": "实时风险监控",
          "config": {
            "model": "gpt-4",
            "prompt": "实时监控订单处理过程中的风险变化，提供实时预警",
            "temperature": 0.5,
            "maxTokens": 300
          },
          "dependsOn": ["validate_order"]
        },
        {
          "id": "save_order",
          "type": "api",
          "name": "保存订单到数据库",
          "config": {
            "method": "POST",
            "url": "https://api.example.com/orders",
            "headers": {
              "Content-Type": "application/json"
            },
            "body": {
              "order_id": "${input.order_id}",
              "customer_id": "${input.customer_id}",
              "amount": "${input.amount}",
              "status": "${validate_order.response.status}",
              "risk_level": "${realtime_monitoring.response.risk_level}",
              "risk_score": "${realtime_monitoring.response.risk_score}",
              "created_at": "${timestamp}"
            }
          },
          "dependsOn": ["realtime_monitoring"]
        }
      ],
      "variables": {
        "api_key": "${env.API_KEY}",
        "timeout": 30000,
        "retry_attempts": 3
      }
    },
    "variables": {
      "priority": "URGENT",
      "auto_approve": true,
      "notification_enabled": true,
      "monitoring_interval": 5000
    },
    "metadata": {
      "author": "user-001",
      "tags": ["订单处理", "风险监控", "自动化"],
      "category": "数据处理",
      "difficulty": "INTERMEDIATE"
    },
    "exportedAt": "2026-04-14T18:28:00Z",
    "exportVersion": "1.0"
  },
  "timestamp": "2026-04-14T18:28:00Z"
}
```

#### 错误码

- `401`: 未授权
- `404`: 工作流不存在
- `500`: 服务器内部错误

---

#### 3.2 导入工作流

**POST** `/workflows/import`

从JSON数据导入工作流，支持多种导入选项。

#### 请求参数

| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| workflow | object | 是 | 工作流数据对象 |
| options | object | 否 | 导入选项 |

#### 请求示例

```json
{
  "workflow": {
    "id": "imported-workflow-001",
    "name": "导入的订单处理工作流",
    "description": "从外部系统导入的订单处理工作流",
    "version": "2.1",
    "status": "DRAFT",
    "config": {
      "steps": [
        {
          "id": "validate_order",
          "type": "api",
          "name": "验证订单信息",
          "config": {
            "method": "POST",
            "url": "https://api.example.com/validate-order",
            "headers": {
              "Content-Type": "application/json",
              "Authorization": "Bearer ${api_key}"
            },
            "timeout": 30000,
            "retryPolicy": {
              "maxAttempts": 3,
              "delay": 1000,
              "backoff": "exponential"
            }
          }
        },
        {
          "id": "analyze_risk",
          "type": "ai",
          "name": "智能风险分析",
          "config": {
            "model": "gpt-4",
            "prompt": "根据订单信息分析风险等级，返回JSON格式：{risk_level: 'LOW|MEDIUM|HIGH', risk_score: number, factors: string[]}",
            "temperature": 0.7,
            "maxTokens": 500
          },
          "dependsOn": ["validate_order"]
        },
        {
          "id": "save_order",
          "type": "api",
          "name": "保存订单到数据库",
          "config": {
            "method": "POST",
            "url": "https://api.example.com/orders",
            "headers": {
              "Content-Type": "application/json"
            },
            "body": {
              "order_id": "${input.order_id}",
              "customer_id": "${input.customer_id}",
              "amount": "${input.amount}",
              "status": "${validate_order.response.status}",
              "risk_level": "${analyze_risk.response.risk_level}",
              "risk_score": "${analyze_risk.response.risk_score}",
              "created_at": "${timestamp}"
            }
          },
          "dependsOn": ["analyze_risk"]
        }
      ],
      "variables": {
        "api_key": "${env.API_KEY}",
        "timeout": 30000,
        "retry_attempts": 3
      }
    },
    "variables": {
      "priority": "HIGH",
      "auto_approve": false,
      "notification_enabled": true
    },
    "metadata": {
      "author": "external-system",
      "tags": ["导入", "订单处理"],
      "category": "数据处理",
      "difficulty": "INTERMEDIATE"
    }
  },
  "options": {
    "name": "订单处理工作流 - 生产环境",
    "draft": true,
    "overwrite": false,
    "validateOnly": false,
    "migrateVariables": true
  }
}
```

#### 响应示例

```json
{
  "success": true,
  "message": "工作流导入成功",
  "data": {
    "id": "imported-workflow-001",
    "name": "订单处理工作流 - 生产环境",
    "description": "从外部系统导入的订单处理工作流",
    "status": "DRAFT",
    "config": {
      "steps": [
        {
          "id": "validate_order",
          "type": "api",
          "name": "验证订单信息",
          "config": {
            "method": "POST",
            "url": "https://api.example.com/validate-order",
            "headers": {
              "Content-Type": "application/json",
              "Authorization": "Bearer ${api_key}"
            },
            "timeout": 30000,
            "retryPolicy": {
              "maxAttempts": 3,
              "delay": 1000,
              "backoff": "exponential"
            }
          }
        },
        {
          "id": "analyze_risk",
          "type": "ai",
          "name": "智能风险分析",
          "config": {
            "model": "gpt-4",
            "prompt": "根据订单信息分析风险等级，返回JSON格式：{risk_level: 'LOW|MEDIUM|HIGH', risk_score: number, factors: string[]}",
            "temperature": 0.7,
            "maxTokens": 500
          },
          "dependsOn": ["validate_order"]
        },
        {
          "id": "save_order",
          "type": "api",
          "name": "保存订单到数据库",
          "config": {
            "method": "POST",
            "url": "https://api.example.com/orders",
            "headers": {
              "Content-Type": "application/json"
            },
            "body": {
              "order_id": "${input.order_id}",
              "customer_id": "${input.customer_id}",
              "amount": "${input.amount}",
              "status": "${validate_order.response.status}",
              "risk_level": "${analyze_risk.response.risk_level}",
              "risk_score": "${analyze_risk.response.risk_score}",
              "created_at": "${timestamp}"
            }
          },
          "dependsOn": ["analyze_risk"]
        }
      ],
      "variables": {
        "api_key": "${env.API_KEY}",
        "timeout": 30000,
        "retry_attempts": 3
      }
    },
    "variables": {
      "priority": "HIGH",
      "auto_approve": false,
      "notification_enabled": true
    },
    "metadata": {
      "author": "external-system",
      "tags": ["导入", "订单处理"],
      "category": "数据处理",
      "difficulty": "INTERMEDIATE"
    },
    "importStatus": "SUCCESS",
    "importWarnings": [
      {
        "type": "CONFIG_WARNING",
        "message": "API端点URL使用了相对路径，建议使用绝对URL"
      }
    ],
    "importTime": 3.2,
    "importedAt": "2026-04-14T18:29:00Z",
    "sourceFormat": "JSON",
    "migrationResults": {
      "variablesMigrated": true,
      "configUpdated": true,
      "metadataPreserved": true
    }
  },
  "timestamp": "2026-04-14T18:29:00Z"
}
```

#### 错误码

- `400`: 请求参数错误
- `401`: 未授权
- `409`: 工作流名称已存在且不允许覆盖
- `422`: 工作流配置验证失败
- `500`: 服务器内部错误

---

### 4. 审计日志 API

#### 4.1 查询审计日志

**GET** `/audit-logs`

查询系统审计日志，支持按条件筛选和分页。

#### 请求参数

| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| action | string | 否 | 操作动作（支持前缀匹配） |
| actor | string | 否 | 操作者ID |
| resourceType | string | 否 | 资源类型：workflow, template, engine, user, dashboard, system |
| resourceId | string | 否 | 资源ID |
| severity | string | 否 | 严重级别：info, warn, error, critical |
| result | string | 否 | 操作结果：success, failure, denied |
| from | string | 否 | 开始时间（ISO格式） |
| to | string | 否 | 结束时间（ISO格式） |
| offset | number | 否 | 分页偏移，默认为0 |
| limit | number | 否 | 每页数量，默认50，最大200 |

#### 请求示例

```bash
curl -X GET "http://localhost:3000/api/audit-logs?action=workflow.&severity=error&from=2026-04-14T00:00:00Z&to=2026-04-14T23:59:59Z&limit=50" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

#### 响应示例

```json
{
  "success": true,
  "message": "查询审计日志成功",
  "data": [
    {
      "id": "audit_001",
      "action": "workflow.created",
      "actor": "user-001",
      "actorType": "user",
      "resourceType": "workflow",
      "resourceId": "workflow-002",
      "severity": "info",
      "result": "success",
      "message": "工作流创建成功：订单处理工作流 v2",
      "metadata": {
        "name": "订单处理工作流 v2",
        "status": "DRAFT",
        "userId": "user-001"
      },
      "ipAddress": "192.168.1.100",
      "traceId": "trace-001",
      "timestamp": "2026-04-14T18:10:00Z"
    },
    {
      "id": "audit_002",
      "action": "workflow.executed",
      "actor": "system",
      "actorType": "service",
      "resourceType": "workflow",
      "resourceId": "workflow-002",
      "severity": "info",
      "result": "success",
      "message": "工作流执行成功：execution-001",
      "metadata": {
        "executionId": "execution-001",
        "duration": 45.2,
        "priority": "HIGH",
        "inputVariables": {
          "order_id": "ORD-2026-001",
          "amount": 299.99
        }
      },
      "ipAddress": "10.0.0.1",
      "traceId": "trace-002",
      "timestamp": "2026-04-14T18:18:00Z"
    },
    {
      "id": "audit_003",
      "action": "workflow.failed",
      "actor": "system",
      "actorType": "service",
      "resourceType": "workflow",
      "resourceId": "workflow-002",
      "severity": "error",
      "result": "failure",
      "message": "工作流执行失败：execution-002",
      "metadata": {
        "executionId": "execution-002",
        "error": {
          "code": "VALIDATION_ERROR",
          "message": "订单金额超过限制",
          "details": {
            "max_amount": 5000,
            "actual_amount": 9999.99
          }
        }
      },
      "ipAddress": "10.0.0.1",
      "traceId": "trace-003",
      "timestamp": "2026-04-14T18:20:00Z"
    }
  ],
  "pagination": {
    "offset": 0,
    "limit": 50,
    "total": 156,
    "totalPages": 4
  },
  "timestamp": "2026-04-14T18:30:00Z"
}
```

#### 错误码

- `401`: 未授权
- `500`: 服务器内部错误

---

#### 4.2 获取审计统计

**GET** `/audit-logs/stats`

获取审计日志的统计信息，包括按动作、级别、结果等维度的统计。

#### 请求参数

| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| from | string | 否 | 开始时间（ISO格式） |
| to | string | 否 | 结束时间（ISO格式） |
| resourceType | string | 否 | 资源类型筛选 |

#### 请求示例

```bash
curl -X GET "http://localhost:3000/api/audit-logs/stats?from=2026-04-14T00:00:00Z&to=2026-04-14T23:59:59Z&resourceType=workflow" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

#### 响应示例

```json
{
  "success": true,
  "message": "获取审计统计成功",
  "data": {
    "totalEntries": 156,
    "byAction": {
      "workflow.created": 12,
      "workflow.updated": 8,
      "workflow.deleted": 3,
      "workflow.executed": 45,
      "workflow.failed": 6,
      "workflow.cloned": 2,
      "user.login": 25,
      "user.logout": 15,
      "api.call": 40
    },
    "bySeverity": {
      "info": 120,
      "warn": 25,
      "error": 10,
      "critical": 1
    },
    "byResult": {
      "success": 135,
      "failure": 15,
      "denied": 6
    },
    "byResourceType": {
      "workflow": 76,
      "user": 40,
      "system": 25,
      "template": 10,
      "engine": 5
    },
    "failureCount": 21,
    "earliestEntry": "2026-04-14T00:05:00Z",
    "latestEntry": "2026-04-14T18:30:00Z"
  },
  "timestamp": "2026-04-14T18:30:00Z"
}
```

#### 错误码

- `401`: 未授权
- `500`: 服务器内部错误

---

### 5. API 控制器增强功能

#### 5.1 错误处理装饰器

所有API控制器都使用了统一的错误处理装饰器，提供一致的用户体验。

```typescript
@withErrorHandling({
  logErrors: true,
  sanitizeUserError: true,
  defaultErrorCode: 'WORKFLOW_EXECUTE_ERROR',
  defaultStatusCode: 500,
})
```

#### 5.2 自动重试机制

网络请求失败时自动重试，支持指数退避策略。

```typescript
@withRetry({
  maxRetries: 2,
  delayMs: 100,
  retryCondition: (error) => 
    error.message.includes('network') || 
    error.message.includes('timeout') ||
    error.message.includes('connection')
})
```

#### 5.3 输入验证

自动验证请求参数，返回详细的错误信息。

```typescript
@withInputValidation((req) => this.validateExecuteWorkflow(req))
```

#### 5.4 性能监控

自动监控API性能指标，记录响应时间和资源使用情况。

```typescript
@withPerformanceMonitoring()
```

---

### 6. 最佳实践

#### 6.1 API调用建议

1. **使用HTTPS协议** 确保数据传输安全
2. **实现请求重试机制** 处理临时性网络故障
3. **添加适当的超时设置** 避免长时间等待
4. **使用连接池管理数据库连接** 提高性能

#### 6.2 错误处理

1. **始终检查响应状态码** 正确处理HTTP状态
2. **实现指数退避重试** 避免雪崩效应
3. **记录详细的错误日志** 便于问题排查
4. **提供用户友好的错误信息** 提升用户体验

#### 6.3 性能优化

1. **启用响应缓存** 减少重复计算
2. **使用分页减少数据传输** 降低网络开销
3. **实现异步处理** 提高并发能力
4. **监控关键性能指标** 及时发现问题

#### 6.4 安全考虑

1. **使用JWT进行身份验证** 确保用户身份安全
2. **实现适当的权限控制** 防止越权操作
3. **敏感数据加密传输** 保护数据隐私
4. **定期更新API密钥** 降低安全风险

---

## 版本历史

### v2.0 (当前版本)
- 增强版API控制器，支持装饰器模式
- 自动重试和错误处理机制
- 性能监控和指标收集
- 更严格的输入验证
- 工作流导入导出功能
- 完整的审计日志系统
- 工作流克隆功能

### v1.0
- 基础工作流管理API
- 简单的CRUD操作
- 基础错误处理
- 手动重试机制

---

## 联系支持

如有问题或建议，请联系：
- **邮箱**: support@ai-orchestrator.com
- **文档**: https://docs.ai-orchestrator.com
- **社区**: https://community.ai-orchestrator.com
- **GitHub**: https://github.com/ai-ideas-lab/ai-workspace-orchestrator

---

**文档生成时间**: 2026-04-14T18:30:00Z
**生成工具**: API文档自动生成系统
**维护团队**: AI Workspace Orchestrator 开发团队