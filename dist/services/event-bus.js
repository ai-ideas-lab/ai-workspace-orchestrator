"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventBus = void 0;
class EventBus {
    constructor(options) {
        this.listeners = new Map();
        this.wildcardListeners = new Set();
        this.eventLog = [];
        this.maxLogSize = options?.maxLogSize ?? 1000;
    }
    static getInstance(options) {
        if (!EventBus.instance) {
            EventBus.instance = new EventBus(options);
        }
        return EventBus.instance;
    }
    static resetInstance() {
        EventBus.instance = null;
    }
    on(eventType, callback) {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, new Set());
        }
        this.listeners.get(eventType).add(callback);
        return {
            unsubscribe: () => {
                this.listeners.get(eventType)?.delete(callback);
            },
        };
    }
    onAny(callback) {
        this.wildcardListeners.add(callback);
        return {
            unsubscribe: () => {
                this.wildcardListeners.delete(callback);
            },
        };
    }
    once(eventType, callback) {
        const wrapper = ((event) => {
            sub.unsubscribe();
            callback(event);
        });
        const sub = this.on(eventType, wrapper);
        return sub;
    }
    emit(event) {
        const fullEvent = {
            ...event,
            timestamp: new Date(),
        };
        let delivered = 0;
        const typeListeners = this.listeners.get(event.type);
        if (typeListeners) {
            for (const cb of typeListeners) {
                try {
                    cb(fullEvent);
                    delivered++;
                }
                catch {
                }
            }
        }
        for (const cb of this.wildcardListeners) {
            try {
                cb(fullEvent);
                delivered++;
            }
            catch {
            }
        }
        this.eventLog.push({ event: fullEvent, deliveredTo: delivered });
        if (this.eventLog.length > this.maxLogSize) {
            this.eventLog.shift();
        }
        return delivered;
    }
    getEventLog(limit) {
        const log = this.eventLog;
        return limit ? log.slice(-limit) : [...log];
    }
    getEventLogByType(type, limit) {
        const filtered = this.eventLog.filter((e) => e.event.type === type);
        return limit ? filtered.slice(-limit) : filtered;
    }
    getListenerCounts() {
        const counts = { '*': this.wildcardListeners.size };
        for (const [type, listeners] of this.listeners) {
            counts[type] = listeners.size;
        }
        return counts;
    }
    get totalEventsEmitted() {
        return this.eventLog.length;
    }
    clearAll() {
        this.listeners.clear();
        this.wildcardListeners.clear();
        this.eventLog = [];
    }
    clearLog() {
        this.eventLog = [];
    }
}
exports.EventBus = EventBus;
EventBus.instance = null;
//# sourceMappingURL=event-bus.js.map