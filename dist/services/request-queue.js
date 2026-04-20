"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestQueue = void 0;
const load_balancer_js_1 = require("./load-balancer.js");
const circuit_breaker_js_1 = require("./circuit-breaker.js");
const PRIORITY_WEIGHT = {
    CRITICAL: 4,
    HIGH: 3,
    NORMAL: 2,
    LOW: 1,
};
class RequestQueue {
    constructor(circuitBreaker) {
        this.queue = [];
        this.autoIncrement = 0;
        this.circuitBreaker = circuitBreaker ?? new circuit_breaker_js_1.CircuitBreaker();
    }
    enqueue(task, priority = 'NORMAL') {
        const id = `req_${++this.autoIncrement}_${Date.now()}`;
        const request = {
            id,
            taskType: task.taskType,
            payload: task.payload,
            priority,
            enqueuedAt: new Date(),
        };
        const weight = PRIORITY_WEIGHT[priority];
        let inserted = false;
        for (let i = 0; i < this.queue.length; i++) {
            if (weight > PRIORITY_WEIGHT[this.queue[i].priority]) {
                this.queue.splice(i, 0, request);
                inserted = true;
                break;
            }
        }
        if (!inserted) {
            this.queue.push(request);
        }
        return id;
    }
    processNext() {
        if (this.queue.length === 0)
            return null;
        const maxAttempts = 10;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const engineId = load_balancer_js_1.loadBalancer.selectEngine();
            if (!engineId)
                return null;
            if (this.circuitBreaker.allowRequest(engineId)) {
                const request = this.queue.shift();
                request.assignedEngineId = engineId;
                return {
                    request,
                    engineId,
                    circuitState: this.circuitBreaker.getState(engineId),
                    remainingCount: this.queue.length,
                };
            }
            continue;
        }
        return null;
    }
    reportSuccess(engineId) {
        this.circuitBreaker.recordSuccess(engineId);
    }
    reportFailure(engineId) {
        this.circuitBreaker.recordFailure(engineId);
    }
    updatePerformance(snapshots) {
        load_balancer_js_1.loadBalancer.updateWeights(snapshots);
    }
    registerEngine(engineId, opts) {
        load_balancer_js_1.loadBalancer.registerEngine(engineId, opts?.weight);
    }
    deregisterEngine(engineId) {
        load_balancer_js_1.loadBalancer.deregisterEngine(engineId);
        this.circuitBreaker.reset(engineId);
    }
    get length() {
        return this.queue.length;
    }
    peek() {
        return this.queue[0];
    }
    getStats() {
        const counts = { CRITICAL: 0, HIGH: 0, NORMAL: 0, LOW: 0, total: this.queue.length };
        for (const req of this.queue) {
            counts[req.priority]++;
        }
        return counts;
    }
}
exports.RequestQueue = RequestQueue;
//# sourceMappingURL=request-queue.js.map