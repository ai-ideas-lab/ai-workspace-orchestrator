import { AIEngineService, EngineConfig, Task, EngineResult } from '../services/ai-engine-service';

describe('AIEngineService', () => {
  let service: AIEngineService;

  beforeEach(() => {
    service = new AIEngineService();
  });

  describe('selectEngine', () => {
    it('should select ChatGPT for text generation tasks', () => {
      const task: Task = {
        id: '1',
        type: 'text-generation',
        content: 'Hello, world!',
        engine: 'chatgpt',
      };

      const engine = service.selectEngine(task);
      expect(engine.name).toBe('ChatGPT');
    });

    it('should select Claude for code generation tasks', () => {
      const task: Task = {
        id: '2',
        type: 'code-generation',
        content: 'function hello() { return "hello"; }',
        engine: 'claude',
      };

      const engine = service.selectEngine(task);
      expect(engine.name).toBe('Claude');
    });

    it('should throw error when no engines are available', () => {
      // Remove all engines
      service['engines'].forEach((_, key) => service.removeEngine(key));
      
      const task: Task = {
        id: '3',
        type: 'text-generation',
        content: 'Hello',
        engine: 'chatgpt',
      };

      expect(() => service.selectEngine(task)).toThrow('No available AI engines');
    });
  });

  describe('getEngineConfig', () => {
    it('should return engine configuration for existing engine', () => {
      const config = service.getEngineConfig('chatgpt');
      expect(config.name).toBe('ChatGPT');
      expect(config.type).toBe('chatgpt');
    });

    it('should throw error for non-existent engine', () => {
      expect(() => service.getEngineConfig('nonexistent')).toThrow('Engine nonexistent not found');
    });
  });

  describe('executeTask', () => {
    it('should successfully execute a text generation task', async () => {
      const task: Task = {
        id: '4',
        type: 'text-generation',
        content: 'Write a hello world program in JavaScript',
        engine: 'chatgpt',
      };

      const result = await service.executeTask(task);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.executionTime).toBeGreaterThan(0);
      expect(result.cost).toBeDefined();
    });

    it('should handle task execution failure gracefully', async () => {
      const task: Task = {
        id: '5',
        type: 'translation',
        content: 'Translate to French',
        engine: 'nonexistent-engine',
      };

      const result = await service.executeTask(task);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('engine management', () => {
    it('should add new engine successfully', () => {
      const newEngine: EngineConfig = {
        name: 'Gemini',
        type: 'gemini',
        endpoint: 'https://api.google.com/v1/generate',
        apiKey: 'test-api-key',
        maxTokens: 1500,
        temperature: 0.8,
        enabled: true,
      };

      service.addEngine(newEngine);
      const engines = service.listEngines();
      expect(engines).toHaveLength(3);
      expect(engines.some(engine => engine.name === 'Gemini')).toBe(true);
    });

    it('should remove existing engine successfully', () => {
      service.removeEngine('chatgpt');
      const engines = service.listEngines();
      expect(engines).toHaveLength(1);
      expect(engines.some(engine => engine.name === 'ChatGPT')).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle null task gracefully', async () => {
      // This should trigger our bug - task with undefined/null properties
      const invalidTask: any = null;
      
      const result = await service.executeTask(invalidTask);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle empty task content gracefully', async () => {
      const task: Task = {
        id: '6',
        type: 'text-generation',
        content: '',
        engine: 'chatgpt',
      };

      const result = await service.executeTask(task);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });
});