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
   * 平滑加权轮询选引擎。
   * 返回选中的引擎 ID，若无引擎则返回 null。
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