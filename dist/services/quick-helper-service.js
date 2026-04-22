"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getQuickStatus = void 0;
const getQuickStatus = () => {
    try {
        return { status: "healthy", timestamp: new Date().toISOString() };
    }
    catch (error) {
        return {
            status: "error",
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : "Unknown error occurred"
        };
    }
};
exports.getQuickStatus = getQuickStatus;
//# sourceMappingURL=quick-helper-service.js.map