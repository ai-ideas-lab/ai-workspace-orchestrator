import { Router, Request, Response } from 'express';
import { WorkflowController } from '../controllers/workflow.controller.js';
import { logger } from '../utils/logger.js';
import { db as prisma } from '../database/index.js';
import WorkflowImportExportService from '../services/workflow-import-export.service.js';
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
} from '../utils/responseUtils.js';

const router = Router();
const workflowController = new WorkflowController();
const importExportService = WorkflowImportExportService.getInstance();

// 工作流管理路由
router.get('/', workflowController.getWorkflows.bind(workflowController));
router.post('/', workflowController.createWorkflow.bind(workflowController));
router.get('/:id', workflowController.getWorkflow.bind(workflowController));
router.put('/:id', workflowController.updateWorkflow.bind(workflowController));
router.delete('/:id', workflowController.deleteWorkflow.bind(workflowController));

// 工作流克隆路由
import { AsyncErrorHandler, AsyncOperationContext } from '../utils/async-error-handler.js';

const asyncErrorHandler = AsyncErrorHandler.getInstance();

/**
 * 克隆指定的工作流
 * 
 * 创建指定工作流的完整副本，生成新的工作流ID但保留原始配置。
 * 克隆后的工作流状态默认为DRAFT（草稿），允许用户进行修改后再激活。
 * 支持自定义克隆后的工作流名称，如果不提供则自动添加"(副本)"后缀。
 * 
 * @param {Request} req - Express请求对象，包含工作流ID和自定义名称
 * @param {string} req.params.id - 要克隆的工作流的唯一标识符
 * @param {Object} req.body - 请求体参数
 * @param {string} [req.body.name] - 克隆后工作流的自定义名称，可选参数
 * @param {Response} res - Express响应对象，用于返回克隆结果
 * @returns {Promise<void>} 无返回值，直接通过res发送响应
 * 
 * @throws {Error} 当原始工作流不存在时返回404错误
 * @throws {Error} 当数据库操作失败时返回500错误
 * 
 * @example
 * // 基本克隆操作
 * // POST /api/workflows/550e8400-e29b-41d4-a716-446655440000/clone
 * const response = await fetch('/api/workflows/550e8400-e29b-41d4-a716-446655440000/clone', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({})
 * });
 * // 克隆后的工作流名称默认为"原始工作流名称 (副本)"
 * 
 * @example
 * // 自定义名称克隆
 * // POST /api/workflows/550e8400-e29b-41d4-a716-446655440000/clone
 * const response = await fetch('/api/workflows/550e8400-e29b-41d4-a716-446655440000/clone', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ name: "数据分析副本" })
 * });
 * // 克隆后的工作流名称为"数据分析副本"
 * 
 * @example
 * // 错误情况：工作流不存在
 * // POST /api/workflows/invalid-id/clone
 * const response = await fetch('/api/workflows/invalid-id/clone', {
 *   method: 'POST'
 * });
 * // 返回状态码: 404
 * // 返回体: { success: false, error: '工作流不存在' }
 * 
 * @example
 * // 在前端使用示例
 * async function cloneWorkflow(workflowId, customName = null) {
 *   try {
 *     const response = await fetch(`/api/workflows/${workflowId}/clone`, {
 *       method: 'POST',
 *       headers: {
 *         'Content-Type': 'application/json',
 *         'Authorization': `Bearer ${authToken}`
 *       },
 *       body: JSON.stringify({ name: customName })
 *     });
 *     
 *     if (!response.ok) {
 *       throw new Error('克隆工作流失败');
 *     }
 *     
 *     const result = await response.json();
 *     console.log('工作流克隆成功:', result.data);
 *     return result.data;
 *   } catch (error) {
 *     console.error('工作流克隆失败:', error);
 *     throw error;
 *   }
 * }
 * 
 * // 使用示例
 * const clonedWorkflow = await cloneWorkflow('550e8400-e29b-41d4-a716-446655440000', '我的副本');
 * console.log(`已克隆工作流: ${clonedWorkflow.id} - ${clonedWorkflow.name}`);
 * 
 * @apiNote
 * - 克隆后的工作流状态为DRAFT，需要手动激活后才能执行
 * - 克隆过程会复制所有配置、变量和设置，但不会复制执行历史
 * - 原始工作流保持不变，克隆是安全的操作
 * - 需要用户认证，只能在登录状态下调用此接口
 * - 支持的事务类型：数据库写入操作
 * - 权限要求：用户必须对原始工作流有读取权限
 * 
 * @since 1.0.0
 * @category Workflow Management
 * @alias cloneWorkflow
 * @see getWorkflow
 * @see createWorkflow
 * @see updateWorkflow
 */
