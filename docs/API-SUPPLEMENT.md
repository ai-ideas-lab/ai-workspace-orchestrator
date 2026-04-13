# AI Workspace Orchestrator API 补充文档

## 概述

本文档补充最新实现的工作流管理API接口，包括工作流克隆、导入导出、验证工具等功能。基于实际代码实现提供详细的接口说明。

## 基础信息

- **基础URL**: `/api/workflows`
- **内容类型**: `application/json`
- **认证方式**: JWT Bearer Token
- **响应格式**: JSON

---

## 1. 工作流管理 API

### 1.1 获取工作流列表

**GET** `/api/workflows`

获取分页的工作流列表，支持状态筛选和搜索功能。

**请求参数**:
- `page`: 页码，默认1
- `limit`: 每页数量，默认10
- `status`: 工作流状态筛选
- `userId`: 用户ID筛选
- `search`: 搜索关键词

**请求示例**:
```bash
curl -X GET "http://localhost:3000/api/workflows?page=1&limit=10&status=ACTIVE&search=AI" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": "wf_123456",
      "name": "AI内容生成流水线",
      "description": "自动生成和优化博客内容",
      "status": "ACTIVE",
      "config": {
        "steps": [
          {
            "id": "step_1",
            "name": "主题生成",
            "type": "text-generation",
            "config": {
              "model": "gpt-4",
              "prompt": "生成博客主题"
            },
            "order": 1,
            "dependencies": []
          }
        ],
        "trigger": {
          "type": "schedule",
          "cron": "0 9 * * *"
        }
      },
      "variables": {
        "topic": "科技",
        "length": "1000"
      },
      "userId": "usr_789012",
      "createdAt": "2026-04-13T02:10:00Z",
      "updatedAt": "2026-04-13T02:15:00Z"
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

**错误码**:
- 400: 请求参数无效
- 401: 未授权
- 403: 权限不足
- 500: 服务器内部错误

### 1.2 创建工作流

**POST** `/api/workflows`

创建新的工作流配置。

**请求体**:
```json
{
  "name": "AI内容生成流水线",
  "description": "自动生成和优化博客内容",
  "config": {
    "steps": [
      {
        "id": "step_1",
        "name": "主题生成",
        "type": "text-generation",
        "config": {
          "model": "gpt-4",
          "prompt": "生成博客主题"
        },
        "order": 1,
        "dependencies": []
      }
    ],
    "trigger": {
      "type": "schedule",
      "cron": "0 9 * * *"
    }
  },
  "variables": {
    "topic": "科技",
    "length": "1000"
  },
  "userId": "usr_789012"
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "wf_123456",
    "name": "AI内容生成流水线",
    "description": "自动生成和优化博客内容",
    "status": "DRAFT",
    "config": {
      "steps": [
        {
          "id": "step_1",
          "name": "主题生成",
          "type": "text-generation",
          "config": {
            "model": "gpt-4",
            "prompt": "生成博客主题"
          },
          "order": 1,
          "dependencies": []
        }
      ],
      "trigger": {
        "type": "schedule",
        "cron": "0 9 * * *"
      }
    },
    "variables": {
      "topic": "科技",
      "length": "1000"
    },
    "userId": "usr_789012",
    "createdAt": "2026-04-13T02:10:00Z",
    "updatedAt": "2026-04-13T02:10:00Z"
  },
  "message": "工作流创建成功"
}
```

**错误码**:
- 400: 请求体格式错误或字段缺失
- 401: 未授权
- 409: 工作流名称已存在
- 500: 服务器内部错误

### 1.3 获取工作流详情

**GET** `/api/workflows/{id}`

获取指定工作流的详细信息。

**路径参数**:
- `id`: 工作流ID

**请求示例**:
```bash
curl -X GET "http://localhost:3000/api/workflows/wf_123456" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "wf_123456",
    "name": "AI内容生成流水线",
    "description": "自动生成和优化博客内容",
    "status": "ACTIVE",
    "config": {
      "steps": [
        {
          "id": "step_1",
          "name": "主题生成",
          "type": "text-generation",
          "config": {
            "model": "gpt-4",
            "prompt": "生成博客主题",
            "temperature": 0.7
          },
          "order": 1,
          "dependencies": []
        },
        {
          "id": "step_2",
          "name": "内容扩展",
          "type": "text-generation",
          "config": {
            "model": "gpt-4",
            "prompt": "基于主题扩展内容"
          },
          "order": 2,
          "dependencies": ["step_1"]
        }
      ],
      "trigger": {
        "type": "schedule",
        "cron": "0 9 * * *"
      }
    },
    "variables": {
      "topic": "科技",
      "length": "1000",
      "targetAudience": "开发者"
    },
    "userId": "usr_789012",
    "createdAt": "2026-04-13T02:10:00Z",
    "updatedAt": "2026-04-13T02:15:00Z",
    "executions": [
      {
        "id": "ex_789012",
        "status": "SUCCESS",
        "createdAt": "2026-04-13T09:00:00Z",
        "durationMs": 45000
      }
    ]
  },
  "message": "获取工作流详情成功"
}
```

**错误码**:
- 400: 工作流ID不能为空
- 404: 工作流不存在
- 401: 未授权
- 500: 服务器内部错误

### 1.4 更新工作流

**PUT** `/api/workflows/{id}`

更新现有工作流的配置信息。

**路径参数**:
- `id`: 工作流ID

**请求体**:
```json
{
  "name": "AI内容生成流水线 v2",
  "description": "增强版博客内容生成",
  "config": {
    "steps": [
      {
        "id": "step_1",
        "name": "主题生成",
        "type": "text-generation",
        "config": {
          "model": "gpt-4",
          "prompt": "生成博客主题",
          "temperature": 0.8
        },
        "order": 1,
        "dependencies": []
      }
    ],
    "trigger": {
      "type": "schedule",
      "cron": "0 9 * * *"
    }
  },
  "variables": {
    "topic": "科技",
    "length": "1500",
    "targetAudience": "开发者"
  },
  "status": "ACTIVE"
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "wf_123456",
    "name": "AI内容生成流水线 v2",
    "description": "增强版博客内容生成",
    "status": "ACTIVE",
    "config": {
      "steps": [
        {
          "id": "step_1",
          "name": "主题生成",
          "type": "text-generation",
          "config": {
            "model": "gpt-4",
            "prompt": "生成博客主题",
            "temperature": 0.8
          },
          "order": 1,
          "dependencies": []
        }
      ],
      "trigger": {
        "type": "schedule",
        "cron": "0 9 * * *"
      }
    },
    "variables": {
      "topic": "科技",
      "length": "1500",
      "targetAudience": "开发者"
    },
    "userId": "usr_789012",
    "createdAt": "2026-04-13T02:10:00Z",
    "updatedAt": "2026-04-13T02:20:00Z"
  },
  "message": "工作流更新成功"
}
```

**错误码**:
- 400: 工作流ID无效或请求体格式错误
- 404: 工作流不存在
- 401: 未授权
- 500: 服务器内部错误

### 1.5 删除工作流

**DELETE** `/api/workflows/{id}`

删除指定工作流及其相关数据。

**路径参数**:
- `id`: 工作流ID

**请求示例**:
```bash
curl -X DELETE "http://localhost:3000/api/workflows/wf_123456" \
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

