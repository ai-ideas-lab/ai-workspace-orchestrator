# AI Workspace Orchestrator API 补充文档

## 概述

本文档补充了 AI Workspace Orchestrator 的增强版API接口，包括带装饰器的高级工作流管理、重试机制、性能监控等功能。

## 基础信息

- **基础URL**: `http://localhost:3000/api`
- **内容类型**: `application/json`
- **认证方式**: JWT Bearer Token
- **版本**: v2.0 (增强版)

## 增强功能特性

### 装饰器模式
- `@withErrorHandling`: 统一错误处理
- `@withRetry`: 自动重试机制
- `@withInputValidation`: 输入参数验证
- `@withTransactionErrorHandler`: 事务错误处理
- `@withPerformanceMonitoring`: 性能监控

---

## API 接口详情

### 1. 增强版获取工作流列表

**GET** `/workflows/enhanced`

获取工作流列表，支持性能监控和自动重试。

#### 路径参数

| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| page | number | 否 | 页码，默认1 |
| limit | number | 否 | 每页数量，默认10，最大100 |
| status | string | 否 | 工作流状态过滤 |
| userId | string | 否 | 用户ID过滤 |
| search | string | 否 | 搜索关键词 |

#### 请求示例

```bash
curl -X GET "http://localhost:3000/api/workflows/enhanced?page=1&limit=10&status=ACTIVE&search=订单" \
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
      "stepsCount": 5,
      "createdAt": "2026-04-13T08:10:00Z",
      "updatedAt": "2026-04-13T09:15:00Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50,
    "limit": 10
  },
  "performance": {
    "responseTime": 125,
    "cacheHit": true,
    "retriesCount": 0
  },
  "timestamp": "2026-04-13T08:30:00Z"
}
```

#### 错误码

- `400`: 查询参数验证失败
- `401`: 未授权
- `403`: 权限不足
- `500`: 服务器内部错误
- `503`: 服务暂时不可用（自动重试）

#### 认证要求

- Bearer Token (JWT)
- 需要用户登录状态

---

### 2. 增强版创建工作流

**POST** `/workflows/enhanced`

创建新工作流，支持事务错误处理和输入验证。

#### 请求参数

| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| name | string | 是 | 工作流名称，最大200字符 |
| description | string | 否 | 工作流描述 |
| config | object | 是 | 工作流配置对象 |
| variables | object | 否 | 变量定义 |
| userId | string | 否 | 用户ID |

#### 请求示例

```json
{
  "name": "智能订单处理工作流",
  "description": "AI驱动的订单自动化处理系统",
  "config": {
    "steps": [
      {
        "id": "validate-order",
        "type": "api",
        "name": "验证订单信息",
        "config": {
          "url": "https://api.example.com/validate",
          "method": "POST",
          "headers": {
            "Content-Type": "application/json",
            "Authorization": "Bearer ${token}"
          },
          "timeout": 30000,
          "retry": {
            "maxAttempts": 3,
            "delayMs": 1000
          }
        }
      },
      {
        "id": "ai-analysis",
        "type": "ai",
        "name": "AI风险分析",
        "config": {
          "model": "gpt-4",
          "prompt": "分析订单风险等级和欺诈可能性",
          "temperature": 0.3
        }
      },
      {
        "id": "decision",
        "type": "condition",
        "name": "决策分支",
        "config": {
          "condition": "${ai_analysis.risk_level} === 'HIGH'",
          "true": "reject-order",
          "false": "process-order"
        }
      }
    ],
    "variables": {
      "order_id": "${input.order_id}",
      "risk_score": 0,
      "processed_at": "${timestamp}"
    }
  },
  "variables": {
    "priority": "NORMAL",
    "max_retries": 3,
    "timeout": 60000
  }
}
```

#### 响应示例

