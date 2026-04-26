"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatExecutionTime = formatExecutionTime;
exports.formatDuration = formatDuration;
function formatExecutionTime(ms) {
    return `${(ms / 1000).toFixed(2)}s`;
}
function formatDuration(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
//# sourceMappingURL=timeUtils.js.map