**错误码**:
- 400: 工作流ID不能为空
- 404: 工作流不存在
- 401: 未授权
- 500: 服务器内部错误

---

## 2. 工作流克隆 API

### 2.1 克隆工作流

**POST** `/api/workflows/{id}/clone`

克隆现有工作流创建副本，支持自定义名称。

**路径参数**:
- `id`: 原始工作流ID

**请求体**:
```json
{
  "name": "AI内容生成流水线 - 备份"
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "wf_789012",
    "name": "AI内容生成流水线 - 备份",
    "description": "自动生成和优化博客内容",
    "status": "DRAFT",
    "config": {
      "steps": [
        {
          "id": "step_1",
          "name": "主题生成",
          "type": "text-generation",
          "config": {
            "model": "gpt-4",
            "prompt": "生成博客主题"
          },
          "order": 1,
          "dependencies": []
        }
      ],
      "trigger": {
        "type": "schedule",
        "cron": "0 9 * * *"
      }
    },
    "variables": {
      "topic": "科技",
      "length": "1000"
    },
    "userId": "usr_789012",
    "sourceWorkflowId": "wf_123456",
    "sourceWorkflowName": "AI内容生成流水线",
    "createdAt": "2026-04-13T02:25:00Z",
    "updatedAt": "2026-04-13T02:25:00Z"
  },
  "message": "工作流克隆成功"
}
```

**错误码**:
- 400: 请求体格式错误
- 404: 原始工作流不存在
- 401: 未授权
- 500: 服务器内部错误

---

## 3. 工作流执行 API

### 3.1 执行工作流

**POST** `/api/workflows/{id}/execute`

