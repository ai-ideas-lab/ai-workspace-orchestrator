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
    try {
      const { 
        page = 1, 
        limit = 10, 
        status, 
        userId,
        search 
      } = req.query;

      const result = await this.workflowService.getWorkflows({
        page: Number(page),
        limit: Number(limit),
        status: status as string,
        userId: userId as string,
        search: search as string,
      });

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
   * 执行工作流
   */
  async executeWorkflow(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { inputVariables, priority } = req.body;

      if (!id) {
        validationErrorResponse(res, '工作流ID不能为空');
        return;
      }

      const execution = await this.workflowService.executeWorkflow(id, {
        inputVariables: inputVariables || {},
        priority,
      });

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