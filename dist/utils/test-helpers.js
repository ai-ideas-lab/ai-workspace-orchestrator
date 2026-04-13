"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.safeEventAccess = safeEventAccess;
function safeEventAccess(events, index) {
    if (!events || events.length === 0) {
        throw new Error(`Events array is empty or undefined, cannot access index ${index}`);
    }
    return events[index];
}
//# sourceMappingURL=test-helpers.js.map