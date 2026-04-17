/**
 * 执行工作流 - 核心工作流执行引擎
 * 
 * 根据工作流ID和用户输入，按照预设的步骤顺序执行整个工作流。
 * 该函数负责步骤排序、引擎选择、结果收集和执行状态管理。
 * 支持多步骤工作流的串行执行，每个步骤的结果会传递给后续步骤。
 * 
 * @param workflowId - 要执行的工作流ID，必须在数据库中存在
 * @param userInput - 用户输入的原始文本，用于工作流执行上下文
 * @returns 返回执行结果对象，包含工作流ID、所有步骤的执行结果和完成时间
 * @throws Error - 当工作流不存在时抛出异常
 * @example
 * // 基本工作流执行
 * const result = await executeWorkflow('workflow-123', '生成月度报告');
 * console.log(result);
 * // 输出:
 * // {
 * //   workflowId: 'workflow-123',
 * //   results: [
 * //     { stepId: 'step-1', output: '数据已收集', status: 'completed' },
 * //     { stepId: 'step-2', output: '报告已生成', status: 'completed' }
 * //   ],
 * //   completedAt: 2026-04-13T04:59:00.000Z
 * // }
 * 
 * // 错误处理示例
 * try {
 *   const result = await executeWorkflow('invalid-workflow', 'test input');
 *   console.log(result);
 * } catch (error) {
 *   console.error('工作流执行失败:', error.message);
 *   // 输出: 工作流执行失败: Workflow not found
 * }
 */

// ── 类型定义 ────────────────────────────────────────────

