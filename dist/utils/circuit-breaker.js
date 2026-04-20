"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.circuitBreaker = exports.CircuitBreaker = void 0;
exports.withCircuitBreaker = withCircuitBreaker;
exports.withApiCircuitBreaker = withApiCircuitBreaker;
const errors_js_1 = require("./errors.js");
const enhanced_error_logger_js_1 = require("./enhanced-error-logger.js");
class CircuitBreaker {
    constructor(options = {}) {
        this.circuits = new Map();
        this.defaultFallback = async (error) => {
            enhanced_error_logger_js_1.logger.warn('使用默认降级函数:', error.message);
            throw new errors_js_1.SystemError('服务暂时不可用，请稍后重试', 'circuit_breaker_fallback');
        };
        this.defaultStateChangeHandler = (state, key) => {
            enhanced_error_logger_js_1.logger.warn(`熔断器状态变化: ${key} -> ${state}`);
        };
        this.options = {
            timeoutMs: options.timeoutMs || 5000,
            errorThreshold: options.errorThreshold || 5,
            resetTimeoutMs: options.resetTimeoutMs || 30000,
            monitoringIntervalMs: options.monitoringIntervalMs || 10000,
            fallback: options.fallback || this.defaultFallback,
            onStateChange: options.onStateChange || this.defaultStateChangeHandler,
        };
        this.startMonitoring();
    }
    static getInstance(options) {
        if (!CircuitBreaker.instance) {
            CircuitBreaker.instance = new CircuitBreaker(options);
        }
        return CircuitBreaker.instance;
    }
    async execute(key, operation, options = {}) {
        const finalOptions = { ...this.options, ...options };
        let circuit = this.circuits.get(key);
        if (!circuit) {
            circuit = new CircuitBreakerInstance(key, finalOptions);
            this.circuits.set(key, circuit);
        }
        return circuit.execute(operation);
    }
    async executeBatch(operations, options = {}) {
        const results = [];
        const promises = operations.map(async ({ key, operation }) => {
            try {
                const result = await this.execute(key, operation, options);
                return { key, result };
            }
            catch (error) {
                return { key, error: error };
            }
        });
        const results_1 = await Promise.all(promises);
        return results_1;
    }
    getCircuitStates() {
        const states = {};
        this.circuits.forEach((circuit, key) => {
            states[key] = circuit.getState();
        });
        return states;
    }
    resetCircuit(key) {
        const circuit = this.circuits.get(key);
        if (circuit) {
            circuit.reset();
            enhanced_error_logger_js_1.logger.info(`熔断器已重置: ${key}`);
        }
    }
    resetAll() {
        this.circuits.forEach((circuit, key) => {
            circuit.reset();
            enhanced_error_logger_js_1.logger.info(`熔断器已重置: ${key}`);
        });
    }
    startMonitoring() {
        setInterval(() => {
            this.checkAndResetCircuits();
        }, this.options.monitoringIntervalMs);
    }
    checkAndResetCircuits() {
        this.circuits.forEach((circuit, key) => {
            if (circuit.shouldAttemptReset()) {
                circuit.reset();
                enhanced_error_logger_js_1.logger.info(`自动恢复熔断器: ${key}`);
            }
        });
    }
}
exports.CircuitBreaker = CircuitBreaker;
class CircuitBreakerInstance {
    constructor(key, options) {
        this.state = 'CLOSED';
        this.failureCount = 0;
        this.lastFailureTime = 0;
        this.successCount = 0;
        this.nextAttemptTime = 0;
        this.key = key;
        this.options = options;
    }
    async execute(operation) {
        if (this.state === 'OPEN') {
            if (Date.now() >= this.nextAttemptTime) {
                this.state = 'HALF_OPEN';
                this.options.onStateChange?.('HALF_OPEN', this.key);
            }
            else {
                throw this.createCircuitBreakerError();
            }
        }
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error('操作超时'));
            }, this.options.timeoutMs);
        });
        try {
            const result = await Promise.race([operation(), timeoutPromise]);
            this.onSuccess();
            return result;
        }
        catch (error) {
            this.onFailure(error);
            throw error;
        }
    }
    onSuccess() {
        this.failureCount = 0;
        this.successCount++;
        if (this.state === 'HALF_OPEN') {
            this.state = 'CLOSED';
            this.options.onStateChange?.('CLOSED', this.key);
            enhanced_error_logger_js_1.logger.info(`熔断器已关闭: ${this.key}`);
        }
    }
    onFailure(error) {
        this.failureCount++;
        this.lastFailureTime = Date.now();
        if (this.state === 'HALF_OPEN') {
            this.state = 'OPEN';
            this.nextAttemptTime = Date.now() + this.options.resetTimeoutMs;
            this.options.onStateChange?.('OPEN', this.key);
        }
        else if (this.state === 'CLOSED' && this.failureCount >= this.options.errorThreshold) {
            this.state = 'OPEN';
            this.nextAttemptTime = Date.now() + this.options.resetTimeoutMs;
            this.options.onStateChange?.('OPEN', this.key);
        }
        enhanced_error_logger_js_1.logger.error(`熔断器失败: ${this.key}`, {
            error: error instanceof Error ? error.message : String(error),
            failureCount: this.failureCount,
            state: this.state,
        });
    }
    createCircuitBreakerError() {
        const timeUntilReset = Math.ceil((this.nextAttemptTime - Date.now()) / 1000);
        return new errors_js_1.ExternalServiceError(this.key, `服务熔断中，将在 ${timeUntilReset} 秒后恢复`, 503, {
            circuitKey: this.key,
            state: this.state,
            nextAttemptTime: this.nextAttemptTime,
            timeUntilReset,
            failureCount: this.failureCount,
        });
    }
    getState() {
        return this.state;
    }
    shouldAttemptReset() {
        return (this.state === 'OPEN' &&
            Date.now() >= this.nextAttemptTime &&
            this.failureCount > 0);
    }
    reset() {
        this.state = 'CLOSED';
        this.failureCount = 0;
        this.successCount = 0;
        this.nextAttemptTime = 0;
        this.lastFailureTime = 0;
        this.options.onStateChange?.('CLOSED', this.key);
    }
    getStats() {
        return {
            state: this.state,
            failureCount: this.failureCount,
            successCount: this.successCount,
            lastFailureTime: this.lastFailureTime,
            nextAttemptTime: this.nextAttemptTime,
        };
    }
}
exports.circuitBreaker = CircuitBreaker.getInstance();
function withCircuitBreaker(key, options = {}) {
    return function (target, propertyName, descriptor) {
        const method = descriptor.value;
        descriptor.value = async function (...args) {
            return exports.circuitBreaker.execute(key, () => method.apply(this, args), options);
        };
        return descriptor;
    };
}
function withApiCircuitBreaker(serviceKey, options = {}) {
    return function (target, propertyName, descriptor) {
        const method = descriptor.value;
        descriptor.value = async function (req, res, next) {
            try {
                const result = await exports.circuitBreaker.execute(`${serviceKey}.${req.method}`, () => method.apply(this, [req, res, next]), {
                    ...options,
                    fallback: async (error) => {
                        const circuitError = error;
                        if (!res.headersSent) {
                            res.status(circuitError.statusCode || 503).json({
                                success: false,
                                error: {
                                    code: 'SERVICE_UNAVAILABLE',
                                    message: '服务暂时不可用，请稍后重试',
                                    details: {
                                        service: serviceKey,
                                        retryAfter: options.resetTimeoutMs ? Math.ceil(options.resetTimeoutMs / 1000) : 30,
                                    },
                                    timestamp: new Date().toISOString(),
                                },
                                meta: {
                                    timestamp: new Date().toISOString(),
                                    service: serviceKey,
                                },
                            });
                        }
                        return null;
                    },
                });
                return result;
            }
            catch (error) {
                if (!res.headersSent && next) {
                    next(error);
                }
            }
        };
        return descriptor;
    };
}
//# sourceMappingURL=circuit-breaker.js.map