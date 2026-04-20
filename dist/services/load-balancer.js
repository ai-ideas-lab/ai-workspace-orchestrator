"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadBalancer = void 0;
class LoadBalancer {
    constructor() {
        this.engines = new Map();
    }
    registerEngine(engineId, weight = 100) {
        const effectiveWeight = Math.max(1, weight);
        if (!this.engines.has(engineId)) {
            this.engines.set(engineId, {
                engineId,
                weight: effectiveWeight,
                effectiveWeight: effectiveWeight,
                currentWeight: 0,
            });
        }
        else {
            const entry = this.engines.get(engineId);
            entry.weight = effectiveWeight;
            entry.effectiveWeight = effectiveWeight;
        }
    }
    deregisterEngine(engineId) {
        return this.engines.delete(engineId);
    }
    selectEngine() {
        if (this.engines.size === 0)
            return null;
        const entries = Array.from(this.engines.values());
        const totalWeight = entries.reduce((sum, e) => sum + e.effectiveWeight, 0);
        if (totalWeight === 0)
            return null;
        let best = null;
        for (const entry of entries) {
            entry.currentWeight += entry.effectiveWeight;
            if (!best || entry.currentWeight > best.currentWeight) {
                best = entry;
            }
        }
        best.currentWeight -= totalWeight;
        return best.engineId;
    }
    updateWeights(snapshots) {
        for (const snap of snapshots) {
            const entry = this.engines.get(snap.engineId);
            if (entry) {
                const baseWeight = entry.weight;
                const successBonus = snap.successRate * 40;
                const responsePenalty = snap.avgResponseMs / 400;
                const loadPenalty = snap.activeRequests;
                const newWeight = baseWeight + successBonus - responsePenalty - loadPenalty;
                entry.effectiveWeight = Math.max(1, newWeight);
            }
        }
    }
    getWeightInfo() {
        return Array.from(this.engines.values()).map(e => ({
            engineId: e.engineId,
            weight: e.weight,
            effectiveWeight: e.effectiveWeight,
            currentWeight: e.currentWeight,
        }));
    }
}
exports.loadBalancer = new LoadBalancer();
//# sourceMappingURL=load-balancer.js.map