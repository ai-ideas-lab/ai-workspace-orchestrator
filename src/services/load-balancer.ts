/**
 * LoadBalancer - 平滑加权轮询负载均衡器
 *
 * 每个注册引擎持有 weight / effectiveWeight / currentWeight 三个数值，
 * 选引擎时遍历所有引擎将 effectiveWeight 累加到 currentWeight，
 * 选 currentWeight 最大的，然后将其减去总 effectiveWeight。
 * 这样权重越高的引擎被选中的频率越高，同时分布均匀。
 */

export interface EnginePerformanceSnapshot {
  engineId: string;
  avgResponseMs: number;
  successRate: number;
  activeRequests: number;
}

interface EngineEntry {
  engineId: string;
  weight: number;
  effectiveWeight: number;
  currentWeight: number;
}

class LoadBalancerSingleton {
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
    } else {
      // 更新已存在引擎的权重
      const entry = this.engines.get(engineId)!;
      entry.weight = weight;
      entry.effectiveWeight = weight;
    }
  }

  /** 注销引擎 */
  deregisterEngine(engineId: string): void {
    this.engines.delete(engineId);
  }

  /** 平滑加权轮询选择引擎 */
  selectEngine(): string | null {
    if (this.engines.size === 0) return null;

    let best: EngineEntry | null = null;
    let totalEffective = 0;

    for (const entry of this.engines.values()) {
      entry.currentWeight += entry.effectiveWeight;
      totalEffective += entry.effectiveWeight;

      if (!best || entry.currentWeight > best.currentWeight) {
        best = entry;
      }
    }

    if (best) {
      best.currentWeight -= totalEffective;
      return best.engineId;
    }

    return null;
  }

  /** 根据性能快照动态调整权重 */
  updateWeights(snapshots: EnginePerformanceSnapshot[]): void {
    for (const snap of snapshots) {
      const entry = this.engines.get(snap.engineId);
      if (!entry) continue;

      // 成功率高、响应快 → 增加权重；反之减少
      const successBonus = snap.successRate * 20; // 0~20
      const latencyPenalty = Math.min(snap.avgResponseMs / 100, 30); // 0~30
      const loadPenalty = Math.min(snap.activeRequests * 2, 20); // 0~20

      entry.effectiveWeight = Math.max(
        1,
        entry.weight + successBonus - latencyPenalty - loadPenalty,
      );
    }
  }

  /** 获取所有引擎权重信息（调试用） */
  getWeightInfo(): Array<{ engineId: string; weight: number; effectiveWeight: number; currentWeight: number }> {
    return Array.from(this.engines.values()).map((e) => ({
      engineId: e.engineId,
      weight: e.weight,
      effectiveWeight: e.effectiveWeight,
      currentWeight: e.currentWeight,
    }));
  }
}

// 全局单例
export const loadBalancer = new LoadBalancerSingleton();
