import { loadBalancer } from '../services/load-balancer';

describe('LoadBalancer', () => {
  beforeEach(() => {
    // 清空所有注册的引擎
    loadBalancer['engines'].clear();
  });

  describe('registerEngine()', () => {
    it('应成功注册新引擎（默认权重 100）', () => {
      loadBalancer.registerEngine('engine-1');
      const weightInfo = loadBalancer.getWeightInfo();
      
      expect(weightInfo).toHaveLength(1);
      expect(weightInfo[0].engineId).toBe('engine-1');
      expect(weightInfo[0].weight).toBe(100);
      expect(weightInfo[0].effectiveWeight).toBe(100);
      expect(weightInfo[0].currentWeight).toBe(0);
    });

    it('应成功注册新引擎（自定义权重）', () => {
      loadBalancer.registerEngine('engine-2', 200);
      const weightInfo = loadBalancer.getWeightInfo();
      
      expect(weightInfo).toHaveLength(1);
      expect(weightInfo[0].engineId).toBe('engine-2');
      expect(weightInfo[0].weight).toBe(200);
      expect(weightInfo[0].effectiveWeight).toBe(200);
    });

    it('重复注册同一个引擎应更新已有配置', () => {
      loadBalancer.registerEngine('engine-3', 100);
      loadBalancer.registerEngine('engine-3', 150); // 重复注册更新权重
      
      const weightInfo = loadBalancer.getWeightInfo();
      expect(weightInfo).toHaveLength(1);
      expect(weightInfo[0].weight).toBe(150);
      expect(weightInfo[0].effectiveWeight).toBe(150);
    });
  });

  describe('deregisterEngine()', () => {
    it('应成功注销已注册的引擎', () => {
      loadBalancer.registerEngine('engine-4', 100);
      loadBalancer.registerEngine('engine-5', 200);
      
      expect(loadBalancer.getWeightInfo()).toHaveLength(2);
      
      loadBalancer.deregisterEngine('engine-4');
      
      const weightInfo = loadBalancer.getWeightInfo();
      expect(weightInfo).toHaveLength(1);
      expect(weightInfo[0].engineId).toBe('engine-5');
    });

    it('注销不存在的引擎应无错误', () => {
      expect(() => {
        loadBalancer.deregisterEngine('non-existent');
      }).not.toThrow();
    });

    it('注销后引擎应无法再被选中', () => {
      loadBalancer.registerEngine('temp-engine', 100);
      loadBalancer.registerEngine('permanent-engine', 100);
      
      // 注销一个引擎
      loadBalancer.deregisterEngine('temp-engine');
      
      // 进行多次选择，确保已注销的引擎不会被选中
      for (let i = 0; i < 10; i++) {
        const selected = loadBalancer.selectEngine();
        expect(selected).toBe('permanent-engine');
      }
    });

    it('注销引擎后权重信息应更新', () => {
      loadBalancer.registerEngine('engine-a', 100);
      loadBalancer.registerEngine('engine-b', 200);
      loadBalancer.registerEngine('engine-c', 150);
      
      // 记录注销前的信息
      const beforeInfo = loadBalancer.getWeightInfo();
      expect(beforeInfo).toHaveLength(3);
      
      // 注销引擎
      loadBalancer.deregisterEngine('engine-b');
      
      // 验证信息已更新
      const afterInfo = loadBalancer.getWeightInfo();
      expect(afterInfo).toHaveLength(2);
      expect(afterInfo.map(info => info.engineId)).not.toContain('engine-b');
    });

    it('注销最后一个引擎后应返回空数组', () => {
      loadBalancer.registerEngine('last-engine', 100);
      
      expect(loadBalancer.getWeightInfo()).toHaveLength(1);
      
      loadBalancer.deregisterEngine('last-engine');
      
      const weightInfo = loadBalancer.getWeightInfo();
      expect(weightInfo).toEqual([]);
      
      // 验证选择引擎也返回 null
      expect(loadBalancer.selectEngine()).toBeNull();
    });

    it('连续注销多个引擎应正常工作', () => {
      loadBalancer.registerEngine('engine-1', 100);
      loadBalancer.registerEngine('engine-2', 150);
      loadBalancer.registerEngine('engine-3', 200);
      loadBalancer.registerEngine('engine-4', 50);
      
      expect(loadBalancer.getWeightInfo()).toHaveLength(4);
      
      // 连续注销多个引擎
      loadBalancer.deregisterEngine('engine-1');
      loadBalancer.deregisterEngine('engine-3');
      
      const weightInfo = loadBalancer.getWeightInfo();
      expect(weightInfo).toHaveLength(2);
      expect(weightInfo.map(info => info.engineId)).toEqual(['engine-2', 'engine-4']);
    });

    it('注销引擎后应清除相关的currentWeight状态', () => {
      loadBalancer.registerEngine('state-engine', 100);
      
      // 执行选择操作以设置 currentWeight
      loadBalancer.selectEngine();
      
      // 验证有 currentWeight 状态
      const beforeInfo = loadBalancer.getWeightInfo();
      expect(beforeInfo[0].currentWeight).not.toBe(0);
      
      // 注销引擎
      loadBalancer.deregisterEngine('state-engine');
      
      // 验证引擎已不存在
      const afterInfo = loadBalancer.getWeightInfo();
      expect(afterInfo).toEqual([]);
    });
  });

  describe('selectEngine()', () => {
    it('无注册引擎时应返回 null', () => {
      expect(loadBalancer.selectEngine()).toBeNull();
    });

    it('单引擎选择时应返回该引擎', () => {
      loadBalancer.registerEngine('engine-6', 100);
      
      const selected = loadBalancer.selectEngine();
      expect(selected).toBe('engine-6');
    });

    it('多引擎加权轮询应按权重分布', () => {
      loadBalancer.registerEngine('engine-low', 100);
      loadBalancer.registerEngine('engine-high', 300);
      
      // 进行多次选择，统计分布
      const selections: Record<string, number> = {
        'engine-low': 0,
        'engine-high': 0,
      };
      
      const iterations = 1000;
      for (let i = 0; i < iterations; i++) {
        const selected = loadBalancer.selectEngine();
        if (selected) {
          selections[selected]++;
        }
      }
      
      // 高权重引擎应该被选择更多次
      expect(selections['engine-high']).toBeGreaterThan(selections['engine-low']);
      
      // 分布比例应该接近权重比例 (3:1)
      const highRatio = selections['engine-high'] / iterations;
      const lowRatio = selections['engine-low'] / iterations;
      
      expect(highRatio).toBeGreaterThan(0.6); // 高权重引擎应占 >60%
      expect(lowRatio).toBeLessThan(0.4);  // 低权重引擎应占 <40%
    });

    it('平滑加权轮询应正确更新 currentWeight', () => {
      loadBalancer.registerEngine('engine-a', 100);
      loadBalancer.registerEngine('engine-b', 100);
      
      const firstSelection = loadBalancer.selectEngine();
      expect(firstSelection).toBeEither('engine-a', 'engine-b');
      
      const weightInfo = loadBalancer.getWeightInfo();
      const firstEntry = weightInfo.find(e => e.engineId === firstSelection);
      const otherEntry = weightInfo.find(e => e.engineId !== firstSelection);
      
      expect(firstEntry!.currentWeight).toBe(-200); // selected: weight - totalEffective
      expect(otherEntry!.currentWeight).toBe(100);   // not selected: currentWeight remains
    });

    it('权重为 0 的引擎不应被选中', () => {
      loadBalancer.registerEngine('engine-zero', 0);
      loadBalancer.registerEngine('engine-normal', 100);
      
      // 即使多次选择，零权重引擎也不应该被选中
      for (let i = 0; i < 10; i++) {
        const selected = loadBalancer.selectEngine();
        expect(selected).toBe('engine-normal');
      }
    });

    it('权重为负数应被自动修正为 1', () => {
      loadBalancer.registerEngine('engine-negative', -50);
      loadBalancer.registerEngine('engine-normal', 100);
      
      const selected = loadBalancer.selectEngine();
      expect(selected).toBeEither('engine-negative', 'engine-normal');
      
      // 权重应该被修正为最小值 1
      const weightInfo = loadBalancer.getWeightInfo();
      const negativeEntry = weightInfo.find(e => e.engineId === 'engine-negative');
      expect(negativeEntry!.effectiveWeight).toBe(1);
    });

    it('应正确处理单引擎的权重更新和选择循环', () => {
      loadBalancer.registerEngine('single-engine', 100);
      
      // 初始选择
      const firstSelection = loadBalancer.selectEngine();
      expect(firstSelection).toBe('single-engine');
      
      // 更新性能快照
      const snapshots = [{
        engineId: 'single-engine',
        avgResponseMs: 20,
        successRate: 0.95,
        activeRequests: 1,
      }];
      
      loadBalancer.updateWeights(snapshots);
      
      // 再次选择，权重应增加
      const secondSelection = loadBalancer.selectEngine();
      expect(secondSelection).toBe('single-engine');
      
      const weightInfo = loadBalancer.getWeightInfo();
      expect(weightInfo[0].effectiveWeight).toBeGreaterThan(100);
    });
  });

  describe('updateWeights()', () => {
    it('应成功更新引擎权重', () => {
      loadBalancer.registerEngine('engine-7', 100);
      
      const snapshots = [
        {
          engineId: 'engine-7',
          avgResponseMs: 50,
          successRate: 0.95,
          activeRequests: 2,
        },
      ];
      
      loadBalancer.updateWeights(snapshots);
      
      const weightInfo = loadBalancer.getWeightInfo();
      expect(weightInfo[0].effectiveWeight).toBeGreaterThan(100);
      
      // 计算预期: 100 + (0.95 * 20) - (50/100) - (2 * 2) = 100 + 19 - 0.5 - 4 = 114.5
      expect(weightInfo[0].effectiveWeight).toBeCloseTo(114.5);
    });

    it('应处理不存在的引擎（无错误）', () => {
      loadBalancer.registerEngine('engine-8', 100);
      
      const snapshots = [
        {
          engineId: 'non-existent-engine',
          avgResponseMs: 50,
          successRate: 0.95,
          activeRequests: 2,
        },
      ];
      
      expect(() => {
        loadBalancer.updateWeights(snapshots);
      }).not.toThrow();
      
      // 现有引擎权重不应改变
      const weightInfo = loadBalancer.getWeightInfo();
      expect(weightInfo[0].effectiveWeight).toBe(100);
    });

    it('应正确处理边界条件', () => {
      loadBalancer.registerEngine('engine-9', 100);
      
      const snapshots = [
        {
          engineId: 'engine-9',
          avgResponseMs: 5000,  // 很高的延迟
          successRate: 0.1,    // 很低的成功率
          activeRequests: 50,  // 很高的负载
        },
      ];
      
      loadBalancer.updateWeights(snapshots);
      
      // 成功率低、延迟高、负载高 → 权重应大幅减少
      // 计算预期: 100 + (0.1 * 20) - (5000/100) - (50 * 2) = 100 + 2 - 50 - 100 = -48
      // 但最小值是 1
      const weightInfo = loadBalancer.getWeightInfo();
      expect(weightInfo[0].effectiveWeight).toBe(1);
    });

    it('应正确计算各种性能指标的影响', () => {
      loadBalancer.registerEngine('engine-10', 100);
      
      // 高性能情况（高成功率、低延迟、低负载）
      const highPerfSnapshots = [
        {
          engineId: 'engine-10',
          avgResponseMs: 10,
          successRate: 0.99,
          activeRequests: 1,
        },
      ];
      
      loadBalancer.updateWeights(highPerfSnapshots);
      
      const weightInfo = loadBalancer.getWeightInfo();
      // 计算预期: 100 + (0.99 * 20) - (10/100) - (1 * 2) = 100 + 19.8 - 0.1 - 2 = 117.7
      expect(weightInfo[0].effectiveWeight).toBeCloseTo(117.7);
    });

    it('多引擎更新应独立处理', () => {
      loadBalancer.registerEngine('engine-a', 100);
      loadBalancer.registerEngine('engine-b', 100);
      loadBalancer.registerEngine('engine-c', 100);
      
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
      
      loadBalancer.updateWeights(snapshots);
      
      const weightInfo = loadBalancer.getWeightInfo();
      
      // engine-a 应该获得最高权重
      const engineA = weightInfo.find(e => e.engineId === 'engine-a');
      const engineB = weightInfo.find(e => e.engineId === 'engine-b');
      const engineC = weightInfo.find(e => e.engineId === 'engine-c');
      
      expect(engineA!.effectiveWeight).toBeGreaterThan(engineB!.effectiveWeight);
      expect(engineB!.effectiveWeight).toBeLessThan(engineC!.effectiveWeight);
    });
  });

  describe('getWeightInfo()', () => {
    it('应返回所有引擎的权重信息', () => {
      loadBalancer.registerEngine('engine-x', 100);
      loadBalancer.registerEngine('engine-y', 200);
      loadBalancer.registerEngine('engine-z', 150);
      
      const weightInfo = loadBalancer.getWeightInfo();
      
      expect(weightInfo).toHaveLength(3);
      expect(weightInfo.every(info => 
        'engineId' in info && 
        'weight' in info && 
        'effectiveWeight' in info && 
        'currentWeight' in info
      )).toBe(true);
    });

    it('无引擎时应返回空数组', () => {
      const weightInfo = loadBalancer.getWeightInfo();
      expect(weightInfo).toEqual([]);
    });

    it('应正确返回引擎权重的详细信息', () => {
      loadBalancer.registerEngine('test-engine', 150);
      
      // 执行一些选择操作来改变 currentWeight
      loadBalancer.selectEngine();
      
      const weightInfo = loadBalancer.getWeightInfo();
      
      expect(weightInfo).toHaveLength(1);
      const info = weightInfo[0];
      
      expect(info.engineId).toBe('test-engine');
      expect(info.weight).toBe(150);
      expect(info.effectiveWeight).toBe(150);
      expect(typeof info.currentWeight).toBe('number');
    });

    it('应正确反映权重更新后的状态', () => {
      loadBalancer.registerEngine('dynamic-engine', 100);
      
      // 更新权重
      const snapshots = [{
        engineId: 'dynamic-engine',
        avgResponseMs: 50,
        successRate: 0.9,
        activeRequests: 2,
      }];
      
      loadBalancer.updateWeights(snapshots);
      
      const weightInfo = loadBalancer.getWeightInfo();
      expect(weightInfo).toHaveLength(1);
      expect(weightInfo[0].effectiveWeight).toBeGreaterThan(100);
    });

    it('应返回可序列化的权重信息', () => {
      loadBalancer.registerEngine('serializable-engine', 100);
      
      const weightInfo = loadBalancer.getWeightInfo();
      
      // 确保返回的数据可以 JSON 序列化
      const jsonStr = JSON.stringify(weightInfo);
      expect(jsonStr).toBeDefined();
      
      const parsed = JSON.parse(jsonStr);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].engineId).toBe('serializable-engine');
    });
  });

  describe('综合场景测试', () => {
    it('完整的负载均衡工作流', () => {
      // 1. 注册多个引擎
      loadBalancer.registerEngine('web-server-1', 100);
      loadBalancer.registerEngine('web-server-2', 150);
      loadBalancer.registerEngine('web-server-3', 50);
      
      // 2. 进行选择
      const selections: string[] = [];
      for (let i = 0; i < 100; i++) {
        const selected = loadBalancer.selectEngine();
        if (selected) {
          selections.push(selected);
        }
      }
      
      // 3. 验证分布
      const distribution = {
        'web-server-1': selections.filter(s => s === 'web-server-1').length,
        'web-server-2': selections.filter(s => s === 'web-server-2').length,
        'web-server-3': selections.filter(s => s === 'web-server-3').length,
      };
      
      // 高权重引擎应该被选择更多
      expect(distribution['web-server-2']).toBeGreaterThan(distribution['web-server-1']);
      expect(distribution['web-server-1']).toBeGreaterThan(distribution['web-server-3']);
      
      // 4. 模拟性能更新
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
      
      loadBalancer.updateWeights(performanceSnapshots);
      
      // 5. 验证权重更新后的再次选择
      const newSelections: string[] = [];
      for (let i = 0; i < 100; i++) {
        const selected = loadBalancer.selectEngine();
        if (selected) {
          newSelections.push(selected);
        }
      }
      
      // 性能最好的引擎应该获得更多选择
      const newDistribution = {
        'web-server-1': newSelections.filter(s => s === 'web-server-1').length,
        'web-server-2': newSelections.filter(s => s === 'web-server-2').length,
        'web-server-3': newSelections.filter(s => s === 'web-server-3').length,
      };
      
      expect(newDistribution['web-server-1']).toBeGreaterThan(newDistribution['web-server-2']);
    });

    it('动态扩缩容场景', () => {
      // 初始状态：2个引擎
      loadBalancer.registerEngine('server-a', 100);
      loadBalancer.registerEngine('server-b', 100);
      
      // 进行一些选择
      for (let i = 0; i < 50; i++) {
        loadBalancer.selectEngine();
      }
      
      // 添加新引擎
      loadBalancer.registerEngine('server-c', 100);
      
      expect(loadBalancer.getWeightInfo()).toHaveLength(3);
      
      // 新引擎应该能被选中
      const selected = loadBalancer.selectEngine();
      expect(['server-a', 'server-b', 'server-c']).toContain(selected);
      
      // 移除引擎
      loadBalancer.deregisterEngine('server-a');
      
      expect(loadBalancer.getWeightInfo()).toHaveLength(2);
      
      // 剩余引擎正常工作
      for (let i = 0; i < 10; i++) {
        const selected = loadBalancer.selectEngine();
        expect(['server-b', 'server-c']).toContain(selected);
      }
    });

    it('极端负载情况下的处理', () => {
      loadBalancer.registerEngine('engine-stressed', 100);
      
      // 模拟极高负载情况
      const extremeSnapshots = [
        {
          engineId: 'engine-stressed',
          avgResponseMs: 10000,
          successRate: 0.1,
          activeRequests: 100,
        },
      ];
      
      loadBalancer.updateWeights(extremeSnapshots);
      
      const weightInfo = loadBalancer.getWeightInfo();
      // 应该被限制到最小权重 1
      expect(weightInfo[0].effectiveWeight).toBe(1);
      
      // 在这种情况下，选择应该仍然可用，但权重很低
      const selected = loadBalancer.selectEngine();
      expect(selected).toBe('engine-stressed');
    });
  });
});

// 扩展 Jest 的匹配器
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeEither(value1: any, value2: any): R;
    }
  }
}

expect.extend({
  toBeEither(received, value1, value2) {
    const pass = received === value1 || received === value2;
    if (pass) {
      return {
        message: () => `expected ${received} not to be either ${value1} or ${value2}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be either ${value1} or ${value2}`,
        pass: false,
      };
    }
  },
});