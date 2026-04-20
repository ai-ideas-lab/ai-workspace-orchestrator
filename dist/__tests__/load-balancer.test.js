"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const load_balancer_1 = require("../services/load-balancer");
describe('LoadBalancer', () => {
    beforeEach(() => {
        load_balancer_1.loadBalancer['engines'].clear();
    });
    describe('registerEngine()', () => {
        test('应成功注册新引擎（默认权重 100）', () => {
            load_balancer_1.loadBalancer.registerEngine('engine-1');
            const weightInfo = load_balancer_1.loadBalancer.getWeightInfo();
            expect(weightInfo).toHaveLength(1);
            expect(weightInfo[0].engineId).toBe('engine-1');
            expect(weightInfo[0].weight).toBe(100);
            expect(weightInfo[0].effectiveWeight).toBe(100);
            expect(weightInfo[0].currentWeight).toBe(0);
        });
        test('应成功注册新引擎（自定义权重）', () => {
            load_balancer_1.loadBalancer.registerEngine('engine-2', 200);
            const weightInfo = load_balancer_1.loadBalancer.getWeightInfo();
            expect(weightInfo).toHaveLength(1);
            expect(weightInfo[0].engineId).toBe('engine-2');
            expect(weightInfo[0].weight).toBe(200);
            expect(weightInfo[0].effectiveWeight).toBe(200);
        });
        test('重复注册同一个引擎应更新已有配置', () => {
            load_balancer_1.loadBalancer.registerEngine('engine-3', 100);
            load_balancer_1.loadBalancer.registerEngine('engine-3', 150);
            const weightInfo = load_balancer_1.loadBalancer.getWeightInfo();
            expect(weightInfo).toHaveLength(1);
            expect(weightInfo[0].weight).toBe(150);
            expect(weightInfo[0].effectiveWeight).toBe(150);
        });
    });
    describe('deregisterEngine()', () => {
        test('应成功注销已注册的引擎', () => {
            load_balancer_1.loadBalancer.registerEngine('engine-4', 100);
            load_balancer_1.loadBalancer.registerEngine('engine-5', 200);
            expect(load_balancer_1.loadBalancer.getWeightInfo()).toHaveLength(2);
            load_balancer_1.loadBalancer.deregisterEngine('engine-4');
            const weightInfo = load_balancer_1.loadBalancer.getWeightInfo();
            expect(weightInfo).toHaveLength(1);
            expect(weightInfo[0].engineId).toBe('engine-5');
        });
        test('注销不存在的引擎应无错误', () => {
            expect(() => {
                load_balancer_1.loadBalancer.deregisterEngine('non-existent');
            }).not.toThrow();
        });
    });
    describe('selectEngine()', () => {
        test('无注册引擎时应返回 null', () => {
            expect(load_balancer_1.loadBalancer.selectEngine()).toBeNull();
        });
        test('单引擎选择时应返回该引擎', () => {
            load_balancer_1.loadBalancer.registerEngine('engine-6', 100);
            const selected = load_balancer_1.loadBalancer.selectEngine();
            expect(selected).toBe('engine-6');
        });
        test('多引擎加权轮询应按权重分布', () => {
            load_balancer_1.loadBalancer.registerEngine('engine-low', 100);
            load_balancer_1.loadBalancer.registerEngine('engine-high', 300);
            const selections = {
                'engine-low': 0,
                'engine-high': 0,
            };
            const iterations = 200;
            for (let i = 0; i < iterations; i++) {
                const selected = load_balancer_1.loadBalancer.selectEngine();
                if (selected) {
                    selections[selected]++;
                }
            }
            expect(selections['engine-high']).toBeGreaterThan(selections['engine-low']);
            const highRatio = selections['engine-high'] / iterations;
            const lowRatio = selections['engine-low'] / iterations;
            expect(highRatio).toBeGreaterThan(0.6);
            expect(lowRatio).toBeLessThan(0.4);
        });
        test('平滑加权轮询应正确更新 currentWeight', () => {
            load_balancer_1.loadBalancer.registerEngine('engine-a', 100);
            load_balancer_1.loadBalancer.registerEngine('engine-b', 100);
            const firstSelection = load_balancer_1.loadBalancer.selectEngine();
            expect(['engine-a', 'engine-b']).toContain(firstSelection);
            const weightInfo = load_balancer_1.loadBalancer.getWeightInfo();
            const firstEntry = weightInfo.find(e => e.engineId === firstSelection);
            const otherEntry = weightInfo.find(e => e.engineId !== firstSelection);
            expect(firstEntry).toBeDefined();
            expect(otherEntry).toBeDefined();
            expect(firstEntry.currentWeight).toBe(-100);
            expect(otherEntry.currentWeight).toBe(100);
        });
        test('权重为 0 的引擎不应被选中', () => {
            load_balancer_1.loadBalancer.registerEngine('engine-zero', 0);
            load_balancer_1.loadBalancer.registerEngine('engine-normal', 100);
            for (let i = 0; i < 10; i++) {
                const selected = load_balancer_1.loadBalancer.selectEngine();
                expect(selected).toBe('engine-normal');
            }
        });
        test('权重为负数应被自动修正为 1', () => {
            load_balancer_1.loadBalancer.registerEngine('engine-negative', -50);
            load_balancer_1.loadBalancer.registerEngine('engine-normal', 100);
            const selected = load_balancer_1.loadBalancer.selectEngine();
            expect(['engine-negative', 'engine-normal']).toContain(selected);
            const weightInfo = load_balancer_1.loadBalancer.getWeightInfo();
            const negativeEntry = weightInfo.find(e => e.engineId === 'engine-negative');
            expect(negativeEntry.effectiveWeight).toBe(1);
        });
    });
    describe('updateWeights()', () => {
        test('应成功更新引擎权重', () => {
            load_balancer_1.loadBalancer.registerEngine('engine-7', 100);
            const snapshots = [
                {
                    engineId: 'engine-7',
                    avgResponseMs: 50,
                    successRate: 0.95,
                    requestsInFlight: 1,
                    activeRequests: 2,
                },
            ];
            load_balancer_1.loadBalancer.updateWeights(snapshots);
            const weightInfo = load_balancer_1.loadBalancer.getWeightInfo();
            expect(weightInfo[0].effectiveWeight).toBeGreaterThan(100);
            expect(weightInfo[0].effectiveWeight).toBeCloseTo(114.5, 1);
        });
        test('应处理不存在的引擎（无错误）', () => {
            load_balancer_1.loadBalancer.registerEngine('engine-8', 100);
            const snapshots = [
                {
                    engineId: 'non-existent-engine',
                    avgResponseMs: 50,
                    successRate: 0.95,
                    requestsInFlight: 1,
                    activeRequests: 2,
                },
            ];
            expect(() => {
                load_balancer_1.loadBalancer.updateWeights(snapshots);
            }).not.toThrow();
            const weightInfo = load_balancer_1.loadBalancer.getWeightInfo();
            expect(weightInfo[0].effectiveWeight).toBe(100);
        });
        test('应正确处理边界条件', () => {
            load_balancer_1.loadBalancer.registerEngine('engine-9', 100);
            const snapshots = [
                {
                    engineId: 'engine-9',
                    avgResponseMs: 5000,
                    successRate: 0.1,
                    activeRequests: 50,
                },
            ];
            load_balancer_1.loadBalancer.updateWeights(snapshots);
            const weightInfo = load_balancer_1.loadBalancer.getWeightInfo();
            expect(weightInfo[0].effectiveWeight).toBe(1);
        });
        test('多引擎更新应独立处理', () => {
            load_balancer_1.loadBalancer.registerEngine('engine-a', 100);
            load_balancer_1.loadBalancer.registerEngine('engine-b', 100);
            load_balancer_1.loadBalancer.registerEngine('engine-c', 100);
            const snapshots = [
                {
                    engineId: 'engine-a',
                    avgResponseMs: 10,
                    successRate: 0.99,
                    activeRequests: 1,
                },
                {
                    engineId: 'engine-b',
                    avgResponseMs: 1000,
                    successRate: 0.5,
                    activeRequests: 10,
                },
                {
                    engineId: 'engine-c',
                    avgResponseMs: 50,
                    successRate: 0.8,
                    activeRequests: 5,
                },
            ];
            load_balancer_1.loadBalancer.updateWeights(snapshots);
            const weightInfo = load_balancer_1.loadBalancer.getWeightInfo();
            const engineA = weightInfo.find(e => e.engineId === 'engine-a');
            const engineB = weightInfo.find(e => e.engineId === 'engine-b');
            const engineC = weightInfo.find(e => e.engineId === 'engine-c');
            expect(engineA.effectiveWeight).toBeGreaterThan(engineB.effectiveWeight);
            expect(engineB.effectiveWeight).toBeLessThan(engineC.effectiveWeight);
        });
    });
    describe('getWeightInfo()', () => {
        test('应返回所有引擎的权重信息', () => {
            load_balancer_1.loadBalancer.registerEngine('engine-x', 100);
            load_balancer_1.loadBalancer.registerEngine('engine-y', 200);
            load_balancer_1.loadBalancer.registerEngine('engine-z', 150);
            const weightInfo = load_balancer_1.loadBalancer.getWeightInfo();
            expect(weightInfo).toHaveLength(3);
            expect(weightInfo.every(info => 'engineId' in info &&
                'weight' in info &&
                'effectiveWeight' in info &&
                'currentWeight' in info)).toBe(true);
        });
        test('无引擎时应返回空数组', () => {
            const weightInfo = load_balancer_1.loadBalancer.getWeightInfo();
            expect(weightInfo).toEqual([]);
        });
    });
    describe('综合场景测试', () => {
        test('完整的负载均衡工作流', () => {
            load_balancer_1.loadBalancer.registerEngine('web-server-1', 100);
            load_balancer_1.loadBalancer.registerEngine('web-server-2', 150);
            load_balancer_1.loadBalancer.registerEngine('web-server-3', 50);
            const selections = [];
            for (let i = 0; i < 200; i++) {
                const selected = load_balancer_1.loadBalancer.selectEngine();
                if (selected) {
                    selections.push(selected);
                }
            }
            const distribution = {
                'web-server-1': selections.filter(s => s === 'web-server-1').length,
                'web-server-2': selections.filter(s => s === 'web-server-2').length,
                'web-server-3': selections.filter(s => s === 'web-server-3').length,
            };
            expect(distribution['web-server-2']).toBeGreaterThan(distribution['web-server-1']);
            expect(distribution['web-server-1']).toBeGreaterThan(distribution['web-server-3']);
            const performanceSnapshots = [
                {
                    engineId: 'web-server-1',
                    avgResponseMs: 20,
                    successRate: 0.98,
                    activeRequests: 3,
                },
                {
                    engineId: 'web-server-2',
                    avgResponseMs: 200,
                    successRate: 0.7,
                    activeRequests: 15,
                },
                {
                    engineId: 'web-server-3',
                    avgResponseMs: 30,
                    successRate: 0.95,
                    activeRequests: 2,
                },
            ];
            load_balancer_1.loadBalancer.updateWeights(performanceSnapshots);
            const newSelections = [];
            for (let i = 0; i < 100; i++) {
                const selected = load_balancer_1.loadBalancer.selectEngine();
                if (selected) {
                    newSelections.push(selected);
                }
            }
            const newDistribution = {
                'web-server-1': newSelections.filter(s => s === 'web-server-1').length,
                'web-server-2': newSelections.filter(s => s === 'web-server-2').length,
                'web-server-3': newSelections.filter(s => s === 'web-server-3').length,
            };
            console.error('DEBUG - 新分布:', newDistribution);
            console.error('DEBUG - 权重信息:', load_balancer_1.loadBalancer.getWeightInfo());
            expect(newDistribution['web-server-1']).toBeGreaterThan(newDistribution['web-server-2']);
        });
        test('动态扩缩容场景', () => {
            load_balancer_1.loadBalancer.registerEngine('server-a', 100);
            load_balancer_1.loadBalancer.registerEngine('server-b', 100);
            for (let i = 0; i < 50; i++) {
                load_balancer_1.loadBalancer.selectEngine();
            }
            load_balancer_1.loadBalancer.registerEngine('server-c', 100);
            expect(load_balancer_1.loadBalancer.getWeightInfo()).toHaveLength(3);
            const selected = load_balancer_1.loadBalancer.selectEngine();
            expect(['server-a', 'server-b', 'server-c']).toContain(selected);
            load_balancer_1.loadBalancer.deregisterEngine('server-a');
            expect(load_balancer_1.loadBalancer.getWeightInfo()).toHaveLength(2);
            for (let i = 0; i < 10; i++) {
                const selected = load_balancer_1.loadBalancer.selectEngine();
                expect(['server-b', 'server-c']).toContain(selected);
            }
        });
        test('极端负载情况下的处理', () => {
            load_balancer_1.loadBalancer.registerEngine('engine-stressed', 100);
            const extremeSnapshots = [
                {
                    engineId: 'engine-stressed',
                    avgResponseMs: 10000,
                    successRate: 0.1,
                    activeRequests: 100,
                },
            ];
            load_balancer_1.loadBalancer.updateWeights(extremeSnapshots);
            const weightInfo = load_balancer_1.loadBalancer.getWeightInfo();
            expect(weightInfo[0].effectiveWeight).toBe(1);
            const selected = load_balancer_1.loadBalancer.selectEngine();
            expect(selected).toBe('engine-stressed');
        });
    });
});
//# sourceMappingURL=load-balancer.test.js.map