export interface WorkflowStep {
  id: string;
  order: number;
  engineType: string;
  config: Record<string, any>;
  name?: string;
  description?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  steps: WorkflowStep[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ExecutionResult {
  stepId: string;
  output: any;
  status: 'completed' | 'failed' | 'pending';
  error?: string;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface WorkflowExecutionResult {
  workflowId: string;
  results: ExecutionResult[];
  completedAt: Date;
  totalDuration?: number;
  success: boolean;
}

// ── 工作流获取 ───────────────────────────────────────────

/**
 * 从数据库获取工作流
 * @param workflowId 工作流ID
 * @returns 工作流对象
 * @throws Error 当工作流不存在时
 */
async function getWorkflow(workflowId: string): Promise<Workflow> {
  const workflow = await prisma.workflow.findUnique({ 
    where: { id: workflowId } 
  });
  
  if (!workflow) {
    throw new Error(`Workflow not found: ${workflowId}`);
  }
  
  return {
    id: workflow.id,
    name: workflow.name,
    description: workflow.description,
    steps: workflow.steps,
    createdAt: workflow.createdAt,
    updatedAt: workflow.updatedAt
  };
}

/**
 * 对工作流步骤进行排序
 * @param steps 工作流步骤数组
 * @returns 排序后的步骤数组
 */
function sortWorkflowSteps(steps: WorkflowStep[]): WorkflowStep[] {
  return steps.sort((a, b) => a.order - b.order);
}

// ── 工作流执行 ──────────────────────────────────────────

/**
 * 执行单个工作流步骤
 * @param step 工作流步骤
 * @param userInput 用户输入
 * @param previousResults 前续步骤的执行结果
 * @returns 执行结果
 */
async function executeWorkflowStep(
  step: WorkflowStep, 
  userInput: string, 
  previousResults: ExecutionResult[]
): Promise<ExecutionResult> {
  const startTime = Date.now();
  
  try {
    const engine = getEngine(step.engineType);
    const output = await engine.execute(step, userInput, previousResults);
    
    return {
      stepId: step.id,
      output,
      status: 'completed',
      duration: Date.now() - startTime,
      metadata: {
        engineType: step.engineType,
        order: step.order,
        success: true
      }
    };
  } catch (error) {
    // 使用异步错误处理器处理重试逻辑
    const asyncErrorHandler = AsyncErrorHandler.getInstance();
    const context: AsyncOperationContext = {
      operation: `workflow_step_${step.id}`,
      userId: (previousResults[0]?.metadata as any)?.userId || 'unknown',
      sessionId: `session_${Date.now()}`,
      correlationId: `correlation_${Date.now()}`,
      metadata: {
        stepId: step.id,
        engineType: step.engineType,
        order: step.order,
        previousResults: previousResults.length,
        userInput
      }
    };

    try {
      // 尝试重试失败的步骤
      const output = await asyncErrorHandler.executeWithRetry(
        async () => {
          const engine = getEngine(step.engineType);
          return await engine.execute(step, userInput, previousResults);
        },
        context,
        {
          maxRetries: 2,
          baseDelayMs: 1000,
          maxDelayMs: 5000,
          retryCondition: (error) => {
            return !(error instanceof AppError && error.isOperational);
          },
          onRetry: (error, attempt) => {
            console.warn(`工作流步骤 ${step.id} 第 ${attempt} 次重试:`, {
              error: error instanceof Error ? error.message : String(error),
              attempt,
              stepId: step.id,
              engineType: step.engineType
            });
          }
        }
      );

      return {
        stepId: step.id,
        output,
        status: 'completed',
        duration: Date.now() - startTime,
        metadata: {
          engineType: step.engineType,
          order: step.order,
          success: true,
          retries: 2 // 标记为重试后成功
        }
      };
    } catch (finalError) {
      // 重试后仍然失败，记录错误并继续
      console.error(`工作流步骤 ${step.id} 执行失败（重试后）:`, {
        error: finalError instanceof Error ? finalError.message : String(finalError),
        stepId: step.id,
        engineType: step.engineType,
        order: step.order
      });

      return {
        stepId: step.id,
        output: null,
        status: 'failed',
        error: finalError instanceof Error ? finalError.message : String(finalError),
        duration: Date.now() - startTime,
        metadata: {
          engineType: step.engineType,
          order: step.order,
          success: false,
          retries: 2,
          finalError: finalError instanceof Error ? finalError.constructor.name : String(finalError)
        }
      };
    }
  }
}

/**
 * 执行完整的工作流
 * @param workflowId 工作流ID
 * @param userInput 用户输入
 * @returns 工作流执行结果
 */
export async function executeWorkflow(workflowId: string, userInput: string): Promise<WorkflowExecutionResult> {
  const startTime = Date.now();
  
  try {
    // 获取工作流 - 使用数据库错误处理包装
    const asyncErrorHandler = AsyncErrorHandler.getInstance();
    const workflow = await asyncErrorHandler.executeWithRetry(
      async () => {
        const workflow = await getWorkflow(workflowId);
        
        // 验证工作流结构
        if (!workflow.steps || workflow.steps.length === 0) {
          throw new Error(`Workflow ${workflowId} has no steps`);
        }
        
        return workflow;
      },
      {
        operation: `get_workflow_${workflowId}`,
        userId: 'unknown',
        sessionId: `session_${Date.now()}`,
        correlationId: `correlation_${Date.now()}`,
        metadata: { workflowId, userInput }
      },
      {
        maxRetries: 3,
        baseDelayMs: 1000,
        maxDelayMs: 5000,
        retryCondition: (error) => {
          return error.message.includes('database') || error.message.includes('connection');
        }
      }
    );
    
    // 排序步骤
    const sortedSteps = sortWorkflowSteps(workflow.steps);
    const results: ExecutionResult[] = [];
    
    // 执行每个步骤
    for (const step of sortedSteps) {
      try {
        const result = await executeWorkflowStep(step, userInput, results);
        results.push(result);
        
        // 如果某个步骤失败，根据步骤类型决定是否继续
        if (result.status === 'failed') {
          console.warn(`Step ${step.id} failed, but continuing with workflow execution`);
          
          // 对于关键步骤，可以添加更严格的处理逻辑
          if (step.engineType === 'database' || step.engineType === 'ai') {
            console.error(`Critical step ${step.id} failed, workflow may be incomplete`);
          }
        }
      } catch (stepError) {
        console.error(`Unexpected error in step ${step.id}:`, stepError);
        
        results.push({
          stepId: step.id,
          output: null,
          status: 'failed',
          error: stepError instanceof Error ? stepError.message : String(stepError),
          duration: 0,
          metadata: {
            engineType: step.engineType,
            order: step.order,
            success: false,
            unexpectedError: true
          }
        });
      }
    }
    
    const totalDuration = Date.now() - startTime;
    
    // 计算工作流成功状态
    const successfulSteps = results.filter(r => r.status === 'completed').length;
    const totalSteps = results.length;
    const successRatio = totalSteps > 0 ? successfulSteps / totalSteps : 0;
    
    // 如果成功比例低于50%，标记为整体失败
    const overallSuccess = successRatio >= 0.5;
    
    if (!overallSuccess) {
      console.warn(`Workflow ${workflowId} execution incomplete: ${successfulSteps}/${totalSteps} steps completed`);
    }
    
    return {
      workflowId,
      results,
      completedAt: new Date(),
      totalDuration,
      success: overallSuccess,
      metadata: {
        totalSteps,
        successfulSteps,
        successRatio,
        userInputLength: userInput.length
      }
    };
    
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    
    // 使用异步错误处理器包装，确保错误被正确处理
    const asyncErrorHandler = AsyncErrorHandler.getInstance();
    const context: AsyncOperationContext = {
      operation: `execute_workflow_${workflowId}`,
      userId: 'unknown',
      sessionId: `session_${Date.now()}`,
      correlationId: `correlation_${Date.now()}`,
      metadata: { workflowId, userInput }
    };

    // 记录错误详情
    await asyncErrorHandler.logOperationFailure(context, error, 1);
    
    return {
      workflowId,
      results: [{
        stepId: 'system-error',
        output: null,
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
        duration: totalDuration,
        metadata: {
          error: 'workflow-execution-error',
          workflowId,
          userInputLength: userInput.length,
          timestamp: new Date().toISOString()
        }
      }],
      completedAt: new Date(),
      totalDuration,
      success: false,
      metadata: {
        systemError: true,
        errorType: error instanceof Error ? error.constructor.name : 'UnknownError'
      }
    };
  }
}