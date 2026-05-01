"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const event_bus_1 = require("../services/event-bus");
const metrics_collector_1 = require("../services/metrics-collector");
const dashboard_service_1 = require("../services/dashboard-service");
let eventBus;
let collector;
let dashboard;
beforeEach(() => {
    event_bus_1.EventBus.resetInstance();
    eventBus = new event_bus_1.EventBus();
    collector = new metrics_collector_1.MetricsCollector(eventBus);
    collector.start();
    dashboard = new dashboard_service_1.DashboardService(collector);
});
afterEach(() => {
    collector.stop();
});
function simulateHealthyEngine(engineId, responseTimeMs = 150) {
    eventBus.emit({ type: 'engine.registered', engineId, weight: 1 });
    eventBus.emit({ type: 'engine.success', engineId, responseTimeMs });
}
function simulateFailedEngine(engineId) {
    eventBus.emit({ type: 'engine.registered', engineId, weight: 1 });
    eventBus.emit({ type: 'engine.failure', engineId, errorMessage: 'timeout' });
}
describe('DashboardService - getDashboardSummary', () => {
    test('返回完整摘要结构', () => {
        simulateHealthyEngine('engine-1');
        const summary = dashboard.getDashboardSummary();
        expect(summary.generatedAt).toBeInstanceOf(Date);
        expect(summary.health).toBeDefined();
        expect(summary.engines).toBeInstanceOf(Array);
        expect(summary.queue).toBeDefined();
        expect(summary.activeAlerts).toBeInstanceOf(Array);
        expect(summary.alertCount).toBe(summary.activeAlerts.length);
    });
    test('空系统返回默认值', () => {
        const summary = dashboard.getDashboardSummary();
        expect(summary.health.score).toBe(100);
        expect(summary.engines).toHaveLength(0);
        expect(summary.queue.totalEnqueued).toBe(0);
        expect(summary.alertCount).toBe(0);
    });
    test('多引擎生成多个引擎卡片', () => {
        simulateHealthyEngine('engine-1');
        simulateHealthyEngine('engine-2');
        simulateHealthyEngine('engine-3');
        const summary = dashboard.getDashboardSummary();
        expect(summary.engines).toHaveLength(3);
        expect(summary.engines.every((e) => e.status === 'healthy')).toBe(true);
    });
});
describe('DashboardService - getAlerts', () => {
    test('健康系统无告警', () => {
        simulateHealthyEngine('engine-1', 100);
        const alerts = dashboard.getAlerts();
        expect(alerts).toHaveLength(0);
    });
    test('低成功率触发告警', () => {
        eventBus.emit({ type: 'engine.registered', engineId: 'engine-1', weight: 1 });
        for (let i = 0; i < 8; i++) {
            eventBus.emit({ type: 'engine.failure', engineId: 'engine-1', errorMessage: 'err' });
        }
        for (let i = 0; i < 2; i++) {
            eventBus.emit({ type: 'engine.success', engineId: 'engine-1', responseTimeMs: 100 });
        }
        const alerts = dashboard.getAlerts();
        const lowRateAlert = alerts.find((a) => a.type === 'low_success_rate');
        expect(lowRateAlert).toBeDefined();
        expect(lowRateAlert.severity).toBe('critical');
    });
    test('高响应时间触发告警', () => {
        simulateHealthyEngine('engine-1', 5000);
        const alerts = dashboard.getAlerts();
        const responseAlert = alerts.find((a) => a.type === 'high_response_time');
        expect(responseAlert).toBeDefined();
        expect(responseAlert.currentValue).toBeGreaterThan(3000);
    });
    test('熔断器 OPEN 触发告警', () => {
        simulateHealthyEngine('engine-1');
        eventBus.emit({
            type: 'circuit.state_changed',
            engineId: 'engine-1',
            oldState: 'CLOSED',
            newState: 'OPEN',
        });
        const alerts = dashboard.getAlerts();
        const circuitAlert = alerts.find((a) => a.type === 'circuit_open');
        expect(circuitAlert).toBeDefined();
        expect(circuitAlert.engineId).toBe('engine-1');
        expect(circuitAlert.severity).toBe('critical');
    });
    test('告警按严重级别排序（critical 在前）', () => {
        eventBus.emit({ type: 'engine.registered', engineId: 'engine-1', weight: 1 });
        eventBus.emit({ type: 'engine.success', engineId: 'engine-1', responseTimeMs: 5000 });
        const alerts = dashboard.getAlerts();
        for (let i = 1; i < alerts.length; i++) {
            const order = { critical: 0, warning: 1, info: 2 };
            expect(order[alerts[i - 1].severity]).toBeLessThanOrEqual(order[alerts[i].severity]);
        }
    });
    test('自定义阈值生效', () => {
        const customDashboard = new dashboard_service_1.DashboardService(collector, {
            minSuccessRate: 0.99,
        });
        simulateHealthyEngine('engine-1', 100);
        expect(customDashboard.getAlerts()).toHaveLength(0);
        eventBus.emit({ type: 'engine.failure', engineId: 'engine-1', errorMessage: 'err' });
        const alerts = customDashboard.getAlerts();
        expect(alerts.some((a) => a.type === 'low_success_rate')).toBe(true);
    });
});
describe('DashboardService - EngineStatusCard', () => {
    test('高成功率+低延迟 → healthy', () => {
        simulateHealthyEngine('engine-1', 100);
        const summary = dashboard.getDashboardSummary();
        const card = summary.engines.find((e) => e.engineId === 'engine-1');
        expect(card?.status).toBe('healthy');
    });
    test('成功率<90% → degraded', () => {
        eventBus.emit({ type: 'engine.registered', engineId: 'engine-1', weight: 1 });
        for (let i = 0; i < 8; i++) {
            eventBus.emit({ type: 'engine.success', engineId: 'engine-1', responseTimeMs: 100 });
        }
        for (let i = 0; i < 2; i++) {
            eventBus.emit({ type: 'engine.failure', engineId: 'engine-1', errorMessage: 'err' });
        }
        const summary = dashboard.getDashboardSummary();
        const card = summary.engines.find((e) => e.engineId === 'engine-1');
        expect(card?.status).toBe('degraded');
        expect(card?.successRate).toBeCloseTo(0.8);
    });
});
//# sourceMappingURL=dashboard-service.test.js.map