interface AIEngine {
  id: string;
  name: string;
  costPerToken: number;
  latency: number;
  capabilities: string[];
}

interface Task {
  type: string;
  complexity: number;
  requiredCapabilities: string[];
}

export function selectOptimalAIEngine(task: Task, engines: AIEngine[]): AIEngine {
  const scoredEngines = engines.map(engine => {
    const capabilityMatch = task.requiredCapabilities.every(
      cap => engine.capabilities.includes(cap)
    );
    
    const capabilityScore = capabilityMatch ? 100 : 0;
    const costScore = 100 - (engine.costPerToken * 10);
    const latencyScore = 100 - (engine.latency * 5);
    
    const totalScore = capabilityScore * 0.5 + costScore * 0.3 + latencyScore * 0.2;
    
    return { engine, score: totalScore };
  });
  
  return scoredEngines.reduce((best, current) => 
    current.score > best.score ? current : best
  ).engine;
}

// Usage example
const engines = [
  { id: 'gpt-4', name: 'GPT-4', costPerToken: 0.03, latency: 2000, capabilities: ['text', 'reasoning', 'coding'] },
  { id: 'claude-3', name: 'Claude-3', costPerToken: 0.025, latency: 1500, capabilities: ['text', 'reasoning'] },
  { id: 'gemini', name: 'Gemini', costPerToken: 0.02, latency: 1000, capabilities: ['text', 'multimodal'] }
];

const task = {
  type: 'code_review',
  complexity: 5,
  requiredCapabilities: ['text', 'reasoning', 'coding']
};

const optimalEngine = selectOptimalAIEngine(task, engines);
console.log(`Selected engine: ${optimalEngine.name}`);