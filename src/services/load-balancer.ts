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

  /** 注册引擎（默认权重 100） */
  registerEngine(engineId: string, weight: number = 100): void {
    if (!this.engines.has(engineId)) {
      this.engines.set(engineId, {
        engineId,
        weight,
        effectiveWeight: weight,
        currentWeight: 0,
      });
    }
  }

  /** 注销引擎 */
  deregisterEngine(engineId: string): void {
    this.engines.delete(engineId);
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

  /** 根据性能快照调整权重 */
  updateWeights(snapshots: EnginePerformanceSnapshot[]): void {
    for (const snap of snapshots) {
      const entry = this.engines.get(snap.engineId);
      if (entry) {
        // 简单策略：成功率越高、响应越快 → 权重越高
        const baseWeight = 100;
        const perfScore = snap.successRate * (1000 / Math.max(snap.avgResponseMs, 1));
        entry.effectiveWeight = Math.max(1, Math.round(baseWeight * perfScore));
      }
    }
  }

  /** 返回所有引擎的权重信息（供外部清理用） */
  getWeightInfo(): Array<{ engineId: string; effectiveWeight: number; currentWeight: number }> {
    return Array.from(this.engines.values()).map(e => ({
      engineId: e.engineId,
      effectiveWeight: e.effectiveWeight,
      currentWeight: e.currentWeight,
    }));
  }
}

/** 全局单例 */
export const loadBalancer = new LoadBalancer();