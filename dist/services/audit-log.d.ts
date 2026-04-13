export type AuditSeverity = 'info' | 'warn' | 'error' | 'critical';
export interface AuditEntry {
    id: string;
    action: string;
    actor: string;
    actorType: 'user' | 'system' | 'api-key' | 'service';
    resourceType: 'workflow' | 'template' | 'engine' | 'user' | 'dashboard' | 'system';
    resourceId: string;
    severity: AuditSeverity;
    result: 'success' | 'failure' | 'denied';
    message: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
    traceId?: string;
    timestamp: Date;
}
export interface AuditQuery {
    action?: string;
    actor?: string;
    resourceType?: AuditEntry['resourceType'];
    resourceId?: string;
    severity?: AuditSeverity;
    result?: AuditEntry['result'];
    from?: Date;
    to?: Date;
    offset?: number;
    limit?: number;
}
export interface AuditStats {
    totalEntries: number;
    byAction: Record<string, number>;
    bySeverity: Record<AuditSeverity, number>;
    byResult: Record<string, number>;
    byResourceType: Record<string, number>;
    failureCount: number;
    earliestEntry?: Date;
    latestEntry?: Date;
}
export interface AuditLogOptions {
    maxEntries?: number;
    captureEventBus?: boolean;
}
export interface CreateAuditEntry {
    action: string;
    actor: string;
    actorType?: AuditEntry['actorType'];
    resourceType: AuditEntry['resourceType'];
    resourceId: string;
    severity?: AuditSeverity;
    result?: AuditEntry['result'];
    message: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
    traceId?: string;
    timestamp?: Date;
}
export declare class AuditLogService {
    private entries;
    private maxEntries;
    private idCounter;
    private static instance;
    private eventBusSub;
    constructor(options?: AuditLogOptions);
    static getInstance(options?: AuditLogOptions): AuditLogService;
    static resetInstance(): void;
    private nextId;
    log(input: CreateAuditEntry): AuditEntry;
    logBatch(inputs: CreateAuditEntry[]): AuditEntry[];
    query(params?: AuditQuery): {
        entries: AuditEntry[];
        total: number;
    };
    getById(id: string): AuditEntry | undefined;
    getStats(): AuditStats;
    startEventBusCapture(): void;
    stopEventBusCapture(): void;
    exportAsJson(params?: AuditQuery): string;
    exportAsCsv(params?: AuditQuery): string;
    clear(): void;
    get size(): number;
}
//# sourceMappingURL=audit-log.d.ts.map