```json
{
  "success": true,
  "message": "工作流创建成功",
  "data": {
    "id": "workflow-enhanced-001",
    "name": "智能订单处理工作流",
    "description": "AI驱动的订单自动化处理系统",
    "status": "DRAFT",
    "config": {
      "steps": [
        {
          "id": "validate-order",
          "type": "api",
          "name": "验证订单信息",
          "config": {
            "url": "https://api.example.com/validate",
            "method": "POST",
            "timeout": 30000
          }
        }
      ]
    },
    "variables": {
      "priority": "NORMAL",
      "max_retries": 3,
      "timeout": 60000
    },
    "userId": "user-001",
    "createdAt": "2026-04-13T08:30:00Z",
    "updatedAt": "2026-04-13T08:30:00Z"
  },
  "transaction": {
    "id": "txn-001",
    "status": "COMMITTED"
  },
  "validation": {
    "passed": true,
    "warnings": [],
    "suggestions": []
  },
  "timestamp": "2026-04-13T08:30:00Z"
}
```

#### 错误码

- `400`: 输入验证失败
- `401`: 未授权
- `409`: 工作流名称已存在
- `422`: 数据格式错误
- `500`: 服务器内部错误（事务回滚）
- `503`: 数据库连接失败

#### 认证要求

- Bearer Token (JWT)
- 需要用户登录状态

---

### 3. 增强版获取工作流详情

**GET** `/workflows/enhanced/:id`

获取工作流详情，支持缓存和自动重试。

#### 路径参数

| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| id | string | 是 | 工作流ID |

#### 请求示例

```bash
curl -X GET "http://localhost:3000/api/workflows/enhanced/workflow-enhanced-001" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 响应示例

```json
{
  "success": true,
  "message": "获取工作流详情成功",
  "data": {
    "id": "workflow-enhanced-001",
    "name": "智能订单处理工作流",
    "description": "AI驱动的订单自动化处理系统",
    "status": "ACTIVE",
    "config": {
      "steps": [
        {
          "id": "validate-order",
          "type": "api",
          "name": "验证订单信息",
          "config": {
            "url": "https://api.example.com/validate",
            "method": "POST",
            "timeout": 30000,
            "retry": {
              "maxAttempts": 3,
              "backoff": "exponential"
            }
          },
          "validation": {
            "urlAccessible": true,
            "methodSupported": true,
            "timeoutValid": true
          }
        },
        {
          "id": "ai-analysis",
          "type": "ai",
          "name": "AI风险分析",
          "config": {
            "model": "gpt-4",
            "prompt": "分析订单风险等级",
            "temperature": 0.3
          },
          "validation": {
            "modelAvailable": true,
            "promptValid": true
          }
        }
      ]
    },
    "variables": {
      "priority": "NORMAL",
      "max_retries": 3,
      "timeout": 60000
    },
    "metadata": {
      "executionCount": 1250,
      "successRate": 0.95,
      "averageExecutionTime": 2.5,
      "lastExecutedAt": "2026-04-13T08:25:00Z"
    },
    "userId": "user-001",
    "createdAt": "2026-04-13T08:30:00Z",
    "updatedAt": "2026-04-13T08:35:00Z"
  },
  "cache": {
    "hit": true,
    "ttl": 300,
    "key": "workflow:enhanced:workflow-enhanced-001"
  },
  "performance": {
    "responseTime": 45,
    "databaseTime": 20,
    "cacheTime": 5
  },
  "timestamp": "2026-04-13T08:35:00Z"
}
```

#### 错误码

- `400`: 工作流ID格式错误
- `401`: 未授权
- `403`: 权限不足
- `404`: 工作流不存在
- `429`: 请求频率限制
- `500`: 服务器内部错误

#### 认证要求

- Bearer Token (JWT)
- 需要用户登录状态
- 工作流所有者或管理员权限

---

### 4. 增强版更新工作流

**PUT** `/workflows/enhanced/:id`

更新工作流，支持乐观锁和事务错误处理。

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
| status | string | 否 | 工作流状态 (DRAFT, ACTIVE, PAUSED, ARCHIVED) |

#### 请求示例

```json
{
  "name": "智能订单处理工作流 v2",
  "description": "增强版AI驱动的订单自动化处理系统",
  "config": {
    "steps": [
      {
        "id": "validate-order",
        "type": "api",
        "name": "验证订单信息",
        "config": {
          "url": "https://api.example.com/validate-v2",
          "method": "POST",
          "timeout": 30000,
          "retry": {
            "maxAttempts": 5,
            "backoff": "exponential",
            "delayMs": 1000
          }
        }
      },
      {
        "id": "ai-analysis",
        "type": "ai",
        "name": "AI风险分析",
        "config": {
          "model": "gpt-4-turbo",
          "prompt": "深度分析订单风险等级和欺诈可能性",
          "temperature": 0.2,
          "maxTokens": 1000
        }
      }
    ],
    "variables": {
      "priority": "HIGH",
      "max_retries": 5,
      "timeout": 90000,
      "features": {
        "real_time_monitoring": true,
        "auto_scaling": true
      }
    }
  },
  "status": "ACTIVE"
}
```

#### 响应示例

```json
{
  "success": true,
  "message": "工作流更新成功",
  "data": {
    "id": "workflow-enhanced-001",
    "name": "智能订单处理工作流 v2",
    "description": "增强版AI驱动的订单自动化处理系统",
    "status": "ACTIVE",
    "config": {
      "steps": [
        {
          "id": "validate-order",
          "type": "api",
          "name": "验证订单信息",
          "config": {
            "url": "https://api.example.com/validate-v2",
            "method": "POST",
            "timeout": 30000,
            "retry": {
              "maxAttempts": 5,
              "backoff": "exponential"
            }
          }
        }
      ]
    },
    "variables": {
      "priority": "HIGH",
      "max_retries": 5,
      "timeout": 90000,
      "features": {
        "real_time_monitoring": true,
        "auto_scaling": true
      }
    },
    "userId": "user-001",
    "version": 2,
    "updatedAt": "2026-04-13T08:40:00Z"
  },
  "transaction": {
    "id": "txn-002",
    "status": "COMMITTED",
    "version": 2
  },
  "optimisticLock": {
    "version": 2,
    "cas": true
  },
  "timestamp": "2026-04-13T08:40:00Z"
}
```

#### 错误码

- `400`: 输入验证失败
- `401`: 未授权
- `403": 权限不足
- `404`: 工作流不存在
- `409`: 工作流名称冲突
- `422`: 数据格式错误
- `428`: 需要重新获取（乐观锁冲突）
- `500`: 服务器内部错误（事务回滚）

