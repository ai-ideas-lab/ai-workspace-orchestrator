import { loadBalancer } from '../services/load-balancer';

describe('LoadBalancer - Simple Tests', () => {
  beforeEach(() => {
    // Clear all registered engines
    loadBalancer['engines'].clear();
  });

  test('should register engine with default weight', () => {
    loadBalancer.registerEngine('test-engine');
    const weightInfo = loadBalancer.getWeightInfo();
    
    expect(weightInfo).toHaveLength(1);
    expect(weightInfo[0]?.engineId).toBe('test-engine');
    expect(weightInfo[0]?.weight).toBe(100);
    expect(weightInfo[0]?.effectiveWeight).toBe(100);
    expect(weightInfo[0]?.currentWeight).toBe(0);
  });

  test('should register engine with custom weight', () => {
    loadBalancer.registerEngine('test-engine-2', 200);
    const weightInfo = loadBalancer.getWeightInfo();
    
    expect(weightInfo).toHaveLength(1);
    expect(weightInfo[0]?.engineId).toBe('test-engine-2');
    expect(weightInfo[0]?.weight).toBe(200);
    expect(weightInfo[0]?.effectiveWeight).toBe(200);
  });

  test('should select null when no engines registered', () => {
    expect(loadBalancer.selectEngine()).toBeNull();
  });

  test('should select single engine', () => {
    loadBalancer.registerEngine('single-engine', 100);
    const selected = loadBalancer.selectEngine();
    
    expect(selected).toBe('single-engine');
  });

  test('should handle negative weights', () => {
    loadBalancer.registerEngine('negative-engine', -50);
    const weightInfo = loadBalancer.getWeightInfo();
    
    expect(weightInfo[0]?.effectiveWeight).toBe(1); // Minimum weight
  });

  test('should update weights correctly', () => {
    loadBalancer.registerEngine('engine', 100);
    
    const snapshots = [
      {
        engineId: 'engine',
        avgResponseMs: 50,
        successRate: 0.95,
        requestsInFlight: 1,
        activeRequests: 2,
      }
    ];
    
    loadBalancer.updateWeights(snapshots);
    const weightInfo = loadBalancer.getWeightInfo();
    
    // Expected: 100 + (0.95 * 40) - (50/400) - 2 = 100 + 38 - 0.125 - 2 = 135.875
    expect(weightInfo[0]?.effectiveWeight).toBeCloseTo(135.875, 1);
  });

  test('should get weight info', () => {
    loadBalancer.registerEngine('engine-1', 100);
    loadBalancer.registerEngine('engine-2', 200);
    
    const weightInfo = loadBalancer.getWeightInfo();
    
    expect(weightInfo).toHaveLength(2);
    expect(weightInfo.every(info => 
      'engineId' in info && 
      'weight' in info && 
      'effectiveWeight' in info && 
      'currentWeight' in info
    )).toBe(true);
  });
});