启动工作流执行，支持优先级设置和输入变量。

**路径参数**:
- `id`: 工作流ID

**请求体**:
```json
{
  "inputVariables": {
    "topic": "人工智能",
    "length": "2000",
    "targetAudience": "技术爱好者"
  },
  "priority": "HIGH"
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "ex_456789",
    "workflowId": "wf_123456",
    "workflow": {
      "id": "wf_123456",
      "name": "AI内容生成流水线"
    },
    "status": "PENDING",
    "inputVariables": {
      "topic": "人工智能",
      "length": "2000",
      "targetAudience": "技术爱好者"
    },
    "priority": "HIGH",
    "createdAt": "2026-04-13T09:05:00Z",
    "startedAt": "2026-04-13T09:05:30Z"
  },
  "message": "工作流执行启动成功"
}
```

**错误码**:
- 400: 工作流ID无效或请求体格式错误
- 404: 工作流不存在
- 401: 未授权
- 429: 工作流并发限制
- 500: 服务器内部错误

### 3.2 获取执行历史

**GET** `/api/workflows/{id}/executions`

获取指定工作流的执行历史记录。

**路径参数**:
- `id`: 工作流ID

**查询参数**:
- `page`: 页码，默认1
- `limit`: 每页数量，默认10
- `status`: 执行状态筛选
- `startDate`: 开始日期 (YYYY-MM-DD)
- `endDate`: 结束日期 (YYYY-MM-DD)

**请求示例**:
```bash
curl -X GET "http://localhost:3000/api/workflows/wf_123456/executions?page=1&limit=5&status=SUCCESS&startDate=2026-04-13&endDate=2026-04-13" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": "ex_456789",
      "workflowId": "wf_123456",
      "status": "SUCCESS",
      "inputVariables": {
        "topic": "人工智能",
        "length": "2000",
        "targetAudience": "技术爱好者"
      },
      "priority": "HIGH",
      "steps": [
        {
          "id": "step_456789",
          "name": "主题生成",
          "order": 1,
          "status": "COMPLETED",
          "execution": {
            "id": "ex_step_456789",
            "status": "COMPLETED",
            "output": {
              "topic": "人工智能的发展趋势",
              "confidence": 0.95
            },
            "durationMs": 3200
          }
        }
      ],
      "createdAt": "2026-04-13T09:05:00Z",
      "startedAt": "2026-04-13T09:05:30Z",
      "completedAt": "2026-04-13T09:10:15Z",
      "durationMs": 284500
    }
  ],
  "message": "获取执行历史成功",
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 12,
    "totalPages": 3
  }
}
```

**错误码**:
- 400: 工作流ID无效或查询参数错误
- 404: 工作流不存在
- 401: 未授权
- 500: 服务器内部错误

---

## 4. 工作流工具 API

### 4.1 验证工作流配置

**POST** `/api/workflows/validate`

验证工作流配置的语法和逻辑正确性。

**请求体**:
```json
{
  "config": {
    "steps": [
      {
        "id": "step_1",
        "name": "主题生成",
        "type": "text-generation",
        "config": {
          "model": "gpt-4",
          "prompt": "生成博客主题",
          "temperature": 0.7
        },
        "order": 1,
        "dependencies": []
      },
      {
        "id": "step_2",
        "name": "内容扩展",
        "type": "text-generation",
        "config": {
          "model": "gpt-4",
          "prompt": "基于主题扩展内容"
        },
        "order": 2,
        "dependencies": ["step_1"]
      }
    ],
    "trigger": {
      "type": "schedule",
      "cron": "0 9 * * *"
    }
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
    "recommendations": [
      {
        "type": "optimization",
        "message": "建议在步骤1中添加超时设置",
        "code": "OPT_001"
      }
    ],
    "performance": {
      "estimatedDuration": "45-60秒",
      "memoryUsage": "预估 256MB",
      "concurrentSteps": 1
    }
  },
  "message": "工作流配置验证成功"
}
```

**错误响应示例**:
```json
{
  "success": false,
  "data": {
    "valid": false,
    "errors": [
      {
        "code": "STEP_MISSING_CONFIG",
        "message": "步骤step_2缺少必要的配置参数",
        "path": "steps.1.config"
      },
      {
        "code": "DEPENDENCY_CYCLE",
        "message": "检测到循环依赖: step_1 → step_2 → step_1",
        "path": "steps.1.dependencies"
      }
    ],
    "warnings": [
      {
        "code": "UNUSED_VARIABLE",
        "message": "变量unusedVariable未被任何步骤使用",
        "path": "variables"
      }
    ],
    "performance": {
      "estimatedDuration": "30-45秒",
      "memoryUsage": "预估 128MB",
      "concurrentSteps": 1
    }
  },
  "message": "工作流配置验证失败"
}
```