#### 认证要求

- Bearer Token (JWT)
- 需要用户登录状态
- 工作流所有者权限

---

### 5. 增强版删除工作流

**DELETE** `/workflows/enhanced/:id`

删除工作流，支持级联删除和活跃执行检查。

#### 路径参数

| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| id | string | 是 | 工作流ID |

#### 请求示例

```bash
curl -X DELETE "http://localhost:3000/api/workflows/enhanced/workflow-enhanced-001" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 响应示例

```json
{
  "success": true,
  "message": "工作流删除成功",
  "data": null,
  "cleanup": {
    "deletedExecutions": 1250,
    "deletedLogs": 5000,
    "deletedMetrics": 10000,
    "cleanupTime": 2500
  },
  "preCheck": {
    "activeExecutions": 0,
    "scheduledJobs": 0,
    "dependentWorkflows": 0
  },
  "timestamp": "2026-04-13T08:45:00Z"
}
```

#### 错误码

- `400`: 工作流ID格式错误
- `401`: 未授权
- `403`: 权限不足
- `404`: 工作流不存在
- `409`: 包含活跃执行，无法删除
- `423`: 工作流被锁定
- `500`: 服务器内部错误
- `503`: 数据库连接失败（自动重试）

#### 认证要求

- Bearer Token (JWT)
- 需要用户登录状态
- 工作流所有者或管理员权限

---

### 6. 增强版执行工作流

**POST** `/workflows/enhanced/:id/execute`

执行工作流，支持超时控制、重试机制和性能监控。

#### 路径参数

| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| id | string | 是 | 工作流ID |

#### 请求参数

| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| variables | object | 否 | 输入变量 |
| priority | string | 否 | 优先级 (LOW, NORMAL, HIGH, URGENT) |
| timeout | number | 否 | 超时时间（秒），1-3600 |

#### 请求示例

```json
{
  "variables": {
    "order_id": "ORD-2026-001",
    "customer_id": "CUS-001",
    "amount": 299.99,
    "currency": "CNY",
    "items": [
      {
        "product_id": "PROD-001",
        "quantity": 2,
        "price": 149.99
      }
    ],
    "metadata": {
      "source": "web",
      "device": "desktop",
      "ip_address": "192.168.1.100"
    }
  },
  "priority": "HIGH",
  "timeout": 180
}
```

#### 响应示例

```json
{
  "success": true,
  "message": "工作流执行已启动",
  "data": {
    "executionId": "exec-enhanced-001",
    "workflowId": "workflow-enhanced-001",
    "status": "PENDING",
    "priority": "HIGH",
    "timeout": 180,
    "variables": {
      "order_id": "ORD-2026-001",
      "customer_id": "CUS-001",
      "amount": 299.99
    },
    "estimatedDuration": 45,
    "createdAt": "2026-04-13T08:50:00Z",
    "startedAt": "2026-04-13T08:50:15Z"
  },
  "monitoring": {
    "queuePosition": 3,
    "estimatedStartTime": "2026-04-13T08:50:45Z",
    "retryPolicy": {
      "maxRetries": 3,
      "backoffType": "exponential",
      "initialDelay": 1000
    }
  },
  "performance": {
    "queueTime": 15,
    "startupTime": 30,
    "totalTime": 45
  },
  "timestamp": "2026-04-13T08:50:15Z"
}
```

#### 错误码

- `400`: 输入验证失败
- `401`: 未授权
- `403": 权限不足
- `404`: 工作流不存在
- `422`: 数据格式错误
- `429`: 队列满，稍后重试
- `500`: 服务器内部错误
- `503`: 服务不可用（自动重试）

