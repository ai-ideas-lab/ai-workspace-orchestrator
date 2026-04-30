# AI Workspace Orchestrator API 文档

## 概述

AI Workspace Orchestrator 是一个企业级AI工作流自动化平台，提供RESTful API用于工作流管理和执行。

## 基础信息

- **Base URL**: `http://localhost:3000`
- **API Version**: 1.0
- **Content-Type**: `application/json`

## 认证

API使用JWT token进行认证，需要在请求头中包含：
```
Authorization: Bearer <your-jwt-token>
```

## 系统端点

### 健康检查

**GET** `/health`

检查服务运行状态。

**响应示例:**
```json
{
  "success": true,
  "message": "服务运行正常",
  "requestId": "req_1234567890",
  "timestamp": "2026-04-15T20:45:00.000Z",
  "uptime": 3600
}
```

### 系统信息

**GET** `/system`

获取系统详细信息。

**响应示例:**
```json
{
  "success": true,
  "message": "系统信息",
  "requestId": "req_1234567890",
  "timestamp": "2026-04-15T20:45:00.000Z",
  "environment": "development",
  "version": "18.0.0",
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
    "user": "1000ms",
    "system": "500ms"
  },
  "port": 3000
}
```

## 工作流 API

### 获取工作流列表

**GET** `/api/workflows`

获取所有工作流的列表，支持分页和过滤。

**查询参数:**
- `page` (number): 页码，默认1
- `limit` (number): 每页数量，默认10
- `status` (string): 工作流状态过滤
- `userId` (string): 用户ID过滤
- `search` (string): 搜索关键词

**响应示例:**
```json
{
  "success": true,
  "message": "获取工作流列表成功",
  "data": [
    {
      "id": "workflow-123",
      "name": "数据分析工作流",
      "description": "用于数据分析的自动化工作流",
      "status": "ACTIVE",
      "createdAt": "2026-04-15T20:45:00.000Z",
      "updatedAt": "2026-04-15T20:45:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

### 创建工作流

**POST** `/api/workflows`

创建新的工作流。

**请求体:**
```json
{
  "name": "新的工作流",
  "description": "工作流描述",
  "config": {
    "steps": [...],
    "variables": {...}
  },
  "variables": {
    "param1": "value1"
  }
}
```

**响应示例:**
```json
{
  "success": true,
  "message": "工作流创建成功",
  "data": {
    "id": "workflow-456",
    "name": "新的工作流",
    "description": "工作流描述",
    "status": "DRAFT",
    "config": {...},
    "variables": {...},
    "createdAt": "2026-04-15T20:45:00.000Z"
  }
}
```

### 获取特定工作流

**GET** `/api/workflows/:id`

获取指定ID的工作流详情。

**响应示例:**
```json
{
  "success": true,
  "message": "获取工作流成功",
  "data": {
    "id": "workflow-123",
    "name": "数据分析工作流",
    "description": "用于数据分析的自动化工作流",
    "status": "ACTIVE",
    "config": {...},
    "variables": {...},
    "createdAt": "2026-04-15T20:45:00.000Z",
    "updatedAt": "2026-04-15T20:45:00.000Z"
  }
}
```

### 更新工作流

**PUT** `/api/workflows/:id`

更新指定ID的工作流。

**请求体:**
```json
{
  "name": "更新后的工作流名称",
  "description": "更新后的描述",
  "config": {...},
  "variables": {...}
}
```

### 删除工作流

**DELETE** `/api/workflows/:id`

删除指定ID的工作流。

**响应示例:**
```json
{
  "success": true,
  "message": "工作流删除成功"
}
```

### 克隆工作流

**POST** `/api/workflows/:id/clone`

克隆指定ID的工作流，创建完全相同的副本但生成新的工作流ID。

**描述:**
该端点创建指定工作流的完整副本，包括所有配置、变量和设置。克隆后的工作流状态默认为"DRAFT"（草稿），允许用户进行修改后再激活。支持自定义克隆后的工作流名称，如果不提供则自动添加"(副本)"后缀。

**参数:**
- `id` (path, required): 要克隆的工作流的唯一标识符

**请求体:**
```json
{
  "name": "自定义工作流名称"
}
```

**请求体参数:**
- `name` (string, optional): 克隆后工作流的自定义名称，如果不提供则默认为"原始名称 (副本)"

**响应示例:**
```json
{
  "success": true,
  "message": "工作流克隆成功",
  "data": {
    "id": "workflow-789",
    "name": "数据分析副本",
    "description": "用于数据分析的自动化工作流",
    "status": "DRAFT",
    "sourceWorkflowId": "workflow-123",
    "sourceWorkflowName": "数据分析工作流",
    "createdAt": "2026-04-15T20:45:00.000Z"
  }
}
```

**错误响应:**
- `404`: 工作流不存在
```json
{
  "success": false,
  "error": "工作流不存在"
}
```

**使用示例:**
```bash
# 基本克隆
curl -X POST "http://localhost:3000/api/workflows/550e8400-e29b-41d4-a716-446655440000/clone" \
  -H "Authorization: Bearer <your-jwt-token>"

