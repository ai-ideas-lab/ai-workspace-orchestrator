/**
 * Enhanced Workflow Controller - 增强版工作流控制器
 * 
 * 使用统一的错误处理装饰器，提供一致的错误处理体验
 */

import { Request, Response } from 'express';
import { prisma } from '../database/index.js';
import { WorkflowService } from '../services/workflow-scheduler.js';
import { 
  withErrorHandling, 
  withRetry, 
  withInputValidation, 
  withTransactionErrorHandler,
  withPerformanceMonitoring 
} from '../decorators/errorHandling.decorators.js';
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
} from '../utils/responseUtils.js';

/**
 * EnhancedWorkflowController - 增强版工作流管理控制器
 *
 * 提供工作流的CRUD操作、执行、验证等HTTP接口
 * 使用统一的错误处理模式，确保一致的错误处理体验
 */
export class EnhancedWorkflowController {
  private workflowService: WorkflowService;

  constructor() {
    this.workflowService = WorkflowService.getInstance();
  }

  /**
   * 获取工作流列表 - 带性能监控和重试机制
   */
  @withErrorHandling({
    logErrors: true,
    sanitizeUserError: true,
    defaultErrorCode: 'WORKFLOW_LIST_ERROR',
    defaultStatusCode: 500,
  })
  @withRetry({
    maxRetries: 2,
    delayMs: 100,
    retryCondition: (error) => 
      error.message.includes('network') || 
      error.message.includes('timeout') ||
      error.message.includes('connection')
  })
  @withPerformanceMonitoring()
  async getWorkflows(req: Request, res: Response): Promise<void> {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      userId,
      search 
    } = req.query;

