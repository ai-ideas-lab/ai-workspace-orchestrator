/**
 * EventBus - 类型安全的发布/订阅事件总线
 *
 * 为 AI Workspace Orchestrator 各子系统提供统一的事件通信机制。
 * 队列入队/出队、熔断器状态变化、引擎注册/注销等事件均可发布，
 * 监控仪表板、WebSocket 推送、审计日志等模块订阅所需事件。
 *
 * 使用方式:
 *   const bus = EventBus.getInstance();
 *   bus.on('request.enqueued', (e) => console.log(e.requestId));
 *   bus.emit({ type: 'request.enqueued', requestId: 'req_1', ... });
 */

// ── 事件类型定义 ──────────────────────────────────────────

export type EventType =
  | 'request.enqueued'
  | 'request.dequeued'
  | 'request.failed'
  | 'engine.registered'
  | 'engine.deregistered'
  | 'engine.success'
  | 'engine.failure'
  | 'circuit.state_changed'
  | 'circuit.reset'
  | 'queue.cleared';

export interface BaseEvent {
  type: EventType;
  timestamp: Date;
}

export interface RequestEnqueuedEvent extends BaseEvent {
  type: 'request.enqueued';
  requestId: string;
  taskType: string;
  priority: string;
}

export interface RequestDequeuedEvent extends BaseEvent {
  type: 'request.dequeued';
  requestId: string;
  engineId: string;
  waitTimeMs: number;
}

export interface RequestFailedEvent extends BaseEvent {
  type: 'request.failed';
  requestId: string;
  engineId: string;
  error: string;
}

export interface EngineRegisteredEvent extends BaseEvent {
  type: 'engine.registered';
  engineId: string;
  weight: number;
}

export interface EngineDeregisteredEvent extends BaseEvent {
  type: 'engine.deregistered';
  engineId: string;
}

export interface EngineSuccessEvent extends BaseEvent {
  type: 'engine.success';
  engineId: string;
  responseTimeMs: number;
}

export interface EngineFailureEvent extends BaseEvent {
  type: 'engine.failure';
  engineId: string;
  errorMessage: string;
}

export interface CircuitStateChangedEvent extends BaseEvent {
  type: 'circuit.state_changed';
  engineId: string;
  oldState: string;
  newState: string;
}

export interface CircuitResetEvent extends BaseEvent {
  type: 'circuit.reset';
  engineId: string;
}

export interface QueueClearedEvent extends BaseEvent {
  type: 'queue.cleared';
  removedCount: number;
}

export type OrchestratorEvent =
  | RequestEnqueuedEvent
  | RequestDequeuedEvent
  | RequestFailedEvent
  | EngineRegisteredEvent
  | EngineDeregisteredEvent
  | EngineSuccessEvent
  | EngineFailureEvent
  | CircuitStateChangedEvent
  | CircuitResetEvent
  | QueueClearedEvent;

/** 保留判别联合结构的「去掉 timestamp」类型（用于 emit 参数） */
export type EmitPayload = {
  [K in OrchestratorEvent['type']]: Omit<Extract<OrchestratorEvent, { type: K }>, 'timestamp'>;
}[OrchestratorEvent['type']];

// ── 订阅者类型 ────────────────────────────────────────────

export type EventCallback<T extends OrchestratorEvent = OrchestratorEvent> = (event: T) => void;

export interface Subscription {
  /** 取消订阅 */
  unsubscribe: () => void;
}

// ── 事件历史记录 ──────────────────────────────────────────

export interface EventLogEntry {
  event: OrchestratorEvent;
  deliveredTo: number;
}

// ── 主类 ─────────────────────────────────────────────────

export class EventBus {
  private listeners = new Map<EventType, Set<EventCallback>>();
  private wildcardListeners = new Set<EventCallback<any>>();
  private eventLog: EventLogEntry[] = [];
  private maxLogSize: number;
  private static instance: EventBus | null = null;

