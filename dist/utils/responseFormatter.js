"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatApiResponse = formatApiResponse;
function formatApiResponse(data, success = true, message) {
    return {
        success,
        data: success ? data : undefined,
        error: success ? undefined : message,
        message,
        timestamp: new Date().toISOString()
    };
}
//# sourceMappingURL=responseFormatter.js.map