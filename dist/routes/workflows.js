"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const workflow_controller_js_1 = require("../controllers/workflow.controller.js");
const logger_js_1 = require("../utils/logger.js");
const index_js_1 = require("../database/index.js");
const workflow_import_export_service_js_1 = __importDefault(require("../services/workflow-import-export.service.js"));
const responseUtils_js_1 = require("../utils/responseUtils.js");
const router = (0, express_1.Router)();
const workflowController = new workflow_controller_js_1.WorkflowController();
const importExportService = workflow_import_export_service_js_1.default.getInstance();
router.get('/', workflowController.getWorkflows.bind(workflowController));
router.post('/', workflowController.createWorkflow.bind(workflowController));
router.get('/:id', workflowController.getWorkflow.bind(workflowController));
router.put('/:id', workflowController.updateWorkflow.bind(workflowController));
router.delete('/:id', workflowController.deleteWorkflow.bind(workflowController));
const async_error_handler_js_1 = require("../utils/async-error-handler.js");
const asyncErrorHandler = async_error_handler_js_1.AsyncErrorHandler.getInstance();
router.post('/:id/clone', asyncErrorHandler.wrapAsync(async (req, res) => {
    const { id } = req.params;
    const { name } = req.body || {};
    const original = await index_js_1.db.workflow.findUnique({
        where: { id },
        include: { executions: { take: 0 } },
    });
    if (!original) {
        (0, responseUtils_js_1.errorResponse)(res, '工作流不存在', undefined, 404);
        return;
    }
    const cloned = await index_js_1.db.workflow.create({
        data: {
            name: name || `${original.name} (副本)`,
            description: original.description,
            config: original.config,
            status: 'DRAFT',
            variables: original.variables,
            userId: original.userId,
        },
    });
    logger_js_1.logger.info(`Workflow cloned: ${original.id} → ${cloned.id}`);
    (0, responseUtils_js_1.successResponse)(res, {
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
router.post('/:id/execute', workflowController.executeWorkflow.bind(workflowController));
router.get('/:id/executions', workflowController.getExecutionHistory.bind(workflowController));
router.post('/validate', workflowController.validateWorkflow.bind(workflowController));
router.post('/execution-path', workflowController.getExecutionPath.bind(workflowController));
router.get('/:id/export', asyncErrorHandler.wrapAsync(async (req, res) => {
    const { id } = req.params;
    const exportData = await importExportService.exportWorkflow(id);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="workflow-${encodeURIComponent(exportData.workflow.name)}-${Date.now()}.json"`);
    (0, responseUtils_js_1.successResponse)(res, exportData, '工作流导出成功');
}, {
    operation: 'export_workflow',
    userId: req.user?.id,
    sessionId: req.session?.id,
    correlationId: req.requestId,
    metadata: { workflowId: id }
}));
router.post('/import', asyncErrorHandler.wrapAsync(async (req, res) => {
    const { workflow: workflowData, options } = req.body;
    if (!workflowData) {
        (0, responseUtils_js_1.validationErrorResponse)(res, '请求体中缺少 workflow 数据');
        return;
    }
    const result = await importExportService.importWorkflow(workflowData, options || {});
    logger_js_1.logger.info(`Workflow imported via API: ${result.id} (${result.name})`);
    (0, responseUtils_js_1.successResponse)(res, result, '工作流导入成功', 201);
}, {
    operation: 'import_workflow',
    userId: req.user?.id,
    sessionId: req.session?.id,
    correlationId: req.requestId,
    metadata: { options }
}));
exports.default = router;
//# sourceMappingURL=workflows.js.map