# 自定义名称克隆
curl -X POST "http://localhost:3000/api/workflows/550e8400-e29b-41d4-a716-446655440000/clone" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "我的工作流副本"}'
```

**注意事项:**
- 克隆后的工作流状态为"DRAFT"，需要手动激活后才能执行
- 克隆过程会复制所有配置、变量和设置，但不会复制执行历史
- 原始工作流保持不变，克隆是安全的操作
- 需要用户认证，只能在登录状态下调用此接口
- 用户必须对原始工作流有读取权限

**请求体:**
```json
{
  "name": "克隆的工作流名称"
}
```

**响应示例:**
```json
{
  "success": true,
  "message": "工作流克隆成功",
  "data": {
    "id": "workflow-789",
    "name": "克隆的工作流名称",
    "description": "原始工作流的描述",
    "status": "DRAFT",
    "sourceWorkflowId": "workflow-123",
    "sourceWorkflowName": "原始工作流名称",
    "createdAt": "2026-04-15T20:45:00.000Z"
  }
}
```

### 执行工作流

**POST** `/api/workflows/:id/execute`

执行指定ID的工作流，支持变量注入和优先级设置。

**请求体:**
```json
{
  "inputVariables": {
    "data_source": "database",
    "query": "SELECT * FROM users",
    "output_file": "/tmp/output.csv"
  },
  "priority": 1,
  "timeout": 30000
}
```

**参数说明:**
- `inputVariables` (object): 工作流执行变量，用于配置工作流各个步骤的输入参数
  - 键值对形式，键为变量名，值为对应的变量值
- `priority` (number, optional): 执行优先级，默认为5（1-10，1为最高优先级）
- `timeout` (number, optional): 超时时间（毫秒），默认为30000（30秒）

**响应示例:**
```json
{
  "success": true,
  "message": "工作流执行启动成功",
  "data": {
    "executionId": "exec-123456",
    "workflowId": "workflow-789",
    "status": "RUNNING",
    "priority": 1,
    "timeout": 30000,
    "inputVariables": {
      "data_source": "database",
      "query": "SELECT * FROM users",
      "output_file": "/tmp/output.csv"
    },
    "startedAt": "2026-04-23T16:03:00.000Z",
    "estimatedDuration": "2-5分钟"
  }
}
```

**状态码:**
- `202 Accepted`: 工作流已接受并开始执行
- `400 Bad Request`: 请求参数错误
- `404 Not Found`: 工作流不存在
- `409 Conflict`: 工作流状态不允许执行（如DRAFT状态）
- `429 Too Many Requests`: 系统负载过高，暂不接收新任务

### 获取执行历史

**GET** `/api/workflows/:id/executions`

获取指定工作流的执行历史，支持分页、状态过滤和时间范围查询。

**用途:**
- 监控工作流的执行状态和结果
- 分析工作流的执行模式和性能
- 调试工作流执行问题
- 审计工作流执行记录

**查询参数:**
- `page` (number, optional): 页码，默认1
- `limit` (number, optional): 每页数量，默认20，最大100
- `status` (string, optional): 执行状态过滤 (PENDING, RUNNING, COMPLETED, FAILED)
- `startTime` (string, optional): 开始时间 (ISO 8601格式)
- `endTime` (string, optional): 结束时间 (ISO 8601格式)
- `sortBy` (string, optional): 排序字段 (startedAt, completedAt)，默认startedAt
- `sortOrder` (string, optional): 排序方向 (ASC, DESC)，默认DESC

**响应示例:**
```json
{
  "success": true,
  "message": "获取执行历史成功",
  "data": [
    {
      "id": "exec-123",
      "workflowId": "workflow-123",
      "status": "COMPLETED",
      "priority": 1,
      "timeout": 30000,
      "startedAt": "2026-04-15T20:45:00.000Z",
      "completedAt": "2026-04-15T20:46:00.000Z",
      "duration": 60000,
      "result": {
        "totalSteps": 3,
        "successfulSteps": 3,
        "failedSteps": 0,
        "successRatio": 1.0
      },
      "inputVariables": {
        "data_source": "database",
        "query": "SELECT * FROM users"
      },
      "metadata": {
        "userId": "user-456",
        "sessionId": "session-789"
      }
    },
    {
      "id": "exec-124",
      "workflowId": "workflow-123",
      "status": "FAILED",
      "priority": 5,
      "timeout": 60000,
      "startedAt": "2026-04-15T19:30:00.000Z",
      "completedAt": "2026-04-15T19:35:00.000Z",
      "duration": 300000,
      "error": {
        "code": "WORKFLOW_EXECUTION_ERROR",
        "message": "Database connection timeout",
        "step": "data-collection",
        "retryCount": 2
      },
      "result": {
        "totalSteps": 3,
        "successfulSteps": 1,
        "failedSteps": 2,
        "successRatio": 0.33
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

**参数说明:**
- `id` (string): 工作流ID
- `status` (string): 过滤特定状态的执行记录
- `startTime`/`endTime` (string): ISO 8601格式时间，用于时间范围过滤
- `sortBy`/`sortOrder`: 排序选项，支持按开始时间或完成时间升序/降序排列

**状态说明:**
- `PENDING`: 等待执行
- `RUNNING`: 执行中
- `COMPLETED`: 执行成功
- `FAILED`: 执行失败

**响应数据:**
- `id`: 执行记录ID
- `workflowId`: 工作流ID
- `status`: 执行状态
- `priority`: 执行优先级
- `timeout`: 超时设置（毫秒）
- `startedAt`: 开始时间
- `completedAt`: 完成时间
- `duration`: 执行时长（毫秒）
- `result`: 执行结果摘要
- `inputVariables`: 输入变量快照
- `error`: 错误信息（仅在失败时存在）
- `metadata`: 元数据信息

**分页信息:**
- 返回分页元数据，包含当前页码、每页数量、总数和总页数
- 支持通过limit参数控制每页返回的记录数量
- 最大单页限制为100条记录，防止大数据量查询导致性能问题
```

### 验证工作流

**POST** `/api/workflows/validate`

验证工作流配置的有效性。

**请求体:**
```json
{
  "config": {...},
  "variables": {...}
}
```

**响应示例:**
```json
{
  "success": true,
  "message": "工作流验证成功",
  "data": {
    "isValid": true,
    "warnings": [],
    "errors": []
  }
}
```

### 获取执行路径（新）

**POST** `/api/workflows/execution-path`

预览工作流的执行路径，帮助用户理解工作流的执行流程和各步骤关系。

**用途:**
- 在执行前验证工作流配置
- 理解工作流的执行顺序和依赖关系
- 估算工作流执行时间
- 识别潜在的执行冲突

**请求体:**
```json
{
  "config": {
    "steps": [
      {
        "id": "data-collection",
        "type": "data_collection",
        "next": ["data-processing"],
        "timeout": 30000
      },
      {
        "id": "data-processing", 
        "type": "ai_processing",
        "next": ["result-export"],
        "timeout": 60000
      },
      {
        "id": "result-export",
        "type": "file_export",
        "timeout": 15000
      }
    ],
    "variables": {
      "api_key": "your_api_key",
      "target_file": "/tmp/output.csv"
    }
  }
}
```

**响应示例:**
```json
{
  "success": true,
  "message": "获取执行路径成功",
  "data": {
    "executionPath": {
      "start": "data-collection",
      "steps": [
        {
          "id": "data-collection",
          "name": "数据收集",
          "type": "data_collection",
          "duration": "30秒",
          "dependencies": [],
          "next": ["data-processing"]
        },
        {
          "id": "data-processing",
          "name": "AI数据处理", 
          "type": "ai_processing",
          "duration": "1分钟",
          "dependencies": ["data-collection"],
          "next": ["result-export"]
        },
        {
          "id": "result-export",
          "name": "结果导出",
          "type": "file_export",
          "duration": "15秒",
          "dependencies": ["data-processing"],
          "next": []
        }
      ],
      "criticalPath": ["data-collection", "data-processing", "result-export"],
      "totalEstimatedDuration": "2分45秒"
    },
    "validation": {
      "isValid": true,
      "hasCycles": false,
      "orphanedSteps": [],
      "warnings": [
        "建议为数据处理步骤添加重试机制"
      ]
    }
  }
}
```

**参数说明:**
- `config` (object): 工作流配置，包含steps数组和variables对象
  - `steps`: 工作流步骤数组，每个步骤包含id、type、next等属性
  - `variables`: 工作流变量定义

**返回值:**
- `executionPath`: 执行路径详情
- `validation`: 验证结果，包含循环检测、孤立步骤等信息

### 导出工作流

**GET** `/api/workflows/:id/export`

导出工作流为JSON文件。

**响应:** 返回JSON文件下载

### 导入工作流

**POST** `/api/workflows/import`

从JSON文件导入工作流，支持灵活的导入选项和配置转换。

**用途:**
- 将导出的工作流重新导入到其他环境
- 批量部署工作流配置
- 复制和修改现有工作流
- 跨环境工作流迁移

**请求体:**
```json
{
  "workflow": {
    "name": "原始工作流名称",
    "description": "工作流描述",
    "config": {
      "steps": [
        {
          "id": "data-collection",
          "type": "data_collection",
          "params": {
            "source": "database",
            "query": "SELECT * FROM users"
          },
          "timeout": 30000,
          "retry": {
            "maxAttempts": 3,
            "delayMs": 1000
          }
        }
      ],
      "variables": {
        "api_key": "original_api_key",
        "output_format": "json"
      }
    },
    "variables": {
      "env_var_1": "value1"
    }
  },
  "options": {
    "name": "自定义新工作流名称",
    "draft": true,
    "overwrite": false,
    "variableTransformations": {
      "api_key": "new_api_key_from_env",
      "output_format": "csv"
    },
    "status": "ACTIVE"
  }
}
```

**参数说明:**
- `workflow` (object, required): 工作流数据对象
  - `name` (string): 工作流名称
  - `description` (string): 工作流描述
  - `config` (object): 工作流配置对象
  - `variables` (object): 工作流变量定义
- `options` (object, optional): 导入选项
  - `name` (string): 自定义工作流名称，如果不提供则使用原始名称
  - `draft` (boolean): 是否以草稿状态导入，默认false
  - `overwrite` (boolean): 是否覆盖同名称工作流，默认false
  - `variableTransformations` (object): 变量转换规则，用于修改导入的变量值
  - `status` (string): 设置导入后的工作流状态 (DRAFT, ACTIVE, PAUSED)

**转换规则说明:**
- `name`: 如果指定，将作为工作流的新名称
- `draft`: true时，导入的工作流将处于草稿状态，需要手动激活
- `overwrite`: true时，如果存在同名工作流将被替换
- `variableTransformations`: 键值对映射，用于修改变量值

**响应示例:**
```json
{
  "success": true,
  "message": "工作流导入成功",
  "data": {
    "id": "workflow-999",
    "name": "自定义新工作流名称",
    "description": "工作流描述",
    "status": "DRAFT",
    "config": {
      "steps": [
        {
          "id": "data-collection",
          "type": "data_collection",
          "params": {
            "source": "database",
            "query": "SELECT * FROM users"
          },
          "timeout": 30000,
          "retry": {
            "maxAttempts": 3,
            "delayMs": 1000
          }
        }
      ],
      "variables": {
        "api_key": "new_api_key_from_env",
        "output_format": "csv",
        "env_var_1": "value1"
      }
    },
    "sourceWorkflowId": null,
    "importedAt": "2026-04-15T20:45:00.000Z",
    "originalWorkflowName": "原始工作流名称"
  }
}
```

**注意事项:**
- 导入时会自动生成新的工作流ID
- 原始工作流的ID和元数据会被保留在元数据中
- 变量转换不会影响原始配置中的结构，只修改变量值
- 导入后工作流可能需要重新验证和测试
- 建议在导入前备份现有工作流配置
```

## 错误处理

API使用标准的HTTP状态码和错误响应格式：

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述",
    "details": {...},
    "requestId": "req_1234567890",
    "timestamp": "2026-04-15T20:45:00.000Z"
  }
}
```

### 常见错误码

- `VALIDATION_ERROR`: 输入验证失败
- `NOT_FOUND`: 资源不存在
- `UNAUTHORIZED`: 未授权访问
- `INTERNAL_ERROR`: 服务器内部错误
- `WORKFLOW_EXECUTION_FAILED`: 工作流执行失败

## 请求ID

每个API响应都包含唯一的请求ID，用于错误追踪和日志记录：

```json
{
  "requestId": "req_1234567890"
}
```

## 版本信息

- **当前版本**: 1.0.0
- **最后更新**: 2026-04-24
- **维护者**: 孔明