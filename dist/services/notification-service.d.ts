import { EventBus, EventType } from './event-bus.js';
export type NotificationLevel = 'info' | 'warning' | 'error' | 'critical';
export type NotificationStatus = 'pending' | 'delivered' | 'read' | 'dismissed';
export type NotificationChannel = 'in-app' | 'webhook' | 'email';
export interface Notification {
    id: string;
    userId: string;
    title: string;
    body: string;
    level: NotificationLevel;
    status: NotificationStatus;
    channel: NotificationChannel;
    sourceEventType: EventType;
    sourceEventId?: string;
    createdAt: Date;
    readAt?: Date;
    metadata: Record<string, unknown>;
}
export interface NotificationFilter {
    userId?: string;
    level?: NotificationLevel;
    status?: NotificationStatus;
    channel?: NotificationChannel;
    since?: Date;
    limit?: number;
}
export interface NotificationRule {
    eventTypes: EventType[];
    level: NotificationLevel;
    channel: NotificationChannel;
    titleTemplate: string;
    bodyTemplate: string;
}
export declare class NotificationService {
    private notifications;
    private rules;
    private subscriptions;
    private maxHistory;
    private eventBus;
    constructor(eventBus: EventBus, options?: {
        maxHistory?: number;
    });
    start(): void;
    stop(): void;
    notify(input: {
        userId: string;
        title: string;
        body: string;
        level: NotificationLevel;
        channel?: NotificationChannel;
        sourceEventType: EventType;
        metadata?: Record<string, unknown>;
    }): Notification;
    getNotifications(filter?: NotificationFilter): Notification[];
    markAsRead(notificationId: string): boolean;
    getUnreadCount(userId: string): number;
    addRule(rule: NotificationRule): void;
    getRules(): NotificationRule[];
    getStats(): {
        total: number;
        byLevel: Record<string, number>;
        byStatus: Record<string, number>;
    };
    private createFromEvent;
    private inferLevel;
}
//# sourceMappingURL=notification-service.d.ts.map