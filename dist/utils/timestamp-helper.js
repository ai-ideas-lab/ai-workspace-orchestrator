"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRequestId = generateRequestId;
exports.measureExecutionTime = measureExecutionTime;
exports.compareTimestamps = compareTimestamps;
exports.isTimestampExpired = isTimestampExpired;
exports.getFormattedTimestamp = getFormattedTimestamp;
exports.createTimeRange = createTimeRange;
const index_js_1 = require("../constants/index.js");
function generateRequestId() {
    try {
        return `${index_js_1.ID_PATTERNS.REQUEST_PREFIX}${Date.now()}_${index_js_1.ID_PATTERNS.TIMESTAMP_ID_SUFFIX}`;
    }
    catch (error) {
        return `${index_js_1.ID_PATTERNS.REQUEST_PREFIX}${Date.now()}`;
    }
}
async function measureExecutionTime(callback) {
    const startTime = Date.now();
    try {
        const result = await callback();
        const endTime = Date.now();
        return {
            result,
            duration: endTime - startTime,
            timestamp: endTime
        };
    }
    catch (error) {
        const endTime = Date.now();
        return {
            result: null,
            duration: endTime - startTime,
            timestamp: endTime
        };
    }
}
function compareTimestamps(timestamp1, timestamp2) {
    try {
        const t1 = timestamp1 || 0;
        const t2 = timestamp2 || 0;
        if (t1 > t2)
            return 1;
        if (t1 < t2)
            return -1;
        return 0;
    }
    catch (error) {
        return 0;
    }
}
function isTimestampExpired(timestamp, expirationMs) {
    try {
        if (!timestamp)
            return true;
        const currentTime = Date.now();
        return currentTime > timestamp + expirationMs;
    }
    catch (error) {
        return true;
    }
}
function getFormattedTimestamp() {
    try {
        const now = new Date();
        return now.toISOString();
    }
    catch (error) {
        return new Date().toISOString();
    }
}
function createTimeRange(startMs, endMs) {
    const end = endMs || Date.now();
    return {
        start: startMs,
        end,
        duration: end - startMs
    };
}
//# sourceMappingURL=timestamp-helper.js.map