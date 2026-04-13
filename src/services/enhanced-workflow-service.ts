/**
 * Enhanced Workflow Service - 增强版工作流服务
 * 
 * 集成完善的错误处理、重试机制、监控和日志记录
 */

import { WorkflowExecutor, WorkflowDefinition } from './workflow-executor.js';
import { EventBus } from './event-bus.js';
import { 
  asyncErrorHandler, 
  AsyncRetryOptions, 
  AsyncOperationContext 
} from '../utils/async-error-handler.js';
import { 
  AppError, 
  WorkflowError, 
  SystemError, 
  ValidationError,
  NotFoundError 
} from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

export interface WorkflowOptions {
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  timeoutMs?: number;
  retryCount?: number;
  metadata?: Record<string, unknown>;
}

export interface WorkflowResult {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  workflowId: string;
  inputVariables: Record<string, unknown>;
  outputVariables?: Record<string, unknown>;
  error?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  metadata?: Record<string, unknown>;
}

export class EnhancedWorkflowService {
  private static instance: EnhancedWorkflowService;
  private executor: WorkflowExecutor;
  private eventBus: EventBus;

  private constructor() {
    this.executor = new WorkflowExecutor();
    this.eventBus = EventBus.getInstance();
  }

  static getInstance(): EnhancedWorkflowService {
    if (!EnhancedWorkflowService.instance) {
      EnhancedWorkflowService.instance = new EnhancedWorkflowService();
    }
    return EnhancedWorkflowService.instance;
  }

  // ── 核心工作流执行函数 (增强版) ──────────────────────

  /**
   * 执行工作流 - 带完整错误处理和重试机制
   * 
   * @param workflowId 工作流ID
   * @param options 执行选项
   * @returns 执行结果
   */
  async executeWorkflow(
    workflowId: string, 
    options: WorkflowOptions = {}
  ): Promise<WorkflowResult> {
    const context: AsyncOperationContext = {
      operation: 'executeWorkflow',
      metadata: { 
        workflowId, 
        ...options.metadata 
      }
    };

    return asyncErrorHandler.executeWithRetry(
      async () => {
        return this.executeWorkflowInternal(workflowId, options);
      },
      context,
      {
        maxRetries: options.retryCount || 2,
        retryCondition: (error) => {
          // 只对可重试的错误进行重试
          return (
            error instanceof SystemError || 
            error instanceof NetworkError ||
            (error instanceof WorkflowError && error.message.includes('temporary'))
          );
        },
        onRetry: (error, attempt) => {
          logger.warn(`工作流执行重试 [${attempt}]:`, { 
            workflowId, 
            error: error.message 
          });
        }
      }
    );
  }

  /**
   * 内部工作流执行逻辑
   */
  private async executeWorkflowInternal(
    workflowId: string, 
    options: WorkflowOptions
  ): Promise<WorkflowResult> {
    const startTime = new Date();
    const executionId = uuidv4();

    try {
      // 获取工作流定义
      const workflow = await this.getWorkflowDefinition(workflowId);
      
      // 验证工作流状态
      this.validateWorkflowState(workflow, options);

      // 记录执行开始
      logger.info(`工作流开始执行: ${workflowId} -> ${executionId}`, {
        workflowId,
        executionId,
        priority: options.priority || 'normal',
        startTime: startTime.toISOString(),
      });

      // 发送开始事件
      await this.eventBus.emit('workflow.execution.started', {
        executionId,
        workflowId,
        priority: options.priority || 'normal',
        inputVariables: options.metadata?.inputVariables || {},
      });

      // 执行工作流
      const result = await this.executor.execute(workflow, {
        inputVariables: options.metadata?.inputVariables || {},
        priority: options.priority || 'normal',
        timeoutMs: options.timeoutMs || 300000, // 5分钟默认超时
      });

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      // 构建执行结果
      const executionResult: WorkflowResult = {
        id: executionId,
        status: 'completed',
        workflowId,
        inputVariables: result.inputVariables || {},
        outputVariables: result.outputVariables,
        startTime,
        endTime,
        duration,
        metadata: {
          ...options.metadata,
          executionTime: duration,
          engineUsed: result.engineUsed,
        }
      };

      // 记录执行完成
      logger.info(`工作流执行完成: ${workflowId} -> ${executionId}`, {
        workflowId,
        executionId,
        status: 'completed',
        duration,
        outputVariables: result.outputVariables,
      });

      // 发送完成事件
      await this.eventBus.emit('workflow.execution.completed', executionResult);

      return executionResult;

    } catch (error) {
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      // 构建失败结果
      const executionResult: WorkflowResult = {
        id: executionId,
        status: 'failed',
        workflowId,
        inputVariables: options.metadata?.inputVariables || {},
        error: error instanceof Error ? error.message : '未知错误',
        startTime,
        endTime,
        duration,
        metadata: {
          ...options.metadata,
          executionTime: duration,
          errorType: error instanceof Error ? error.constructor.name : 'UnknownError',
        }
      };

      // 记录执行失败
      logger.error(`工作流执行失败: ${workflowId} -> ${executionId}`, {
        workflowId,
        executionId,
        error: error instanceof Error ? error.message : '未知错误',
        stack: error instanceof Error ? error.stack : undefined,
        duration,
      });

      // 发送失败事件
      await this.eventBus.emit('workflow.execution.failed', executionResult);

      // 根据错误类型重新抛出
      if (error instanceof AppError) {
        throw error;
      } else if (error instanceof Error) {
        throw new WorkflowError(
          `工作流执行失败: ${error.message}`,
          workflowId,
          undefined,
          { originalError: error.message }
        );
      } else {
        throw new WorkflowError(
          '工作流执行失败: 未知错误',
          workflowId
        );
      }
    }
  }

