import { Request, Response } from 'express';
import { prisma } from '../database/index.js';
import { WorkflowService } from '../services/workflow-scheduler.js';
import { logger } from '../utils/logger.js';
import {
  AppError,
  ValidationError,
  NotFoundError,
  SystemError,
} from '../utils/errors.js';
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
} from '../utils/responseUtils.js';
import { AsyncErrorHandler, AsyncOperationContext } from '../utils/async-error-handler';

/**
 * WorkflowController - 工作流管理控制器
 *
 * 提供工作流的CRUD操作、执行、验证等HTTP接口
 */
export class WorkflowController {
  private workflowService: WorkflowService;

  constructor() {
    this.workflowService = WorkflowService.getInstance();
  }

  /**
   * 获取工作流列表
   */
  async getWorkflows(req: Request, res: Response): Promise<void> {
    const asyncContext: AsyncOperationContext = {
      operation: 'get_workflows',
      userId: req.user?.id,
      sessionId: req.session?.id,
      correlationId: req.requestId,
      metadata: {
        page: req.query.page,
        limit: req.query.limit,
        status: req.query.status,
        search: req.query.search,
      }
    };

    const asyncHandler = AsyncErrorHandler.getInstance();

    try {
      const { 
        page = 1, 
        limit = 10, 
        status, 
        userId,
        search 
      } = req.query;

      const result = await asyncHandler.executeWithRetry(
        () => this.workflowService.getWorkflows({
          page: Number(page),
          limit: Number(limit),
          status: status as string,
          userId: userId as string,
          search: search as string,
        }),
        asyncContext,
        { maxRetries: 2, baseDelayMs: 500 }
      );

      successResponse(res, result.data, '获取工作流列表成功', 200, {
        pagination: result.pagination,
      });
    } catch (error) {
      logger.error('获取工作流列表失败:', error);
      
      if (error instanceof AppError) {
        errorResponse(res, error);
      } else {
        errorResponse(res, '获取工作流列表失败');
      }
    }
  }

  /**
   * 创建新工作流
   */
  async createWorkflow(req: Request, res: Response): Promise<void> {
    try {
      const { name, description, config, variables, userId } = req.body;

      // 基础验证
      if (!name || !config) {
        validationErrorResponse(res, '工作流名称和配置不能为空');
        return;
      }

      const workflow = await this.workflowService.createWorkflow({
        name,
        description,
        config,
        variables: variables || {},
        userId: userId || req.user?.id,
      });

      logger.info(`工作流创建成功: ${workflow.id} (${name})`);

      successResponse(res, workflow, '工作流创建成功', 201);
    } catch (error) {
      logger.error('创建工作流失败:', error);
      
      if (error instanceof AppError) {
        errorResponse(res, error);
      } else if (error.message.includes('唯一约束')) {
        errorResponse(res, '工作流名称已存在', undefined, 409);
      } else {
        errorResponse(res, '创建工作流失败');
      }
    }
  }

  /**
   * 获取单个工作流详情
   */
  async getWorkflow(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        validationErrorResponse(res, '工作流ID不能为空');
        return;
      }

      const workflow = await this.workflowService.getWorkflow(id);

      if (!workflow) {
        notFoundResponse(res, '工作流', id);
        return;
      }

