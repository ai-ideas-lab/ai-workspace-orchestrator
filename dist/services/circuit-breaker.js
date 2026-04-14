"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircuitBreaker = exports.CircuitState = void 0;
var CircuitState;
(function (CircuitState) {
    CircuitState["CLOSED"] = "CLOSED";
    CircuitState["OPEN"] = "OPEN";
    CircuitState["HALF_OPEN"] = "HALF_OPEN";
})(CircuitState || (exports.CircuitState = CircuitState = {}));
class CircuitBreaker {
    constructor(config = {}) {
        this.engines = new Map();
        this.failureThreshold = config.failureThreshold ?? 5;
        this.resetTimeoutMs = config.resetTimeoutMs ?? 30000;
        this.halfOpenMaxAttempts = config.halfOpenMaxAttempts ?? 1;
    }
    getOrCreate(engineId) {
        if (!this.engines.has(engineId)) {
            this.engines.set(engineId, {
                state: CircuitState.CLOSED,
                failureCount: 0,
                openedAt: null,
                successCount: 0,
                halfOpenAttempts: 0,
            });
        }
        return this.engines.get(engineId);
    }
    allowRequest(engineId) {
        const circuit = this.getOrCreate(engineId);
        if (circuit.state === CircuitState.CLOSED) {
            return true;
        }
        if (circuit.state === CircuitState.HALF_OPEN) {
            circuit.halfOpenAttempts++;
            return circuit.halfOpenAttempts <= this.halfOpenMaxAttempts;
        }
        if (circuit.openedAt && Date.now() - circuit.openedAt >= this.resetTimeoutMs) {
            circuit.state = CircuitState.HALF_OPEN;
            circuit.failureCount = 0;
            circuit.halfOpenAttempts = 0;
            return true;
        }
        return false;
    }
    getState(engineId) {
        return this.getOrCreate(engineId).state;
    }
    recordSuccess(engineId) {
        const circuit = this.getOrCreate(engineId);
        circuit.successCount++;
        circuit.failureCount = 0;
        circuit.state = CircuitState.CLOSED;
        circuit.openedAt = null;
        circuit.halfOpenAttempts = 0;
    }
    recordFailure(engineId) {
        const circuit = this.getOrCreate(engineId);
        if (circuit.state === CircuitState.HALF_OPEN) {
            circuit.state = CircuitState.OPEN;
            circuit.openedAt = Date.now();
            circuit.failureCount = 1;
            circuit.halfOpenAttempts = 0;
            return;
        }
        circuit.failureCount++;
        circuit.successCount = 0;
        if (circuit.failureCount >= this.failureThreshold) {
            circuit.state = CircuitState.OPEN;
            circuit.openedAt = Date.now();
        }
    }
    reset(engineId) {
        this.engines.delete(engineId);
    }
    resetAll() {
        this.engines.clear();
    }
    getAllStates() {
        const result = {};
        for (const [id, circuit] of this.engines) {
            result[id] = {
                state: circuit.state,
                failures: circuit.failureCount,
                successes: circuit.successCount,
            };
        }
        return result;
    }
}
exports.CircuitBreaker = CircuitBreaker;
//# sourceMappingURL=circuit-breaker.js.map