"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const load_balancer_1 = require("../services/load-balancer");
describe('LoadBalancer - Simple Tests', () => {
    beforeEach(() => {
        load_balancer_1.loadBalancer['engines'].clear();
    });
    test('should register engine with default weight', () => {
        load_balancer_1.loadBalancer.registerEngine('test-engine');
        const weightInfo = load_balancer_1.loadBalancer.getWeightInfo();
        expect(weightInfo).toHaveLength(1);
        expect(weightInfo[0]?.engineId).toBe('test-engine');
        expect(weightInfo[0]?.weight).toBe(100);
        expect(weightInfo[0]?.effectiveWeight).toBe(100);
        expect(weightInfo[0]?.currentWeight).toBe(0);
    });
    test('should register engine with custom weight', () => {
        load_balancer_1.loadBalancer.registerEngine('test-engine-2', 200);
        const weightInfo = load_balancer_1.loadBalancer.getWeightInfo();
        expect(weightInfo).toHaveLength(1);
        expect(weightInfo[0]?.engineId).toBe('test-engine-2');
        expect(weightInfo[0]?.weight).toBe(200);
        expect(weightInfo[0]?.effectiveWeight).toBe(200);
    });
    test('should select null when no engines registered', () => {
        expect(load_balancer_1.loadBalancer.selectEngine()).toBeNull();
    });
    test('should select single engine', () => {
        load_balancer_1.loadBalancer.registerEngine('single-engine', 100);
        const selected = load_balancer_1.loadBalancer.selectEngine();
        expect(selected).toBe('single-engine');
    });
    test('should handle negative weights', () => {
        load_balancer_1.loadBalancer.registerEngine('negative-engine', -50);
        const weightInfo = load_balancer_1.loadBalancer.getWeightInfo();
        expect(weightInfo[0]?.effectiveWeight).toBe(1);
    });
    test('should update weights correctly', () => {
        load_balancer_1.loadBalancer.registerEngine('engine', 100);
        const snapshots = [
            {
                engineId: 'engine',
                avgResponseMs: 50,
                successRate: 0.95,
                requestsInFlight: 1,
                activeRequests: 2,
            }
        ];
        load_balancer_1.loadBalancer.updateWeights(snapshots);
        const weightInfo = load_balancer_1.loadBalancer.getWeightInfo();
        expect(weightInfo[0]?.effectiveWeight).toBeCloseTo(135.875, 1);
    });
    test('should get weight info', () => {
        load_balancer_1.loadBalancer.registerEngine('engine-1', 100);
        load_balancer_1.loadBalancer.registerEngine('engine-2', 200);
        const weightInfo = load_balancer_1.loadBalancer.getWeightInfo();
        expect(weightInfo).toHaveLength(2);
        expect(weightInfo.every(info => 'engineId' in info &&
            'weight' in info &&
            'effectiveWeight' in info &&
            'currentWeight' in info)).toBe(true);
    });
});
//# sourceMappingURL=load-balancer-simple.test.js.map