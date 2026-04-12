import express from 'express';
import { z } from 'zod';
import { workflowExecutionService } from '../services/workflow-execution-service.js';
const router = express.Router();
const createExecutionSchema = z.object({
    workflowId: z.string().min(1),
    status: z.enum(['running', 'completed', 'failed', 'cancelled']),
    triggerData: z.record(z.any()).optional(),
    result: z.record(z.any()).optional(),
    errorMessage: z.string().optional(),
    executionTimeMs: z.number().positive().optional(),
});
const getExecutionsSchema = z.object({
    workflowId: z.string().optional(),
    status: z.enum(['running', 'completed', 'failed', 'cancelled']).optional(),
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(10),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    userId: z.string().optional(),
    sortBy: z.enum(['created_at', 'started_at']).default('created_at'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
const createStepExecutionSchema = z.object({
    executionId: z.string().min(1),
    stepId: z.string().min(1),
    status: z.enum(['running', 'completed', 'failed', 'skipped']),
    inputData: z.record(z.any()).optional(),
    outputData: z.record(z.any()).optional(),
    errorMessage: z.string().optional(),
    durationMs: z.number().positive().optional(),
});
router.post('/', async (req, res) => {
    try {
        const validatedData = createExecutionSchema.parse(req.body);
        const result = await workflowExecutionService.createExecution(validatedData);
        if (!result.success) {
            return res.status(400).json(result);
        }
        res.status(201).json(result);
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error instanceof Error ? error.message : error,
        });
    }
});
router.get('/', async (req, res) => {
    try {
        const validatedData = getExecutionsSchema.parse(req.query);
        const result = await workflowExecutionService.getExecutions(validatedData);
        if (!result.success) {
            return res.status(400).json(result);
        }
        res.json(result);
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: 'Invalid query parameters',
            details: error instanceof Error ? error.message : error,
        });
    }
});
router.get('/:id', async (req, res) => {
    const result = await workflowExecutionService.getExecution(req.params.id);
    if (!result.success) {
        return res.status(404).json(result);
    }
    res.json(result);
});
router.put('/:id', async (req, res) => {
    try {
        const validatedData = createExecutionSchema.partial().parse(req.body);
        const result = await workflowExecutionService.updateExecution(req.params.id, validatedData);
        if (!result.success) {
            return res.status(400).json(result);
        }
        res.json(result);
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error instanceof Error ? error.message : error,
        });
    }
});
router.delete('/:id', async (req, res) => {
    const result = await workflowExecutionService.deleteExecution(req.params.id);
    if (!result.success) {
        return res.status(404).json(result);
    }
    res.json(result);
});
router.get('/stats', async (req, res) => {
    const result = await workflowExecutionService.getExecutionStats();
    res.json(result);
});
router.post('/:id/steps', async (req, res) => {
    try {
        const stepData = createStepExecutionSchema.parse({
            executionId: req.params.id,
            ...req.body,
        });
        const result = await workflowExecutionService.createStepExecution(stepData);
        if (!result.success) {
            return res.status(400).json(result);
        }
        res.status(201).json(result);
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error instanceof Error ? error.message : error,
        });
    }
});
export default router;
//# sourceMappingURL=executions.js.map