    // 输入验证
    const validation = this.validatePaginationQuery({ page, limit });
    if (!validation.isValid) {
      validationErrorResponse(res, '查询参数验证失败', validation.errors);
      return;
    }

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
  }

  /**
   * 创建新工作流 - 带事务错误处理和输入验证
   */
  @withErrorHandling({
    logErrors: true,
    sanitizeUserError: true,
    defaultErrorCode: 'WORKFLOW_CREATE_ERROR',
    defaultStatusCode: 500,
  })
  @withInputValidation((req) => this.validateCreateWorkflow(req))
  @withTransactionErrorHandler('createWorkflow')
  async createWorkflow(req: Request, res: Response): Promise<void> {
    const { name, description, config, variables, userId } = req.body;

    const workflow = await this.workflowService.createWorkflow({
      name,
      description,
      config,
      variables: variables || {},
      userId: userId || req.user?.id,
    });

    logger.info(`工作流创建成功: ${workflow.id} (${name})`);

    successResponse(res, workflow, '工作流创建成功', 201);
  }

  /**
   * 获取单个工作流详情 - 带缓存和错误处理
   */
  @withErrorHandling({
    logErrors: true,
    sanitizeUserError: true,
    defaultErrorCode: 'WORKFLOW_FETCH_ERROR',
    defaultStatusCode: 404,
  })
  @withRetry({
    maxRetries: 1,
    retryCondition: (error) => error.message.includes('not found')
  })
  async getWorkflow(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    if (!id) {
      validationErrorResponse(res, '工作流ID不能为空');
      return;
    }

    const workflow = await this.workflowService.getWorkflow(id);

    if (!workflow) {
      const notFoundError = new NotFoundError('工作流', id);
      errorResponse(res, notFoundError);
      return;
    }

    successResponse(res, workflow, '获取工作流详情成功');
  }

  /**
   * 更新工作流 - 带乐观锁和验证
   */
  @withErrorHandling({
    logErrors: true,
    sanitizeUserError: true,
    defaultErrorCode: 'WORKFLOW_UPDATE_ERROR',
    defaultStatusCode: 500,
  })
  @withInputValidation((req) => this.validateUpdateWorkflow(req))
  @withTransactionErrorHandler('updateWorkflow')
  async updateWorkflow(req: Request, res: Response): Promise<void> {
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
  }

  /**
   * 删除工作流 - 带级联删除处理
   */
  @withErrorHandling({
    logErrors: true,
    sanitizeUserError: true,
    defaultErrorCode: 'WORKFLOW_DELETE_ERROR',
    defaultStatusCode: 500,
  })
  @withRetry({
    maxRetries: 1,
    retryCondition: (error) => 
      error.message.includes('constraint') || 
      error.message.includes('foreign key')
  })
  async deleteWorkflow(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    if (!id) {
      validationErrorResponse(res, '工作流ID不能为空');
      return;
    }

    // 检查工作流是否有活跃的执行
    const activeExecutions = await prisma.workflowExecution.count({
      where: {
        workflowId: id,
        status: {
          in: ['PENDING', 'RUNNING']
        }
      }
    });

    if (activeExecutions > 0) {
      const businessError = new Error('无法删除包含活跃执行的工作流');
      errorResponse(res, businessError.message, undefined, 409);
      return;
    }

    await this.workflowService.deleteWorkflow(id);

    logger.info(`工作流删除成功: ${id}`);

    successResponse(res, null, '工作流删除成功');
  }

  /**
   * 执行工作流 - 帶超时和重试机制
   */
  @withErrorHandling({
    logErrors: true,
    sanitizeUserError: true,
    defaultErrorCode: 'WORKFLOW_EXECUTE_ERROR',
    defaultStatusCode: 500,
  })
  @withInputValidation((req) => this.validateExecuteWorkflow(req))
  @withRetry({
    maxRetries: 1,
    retryCondition: (error) => 
      error.message.includes('timeout') ||
      error.message.includes('service unavailable')
  })
  @withPerformanceMonitoring()
  async executeWorkflow(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { variables, priority, timeout } = req.body;

    if (!id) {
      validationErrorResponse(res, '工作流ID不能为空');
      return;
    }

    const result = await this.workflowService.executeWorkflow(id, {
      variables,
      priority,
      timeout,
    });

    logger.info(`工作流执行启动: ${id}`);

    // 返回202 Accepted，因为执行是异步的
    res.status(202).json({
      success: true,
      message: '工作流执行已启动',
      executionId: result.id,
      status: result.status,
      estimatedDuration: result.estimatedDuration,
    });
  }

  /**
   * 获取执行历史 - 带分页和过滤
   */
  @withErrorHandling({
    logErrors: true,
    sanitizeUserError: true,
    defaultErrorCode: 'EXECUTION_HISTORY_ERROR',
    defaultStatusCode: 500,
  })
  @withInputValidation((req) => this.validateExecutionHistoryQuery(req))
  async getExecutionHistory(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { page = 1, limit = 20, status, startDate, endDate } = req.query;

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
  }

  /**
   * 验证工作流配置 - �静态分析
   */
  @withErrorHandling({
    logErrors: true,
    sanitizeUserError: true,
    defaultErrorCode: 'WORKFLOW_VALIDATE_ERROR',
    defaultStatusCode: 400,
  })
  @withInputValidation((req) => this.validateWorkflowConfig(req))
  async validateWorkflow(req: Request, res: Response): Promise<void> {
    const { config } = req.body;

    const validation = await this.workflowService.validateWorkflow(config);

    if (!validation.isValid) {
      validationErrorResponse(res, '工作流配置验证失败', validation.errors);
      return;
    }

    successResponse(res, {
      isValid: true,
      warnings: validation.warnings || [],
      suggestions: validation.suggestions || [],
    }, '工作流配置验证通过');
  }

  /**
   * 获取执行路径 - 带依赖分析
   */
  @withErrorHandling({
    logErrors: true,
    sanitizeUserError: true,
    defaultErrorCode: 'EXECUTION_PATH_ERROR',
    defaultStatusCode: 500,
  })
  @withInputValidation((req) => this.validateExecutionPath(req))
  async getExecutionPath(req: Request, res: Response): Promise<void> {
    const { config, input } = req.body;

    const path = await this.workflowService.getExecutionPath(config, input);

    successResponse(res, path, '执行路径分析成功');
  }

  /**
   * 工作流克隆 - 带数据验证和权限检查
   */
  @withErrorHandling({
    logErrors: true,
    sanitizeUserError: true,
    defaultErrorCode: 'WORKFLOW_CLONE_ERROR',
    defaultStatusCode: 500,
  })
  @withRetry({
    maxRetries: 2,
    delayMs: 50,
    retryCondition: (error) => error.message.includes('unique constraint')
  })
  async cloneWorkflow(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { name } = req.body || {};

    // 验证原始工作流存在
    const original = await prisma.workflow.findUnique({
      where: { id },
      include: { executions: { take: 0 } },
    });

    if (!original) {
      const notFoundError = new NotFoundError('工作流', id);
      errorResponse(res, notFoundError);
      return;
    }

    // 检查权限
    if (original.userId !== req.user?.id && !req.user?.isAdmin) {
      const authError = new Error('没有权限克隆此工作流');
      errorResponse(res, authError.message, undefined, 403);
      return;
    }

    // 克隆工作流
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
  }

  // ========== 私有验证方法 ==========

  /**
   * 验证分页查询参数
   */
  private validatePaginationQuery(query: any): { isValid: boolean; errors?: string[] } {
    const errors: string[] = [];
    const { page, limit } = query;

    if (page && (!Number.isInteger(Number(page)) || Number(page) < 1)) {
      errors.push('页码必须是正整数');
    }

    if (limit && (!Number.isInteger(Number(limit)) || Number(limit) < 1 || Number(limit) > 100)) {
      errors.push('每页数量必须是1-100之间的整数');
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * 验证创建工作流的输入
   */
  private validateCreateWorkflow(req: Request): { isValid: boolean; errors?: string[] } {
    const { name, config } = req.body;
    const errors: string[] = [];

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      errors.push('工作流名称不能为空');
    }

    if (!config || typeof config !== 'object') {
      errors.push('工作流配置必须是对象');
    }

    if (name && name.length > 200) {
      errors.push('工作流名称不能超过200个字符');
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * 验证更新工作流的输入
   */
  private validateUpdateWorkflow(req: Request): { isValid: boolean; errors?: string[] } {
    const { name, description, config, status } = req.body;
    const errors: string[] = [];

    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
      errors.push('工作流名称不能为空');
    }

    if (name !== undefined && name.length > 200) {
      errors.push('工作流名称不能超过200个字符');
    }

    if (description !== undefined && typeof description !== 'string') {
      errors.push('工作流描述必须是字符串');
    }

    if (config !== undefined && typeof config !== 'object') {
      errors.push('工作流配置必须是对象');
    }

    if (status !== undefined && !['DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED'].includes(status)) {
      errors.push('工作流状态必须是 DRAFT, ACTIVE, PAUSED 或 ARCHIVED');
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * 验证执行工作流的输入
   */
  private validateExecuteWorkflow(req: Request): { isValid: boolean; errors?: string[] } {
    const { variables, priority, timeout } = req.body;
    const errors: string[] = [];

    if (variables !== undefined && typeof variables !== 'object') {
      errors.push('变量必须是对象');
    }

    if (priority !== undefined && !['LOW', 'NORMAL', 'HIGH', 'URGENT'].includes(priority)) {
      errors.push('优先级必须是 LOW, NORMAL, HIGH 或 URGENT');
    }

    if (timeout !== undefined && (!Number.isInteger(Number(timeout)) || Number(timeout) < 1 || Number(timeout) > 3600)) {
      errors.push('超时时间必须是1-3600秒之间的整数');
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * 验证执行历史查询参数
   */
  private validateExecutionHistoryQuery(req: Request): { isValid: boolean; errors?: string[] } {
    const { page, limit, status, startDate, endDate } = req.query;
    const errors: string[] = [];

    if (page && (!Number.isInteger(Number(page)) || Number(page) < 1)) {
      errors.push('页码必须是正整数');
    }

    if (limit && (!Number.isInteger(Number(limit)) || Number(limit) < 1 || Number(limit) > 100)) {
      errors.push('每页数量必须是1-100之间的整数');
    }

    if (status && !['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'].includes(status as string)) {
      errors.push('状态必须是 PENDING, RUNNING, COMPLETED, FAILED 或 CANCELLED');
    }

    if (startDate && isNaN(Date.parse(startDate as string))) {
      errors.push('开始日期格式无效');
    }

    if (endDate && isNaN(Date.parse(endDate as string))) {
      errors.push('结束日期格式无效');
    }

    if (startDate && endDate && new Date(startDate as string) > new Date(endDate as string)) {
      errors.push('开始日期不能晚于结束日期');
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * 验证工作流配置
   */
  private validateWorkflowConfig(req: Request): { isValid: boolean; errors?: string[] } {
    const { config } = req.body;
    const errors: string[] = [];

    if (!config || typeof config !== 'object') {
      errors.push('工作流配置必须是对象');
      return { isValid: false, errors };
    }

    // 基本结构验证
    if (!config.steps || !Array.isArray(config.steps)) {
      errors.push('工作流配置必须包含步骤数组');
    }

    // 验证每个步骤
    if (config.steps) {
      config.steps.forEach((step: any, index: number) => {
        if (!step.id || typeof step.id !== 'string') {
          errors.push(`步骤 ${index + 1}: ID不能为空且必须是字符串`);
        }

        if (!step.type || !['api', 'script', 'condition', 'loop'].includes(step.type)) {
          errors.push(`步骤 ${index + 1}: 类型必须是 api, script, condition 或 loop`);
        }

        if (step.type === 'api' && (!step.config || typeof step.config !== 'object')) {
          errors.push(`步骤 ${index + 1}: API步骤必须包含配置对象`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * 验证执行路径查询
   */
  private validateExecutionPath(req: Request): { isValid: boolean; errors?: string[] } {
    const { config, input } = req.body;
    const errors: string[] = [];

    if (!config || typeof config !== 'object') {
      errors.push('配置必须是对象');
    }

    if (input !== undefined && typeof input !== 'object') {
      errors.push('输入必须是对象');
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }
}