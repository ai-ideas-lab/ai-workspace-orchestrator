/**
 * LoadBalancer - 平滑加权轮询负载均衡器
 *
 * 管理一组引擎的权重，每次 selectEngine 返回一个引擎。
 * 使用平滑加权轮询（Smooth Weighted Round-Robin）算法。
 */

export interface EnginePerformanceSnapshot {
  engineId: string;
  avgResponseMs: number;
  successRate: number;
  requestsInFlight: number;
  activeRequests: number;
}

interface EngineEntry {
  engineId: string;
  weight: number;
  effectiveWeight: number;
  currentWeight: number;
}

class LoadBalancer {
  private engines = new Map<string, EngineEntry>();

  /**
   * 注册计算引擎到负载均衡器
   * 
   * 将一个新的计算引擎添加到负载均衡器中，指定其权重。
   * 权重决定了该引擎在负载分配中的优先级和分配比例。
   * 如果引擎已存在，将更新其权重配置。
   * 
   * @param engineId 唯一的引擎标识符
   * @param weight 引擎的权重值，用于负载分配计算。默认为100
   * @throws 如果权重为负数，会被自动调整为1（最小权重）
   * @example
   * // 注册一个默认权重的引擎
   * loadBalancer.registerEngine('engine-1');
   *
   * // 注册一个高权重的引擎（接收更多请求）
   * loadBalancer.registerEngine('engine-2', 200);
   *
   * // 更新已有引擎的权重
   * loadBalancer.registerEngine('engine-1', 150);
   */
  registerEngine(engineId: string, weight: number = 100): void {
    // 确保权重不为负数，最小为1
    const effectiveWeight = Math.max(1, weight);
    
    if (!this.engines.has(engineId)) {
      this.engines.set(engineId, {
        engineId,
        weight: effectiveWeight,
        effectiveWeight: effectiveWeight,
        currentWeight: 0,
      });
    } else {
      // 更新已存在引擎的权重
      const entry = this.engines.get(engineId)!;
      entry.weight = effectiveWeight;
      entry.effectiveWeight = effectiveWeight;
    }
  }

  /**
   * 从负载均衡器中注销引擎
   * 
   * 移除指定的计算引擎，该引擎将不再参与负载分配。
   * 如果引擎不存在，此方法会静默执行，不会抛出异常。
   * 
   * @param engineId 要注销的引擎唯一标识符
   * @returns 成功返回true，引擎不存在时返回false
   * @example
   * // 注销引擎
   * const success = loadBalancer.deregisterEngine('engine-1');
   * if (success) {
   *   console.log('引擎已成功注销');
   * } else {
   *   console.log('引擎不存在');
   * }
   */
  deregisterEngine(engineId: string): boolean {
    return this.engines.delete(engineId);
  }

  /**
   * 使用平滑加权轮询算法选择最适合的引擎
   *
   * 基于引擎的权重和当前状态，通过平滑加权轮询算法选择最优的引擎。
   * 算法考虑了每个引擎的有效权重，并通过动态调整 currentWeight
   * 确保负载在所有引擎之间均匀分布，同时尊重权重配置。
   *
   * @returns 选中的引擎ID字符串，如果没有可用的引擎则返回 null
   * @throws 不抛出异常，方法内部处理所有错误情况
   * @example
   * // 注册引擎并选择
   * loadBalancer.registerEngine('engine-1', 100);
   * loadBalancer.registerEngine('engine-2', 200);
   *
   * // 选择引擎
   * const selectedEngine = loadBalancer.selectEngine();
   * console.log(selectedEngine); // 可能返回 'engine-1' 或 'engine-2'
   *
   * // 连续选择多次以观察负载分布
   * for (let i = 0; i < 10; i++) {
   *   const engine = loadBalancer.selectEngine();
   *   console.log(`第${i + 1}次选择: ${engine}`);
   * }
   */
  selectEngine(): string | null {
    if (this.engines.size === 0) return null;

    const entries = Array.from(this.engines.values());
    const totalWeight = entries.reduce((sum, e) => sum + e.effectiveWeight, 0);
    if (totalWeight === 0) return null;

    let best: EngineEntry | null = null;

    for (const entry of entries) {
      entry.currentWeight += entry.effectiveWeight;
      if (!best || entry.currentWeight > best.currentWeight) {
        best = entry;
      }
    }

    best!.currentWeight -= totalWeight;
    return best!.engineId;
  }

  /**
   * 根据性能快照动态调整引擎权重
   * 
   * 基于引擎的实时性能数据，动态调整各个引擎的有效权重。
   * 权重调整考虑多个因素：成功率奖励、响应时间惩罚、当前负载等。
   * 这是一个自适应的负载优化机制，确保高性能引擎获得更多请求，
   * 同时惩罚表现不佳的引擎。
   * 
   * @param snapshots 引擎性能快照数组，包含每个引擎的实时状态
   * @example
   * // 定义引擎性能快照
   * const snapshots = [
   *   {
   *     engineId: 'engine-1',
   *     avgResponseMs: 150,
   *     successRate: 0.95,
   *     requestsInFlight: 5,
   *     activeRequests: 3
   *   },
   *   {
   *     engineId: 'engine-2',
   *     avgResponseMs: 200,
   *     successRate: 0.88,
   *     requestsInFlight: 8,
   *     activeRequests: 6
   *   }
   * ];
   * 
   * // 根据性能数据调整权重
   * loadBalancer.updateWeights(snapshots);
   */
  updateWeights(snapshots: EnginePerformanceSnapshot[]): void {
    for (const snap of snapshots) {
      const entry = this.engines.get(snap.engineId);
      if (entry) {
        // 计算新权重：基础权重 + 成绩奖励 - 响应时间惩罚 - 负载惩罚
        const baseWeight = entry.weight;
        const successBonus = snap.successRate * 40;  // 大幅增加成绩奖励
        const responsePenalty = snap.avgResponseMs / 400;  // 减轻响应时间惩罚
        const loadPenalty = snap.activeRequests;  // 减轻负载惩罚
        
        const newWeight = baseWeight + successBonus - responsePenalty - loadPenalty;
        entry.effectiveWeight = Math.max(1, newWeight);
      }
    }
  }

  /**
   * 获取所有注册引擎的权重和状态信息
   * 
   * 返回当前负载均衡器中所有引擎的详细权重信息。
   * 包括配置权重、有效权重和当前权重，用于监控和分析。
   * 这些信息对于调试负载分配问题和优化权重配置很有用。
   * 
   * @returns 引擎权重信息数组，每个元素包含引擎ID和各项权重数据
   * @example
   * // 获取所有引擎的权重信息
   * const weightInfo = loadBalancer.getWeightInfo();
   * 
   * console.log('引擎权重信息:', weightInfo);
   * // 输出示例:
   * // [
   * //   {
   * //     engineId: 'engine-1',
   * //     weight: 100,      // 配置的基础权重
   * //     effectiveWeight: 120,  // 调整后的有效权重
   * //     currentWeight: 45     // 当前轮询权重
   * //   },
   * //   {
   * //     engineId: 'engine-2',
   * //     weight: 200,
   * //     effectiveWeight: 180,
   * //     currentWeight: 95
   * //   }
   * // ]
   */
  getWeightInfo(): Array<{ engineId: string; weight: number; effectiveWeight: number; currentWeight: number }> {
    return Array.from(this.engines.values()).map(e => ({
      engineId: e.engineId,
      weight: e.weight,
      effectiveWeight: e.effectiveWeight,
      currentWeight: e.currentWeight,
    }));
  }
}

/** 全局单例 */
export const loadBalancer = new LoadBalancer();