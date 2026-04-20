"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlidingWindowLimiter = void 0;
class SlidingWindowLimiter {
    constructor(config) {
        this.config = config;
        this.entries = [];
    }
    tryAcquire(priority = 'NORMAL') {
        const now = Date.now();
        const cutoff = now - this.config.windowMs;
        this.entries = this.entries.filter(e => e.timestamp > cutoff);
        if (this.entries.length >= this.config.maxRequests)
            return false;
        this.entries.push({ timestamp: now, priority });
        return true;
    }
    get remaining() {
        const cutoff = Date.now() - this.config.windowMs;
        return Math.max(0, this.config.maxRequests - this.entries.filter(e => e.timestamp > cutoff).length);
    }
    reset() { this.entries = []; }
}
exports.SlidingWindowLimiter = SlidingWindowLimiter;
//# sourceMappingURL=sliding-window-limiter.js.map