**错误码**:
- 400: 请求体格式错误或配置验证失败
- 401: 未授权
- 500: 服务器内部错误

### 4.2 获取执行路径

**POST** `/api/workflows/execution-path`

获取工作流的执行路径和依赖关系分析。

**请求体**:
```json
{
  "config": {
    "steps": [
      {
        "id": "step_1",
        "name": "数据收集",
        "type": "api-call",
        "config": {
          "endpoint": "https://api.example.com/data",
          "method": "GET"
        },
        "order": 1,
        "dependencies": []
      },
      {
        "id": "step_2",
        "name": "数据处理",
        "type": "data-processing",
        "config": {
          "algorithm": "clean",
          "format": "json"
        },
        "order": 2,
        "dependencies": ["step_1"]
      },
      {
        "id": "step_3",
        "name": "AI生成",
        "type": "text-generation",
        "config": {
          "model": "gpt-4",
          "prompt": "基于处理后的数据生成内容"
        },
        "order": 3,
        "dependencies": ["step_2"]
      }
    ],
    "trigger": {
      "type": "schedule",
      "cron": "0 9 * * *"
    }
  }
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "executionPath": [
      {
        "stepId": "step_1",
        "stepName": "数据收集",
        "stepType": "api-call",
        "order": 1,
        "dependencies": [],
        "estimatedDuration": "5-10秒",
        "canRunParallel": false,
        "requiredResources": ["网络连接"]
      },
      {
        "stepId": "step_2",
        "stepName": "数据处理",
        "stepType": "data-processing",
        "order": 2,
        "dependencies": ["step_1"],
        "estimatedDuration": "10-15秒",
        "canRunParallel": false,
        "requiredResources": ["CPU", "内存"]
      },
      {
        "stepId": "step_3",
        "stepName": "AI生成",
        "stepType": "text-generation",
        "order": 3,
        "dependencies": ["step_2"],
        "estimatedDuration": "20-30秒",
        "canRunParallel": false,
        "requiredResources": ["GPU", "API调用额度"]
      }
    ],
    "dependencyGraph": {
      "nodes": [
        {"id": "step_1", "name": "数据收集"},
        {"id": "step_2", "name": "数据处理"},
        {"id": "step_3", "name": "AI生成"}
      ],
      "edges": [
        {"from": "step_1", "to": "step_2"},
        {"from": "step_2", "to": "step_3"}
      ]
    },
    "criticalPath": ["step_1", "step_2", "step_3"],
    "totalEstimatedDuration": "35-55秒",
    "parallelizableSteps": 0,
    "resourceRequirements": {
      "cpu": "中等",
      "memory": "中等",
      "network": "低",
      "gpu": "高"
    }
  },
  "message": "获取执行路径成功"
}
```

**错误码**:
- 400: 请求体格式错误或配置分析失败
- 401: 未授权
- 500: 服务器内部错误

---

## 5. 工作流导入导出 API

### 5.1 导出工作流

**GET** `/api/workflows/{id}/export`

将工作流配置导出为JSON文件。

**路径参数**:
- `id`: 工作流ID

**请求示例**:
```bash
curl -X GET "http://localhost:3000/api/workflows/wf_123456/export" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "workflow": {
      "id": "wf_123456",
      "name": "AI内容生成流水线",
      "description": "自动生成和优化博客内容",
      "status": "ACTIVE",
      "config": {
        "steps": [
          {
            "id": "step_1",
            "name": "主题生成",
            "type": "text-generation",
            "config": {
              "model": "gpt-4",
              "prompt": "生成博客主题",
              "temperature": 0.7
            },
            "order": 1,
            "dependencies": []
          }
        ],
        "trigger": {
          "type": "schedule",
          "cron": "0 9 * * *"
        }
      },
      "variables": {
        "topic": "科技",
        "length": "1000"
      },
      "userId": "usr_789012",
      "createdAt": "2026-04-13T02:10:00Z",
      "updatedAt": "2026-04-13T02:15:00Z"
    },
    "exportVersion": "1.0",
    "exportedAt": "2026-04-13T10:00:00Z",
    "checksum": "a1b2c3d4e5f67890"
  },
  "message": "工作流导出成功"
}
```

