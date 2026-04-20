/**
 * Task Scheduler - Core scheduling engine for AI Ideas Lab projects.
 *
 * Provides priority-based task scheduling with lifecycle hooks,
 * retry logic, and concurrency control.
 */

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Task {
  id: string;
  name: string;
  handler: () => Promise<void>;
  priority: TaskPriority;
  status: TaskStatus;
  retries: number;
  maxRetries: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: Error;
}

export interface TaskSchedulerConfig {
  concurrency: number;
  defaultMaxRetries: number;
  onTaskComplete?: (task: Task) => void;
  onTaskFail?: (task: Task) => void;
}

const PRIORITY_WEIGHT: Record<TaskPriority, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};

export class TaskScheduler {
  private queue: Task[] = [];
  private running = new Set<string>();
  private config: TaskSchedulerConfig;
  private timer?: ReturnType<typeof setInterval>;

  constructor(config: Partial<TaskSchedulerConfig> = {}) {
    this.config = {
      concurrency: config.concurrency ?? 4,
      defaultMaxRetries: config.defaultMaxRetries ?? 3,
      onTaskComplete: config.onTaskComplete,
      onTaskFail: config.onTaskFail,
    };
  }

  /**
   * Add a task to the scheduler queue.
   */
  addTask(
    name: string,
    handler: () => Promise<void>,
    priority: TaskPriority = 'medium',
    maxRetries?: number,
  ): Task {
    const task: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      handler,
      priority,
      status: 'pending',
      retries: 0,
      maxRetries: maxRetries ?? this.config.defaultMaxRetries,
      createdAt: new Date(),
    };
    this.queue.push(task);
    this.sortQueue();
    return task;
  }

  /**
   * Start processing the queue.
   */
  start(pollInterval = 100): void {
    if (this.timer) return;
    this.timer = setInterval(() => this.processQueue(), pollInterval);
  }

  /**
   * Stop processing (running tasks will finish).
   */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  /**
   * Cancel a task by ID.
   */
  cancelTask(taskId: string): boolean {
    const idx = this.queue.findIndex((t) => t.id === taskId);
    if (idx !== -1) {
      this.queue[idx].status = 'cancelled';
      this.queue.splice(idx, 1);
      return true;
    }
    return false;
  }

  /**
   * Get current queue snapshot.
   */
  getQueue(): Task[] {
    return [...this.queue];
  }

  /**
   * Get running task IDs.
   */
  getRunning(): string[] {
    return [...this.running];
  }

  /**
   * Wait for all queued tasks to complete.
   */
  async drain(): Promise<void> {
    while (this.queue.length > 0 || this.running.size > 0) {
      await this.processQueue();
      await new Promise((r) => setTimeout(r, 50));
    }
  }

  private sortQueue(): void {
    this.queue.sort((a, b) => PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority]);
  }

  private async processQueue(): Promise<void> {
    while (this.running.size < this.config.concurrency && this.queue.length > 0) {
      const task = this.queue.shift();
      if (!task) break;

      this.running.add(task.id);
      task.status = 'running';
      task.startedAt = new Date();

      this.executeTask(task).finally(() => {
        this.running.delete(task.id);
      });
    }
  }

  private async executeTask(task: Task): Promise<void> {
    try {
      await task.handler();
      task.status = 'completed';
      task.completedAt = new Date();
      this.config.onTaskComplete?.(task);
    } catch (err) {
      task.error = err instanceof Error ? err : new Error(String(err));
      if (task.retries < task.maxRetries) {
        task.retries++;
        task.status = 'pending';
        this.queue.push(task);
        this.sortQueue();
      } else {
        task.status = 'failed';
        task.completedAt = new Date();
        this.config.onTaskFail?.(task);
      }
    }
  }
}