#### 认证要求

- Bearer Token (JWT)
- 需要用户登录状态
- 执行权限

---

### 7. 增强版获取执行历史

**GET** `/workflows/enhanced/:id/executions`

获取工作流执行历史，支持分页和高级过滤。

#### 路径参数

| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| id | string | 是 | 工作流ID |

#### 查询参数

| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| page | number | 否 | 页码，默认1 |
| limit | number | 否 | 每页数量，默认20，最大100 |
| status | string | 否 | 状态过滤 (PENDING, RUNNING, COMPLETED, FAILED, CANCELLED) |
| startDate | string | 否 | 开始日期 (ISO 8601) |
| endDate | string | 否 | 结束日期 (ISO 8601) |

#### 请求示例

```bash
curl -X GET "http://localhost:3000/api/workflows/enhanced/workflow-enhanced-001/executions?page=1&limit=10&status=COMPLETED&startDate=2026-04-01T00:00:00Z&endDate=2026-04-13T23:59:59Z" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 响应示例

```json
{
  "success": true,
  "message": "获取执行历史成功",
  "data": [
    {
      "id": "exec-enhanced-001",
      "workflowId": "workflow-enhanced-001",
      "status": "COMPLETED",
      "priority": "HIGH",
      "duration": 45.2,
      "inputVariables": {
        "order_id": "ORD-2026-001",
        "customer_id": "CUS-001"
      },
      "output": {
        "result": "SUCCESS",
        "processed_items": 5,
        "execution_time": 45.2
      },
      "errors": [],
      "createdAt": "2026-04-13T08:50:00Z",
      "startedAt": "2026-04-13T08:50:15Z",
      "completedAt": "2026-04-13T08:50:45Z",
      "retryCount": 0
    },
    {
      "id": "exec-enhanced-002",
      "workflowId": "workflow-enhanced-001",
      "status": "FAILED",
      "priority": "NORMAL",
      "duration": 120.5,
      "inputVariables": {
        "order_id": "ORD-2026-002",
        "customer_id": "CUS-002"
      },
      "output": {
        "result": "FAILED",
        "error": "API timeout",
        "failed_step": "validate-order"
      },
      "errors": [
        {
          "step": "validate-order",
          "error": "Connection timeout",
          "timestamp": "2026-04-13T09:00:30Z"
        }
      ],
      "createdAt": "2026-04-13T09:00:00Z",
      "startedAt": "2026-04-13T09:00:15Z",
      "completedAt": "2026-04-13T09:02:15Z",
      "retryCount": 2
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 25,
    "totalItems": 500,
    "limit": 20
  },
  "aggregation": {
    "totalCount": 500,
    "completedCount": 475,
    "failedCount": 20,
    "cancelledCount": 5,
    "successRate": 0.95,
    "averageDuration": 52.3
  },
  "timestamp": "2026-04-13T09:05:00Z"
}
```

#### 错误码

- `400`: 查询参数验证失败
- `401": 未授权
- `403": 权限不足
- `404`: 工作流不存在
- `500`: 服务器内部错误

#### 认证要求

- Bearer Token (JWT)
- 需要用户登录状态
- 查看权限

---

### 8. 增强版验证工作流配置

**POST** `/workflows/enhanced/validate`

验证工作流配置，提供详细的静态分析和建议。

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
        "id": "validate-order",
        "type": "api",
        "name": "验证订单信息",
        "config": {
          "url": "https://api.example.com/validate",
          "method": "POST",
          "headers": {
            "Content-Type": "application/json",
            "Authorization": "Bearer ${auth_token}"
          },
          "timeout": 30000,
          "retry": {
            "maxAttempts": 3,
            "backoff": "exponential"
          }
        }
      },
      {
        "id": "ai-analysis",
        "type": "ai",
        "name": "AI风险分析",
        "config": {
          "model": "gpt-4",
          "prompt": "分析订单风险等级",
          "temperature": 0.3,
          "maxTokens": 1000
        }
      },
      {
        "id": "decision",
        "type": "condition",
        "name": "决策分支",
        "config": {
          "condition": "${ai_analysis.risk_score} > 0.7",
          "true": "reject-order",
          "false": "process-order"
        }
      }
    ],
    "variables": {
      "auth_token": "${env.API_TOKEN}",
      "risk_score": 0.0
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
    "score": 95,
    "warnings": [
      {
        "type": "performance",
        "message": "API步骤超时时间较长，建议优化",
        "step": "validate-order",
        "severity": "MEDIUM"
      },
      {
        "type": "security",
        "message": "建议添加API密钥轮换机制",
        "step": "validate-order",
        "severity": "LOW"
      }
    ],
    "suggestions": [
      {
        "type": "optimization",
        "message": "可以将AI分析步骤并行化以提高性能",
        "impact": "HIGH"
      },
      {
        "type": "reliability",
        "message": "建议添加错误重试机制",
        "impact": "MEDIUM"
      }
    ],
    "stepAnalysis": [
      {
        "id": "validate-order",
        "type": "api",
        "status": "VALID",
        "validation": {
          "urlAccessible": true,
          "methodSupported": true,
          "timeoutValid": true,
          "headersValid": true
        },
        "score": 90,
        "issues": []
      },
      {
        "id": "ai-analysis",
        "type": "ai",
        "status": "VALID",
        "validation": {
          "modelAvailable": true,
          "promptValid": true,
          "temperatureInRange": true
        },
        "score": 95,
        "issues": []
      },
      {
        "id": "decision",
        "type": "condition",
        "status": "VALID",
        "validation": {
          "syntaxValid": true,
          "variablesDefined": true
        },
        "score": 85,
        "issues": []
      }
    ],
    "performance": {
      "estimatedDuration": 65,
      "parallelizableSteps": 0,
      "criticalPath": ["validate-order", "ai-analysis", "decision"]
    }
  },
  "timestamp": "2026-04-13T09:10:00Z"
}
```

#### 错误码

- `400`: 配置验证失败
- `422`: 数据格式错误
- `500`: 服务器内部错误

#### 认证要求

- Bearer Token (JWT)
- 需要用户登录状态

---

### 9. 增强版获取执行路径

**POST** `/workflows/enhanced/execution-path`

分析工作流执行路径，支持依赖分析和性能预测。

#### 请求参数

| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| config | object | 是 | 工作流配置 |
| input | object | 否 | 输入变量（用于路径分析） |

#### 请求示例

```json
{
  "config": {
    "steps": [
      {
        "id": "validate-order",
        "type": "api",
        "name": "验证订单信息",
        "config": {
          "url": "https://api.example.com/validate",
          "method": "POST",
          "timeout": 30000
        }
      },
      {
        "id": "check-inventory",
        "type": "api",
        "name": "检查库存",
        "config": {
          "url": "https://api.example.com/inventory",
          "method": "GET",
          "timeout": 20000
        }
      },
      {
        "id": "ai-analysis",
        "type": "ai",
        "name": "AI分析",
        "config": {
          "model": "gpt-4",
          "prompt": "基于订单和库存情况制定策略"
        }
      },
      {
        "id": "decision",
        "type": "condition",
        "name": "决策",
        "config": {
          "condition": "${ai_analysis.recommendation} === 'PROCESS'",
          "true": "process-order",
          "false": "cancel-order"
        }
      },
      {
        "id": "process-order",
        "type": "api",
        "name": "处理订单",
        "config": {
          "url": "https://api.example.com/process",
          "method": "POST"
        }
      },
      {
        "id": "cancel-order",
        "type": "api",
        "name": "取消订单",
        "config": {
          "url": "https://api.example.com/cancel",
          "method": "POST"
        }
      }
    ]
  },
  "input": {
    "order_id": "ORD-2026-001",
    "customer_id": "CUS-001",
    "amount": 299.99
  }
}
```

#### 响应示例

```json
{
  "success": true,
  "message": "执行路径分析成功",
  "data": {
    "paths": [
      {
        "id": "main-path",
        "name": "主执行路径",
        "description": "标准订单处理流程",
        "steps": ["validate-order", "check-inventory", "ai-analysis", "decision", "process-order"],
        "estimatedDuration": 85,
        "parallelizable": true,
        "dependencies": [
          {
            "from": "validate-order",
            "to": "ai-analysis",
            "type": "data",
            "variable": "validation_result"
          },
          {
            "from": "check-inventory",
            "to": "ai-analysis",
            "type": "data",
            "variable": "inventory_status"
          }
        ],
        "decisionPoints": [
          {
            "step": "decision",
            "condition": "${ai_analysis.recommendation} === 'PROCESS'",
            "branches": {
              "true": {
                "path": ["process-order"],
                "probability": 0.8,
                "duration": 15
              },
              "false": {
                "path": ["cancel-order"],
                "probability": 0.2,
                "duration": 10
              }
            }
          }
        ]
      }
    ],
    "performance": {
      "bestCaseDuration": 65,
      "worstCaseDuration": 95,
      "averageDuration": 85,
      "criticalPath": ["validate-order", "check-inventory", "ai-analysis", "decision", "process-order"],
      "bottlenecks": [
        {
          "step": "ai-analysis",
          "reason": "AI处理耗时较长",
          "impact": "HIGH"
        }
      ],
      "optimizationOpportunities": [
        {
          "step": "check-inventory",
          "suggestion": "可以并行执行库存检查",
          "potentialSavings": 20
        }
      ]
    },
    "inputOutputMapping": {
      "inputs": ["order_id", "customer_id", "amount"],
      "outputs": ["order_status", "processing_time", "total_cost"],
      "intermediate": ["validation_result", "inventory_status", "ai_analysis"]
    },
    "errorHandling": {
      "recoveryPaths": 2,
      "fallbackPoints": ["validate-order", "check-inventory"],
      "gracefulDegradation": true
    }
  },
  "timestamp": "2026-04-13T09:15:00Z"
}
```

#### 错误码

- `400`: 配置分析失败
- `422`: 数据格式错误
- `500`: 服务器内部错误

#### 认证要求

- Bearer Token (JWT)
- 需要用户登录状态

---

### 10. 增强版克隆工作流

**POST** `/workflows/enhanced/:id/clone`

克隆工作流，支持数据验证、权限检查和自定义命名。

#### 路径参数

| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| id | string | 是 | 原始工作流ID |

#### 请求参数

| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| name | string | 否 | 新工作流名称 |

#### 请求示例

```json
{
  "name": "智能订单处理工作流 - 测试环境"
}
```

#### 响应示例

```json
{
  "success": true,
  "message": "工作流克隆成功",
  "data": {
    "id": "workflow-enhanced-cloned-001",
    "name": "智能订单处理工作流 - 测试环境",
    "description": "AI驱动的订单自动化处理系统",
    "status": "DRAFT",
    "config": {
      "steps": [
        {
          "id": "validate-order",
          "type": "api",
          "name": "验证订单信息",
          "config": {
            "url": "https://api.example.com/validate",
            "method": "POST",
            "timeout": 30000
          }
        }
      ]
    },
    "variables": {
      "priority": "NORMAL",
      "max_retries": 3,
      "timeout": 60000
    },
    "metadata": {
      "sourceWorkflowId": "workflow-enhanced-001",
      "sourceWorkflowName": "智能订单处理工作流",
      "clonedAt": "2026-04-13T09:20:00Z",
      "version": "1.0.0"
    },
    "userId": "user-001",
    "createdAt": "2026-04-13T09:20:00Z",
    "updatedAt": "2026-04-13T09:20:00Z"
  },
  "validation": {
    "configCopied": true,
    "variablesCopied": true,
    "metadataPreserved": true,
    "validationStatus": "PASSED"
  },
  "permissions": {
    "sourceOwner": "user-001",
    "targetOwner": "user-001",
    "authorized": true
  },
  "timestamp": "2026-04-13T09:20:00Z"
}
```

#### 错误码

- `400`: 输入验证失败
- `401`: 未授权
- `403": 权限不足
- `404": 原始工作流不存在
- `409": 工作流名称冲突
- `422": 数据格式错误
- `500`: 服务器内部错误（自动重试）

#### 认证要求

- Bearer Token (JWT)
- 需要用户登录状态
- 原始工作流查看权限

---

## 错误处理装饰器

### @withErrorHandling

统一错误处理装饰器，提供一致的错误响应格式。

```typescript
@withErrorHandling({
  logErrors: true,           // 记录错误日志
  sanitizeUserError: true,  // 清理用户敏感信息
  defaultErrorCode: 'WORKFLOW_ERROR',
  defaultStatusCode: 500
})
```

### @withRetry

自动重试装饰器，支持条件重试和指数退避。

```typescript
@withRetry({
  maxRetries: 3,
  delayMs: 1000,
  backoff: 'exponential',
  retryCondition: (error) => 
    error.message.includes('timeout') || 
    error.message.includes('connection')
})
```

### @withInputValidation

输入验证装饰器，自动验证请求参数。

```typescript
@withInputValidation((req) => {
  const { name, config } = req.body;
  const errors: string[] = [];
  
  if (!name) errors.push('名称不能为空');
  if (!config || typeof config !== 'object') errors.push('配置必须为对象');
  
  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
})
```

### @withTransactionErrorHandler

事务错误处理装饰器，确保事务一致性。

```typescript
@withTransactionErrorHandler('createWorkflow')
```

### @withPerformanceMonitoring

性能监控装饰器，记录API性能指标。

```typescript
@withPerformanceMonitoring()
```

---

## 性能指标

### 监控字段

| 指标 | 类型 | 说明 |
|------|------|------|
| responseTime | number | 响应时间（毫秒） |
| databaseTime | number | 数据库查询时间（毫秒） |
| cacheTime | number | 缓存访问时间（毫秒） |
| queueTime | number | 队列等待时间（毫秒） |
| memoryUsage | number | 内存使用量（MB） |
| cpuUsage | number | CPU使用率（%） |

### 性能阈值

| 指标 | 正常 | 警告 | 严重 |
|------|------|------|------|
| responseTime | < 100ms | 100-500ms | > 500ms |
| databaseTime | < 50ms | 50-200ms | > 200ms |
| queueTime | < 10ms | 10-50ms | > 50ms |
| memoryUsage | < 500MB | 500MB-1GB | > 1GB |
| cpuUsage | < 70% | 70-90% | > 90% |

---

## 最佳实践

### 1. API调用建议

- 使用HTTPS协议
- 实现请求重试机制
- 添加适当的超时设置
- 使用连接池管理数据库连接

### 2. 错误处理

- 始终检查响应状态码
- 实现指数退避重试
- 记录详细的错误日志
- 提供用户友好的错误信息

### 3. 性能优化

- 启用响应缓存
- 使用分页减少数据传输
- 实现异步处理
- 监控关键性能指标

### 4. 安全考虑

- 使用JWT进行身份验证
- 实现适当的权限控制
- 敏感数据加密传输
- 定期更新API密钥

---

## 版本历史

### v2.0 (当前版本)
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