**文件下载**:
```bash
# 下载文件示例
curl -X GET "http://localhost:3000/api/workflows/wf_123456/export" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -o "workflow-ai-content-generator-1713048000000.json"
```

**错误码**:
- 404: 工作流不存在
- 401: 未授权
- 500: 服务器内部错误

### 5.2 导入工作流

**POST** `/api/workflows/import`

从JSON文件导入工作流配置。

**请求体**:
```json
{
  "workflow": {
    "name": "AI内容生成流水线",
    "description": "自动生成和优化博客内容",
    "status": "DRAFT",
    "config": {
      "steps": [
        {
          "id": "step_1",
          "name": "主题生成",
          "type": "text-generation",
          "config": {
            "model": "gpt-4",
            "prompt": "生成博客主题",
            "temperature": 0.7
          },
          "order": 1,
          "dependencies": []
        }
      ],
      "trigger": {
        "type": "schedule",
        "cron": "0 9 * * *"
      }
    },
    "variables": {
      "topic": "科技",
      "length": "1000"
    },
    "userId": "usr_789012"
  },
  "options": {
    "name": "AI内容生成流水线 v2",
    "draft": true,
    "overwrite": false
  }
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "wf_789012",
    "name": "AI内容生成流水线 v2",
    "description": "自动生成和优化博客内容",
    "status": "DRAFT",
    "config": {
      "steps": [
        {
          "id": "step_1",
          "name": "主题生成",
          "type": "text-generation",
          "config": {
            "model": "gpt-4",
            "prompt": "生成博客主题",
            "temperature": 0.7
          },
          "order": 1,
          "dependencies": []
        }
      ],
      "trigger": {
        "type": "schedule",
        "cron": "0 9 * * *"
      }
    },
    "variables": {
      "topic": "科技",
      "length": "1000"
    },
    "userId": "usr_789012",
    "createdAt": "2026-04-13T10:05:00Z",
    "updatedAt": "2026-04-13T10:05:00Z",
    "importInfo": {
      "sourceWorkflowId": null,
      "originalName": "AI内容生成流水线",
      "importedAt": "2026-04-13T10:05:00Z",
      "version": "1.0"
    }
  },
  "message": "工作流导入成功"
}
```

**错误码**:
- 400: 请求体格式错误或工作流数据无效
- 401: 未授权
- 500: 服务器内部错误

---

## 6. 认证要求

所有API请求都需要在请求头中包含有效的JWT令牌：

```http
Authorization: Bearer <jwt_token>
```

### JWT令牌结构：
```json
{
  "userId": "usr_789012",
  "email": "user@example.com",
  "role": "USER",
  "iat": 1713048000,
  "exp": 1713134400
}
```

### 权限级别：
- **USER**: 只能访问和管理自己的工作流
- **ADMIN**: 可以访问和管理所有工作流
- **SYSTEM**: 系统内部访问权限

---

## 7. 错误处理

### 标准错误响应格式：
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述信息",
    "details": {
      "field": "具体字段",
      "value": "错误值"
    }
  },
  "message": "用户友好的错误信息",
  "requestId": "req_xxx",
  "timestamp": "2026-04-13T10:00:00Z"
}
```

### 常见错误码：
- `VALIDATION_ERROR`: 输入验证失败
- `AUTH_REQUIRED`: 需要认证
- `FORBIDDEN`: 权限不足
- `NOT_FOUND`: 资源不存在
- `CONFLICT`: 资源冲突
- `RATE_LIMIT`: 请求频率限制
- `INTERNAL_ERROR`: 服务器内部错误

---

## 8. 请求限制

- **频率限制**: 每分钟最多100次请求
- **工作流并发限制**: 每个用户同时最多运行5个工作流
- **文件大小限制**: 导入工作流文件大小不超过10MB
- **历史记录保留**: 执行历史记录保留30天

---

## 更新日志

### 2026-04-13
- 新增工作流克隆功能
- 新增工作流导入导出功能
- 新增工作流配置验证工具
- 新增执行路径分析功能
- 优化错误处理和响应格式

### 2026-04-12
- 完善工作流执行状态跟踪
- 新增执行历史查询API
- 优化分页查询性能

### 2026-04-11
- 新增工作流管理CRUD接口
- 完善用户认证系统
- 新增健康检查API

---

## 联系方式

如有问题或建议，请联系开发团队：
- 项目地址: https://github.com/ai-ideas-lab/ai-workspace-orchestrator
- 技术支持: support@ai-workspace-orchestrator.com
- 文档地址: https://docs.ai-workspace-orchestrator.com