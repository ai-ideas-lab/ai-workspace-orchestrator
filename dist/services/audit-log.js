"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogService = void 0;
const event_bus_js_1 = require("./event-bus.js");
class AuditLogService {
    constructor(options) {
        this.entries = [];
        this.idCounter = 0;
        this.eventBusSub = null;
        this.maxEntries = options?.maxEntries ?? 10000;
    }
    static getInstance(options) {
        if (!AuditLogService.instance) {
            AuditLogService.instance = new AuditLogService(options);
        }
        return AuditLogService.instance;
    }
    static resetInstance() {
        if (AuditLogService.instance?.eventBusSub) {
            AuditLogService.instance.eventBusSub.unsubscribe();
        }
        AuditLogService.instance = null;
    }
    nextId() {
        this.idCounter++;
        return `audit_${Date.now()}_${this.idCounter}`;
    }
    log(input) {
        const entry = {
            id: this.nextId(),
            action: input.action,
            actor: input.actor,
            actorType: input.actorType ?? 'user',
            resourceType: input.resourceType,
            resourceId: input.resourceId,
            severity: input.severity ?? 'info',
            result: input.result ?? 'success',
            message: input.message,
            metadata: input.metadata,
            ipAddress: input.ipAddress,
            traceId: input.traceId,
            timestamp: input.timestamp ?? new Date(),
        };
        this.entries.push(entry);
        if (this.entries.length > this.maxEntries) {
            this.entries.shift();
        }
        return entry;
    }
    logBatch(inputs) {
        return inputs.map((input) => this.log(input));
    }
    query(params = {}) {
        const filters = [
            [!!params.action, params.action?.endsWith('.')
                    ? (e) => e.action.startsWith(params.action)
                    : (e) => e.action === params.action],
            [!!params.actor, (e) => e.actor === params.actor],
            [!!params.resourceType, (e) => e.resourceType === params.resourceType],
            [!!params.resourceId, (e) => e.resourceId === params.resourceId],
            [!!params.severity, (e) => e.severity === params.severity],
            [!!params.result, (e) => e.result === params.result],
            [!!params.from, (e) => e.timestamp >= params.from],
            [!!params.to, (e) => e.timestamp <= params.to],
        ];
        const activeFilters = filters.filter(([hasCondition]) => hasCondition).map(([, fn]) => fn);
        const filtered = this.entries.filter((entry) => activeFilters.every((fn) => fn(entry)));
        const total = filtered.length;
        const offset = params.offset ?? 0;
        const limit = Math.min(params.limit ?? 50, 200);
        const entries = filtered.slice(offset, offset + limit);
        return { entries, total };
    }
    getById(id) {
        return this.entries.find((e) => e.id === id);
    }
    getStats() {
        const byAction = {};
        const bySeverity = { info: 0, warn: 0, error: 0, critical: 0 };
        const byResult = {};
        const byResourceType = {};
        let failureCount = 0;
        let earliest;
        let latest;
        for (const entry of this.entries) {
            byAction[entry.action] = (byAction[entry.action] ?? 0) + 1;
            bySeverity[entry.severity]++;
            byResult[entry.result] = (byResult[entry.result] ?? 0) + 1;
            byResourceType[entry.resourceType] = (byResourceType[entry.resourceType] ?? 0) + 1;
            if (entry.result === 'failure' || entry.result === 'denied') {
                failureCount++;
            }
            if (!earliest || entry.timestamp < earliest)
                earliest = entry.timestamp;
            if (!latest || entry.timestamp > latest)
                latest = entry.timestamp;
        }
        return {
            totalEntries: this.entries.length,
            byAction,
            bySeverity,
            byResult,
            byResourceType,
            failureCount,
            earliestEntry: earliest,
            latestEntry: latest,
        };
    }
    startEventBusCapture() {
        const bus = event_bus_js_1.EventBus.getInstance();
        const service = this;
        this.eventBusSub = bus.onAny((event) => {
            const actionMap = {
                'request.enqueued': 'request.enqueue',
                'request.dequeued': 'request.dequeue',
                'request.failed': 'request.fail',
                'engine.registered': 'engine.register',
                'engine.deregistered': 'engine.deregister',
                'engine.success': 'engine.call.success',
                'engine.failure': 'engine.call.failure',
                'circuit.state_changed': 'circuit.state_change',
                'circuit.reset': 'circuit.reset',
                'queue.cleared': 'queue.clear',
            };
            const action = actionMap[event.type] ?? `event.${event.type}`;
            const entry = {
                action,
                actor: event.engineId ?? event.requestId ?? 'system',
                actorType: 'system',
                resourceType: 'system',
                resourceId: event.engineId ?? event.requestId ?? 'unknown',
                severity: event.type.includes('failure') || event.type.includes('failed')
                    ? 'error'
                    : 'info',
                result: event.type.includes('failure') || event.type.includes('failed')
                    ? 'failure'
                    : 'success',
                message: `EventBus: ${event.type}`,
                metadata: { ...event },
            };
            service.log(entry);
        });
    }
    stopEventBusCapture() {
        if (this.eventBusSub) {
            this.eventBusSub.unsubscribe();
            this.eventBusSub = null;
        }
    }
    exportAsJson(params) {
        const { entries } = params ? this.query(params) : { entries: this.entries };
        return JSON.stringify(entries, null, 2);
    }
    exportAsCsv(params) {
        const { entries } = params ? this.query(params) : { entries: this.entries };
        const headers = ['id', 'timestamp', 'action', 'actor', 'actorType', 'resourceType', 'resourceId', 'severity', 'result', 'message'];
        const rows = entries.map((e) => [e.id, e.timestamp.toISOString(), e.action, e.actor, e.actorType, e.resourceType, e.resourceId, e.severity, e.result, `"${e.message.replace(/"/g, '""')}"`].join(','));
        return [headers.join(','), ...rows].join('\n');
    }
    clear() {
        this.entries = [];
        this.idCounter = 0;
    }
    get size() {
        return this.entries.length;
    }
}
exports.AuditLogService = AuditLogService;
AuditLogService.instance = null;
//# sourceMappingURL=audit-log.js.map