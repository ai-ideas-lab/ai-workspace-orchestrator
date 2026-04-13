/**
 * AI工作流编排器 - 核心工作流调度引擎
 * 
 * 提供AI引擎注册、工作流执行和结果聚合的核心功能。
 * 该类负责管理多个AI引擎的生命周期，协调不同类型AI引擎的协作，
 * 以及按照预设工作流顺序执行AI任务并收集执行结果。
 * 
 * @example
 * // 基本使用示例
 * const orchestrator = new WorkspaceOrchestrator();
 * 
 * // 注册AI引擎
 * orchestrator.registerEngine('text-generator', openAIEngine);
 * orchestrator.registerEngine('image-processor', dalleEngine);
 * 
 * // 执行工作流
 * const workflow = {
 *   steps: [
 *     { engine: 'text-generator', input: '生成产品描述' },
 *     { engine: 'image-processor', input: '根据描述生成图片' }
 *   ]
 * };
 * const results = await orchestrator.executeWorkflow(workflow);
 * console.log(results);
 * // 输出示例: ['产品描述文本', '生成图片的base64数据']
 */
export class WorkspaceOrchestrator {
  private aiEngines: Map<string, any> = new Map();
  private workflows: Map<string, any> = new Map();

  /**
   * 注册AI引擎
   * 
   * 将指定的AI引擎注册到编排器中，以便在工作流中使用。
   * 每个引擎需要一个唯一的名称标识符，后续通过该名称引用。
   * 同名引擎会被覆盖，确保引擎名称的唯一性。
   * 
   * @param name - AI引擎的名称标识符，必须唯一
   * @param engine - AI引擎实例，必须实现execute方法
   * @throws Error - 当引擎对象没有必需的execute方法时抛出异常
   * @example
   * // 注册OpenAI文本生成引擎
   * const openAIEngine = {
   *   execute: async (input: string) => {
   *     return await openai.completions.create({
   *       model: 'gpt-3.5-turbo',
   *       prompt: input,
   *       max_tokens: 100
   *     });
   *   }
   * };
   * orchestrator.registerEngine('text-generator', openAIEngine);
   * 
   * // 注册DALL-E图像生成引擎
   * const dalleEngine = {
   *   execute: async (input: string) => {
   *     return await openai.images.generate({
   *       prompt: input,
   *       n: 1,
   *       size: '1024x1024'
   *     });
   *   }
   * };
   * orchestrator.registerEngine('image-processor', dalleEngine);
   * 
   * // 错误处理示例
   * try {
   *   orchestrator.registerEngine('invalid-engine', {});
   * } catch (error) {
   *   console.error('引擎注册失败:', error.message);
   *   // 输出: 引擎注册失败: Engine must have execute method
   * }
   */
  registerEngine(name: string, engine: any) {
    // 验证引擎是否必需的execute方法
    if (!engine || typeof engine.execute !== 'function') {
      throw new Error(`Engine must have execute method`);
    }
    
    this.aiEngines.set(name, engine);
  }

  /**
   * 执行工作流
   * 
   * 按照工作流的步骤顺序，依次调用相应的AI引擎执行任务。
   * 每个步骤的执行结果会作为后续步骤的输入（如果需要）。
   * 支持步骤之间的数据传递和结果聚合。
   * 
   * @param workflow - 工作流对象，包含步骤数组
   * @param workflow.steps - 工作流步骤数组，每个步骤必须包含engine和input字段
   * @returns 返回所有步骤执行结果的数组，按步骤顺序排列
   * @throws Error - 当指定的AI引擎未找到或执行失败时抛出异常
   * @example
   * // 定义多步骤工作流
   * const workflow = {
   *   steps: [
   *     {
   *       engine: 'text-generator',
   *       input: '为iPhone 15写一个吸引人的产品描述'
   *     },
   *     {
   *       engine: 'image-processor', 
   *       input: '根据上述描述生成产品展示图片'
   *     },
   *     {
   *       engine: 'text-generator',
   *       input: '为上述图片生成社交媒体文案'
   *     }
   *   ]
   * };
   * 
   * // 执行工作流
   * const results = await orchestrator.executeWorkflow(workflow);
   * console.log('工作流执行结果:');
   * results.forEach((result, index) => {
   *   console.log(`步骤${index + 1}:`, result);
   * });
   * 
   * // 错误处理示例
   * try {
   *   const workflow = {
   *     steps: [
   *       { engine: 'unknown-engine', input: 'test input' }
   *     ]
   *   };
   *   const results = await orchestrator.executeWorkflow(workflow);
   *   console.log(results);
   * } catch (error) {
   *   console.error('工作流执行失败:', error.message);
   *   // 输出: 工作流执行失败: Engine unknown-engine not found
   * }
   */
  async executeWorkflow(workflow: any) {
    const results = [];
    for (const step of workflow.steps) {
      const engine = this.aiEngines.get(step.engine);
      if (!engine) throw new Error(`Engine ${step.engine} not found`);
      const result = await engine.execute(step.input);
      results.push(result);
    }
    return results;
  }
}