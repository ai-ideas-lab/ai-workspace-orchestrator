import { TaskScheduler } from './taskScheduler';
import type { Task } from './taskScheduler';

describe('TaskScheduler', () => {
  let scheduler: TaskScheduler;

  beforeEach(() => {
    scheduler = new TaskScheduler();
  });

  afterEach(() => {
    scheduler.stop();
  });

  describe('addTask', () => {
    it('should add a task with default priority', () => {
      const task = scheduler.addTask('test', async () => {});
      expect(task.name).toBe('test');
      expect(task.priority).toBe('medium');
      expect(task.status).toBe('pending');
    });

    it('should assign unique IDs', () => {
      const t1 = scheduler.addTask('a', async () => {});
      const t2 = scheduler.addTask('b', async () => {});
      expect(t1.id).not.toBe(t2.id);
    });
  });

  describe('priority ordering', () => {
    it('should sort queue by priority (critical > high > medium > low)', () => {
      scheduler.addTask('low', async () => {}, 'low');
      scheduler.addTask('critical', async () => {}, 'critical');
      scheduler.addTask('medium', async () => {}, 'medium');
      scheduler.addTask('high', async () => {}, 'high');

      const queue = scheduler.getQueue();
      expect(queue.map((t: Task) => t.priority)).toEqual([
        'critical',
        'high',
        'medium',
        'low',
      ]);
    });
  });

  describe('execution', () => {
    it('should execute tasks and mark completed', async () => {
      const results: string[] = [];
      scheduler.addTask('a', async () => { results.push('a'); });
      scheduler.addTask('b', async () => { results.push('b'); });

      await scheduler.drain();

      expect(results).toEqual(['a', 'b']);
      expect(scheduler.getQueue().length).toBe(0);
    });

    it('should respect concurrency limit', async () => {
      let concurrent = 0;
      let maxConcurrent = 0;
      const s = new TaskScheduler({ concurrency: 2 });

      for (let i = 0; i < 6; i++) {
        s.addTask(`t${i}`, async () => {
          concurrent++;
          maxConcurrent = Math.max(maxConcurrent, concurrent);
          await new Promise((r) => setTimeout(r, 20));
          concurrent--;
        });
      }

      await s.drain();
      s.stop();
      expect(maxConcurrent).toBeLessThanOrEqual(2);
    });
  });

  describe('retry logic', () => {
    it('should retry failed tasks up to maxRetries', async () => {
      let attempts = 0;
      const s = new TaskScheduler({ defaultMaxRetries: 2 });

      s.addTask('flaky', async () => {
        attempts++;
        if (attempts < 3) throw new Error('not yet');
      });

      await s.drain();
      s.stop();
      expect(attempts).toBe(3);
    });

    it('should mark task as failed after exhausting retries', async () => {
      let attempts = 0;
      const s = new TaskScheduler({ defaultMaxRetries: 1 });

      s.addTask('fail', async () => {
        attempts++;
        throw new Error('always fails');
      });

      const failed: string[] = [];
      const s2 = new TaskScheduler({ defaultMaxRetries: 1, onTaskFail: (task: Task) => failed.push(task.name) });
      s2.addTask('fail', async () => {
        attempts++;
        throw new Error('always fails');
      });

      await s2.drain();
      s2.stop();
      expect(attempts).toBe(2); // initial + 1 retry
      expect(failed).toEqual(['fail']);
      return;

      await s.drain();
      s.stop();
      expect(attempts).toBe(2); // initial + 1 retry
      expect(failed).toEqual(['fail']);
    });
  });

  describe('cancelTask', () => {
    it('should cancel a pending task', () => {
      const task = scheduler.addTask('cancel-me', async () => {});
      const result = scheduler.cancelTask(task.id);
      expect(result).toBe(true);
      expect(scheduler.getQueue().find((t: Task) => t.id === task.id)).toBeUndefined();
    });

    it('should return false for non-existent task', () => {
      expect(scheduler.cancelTask('nope')).toBe(false);
    });
  });

  describe('lifecycle', () => {
    it('should call onTaskComplete callback', async () => {
      const completed: string[] = [];
      const s = new TaskScheduler({
        onTaskComplete: (task: Task) => completed.push(task.name),
      });

      s.addTask('done', async () => {});
      await s.drain();
      s.stop();
      expect(completed).toEqual(['done']);
    });
  });
});
