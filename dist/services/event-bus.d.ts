export type EventType = 'request.enqueued' | 'request.dequeued' | 'request.failed' | 'engine.registered' | 'engine.deregistered' | 'engine.success' | 'engine.failure' | 'circuit.state_changed' | 'circuit.reset' | 'queue.cleared';
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
export type OrchestratorEvent = RequestEnqueuedEvent | RequestDequeuedEvent | RequestFailedEvent | EngineRegisteredEvent | EngineDeregisteredEvent | EngineSuccessEvent | EngineFailureEvent | CircuitStateChangedEvent | CircuitResetEvent | QueueClearedEvent;
export type EmitPayload = {
    [K in OrchestratorEvent['type']]: Omit<Extract<OrchestratorEvent, {
        type: K;
    }>, 'timestamp'>;
}[OrchestratorEvent['type']];
export type EventCallback<T extends OrchestratorEvent = OrchestratorEvent> = (event: T) => void;
export interface Subscription {
    unsubscribe: () => void;
}
export interface EventLogEntry {
    event: OrchestratorEvent;
    deliveredTo: number;
}
export declare class EventBus {
    private listeners;
    private wildcardListeners;
    private eventLog;
    private maxLogSize;
    private static instance;
    constructor(options?: {
        maxLogSize?: number;
    });
    static getInstance(options?: {
        maxLogSize?: number;
    }): EventBus;
    static resetInstance(): void;
    on<T extends OrchestratorEvent>(eventType: T['type'], callback: EventCallback<T>): Subscription;
    onAny(callback: EventCallback<any>): Subscription;
    once<T extends OrchestratorEvent>(eventType: T['type'], callback: EventCallback<T>): Subscription;
    emit(event: EmitPayload): number;
    getEventLog(limit?: number): EventLogEntry[];
    getEventLogByType(type: EventType, limit?: number): EventLogEntry[];
    getListenerCounts(): Record<string, number>;
    get totalEventsEmitted(): number;
    clearAll(): void;
    clearLog(): void;
}
//# sourceMappingURL=event-bus.d.ts.map