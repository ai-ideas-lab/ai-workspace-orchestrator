/**
 * 工作流验证工具函数
 */

/**
 * 验证工作流定义的基本结构
 * @param workflow 工作流对象
 * @returns 验证结果 { isValid: boolean, errors: string[] }
 */
export function validateWorkflow(workflow: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!workflow || typeof workflow !== 'object') {
    errors.push('工作流必须是一个对象');
    return { isValid: false, errors };
  }
  
  if (!workflow.name || typeof workflow.name !== 'string' || workflow.name.trim() === '') {
    errors.push('工作流名称不能为空');
  }
  
  if (!workflow.steps || !Array.isArray(workflow.steps)) {
    errors.push('工作流步骤必须是一个数组');
  } else {
    workflow.steps.forEach((step: any, index: number) => {
      if (!step || typeof step !== 'object') {
        errors.push(`步骤 ${index} 必须是一个对象`);
        return;
      }
      
      if (!step.id || typeof step.id !== 'string' || step.id.trim() === '') {
        errors.push(`步骤 ${index} ID 不能为空`);
      }
      
      if (!step.type || typeof step.type !== 'string' || step.type.trim() === '') {
        errors.push(`步骤 ${index} 类型不能为空`);
      }
      
      if (step.type === 'api' && (!step.endpoint || typeof step.endpoint !== 'string')) {
        errors.push(`步骤 ${index} API步骤缺少endpoint属性`);
      }
      
      if (step.type === 'ai' && (!step.prompt || typeof step.prompt !== 'string')) {
        errors.push(`步骤 ${index} AI步骤缺少prompt属性`);
      }
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 检查工作流是否包含循环依赖
 * @param workflow 工作流对象
 * @returns 是否包含循环依赖
 */
export function hasCircularDependencies(workflow: any): boolean {
  if (!workflow.steps || !Array.isArray(workflow.steps)) {
    return false;
  }
  
  const stepIds = workflow.steps.map((step: any) => step.id);
  const dependencyGraph: Record<string, string[]> = {};
  
  // 构建依赖图
  workflow.steps.forEach((step: any) => {
    dependencyGraph[step.id] = step.dependencies || [];
  });
  
  // 检查循环依赖
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  
  function hasCycle(node: string): boolean {
    if (recursionStack.has(node)) {
      return true;
    }
    
    if (visited.has(node)) {
      return false;
    }
    
    visited.add(node);
    recursionStack.add(node);
    
    for (const neighbor of dependencyGraph[node] || []) {
      if (hasCycle(neighbor)) {
        return true;
      }
    }
    
    recursionStack.delete(node);
    return false;
  }
  
  for (const stepId of stepIds) {
    if (hasCycle(stepId)) {
      return true;
    }
  }
  
  return false;
}