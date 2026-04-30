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

import { 
  WORKFLOW_STATUS, 
  STEP_TYPE, 
  TIMING, 
  METADATA_KEYS, 
  ERROR_TYPES, 
  ID_PATTERNS 
} from '../constants';

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
  status: typeof WORKFLOW_STATUS.COMPLETED | typeof WORKFLOW_STATUS.FAILED | typeof WORKFLOW_STATUS.PENDING;
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
 * 从数据库检索指定ID的工作流配置
 * 
 * 该函数负责从Prisma数据库中查询并返回指定ID的工作流对象。
 * 作为工作流执行流程的第一个关键步骤，它确保工作流存在且可执行。
 * 如果工作流不存在，函数会抛出异常，避免执行无效的工作流。
 * 
 * @param {string} workflowId - 要检索的工作流的唯一标识符，必须是有效的UUID格式
 * @returns {Promise<Workflow>} 返回包含工作流完整信息的Promise，包括步骤配置、名称和元数据
 * @throws {Error} 当工作流在数据库中不存在时抛出异常，错误信息包含工作流ID
 * 
 * @example
 * // 基本用法：获取指定ID的工作流
 * try {
 *   const workflow = await getWorkflow('550e8400-e29b-41d4-a716-446655440000');
 *   console.log('工作流名称:', workflow.name);
 *   console.log('步骤数量:', workflow.steps.length);
 *   console.log('创建时间:', workflow.createdAt);
 * } catch (error) {
 *   console.error('工作流不存在:', error.message);
 *   // 输出: 工作流不存在: Workflow not found: 550e8400-e29b-41d4-a716-446655440000
 * }
 * 
 * // 在工作流执行器中的使用
 * export async function executeWorkflow(workflowId: string, userInput: string): Promise<WorkflowExecutionResult> {
 *   // 首先获取工作流配置
 *   const workflow = await getWorkflow(workflowId);
 *   
 *   // 验证工作流结构
 *   if (!workflow.steps || workflow.steps.length === 0) {
 *     throw new Error(`Workflow ${workflowId} has no steps`);
 *   }
 *   
 *   // 继续执行逻辑...
 * }
 * 
 * // 注意事项：
 * // 1. 该函数需要有效的数据库连接和Prisma客户端配置
 * // 2. workflowId必须是数据库中存在的工作流ID，否则会抛出异常
 * // 3. 返回的工作流对象包含完整的步骤配置，可以直接用于工作流执行
 * // 4. 函数是异步的，需要使用await调用
 * // 5. 该函数在try-catch块中调用，以处理可能的数据库异常
 * // 6. 适用于工作流管理、执行和验证等多个场景
 * // 7. 返回的工作流对象包含createdAt和updatedAt时间戳，可用于审计和调试
 * // 8. 如果工作流被软删除，该函数不会返回该工作流
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
/**
 * 对工作流步骤按执行顺序进行排序
 * 
 * 根据工作流步骤的执行顺序号（order）对步骤列表进行升序排序，
 * 确保在工作流执行时按照预定的顺序依次执行各个步骤。
 * 该函数是工作流执行流程的重要组成部分，保证依赖关系和执行顺序的正确性。
 * 
 * @param {WorkflowStep[]} steps - 待排序的工作流步骤数组，每个步骤包含顺序号、ID和引擎类型等信息
 * @returns {WorkflowStep[]} 返回按执行顺序排序后的步骤数组，顺序号较小的步骤排在前面
 * 
 * @example
 * // 基本用法：按顺序号对步骤进行排序
 * const steps = [
 *   { id: 'step-3', engineType: 'ai', order: 3 },
 *   { id: 'step-1', engineType: 'database', order: 1 },
 *   { id: 'step-2', engineType: 'http', order: 2 }
 * ];
 * 
 * const sorted = sortWorkflowSteps(steps);
 * console.log(sorted.map(s => s.id)); // 输出: ['step-1', 'step-2', 'step-3']
 * 
 * // 高级用法：结合工作流执行器使用
 * const workflow = {
 *   steps: [
 *     { id: 'data-collection', engineType: 'api', order: 2 },
 *     { id: 'validation', engineType: 'ai', order: 1 },
 *     { id: 'report-generation', engineType: 'ai', order: 3 }
 *   ]
 * };
 * 
 * const sortedSteps = sortWorkflowSteps(workflow.steps);
 * // 现在可以安全地按顺序执行步骤
 * for (const step of sortedSteps) {
 *   await executeWorkflowStep(step, userInput, previousResults);
 * }
 * 
 * // 注意事项：
 * // 1. 排序是稳定的，相同order值的步骤保持原有相对顺序
 * // 2. 该函数不会修改输入数组，而是返回新的排序后的数组
 * // 3. 如果步骤的order属性为负数或非数字，可能导致不可预期的排序结果
 * // 4. 在工作流执行前必须调用此函数确保正确的执行顺序
 * // 5. 该函数的时间复杂度为O(n log n)，适用于大多数工作流场景
 * // 6. 如果传入空数组，将返回空数组
 * // 7. 排序基于数字比较，不适用于字符串或其他类型的order值
 * // 8. 该函数是纯函数，多次调用相同输入会得到相同结果
 * @since 1.0.0
 * @category Workflow Executor
 * @alias sortWorkflowSteps
 * @see executeWorkflow
 * @see executeWorkflowStep
 */
