# API Documentation

## Base URL
```
http://localhost:3000/api
```

## Health Check
- **Method**: `GET`
- **Path**: `/health`
- **Description**: Check if the service is running
- **Response**: 
  ```json
  {
    "success": true,
    "message": "服务运行正常",
    "timestamp": "2026-04-16T00:29:00.000Z",
    "uptime": "1h 23m 45s"
  }
  ```

## System Information
- **Method**: `GET`
- **Path**: `/system`
- **Description**: Get system information and metrics
- **Response**:
  ```json
  {
    "success": true,
    "message": "系统信息",
    "timestamp": "2026-04-16T00:29:00.000Z",
    "environment": "development",
    "memory": {
      "rss": "256MB",
      "heapUsed": "128MB"
    },
    "cpu": {
      "user": "1250ms",
      "system": "850ms"
    }
  }
  ```

## Workflows API

### List All Workflows
- **Method**: `GET`
- **Path**: `/workflows`
- **Description**: Get all workflows
- **Response**: Array of workflow objects

### Clone Workflow
- **Method**: `POST`
- **Path**: `/workflows/:id/clone`
- **Description**: Clone an existing workflow to create a new workflow with the same configuration
- **Parameters**:
  - `id` (path): The ID of the workflow to clone
  - `name` (body, optional): Custom name for the cloned workflow (defaults to original name + " (副本)")
- **Body**: 
  ```json
  {
    "name": "工作流副本名称"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "工作流克隆成功",
    "data": {
      "id": "cloned-workflow-id",
      "name": "原始工作流 (副本)",
      "description": "原始工作流描述",
      "status": "DRAFT",
      "sourceWorkflowId": "original-workflow-id",
      "sourceWorkflowName": "原始工作流名称",
      "createdAt": "2026-04-28T06:03:00.000Z"
    }
  }
  ```
- **Error Responses**:
  - 404: Workflow not found
  - 500: Server error during cloning
- **Rate Limit**: 5 requests per minute per user

### Create Workflow
- **Method**: `POST`
- **Path**: `/workflows`
- **Description**: Create a new workflow
- **Body**: Workflow configuration object

### Get Single Workflow
- **Method**: `GET`
- **Path**: `/workflows/:id`
- **Description**: Get a specific workflow by ID
- **Parameters**: `id` (string) - Workflow ID

### Update Workflow
- **Method**: `PUT`
- **Path**: `/workflows/:id`
- **Description**: Update an existing workflow
- **Parameters**: `id` (string) - Workflow ID
- **Body**: Updated workflow configuration

### Delete Workflow
- **Method**: `DELETE`
- **Path**: `/workflows/:id`
- **Description**: Delete a workflow
- **Parameters**: `id` (string) - Workflow ID

### Clone Workflow
- **Method**: `POST`
- **Path**: `/workflows/:id/clone`
- **Description**: Create a copy of an existing workflow
- **Parameters**: `id` (string) - Original workflow ID
- **Body**: `{ name?: string }` - Optional new name for the clone

### Execute Workflow
- **Method**: `POST`
- **Path**: `/workflows/:id/execute`
- **Description**: Execute a specific workflow
- **Parameters**: `id` (string) - Workflow ID

### Get Execution History
- **Method**: `GET`
- **Path**: `/workflows/:id/executions`
- **Description**: Get execution history for a workflow
- **Parameters**: `id` (string) - Workflow ID

### Validate Workflow
- **Method**: `POST`
- **Path**: `/workflows/validate`
- **Description**: Validate a workflow configuration
- **Body**: Workflow configuration object

### Get Execution Path
- **Method**: `POST`
- **Path**: `/workflows/execution-path`
- **Description**: Get the execution path for a workflow
- **Body**: Workflow configuration object

### Export Workflow
- **Method**: `GET`
- **Path**: `/workflows/:id/export`
- **Description**: Export a workflow as JSON file
- **Parameters**: `id` (string) - Workflow ID
- **Response**: JSON file download

### Import Workflow
- **Method**: `POST`
- **Path**: `/workflows/import`
- **Description**: Import a workflow from JSON data, creating a new workflow instance
- **Body**: 
  ```json
  {
    "workflow": {
      "name": "工作流名称",
      "description": "工作流描述",
      "config": { /* 工作流配置对象 */ },
      "variables": { /* 变量定义 */ }
    },
    "options": {
      "name": "可选的新工作流名称（覆盖workflow.name）",
      "draft": true,
      "overwrite": false
    }
  }
  ```
- **Parameters**:
  - `workflow` (object, required): Complete workflow configuration object
  - `options` (object, optional): Import options for customization
- **Response**:
  ```json
  {
    "success": true,
    "message": "工作流导入成功",
    "data": {
      "id": "imported-workflow-id",
      "name": "导入的工作流名称",
      "description": "工作流描述",
      "status": "DRAFT",
      "createdAt": "2026-04-28T06:03:00.000Z",
      "importedFrom": "external"
    }
  }
  ```
- **Error Responses**:
  - 400: Missing workflow data in request body
  - 409: Conflict if workflow already exists and overwrite=false
  - 422: Validation error for invalid workflow configuration
  - 500: Server error during import
- **Rate Limit**: 10 requests per minute per user
- **Example**:
  ```javascript
  // Import a workflow with custom settings
  const response = await fetch('/api/workflows/import', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      workflow: {
        name: "月度销售报告",
        description: "自动生成月度销售统计报告",
        config: {
          steps: [
            { action: "collect_data", params: { category: "sales", period: "monthly" } },
            { action: "generate_report", params: { include_charts: true } }
          ]
        }
      },
      options: {
        name: "销售报告模板",
        draft: true
      }
    })
  });
  const result = await response.json();
  ```

## Response Format
All API responses follow this format:
- **Success**: `{ success: true, data: {}, message: "Success message" }`
- **Error**: `{ success: false, error: "Error message", statusCode: 400 }`

## Error Codes
- `400`: Bad Request
- `404`: Not Found
- `500`: Internal Server Error

## Usage Example
```javascript
// Get all workflows
const response = await fetch('/api/workflows');
const data = await response.json();

// Create a workflow
const workflow = {
  name: "Sample Workflow",
  description: "A test workflow",
  config: { /* workflow configuration */ }
};

const createResponse = await fetch('/api/workflows', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(workflow)
});
```