  // ── 辅助函数 ────────────────────────────────────────

  /**
   * 获取工作流定义
   */
  private async getWorkflowDefinition(workflowId: string): Promise<WorkflowDefinition> {
    try {
      // 这里应该从数据库或存储中获取工作流定义
      // 暂时返回一个示例定义
      const workflow: WorkflowDefinition = {
        id: workflowId,
        name: '示例工作流',
        version: '1.0',
        steps: [],
        variables: {},
      };

      if (!workflow) {
        throw new NotFoundError('工作流', workflowId);
      }

      return workflow;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new SystemError(`获取工作流定义失败: ${workflowId}`);
    }
  }

  /**
   * 验证工作流状态
   */
  private validateWorkflowState(workflow: WorkflowDefinition, options: WorkflowOptions): void {
    // 验证工作流是否可以执行
    if (workflow.status === 'DRAFT') {
      throw new WorkflowError(
        '工作流处于草稿状态，不能执行',
        workflow.id,
        undefined,
        { status: workflow.status }
      );
    }

    if (workflow.status === 'ARCHIVED') {
      throw new WorkflowError(
        '工作流已归档，不能执行',
        workflow.id,
        undefined,
        { status: workflow.status }
      );
    }

    // 验证必需的配置
    if (!workflow.steps || workflow.steps.length === 0) {
      throw new ValidationError(
        '工作流没有定义执行步骤',
        'steps',
        { workflowId: workflow.id }
      );
    }

    // 验证优先级
    if (options.priority && !['low', 'normal', 'high', 'urgent'].includes(options.priority)) {
      throw new ValidationError(
        '无效的优先级值',
        'priority',
        { provided: options.priority, allowed: ['low', 'normal', 'high', 'urgent'] }
      );
    }
  }

  // ── 公共接口 ─────────────────────────────────────────

  /**
   * 获取工作流执行状态
   */
  async getExecutionStatus(executionId: string): Promise<WorkflowResult | null> {
    const context: AsyncOperationContext = {
      operation: 'getExecutionStatus',
      metadata: { executionId }
    };

    return asyncErrorHandler.executeWithRetry(
      async () => {
        // 这里应该从数据库或存储中获取执行状态
        // 暂时返回null
        return null;
      },
      context,
      {
        maxRetries: 1,
        retryCondition: (error) => error instanceof SystemError
      }
    );
  }

  /**
   * 取消工作流执行
   */
  async cancelExecution(executionId: string): Promise<boolean> {
    const context: AsyncOperationContext = {
      operation: 'cancelExecution',
      metadata: { executionId }
    };

    return asyncErrorHandler.executeWithRetry(
      async () => {
        // 这里应该实现取消逻辑
        logger.info(`工作流执行取消: ${executionId}`);
        return true;
      },
      context,
      {
        maxRetries: 1,
        retryCondition: (error) => error instanceof SystemError
      }
    );
  }

  /**
   * 获取工作流执行历史
   */
  async getExecutionHistory(
    workflowId: string,
    options: {
      page?: number;
      limit?: number;
      status?: string;
      startDate?: string;
      endDate?: string;
    } = {}
  ): Promise<{
    data: WorkflowResult[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const context: AsyncOperationContext = {
      operation: 'getExecutionHistory',
      metadata: { workflowId, ...options }
    };

    return asyncErrorHandler.executeWithRetry(
      async () => {
        // 这里应该从数据库获取执行历史
        // 暂时返回空结果
        return {
          data: [],
          pagination: {
            page: options.page || 1,
            limit: options.limit || 10,
            total: 0,
            totalPages: 0,
          }
        };
      },
      context,
      {
        maxRetries: 1,
        retryCondition: (error) => error instanceof SystemError
      }
    );
  }
}

// 导出单例实例
export const WorkflowService = EnhancedWorkflowService.getInstance();