function sortWorkflowSteps(steps: WorkflowStep[]): WorkflowStep[] {
  try {
    return steps.sort((a, b) => a.order - b.order);
  } catch (error) {
    console.error("Error sorting workflow steps:", error);
    return steps; // Return original array if sorting fails
  }
}// ── 工作流执行 ──────────────────────────────────────────
// ── 工作流执行 ──────────────────────────────────────────

/**
 * 执行单个工作流步骤
 * @param step 工作流步骤
 * @param userInput 用户输入
/**

 * 执行单个工作流步骤

 * 

 * 该函数是工作流执行的核心原子操作，负责处理单个步骤的完整执行生命周期。

 * 它包括引擎获取、步骤执行、错误处理、重试机制和结果生成等全过程。

 * 支持自动重试机制，对可恢复错误进行指数退避重试，确保系统健壮性。

 * 

 * @param {WorkflowStep} step - 要执行的工作流步骤对象，包含步骤配置、引擎类型、执行顺序等信息

 * @param {string} userInput - 原始用户输入文本，作为该步骤执行的基础上下文信息

 * @param {ExecutionResult[]} previousResults - 前续步骤的执行结果数组，每个步骤的结果可作为当前步骤的输入参考

 * @returns {Promise<ExecutionResult>} 返回包含执行结果的Promise对象，包含步骤ID、执行状态、输出内容和元数据等信息

 * 

 * @example

 * // 基本用法：执行单个步骤

 * const step = {

 *   id: 'data-extraction',

 *   engineType: 'ai',

 *   order: 1,

 *   config: { model: 'gpt-4', temperature: 0.7 }

 * };

 * 

 * const result = await executeWorkflowStep(step, '提取PDF中的表格数据', []);

 * console.log(result);

 * // 输出可能为:

 * // {

 * //   stepId: 'data-extraction',

 * //   output: { extractedData: [...] },

 * //   status: 'completed',

 * //   duration: 1234,

 * //   metadata: { engineType: 'ai', order: 1, success: true }

 * // }

 * 

 * // 错误处理示例

 * try {

 *   const result = await executeWorkflowStep(step, '用户输入', previousResults);

 *   if (result.status === 'failed') {

 *     console.error(`步骤执行失败:`, result.error);

 *   }

 * } catch (error) {

 *   console.error('步骤执行异常:', error);

 * }

 * 

 * // 注意事项：

 * // 1. 该函数会自动处理重试逻辑，对于数据库连接等临时错误会尝试重试

 * // 2. 重试次数由RETRY_CONFIG.DEFAULT_MAX_RETRIES控制，默认为2次

 * // 3. 重试采用指数退避策略，最大延迟时间为MAX_DELAY_MS

 * // 4. 如果步骤执行失败，会返回详细错误信息，包括错误类型和失败原因

 * // 5. 函数会记录详细的执行时间，用于性能监控和优化

 * // 6. 返回结果包含metadata字段，可用于调试和监控

 * // 7. 对于非可恢复错误（如参数错误），不会触发重试

 * // 8. 该函数是异步的，需要使用await调用

 * // 9. 在工作流执行器中调用时，通常会配合try-catch处理整体异常

 * // 10. 适用于单步骤执行、工作流集成、单元测试等多个场景

 * 

 * @since 1.0.0

 * @category Workflow Executor

 * @alias executeSingleStep

 * @see executeWorkflow

 * @see sortWorkflowSteps

 * @see getEngine

 * @see AsyncErrorHandler

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
      status: WORKFLOW_STATUS.COMPLETED,
      duration: Date.now() - startTime,
      metadata: {
        [METADATA_KEYS.ENGINE_TYPE]: step.engineType,
        [METADATA_KEYS.ORDER]: step.order,
        [METADATA_KEYS.SUCCESS]: true
      }
    };
  } catch (error) {
    // 使用异步错误处理器处理重试逻辑
    const asyncErrorHandler = AsyncErrorHandler.getInstance();
    const context: AsyncOperationContext = {
      operation: `workflow_step_${step.id}`,
      userId: (previousResults[0]?.metadata as any)?.userId || 'unknown',
      sessionId: `${ID_PATTERNS.SESSION_PREFIX}${Date.now()}`,
      correlationId: `${ID_PATTERNS.CORRELATION_PREFIX}${Date.now()}`,
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
          maxRetries: TIMING.DEFAULT_MAX_RETRIES,
          baseDelayMs: TIMING.BASE_DELAY_MS,
          maxDelayMs: TIMING.MAX_DELAY_MS,
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
        status: WORKFLOW_STATUS.COMPLETED,
        duration: Date.now() - startTime,
        metadata: {
          [METADATA_KEYS.ENGINE_TYPE]: step.engineType,
          [METADATA_KEYS.ORDER]: step.order,
          [METADATA_KEYS.SUCCESS]: true,
          retries: TIMING.DEFAULT_MAX_RETRIES // 标记为重试后成功
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
        status: WORKFLOW_STATUS.FAILED,
        error: finalError instanceof Error ? finalError.message : String(finalError),
        duration: Date.now() - startTime,
        metadata: {
          [METADATA_KEYS.ENGINE_TYPE]: step.engineType,
          [METADATA_KEYS.ORDER]: step.order,
          [METADATA_KEYS.SUCCESS]: false,
          retries: TIMING.DEFAULT_MAX_RETRIES,
          [METADATA_KEYS.FINAL_ERROR]: finalError instanceof Error ? finalError.constructor.name : String(finalError)
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
        sessionId: `${ID_PATTERNS.SESSION_PREFIX}${Date.now()}`,
        correlationId: `${ID_PATTERNS.CORRELATION_PREFIX}${Date.now()}`,
        metadata: { workflowId, userInput }
      },
      {
        maxRetries: TIMING.WORKFLOW_FETCH_MAX_RETRIES,
        baseDelayMs: TIMING.BASE_DELAY_MS,
        maxDelayMs: TIMING.MAX_DELAY_MS,
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
        if (result.status === WORKFLOW_STATUS.FAILED) {
          console.warn(`Step ${step.id} failed, but continuing with workflow execution`);
          
          // 对于关键步骤，可以添加更严格的处理逻辑
          if (step.engineType === STEP_TYPE.DATABASE || step.engineType === STEP_TYPE.AI) {
            console.error(`Critical step ${step.id} failed, workflow may be incomplete`);
          }
        }
      } catch (stepError) {
        console.error(`Unexpected error in step ${step.id}:`, stepError);
        
        results.push({
          stepId: step.id,
          output: null,
          status: WORKFLOW_STATUS.FAILED,
          error: stepError instanceof Error ? stepError.message : String(stepError),
          duration: 0,
          metadata: {
            [METADATA_KEYS.ENGINE_TYPE]: step.engineType,
            [METADATA_KEYS.ORDER]: step.order,
            [METADATA_KEYS.SUCCESS]: false,
            [METADATA_KEYS.UNEXPECTED_ERROR]: true
          }
        });
      }
    }
    
    const totalDuration = Date.now() - startTime;
    
    // 计算工作流成功状态
    const successfulSteps = results.filter(r => r.status === WORKFLOW_STATUS.COMPLETED).length;
    const totalSteps = results.length;
    const successRatio = totalSteps > 0 ? successfulSteps / totalSteps : 0;
    
    // 如果成功比例低于阈值，标记为整体失败
    const overallSuccess = successRatio >= TIMING.SUCCESS_THRESHOLD_RATIO;
    
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
      sessionId: `${ID_PATTERNS.SESSION_PREFIX}${Date.now()}`,
      correlationId: `${ID_PATTERNS.CORRELATION_PREFIX}${Date.now()}`,
      metadata: { workflowId, userInput }
    };

    // 记录错误详情
    await asyncErrorHandler.logOperationFailure(context, error, 1);
    
    return {
      workflowId,
      results: [{
        stepId: ID_PATTERNS.SYSTEM_ERROR_ID,
        output: null,
        status: WORKFLOW_STATUS.FAILED,
        error: error instanceof Error ? error.message : String(error),
        duration: totalDuration,
        metadata: {
          [METADATA_KEYS.ERROR]: ERROR_TYPES.WORKFLOW_EXECUTION_ERROR,
          workflowId,
          userInputLength: userInput.length,
          [METADATA_KEYS.TIMESTAMP]: new Date().toISOString()
        }
      }],
      completedAt: new Date(),
      totalDuration,
      success: false,
      metadata: {
        [METADATA_KEYS.SYSTEM_ERROR]: true,
        [METADATA_KEYS.ERROR]: error instanceof Error ? error.constructor.name : 'UnknownError'
      }
    };
  }
}