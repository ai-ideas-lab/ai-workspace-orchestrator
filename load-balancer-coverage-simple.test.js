const { loadBalancer } = require('./src/services/load-balancer');

describe('LoadBalancer Coverage Test', () => {
  beforeEach(() => {
    // 清空所有注册的引擎
    loadBalancer['engines'].clear();
  });

  it('当所有引擎权重为 0 时应返回 null', () => {
    // 注册多个但权重都为 0 的引擎
    loadBalancer.registerEngine('zero-engine-1', 0);
    loadBalancer.registerEngine('zero-engine-2', 0);
    loadBalancer.registerEngine('zero-engine-3', 0);
    
    // 此时 totalWeight 应该为 0，selectEngine 应该返回 null
    const selected = loadBalancer.selectEngine();
    expect(selected).toBeNull();
  });

  it('当引擎权重被更新导致 totalWeight 为 0 时应返回 null', () => {
    // 注册有正常权重的引擎
    loadBalancer.registerEngine('normal-engine', 100);
    
    // 首先验证能正常选择
    const firstSelection = loadBalancer.selectEngine();
    expect(firstSelection).toBe('normal-engine');
    
    // 手动设置权重为 0 (模拟 updateWeights 的极端情况)
    const entry = loadBalancer['engines'].get('normal-engine');
    if (entry) {
      entry.effectiveWeight = 0;
      entry.weight = 0;
    }
    
    // 现在总权重为 0，应该返回 null
    const secondSelection = loadBalancer.selectEngine();
    expect(secondSelection).toBeNull();
  });

  it('混合权重情况 - 当某些引擎权重为 0 时', () => {
    // 注册混合权重的引擎
    loadBalancer.registerEngine('engine-zero', 0);
    loadBalancer.registerEngine('engine-normal', 100);
    loadBalancer.registerEngine('engine-high', 200);
    
    // 进行多次选择，确保权重为 0 的引擎不会被选中
    const selections = [];
    for (let i = 0; i < 50; i++) {
      const selected = loadBalancer.selectEngine();
      if (selected) {
        selections.push(selected);
      }
    }
    
    // 验证权重为 0 的引擎从未被选中
    expect(selections).not.toContain('engine-zero');
    
    // 验证其他引擎被选中
    expect(selections).toContain('engine-normal');
    expect(selections).toContain('engine-high');
    
    // 验证分布比例
    const normalCount = selections.filter(s => s === 'engine-normal').length;
    const highCount = selections.filter(s => s === 'engine-high').length;
    
    // 高权重引擎应该被选择更多
    expect(highCount).toBeGreaterThan(normalCount);
  });
});