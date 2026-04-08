export interface EngineConfig {
  name: string;
  type: 'chatgpt' | 'claude' | 'gemini' | 'custom';
  endpoint: string;
  apiKey: string;
  maxTokens: number;
  temperature: number;
  enabled: boolean;
}

export interface Task {
  id: string;
  type: 'text-generation' | 'code-generation' | 'translation' | 'analysis';
  content: string;
  engine: string;
  parameters?: Record<string, any>;
}

export interface EngineResult {
  success: boolean;
  data?: any;
  error?: string;
  executionTime: number;
  cost?: number;
}

export class AIEngineService {
  private engines: Map<string, EngineConfig> = new Map();

  constructor() {
    this.initializeDefaultEngines();
  }

  private initializeDefaultEngines(): void {
    const chatgptConfig: EngineConfig = {
      name: 'ChatGPT',
      type: 'chatgpt',
      endpoint: 'https://api.openai.com/v1/chat/completions',
      apiKey: process.env.OPENAI_API_KEY || '',
      maxTokens: 1000,
      temperature: 0.7,
      enabled: true,
    };

    const claudeConfig: EngineConfig = {
      name: 'Claude',
      type: 'claude',
      endpoint: 'https://api.anthropic.com/v1/messages',
      apiKey: process.env.ANTHROPIC_API_KEY || '',
      maxTokens: 2000,
      temperature: 0.5,
      enabled: true,
    };

    this.engines.set('chatgpt', chatgptConfig);
    this.engines.set('claude', claudeConfig);
  }

  public selectEngine(task: Task): EngineConfig {
    // Validate task object
    if (!task) {
      throw new Error('Task cannot be null or undefined');
    }

    if (!task.type) {
      throw new Error('Task type is required');
    }

    const availableEngines = Array.from(this.engines.values()).filter(engine => engine.enabled);
    
    if (availableEngines.length === 0) {
      throw new Error('No available AI engines');
    }

    // First check if a specific engine is requested
    if (task.engine) {
      // Try case-insensitive lookup
      const engineKey = task.engine.toLowerCase();
      const requestedEngine = this.engines.get(engineKey);
      if (requestedEngine && requestedEngine.enabled) {
        return requestedEngine;
      }
      throw new Error(`Engine ${task.engine} not found or not enabled`);
    }

    // Simple engine selection logic based on task type
    switch (task.type) {
      case 'text-generation':
        return availableEngines.find(engine => engine.type === 'chatgpt') || availableEngines[0];
      case 'code-generation':
        return availableEngines.find(engine => engine.type === 'claude') || availableEngines[0];
      default:
        return availableEngines[0];
    }
  }

  public getEngineConfig(engineName: string): EngineConfig {
    const engine = this.engines.get(engineName);
    if (!engine) {
      throw new Error(`Engine ${engineName} not found`);
    }
    return engine;
  }

  public async executeTask(task: Task): Promise<EngineResult> {
    const startTime = Date.now();
    
    try {
      const engine = this.selectEngine(task);
      const result = await this.callEngine(engine, task);
      
      return {
        success: true,
        data: result,
        executionTime: Date.now() - startTime,
        cost: this.estimateCost(task, engine),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: Date.now() - startTime,
      };
    }
  }

  private async callEngine(engine: EngineConfig, task: Task): Promise<any> {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          response: `Generated response for task: ${task.content.substring(0, 50)}...`,
          engine: engine.name,
          timestamp: new Date().toISOString(),
        });
      }, 100 + Math.random() * 200);
    });
  }

  private estimateCost(task: Task, engine: EngineConfig): number {
    // Simple cost estimation (simulated)
    const baseCost = 0.001; // $0.001 per 1000 tokens
    const tokenCount = task.content.length / 4; // Rough estimate
    return (tokenCount / 1000) * baseCost;
  }

  public addEngine(config: EngineConfig): void {
    this.engines.set(config.name.toLowerCase(), config);
  }

  public removeEngine(engineName: string): void {
    this.engines.delete(engineName.toLowerCase());
  }

  public listEngines(): EngineConfig[] {
    return Array.from(this.engines.values());
  }
}