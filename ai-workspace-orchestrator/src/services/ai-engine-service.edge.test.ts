import { AIEngineService, EngineConfig, Task } from '../services/ai-engine-service';

describe('AIEngineService', () => {
  let service: AIEngineService;

  beforeEach(() => {
    service = new AIEngineService();
  });

  describe('selectEngine edge cases', () => {
    it('should throw error when task is null', () => {
      // This should throw an error because selectEngine doesn't handle null tasks
      expect(() => service.selectEngine(null as any)).toThrow();
    });

    it('should throw error when task is undefined', () => {
      expect(() => service.selectEngine(undefined as any)).toThrow();
    });

    it('should throw error when task is missing required properties', () => {
      const invalidTask = { id: 'test' }; // missing type and engine properties
      expect(() => service.selectEngine(invalidTask as Task)).toThrow();
    });
  });

  describe('selectEngine case sensitivity', () => {
    it('should find engine by name case-insensitively', () => {
      const task: Task = {
        id: '7',
        type: 'text-generation',
        content: 'Hello',
        engine: 'ChatGPT', // capitalized
      };

      // This should work - find engine by name case-insensitively
      const engine = service.selectEngine(task);
      expect(engine.name).toBe('ChatGPT');
    });

    it('should find engine by lowercase name', () => {
      const task: Task = {
        id: '8',
        type: 'text-generation',
        content: 'Hello',
        engine: 'chatgpt', // lowercase
      };

      const engine = service.selectEngine(task);
      expect(engine.name).toBe('ChatGPT');
    });
  });
});