      successResponse(res, workflow, '获取工作流详情成功');
    } catch (error) {
      logger.error('获取工作流详情失败:', error);
      
      if (error instanceof AppError) {
        errorResponse(res, error);
      } else {
        errorResponse(res, '获取工作流详情失败');
      }
    }
  }

  /**
   * 更新工作流
   */
  async updateWorkflow(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, description, config, variables, status } = req.body;

      if (!id) {
        validationErrorResponse(res, '工作流ID不能为空');
        return;
      }

      const workflow = await this.workflowService.updateWorkflow(id, {
        name,
        description,
        config,
        variables,
        status,
      });

      logger.info(`工作流更新成功: ${id}`);

      successResponse(res, workflow, '工作流更新成功');
    } catch (error) {
      logger.error('更新工作流失败:', error);
      
      if (error instanceof AppError) {
        errorResponse(res, error);
      } else {
        errorResponse(res, '更新工作流失败');
      }
    }
  }

  /**
   * 删除工作流
   */
  async deleteWorkflow(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        validationErrorResponse(res, '工作流ID不能为空');
        return;
      }

      await this.workflowService.deleteWorkflow(id);

      logger.info(`工作流删除成功: ${id}`);

      successResponse(res, null, '工作流删除成功');
    } catch (error) {
      logger.error('删除工作流失败:', error);
      
      if (error instanceof AppError) {
        errorResponse(res, error);
      } else {
        errorResponse(res, '删除工作流失败');
      }
    }
  }

  /**
   * 执行工作流 - 启动工作流异步执行
   * 
   * 这是工作流的核心执行端点，接受工作流ID和执行参数，启动异步执行任务。
   * 使用超时保护和错误重试机制确保执行的可靠性。
   * 
   * @param {Request} req - Express请求对象
   * @param {Response} res - Express响应对象
   * @returns {Promise<void>}
   * 
   * @throws {ValidationError} 当工作流ID为空时
   * @throws {NotFoundError} 当工作流不存在时
   * @throws {WorkflowExecutionError} 当工作流执行失败时
   * @throws {TimeoutError} 当执行超时时
   * 
   * @example
   * // 基本工作流执行
   * POST /api/workflows/123/execute
   * {
   *   "inputVariables": {
   *     "api_key": "your_api_key",
   *     "target_file": "/tmp/output.csv"
   *   }
   * }
   * 
   * // 高优先级执行
   * POST /api/workflows/123/execute
   * {
   *   "inputVariables": {...},
   *   "priority": 1
   * }
   * 
   * @api {post} /api/workflows/:id/execute 执行工作流
   * @apiName ExecuteWorkflow
   * @apiGroup Workflow
   * @apiDescription 启动指定工作流的异步执行，支持变量注入和优先级设置
   * 
   * @apiParam {string} id 工作流ID
   * @apiParam {Object} [inputVariables={}] 执行变量对象，包含工作流所需的输入参数
   * @apiParam {number} [priority=5] 执行优先级 (1-10，1为最高优先级)
   * @apiParam {number} [timeout=30000] 超时时间（毫秒）
   * 
   * @apiSuccess {200} successResponse 工作流执行成功响应
   * @apiSuccess {202} successResponse 工作流已接受并开始执行
   * @apiError {400} validationErrorResponse 输入参数验证失败
   * @apiError {404} errorResponse 工作流不存在
   * @apiError {409} errorResponse 工作流状态不允许执行
   * @apiError {429} errorResponse 系统负载过高
   */
  async executeWorkflow(req: Request, res: Response): Promise<void> {
    const asyncContext: AsyncOperationContext = {
      operation: 'execute_workflow',
      userId: req.user?.id,
      sessionId: req.session?.id,
      correlationId: req.requestId,
      metadata: {
        workflowId: req.params.id,
        inputVariables: req.body.inputVariables,
        priority: req.body.priority,
      }
    };

    const asyncHandler = AsyncErrorHandler.getInstance();

    try {
      const { id } = req.params;
      const { inputVariables, priority } = req.body;

      if (!id) {
        validationErrorResponse(res, '工作流ID不能为空');
        return;
      }

      // 使用超时保护的工作流执行
      const execution = await asyncHandler.executeWithTimeout(
        () => this.workflowService.executeWorkflow(id, {
          inputVariables: inputVariables || {},
          priority,
        }),
        30000, // 30秒超时
        asyncContext
      );

      logger.info(`工作流执行启动: ${id} -> ${execution.id}`);

      successResponse(res, execution, '工作流执行启动成功', 202);
    } catch (error) {
      logger.error('执行工作流失败:', error);
      
      if (error instanceof AppError) {
        errorResponse(res, error);
      } else {
        errorResponse(res, '执行工作流失败');
      }
    }
  }

  /**
   * 获取工作流执行历史
   */
  async getExecutionHistory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { 
        page = 1, 
        limit = 10, 
        status,
        startDate,
        endDate 
      } = req.query;

      if (!id) {
        validationErrorResponse(res, '工作流ID不能为空');
        return;
      }

      const result = await this.workflowService.getExecutionHistory(id, {
        page: Number(page),
        limit: Number(limit),
        status: status as string,
        startDate: startDate as string,
        endDate: endDate as string,
      });

      successResponse(res, result.data, '获取执行历史成功', 200, {
        pagination: result.pagination,
      });
    } catch (error) {
      logger.error('获取执行历史失败:', error);
      
      if (error instanceof AppError) {
        errorResponse(res, error);
      } else {
        errorResponse(res, '获取执行历史失败');
      }
    }
  }

  /**
   * 验证工作流配置
   */
  async validateWorkflow(req: Request, res: Response): Promise<void> {
    try {
      const { config } = req.body;

      if (!config) {
        validationErrorResponse(res, '工作流配置不能为空');
        return;
      }

      const validation = await this.workflowService.validateWorkflow(config);

      if (!validation.valid) {
        validationErrorResponse(res, '工作流配置验证失败', undefined, 400, {
          errors: validation.errors,
        });
        return;
      }

      successResponse(res, validation, '工作流配置验证成功');
    } catch (error) {
      logger.error('验证工作流配置失败:', error);
      
      if (error instanceof AppError) {
        errorResponse(res, error);
      } else {
        errorResponse(res, '验证工作流配置失败');
      }
    }
  }

  /**
   * 获取工作流执行路径
   */
  async getExecutionPath(req: Request, res: Response): Promise<void> {
    try {
      const { config } = req.body;

      if (!config) {
        validationErrorResponse(res, '工作流配置不能为空');
        return;
      }

      const executionPath = await this.workflowService.getExecutionPath(config);

      successResponse(res, executionPath, '获取执行路径成功');
    } catch (error) {
      logger.error('获取执行路径失败:', error);
      
      if (error instanceof AppError) {
        errorResponse(res, error);
      } else {
        errorResponse(res, '获取执行路径失败');
      }
    }
  }
}

// 辅助函数：在responseUtils中已有，这里直接导入
function notFoundResponse(
  res: any,
  resource: string,
  id?: string | number,
  requestId?: string
): void {
  const error = new Error(`${resource} ${id ? `"${id}"` : ''} 不存在`);
  errorResponse(res, error, { resource, id }, 404, requestId);
}