router.post('/:id/clone', asyncErrorHandler.wrapAsync(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name } = req.body || {};

  // 查找原始工作流
  const original = await prisma.workflow.findUnique({
    where: { id },
    include: { executions: { take: 0 } },
  });

  if (!original) {
    errorResponse(res, '工作流不存在', undefined, 404);
    return;
  }

  // 克隆工作流（新 ID、草稿状态、可自定义名称）
  const cloned = await prisma.workflow.create({
    data: {
      name: name || `${original.name} (副本)`,
      description: original.description,
      config: original.config,
      status: 'DRAFT',
      variables: original.variables,
      userId: original.userId,
    },
  });

  logger.info(`Workflow cloned: ${original.id} → ${cloned.id}`);

  successResponse(res, {
    id: cloned.id,
    name: cloned.name,
    description: cloned.description,
    status: cloned.status,
    sourceWorkflowId: original.id,
    sourceWorkflowName: original.name,
    createdAt: cloned.createdAt,
  }, '工作流克隆成功', 201);
}, {
  operation: 'clone_workflow',
  userId: req.user?.id,
  sessionId: req.session?.id,
  correlationId: req.requestId,
  metadata: { workflowId: id, name }
}));

// 工作流执行路由
router.post('/:id/execute', workflowController.executeWorkflow.bind(workflowController));
router.get('/:id/executions', workflowController.getExecutionHistory.bind(workflowController));

// 工作流验证和工具路由
router.post('/validate', workflowController.validateWorkflow.bind(workflowController));
router.post('/execution-path', workflowController.getExecutionPath.bind(workflowController));

// ===== 工作流导入/导出路由 =====

/**
 * 导出工作流为 JSON
 * GET /api/workflows/:id/export
 */
router.get('/:id/export', asyncErrorHandler.wrapAsync(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const exportData = await importExportService.exportWorkflow(id);

  res.setHeader('Content-Type', 'application/json');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="workflow-${encodeURIComponent(exportData.workflow.name)}-${Date.now()}.json"`
  );

  successResponse(res, exportData, '工作流导出成功');
}, {
  operation: 'export_workflow',
  userId: req.user?.id,
  sessionId: req.session?.id,
  correlationId: req.requestId,
  metadata: { workflowId: id }
}));

/**
 * 从 JSON 导入工作流
 * POST /api/workflows/import
 * Body: { workflow: {...}, options?: { name?, draft?, overwrite? } }
 */
router.post('/import', asyncErrorHandler.wrapAsync(async (req: Request, res: Response): Promise<void> => {
  const { workflow: workflowData, options } = req.body;

  if (!workflowData) {
    validationErrorResponse(res, '请求体中缺少 workflow 数据');
    return;
  }

  const result = await importExportService.importWorkflow(workflowData, options || {});

  logger.info(`Workflow imported via API: ${result.id} (${result.name})`);

  successResponse(res, result, '工作流导入成功', 201);
}, {
  operation: 'import_workflow',
  userId: req.user?.id,
  sessionId: req.session?.id,
  correlationId: req.requestId,
  metadata: { options }
}));

export default router;