  constructor(options?: { maxLogSize?: number }) {
    this.maxLogSize = options?.maxLogSize ?? 1000;
  }

  /** 获取全局单例 */
  static getInstance(options?: { maxLogSize?: number }): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus(options);
    }
    return EventBus.instance;
  }

  /** 重置单例（仅用于测试） */
  static resetInstance(): void {
    EventBus.instance = null;
  }

  // ── 订阅 ────────────────────────────────────────────────

  /**
   * 订阅指定事件类型。
   * @returns Subscription 对象，调用 unsubscribe() 取消订阅。
   */
  on<T extends OrchestratorEvent>(
    eventType: T['type'],
    callback: EventCallback<T>,
  ): Subscription {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback as EventCallback);

    return {
      unsubscribe: () => {
        this.listeners.get(eventType)?.delete(callback as EventCallback);
      },
    };
  }

  /**
   * 订阅所有事件（通配符监听器）。
   * 适合审计日志、监控仪表板等需要捕获所有事件的场景。
   */
  onAny(callback: EventCallback<any>): Subscription {
    this.wildcardListeners.add(callback);
    return {
      unsubscribe: () => {
        this.wildcardListeners.delete(callback);
      },
    };
  }

  /**
   * 一次性订阅：触发一次后自动取消。
   */
  once<T extends OrchestratorEvent>(
    eventType: T['type'],
    callback: EventCallback<T>,
  ): Subscription {
    const wrapper = ((event: T) => {
      sub.unsubscribe();
      callback(event);
    }) as EventCallback<T>;

    const sub = this.on(eventType, wrapper);
    return sub;
  }

  // ── 发布 ────────────────────────────────────────────────

  /**
   * 发布事件，通知所有订阅者。
   * 自动填充 timestamp。返回实际投递的订阅者数量。
   */
  emit(event: EmitPayload): number {
    const fullEvent = {
      ...event,
      timestamp: new Date(),
    } as OrchestratorEvent;

    // 投递给指定类型的订阅者
    let delivered = 0;
    const typeListeners = this.listeners.get(event.type);
    if (typeListeners) {
      for (const cb of typeListeners) {
        try {
          cb(fullEvent);
          delivered++;
        } catch {
          // 订阅者异常不影响其他订阅者
        }
      }
    }

    // 投递给通配符订阅者
    for (const cb of this.wildcardListeners) {
      try {
        cb(fullEvent);
        delivered++;
      } catch {
        // 同上
      }
    }

    // 记录事件日志
    this.eventLog.push({ event: fullEvent, deliveredTo: delivered });
    if (this.eventLog.length > this.maxLogSize) {
      this.eventLog.shift();
    }

    return delivered;
  }

  // ── 查询 ────────────────────────────────────────────────

  /** 获取事件日志（最近 N 条） */
  getEventLog(limit?: number): EventLogEntry[] {
    const log = this.eventLog;
    return limit ? log.slice(-limit) : [...log];
  }

  /** 按事件类型过滤日志 */
  getEventLogByType(type: EventType, limit?: number): EventLogEntry[] {
    const filtered = this.eventLog.filter((e) => e.event.type === type);
    return limit ? filtered.slice(-limit) : filtered;
  }

  /** 获取各事件类型的订阅者数量 */
  getListenerCounts(): Record<string, number> {
    const counts: Record<string, number> = { '*': this.wildcardListeners.size };
    for (const [type, listeners] of this.listeners) {
      counts[type] = listeners.size;
    }
    return counts;
  }

  /** 获取总事件数量 */
  get totalEventsEmitted(): number {
    return this.eventLog.length;
  }

  // ── 清理 ────────────────────────────────────────────────

  /** 移除所有订阅者和日志 */
  clearAll(): void {
    this.listeners.clear();
    this.wildcardListeners.clear();
    this.eventLog = [];
  }

  /** 仅清空事件日志，保留订阅者 */
  clearLog(): void {
    this.eventLog = [];
  }
}
