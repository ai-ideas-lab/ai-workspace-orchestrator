"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const workflow_controller_js_1 = require("../controllers/workflow.controller.js");
const router = (0, express_1.Router)();
const workflowController = new workflow_controller_js_1.WorkflowController();
router.get('/', workflowController.getWorkflows.bind(workflowController));
router.post('/', workflowController.createWorkflow.bind(workflowController));
router.get('/:id', workflowController.getWorkflow.bind(workflowController));
router.put('/:id', workflowController.updateWorkflow.bind(workflowController));
router.delete('/:id', workflowController.deleteWorkflow.bind(workflowController));
router.post('/:id/execute', workflowController.executeWorkflow.bind(workflowController));
router.get('/:id/executions', workflowController.getExecutionHistory.bind(workflowController));
router.post('/validate', workflowController.validateWorkflow.bind(workflowController));
router.post('/execution-path', workflowController.getExecutionPath.bind(workflowController));
exports.default = router;
//# sourceMappingURL=workflows.js.map