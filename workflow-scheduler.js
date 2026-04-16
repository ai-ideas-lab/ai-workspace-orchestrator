// AI Workspace Orchestrator - 核心工作流调度器
class WorkflowScheduler {
  async executeWorkflow(workflow, context) {
    const results = [];
    for (const step of workflow.steps) {
      const result = await this.executeStep(step, context);
      results.push(result);
      if (result.status === 'error') break;
    }
    return this.aggregateResults(results);
  }
  
  async executeStep(step, context) {
    return await this.invokeAIEngine(step.type, step.config, context);
  }
  
  async invokeAIEngine(type, config, context) {
    const engine = this.getEngine(type);
    return engine.execute(config, context);
  }
  
  getEngine(type) {
    return engines[type] || this.getDefaultEngine();
  }
  
  aggregateResults(results) {
    return {
      status: results.every(r => r.status === 'success') ? 'completed' : 'failed',
      results: results,
      summary: this.generateSummary(results)
    };
  }
}

module.exports = WorkflowScheduler;