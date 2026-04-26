"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.quickProgress = quickProgress;
exports.isTaskComplete = isTaskComplete;
function quickProgress(task, progress) {
    return `[${"=".repeat(progress)}${" ".repeat(100 - progress)}] ${progress}% - ${task}`;
}
function isTaskComplete(progress) {
    return progress >= 100;
}
//# sourceMappingURL=quick-progress.js.map