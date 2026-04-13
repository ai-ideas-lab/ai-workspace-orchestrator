import { loadBalancer } from '../services/load-balancer';

// 清空测试环境
function clearEngines() {
  loadBalancer['engines'].clear();
}

describe('LoadBalancer 基本功能测试', () => {
  beforeEach(() => {
    clearEngines();
  });

  test('注册引擎（默认权重）', () => {
    loadBalancer.registerEngine('engine-1');
    const info = loadBalancer.getWeightInfo();
    expect(info).toHaveLength(1);
    expect(info[0].engineId).toBe('engine-1');
    expect(info[0].weight).toBe(100);
  });

  test('注册引擎（自定义权重）', () => {
    loadBalancer.registerEngine('engine-2', 200);
    const info = loadBalancer.getWeightInfo();
    expect(info).toHaveLength(1);
    expect(info[0].weight).toBe(200);
  });

  test('选择引擎 - 无引擎时返回null', () => {
    expect(loadBalancer.selectEngine()).toBeNull();
  });

  test('选择引擎 - 单个引擎', () => {
    loadBalancer.registerEngine('engine-3', 100);
    const selected = loadBalancer.selectEngine();
    expect(selected).toBe('engine-3');
  });

  test('注销引擎', () => {
    loadBalancer.registerEngine('engine-4', 100);
    loadBalancer.registerEngine('engine-5', 100);
    expect(loadBalancer.getWeightInfo()).toHaveLength(2);
    
    loadBalancer.deregisterEngine('engine-4');
    expect(loadBalancer.getWeightInfo()).toHaveLength(1);
  });

  test('加权轮询', () => {
    loadBalancer.registerEngine('low', 100);
    loadBalancer.registerEngine('high', 300);
    
    const selections = { low: 0, high: 0 };
    const iterations = 100;
    
    for (let i = 0; i < iterations; i++) {
      const selected = loadBalancer.selectEngine();
      if (selected) {
        selections[selected]++;
      }
    }
    
    expect(selections.high).toBeGreaterThan(selections.low);
  });

  test('更新权重功能', () => {
    loadBalancer.registerEngine('engine-test', 100);
    
    const snapshots = [{
      engineId: 'engine-test',
      avgResponseMs: 50,
      successRate: 0.95,
      requestsInFlight: 1,
      activeRequests: 2,
    }];
    
    loadBalancer.updateWeights(snapshots);
    
    const info = loadBalancer.getWeightInfo();
    // 预期: 100 + (0.95 * 40) - (50/400) - 2 = 100 + 38 - 0.125 - 2 = 135.875
    expect(info[0].effectiveWeight).toBeCloseTo(135.875, 1);
  });

  test('边界条件 - 权重为0', () => {
    loadBalancer.registerEngine('zero', 0);
    loadBalancer.registerEngine('normal', 100);
    
    // 多次选择，确保零权重引擎不被选中
    for (let i = 0; i < 10; i++) {
      expect(loadBalancer.selectEngine()).toBe('normal');
    }
  });

  test('边界条件 - 负权重自动修正为1', () => {
    loadBalancer.registerEngine('negative', -50);
    const info = loadBalancer.getWeightInfo();
    expect(info[0].effectiveWeight).toBe(1);
  });

  test('综合测试 - 完整工作流', () => {
    // 1. 注册多个引擎
    loadBalancer.registerEngine('server-1', 100);
    loadBalancer.registerEngine('server-2', 200);
    
    // 2. 进行选择
    const selections = [];
    for (let i = 0; i < 50; i++) {
      const selected = loadBalancer.selectEngine();
      if (selected) selections.push(selected);
    }
    
    // 3. 验证权重分布
    const distribution = {
      'server-1': selections.filter(s => s === 'server-1').length,
      'server-2': selections.filter(s => s === 'server-2').length,
    };
    expect(distribution['server-2']).toBeGreaterThan(distribution['server-1']);
    
    // 4. 更新性能权重
    const snapshots = [{
      engineId: 'server-1',
      avgResponseMs: 20,
      successRate: 0.98,
      activeRequests: 1,
    }];
    loadBalancer.updateWeights(snapshots);
    
    // 5. 验证权重增加
    const info = loadBalancer.getWeightInfo();
    expect(info[0].effectiveWeight).toBeGreaterThan(100);
  });
});