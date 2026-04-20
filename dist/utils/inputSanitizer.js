"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeUserInput = sanitizeUserInput;
function sanitizeUserInput(input) {
    if (typeof input !== "string")
        return "";
    return input
        .trim()
        .replace(/<[^>]*>/g, "")
        .replace(/javascript:/gi, "")
        .replace(/data:/gi, "")
        .replace(/<script[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .substring(0, 2000);
}
//# sourceMappingURL=inputSanitizer.js.map