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