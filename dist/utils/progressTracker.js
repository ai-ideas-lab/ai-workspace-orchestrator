"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackStepProgress = trackStepProgress;
function trackStepProgress(stepId, progress) {
    const status = progress >= 100 ? 'completed' : progress >= 50 ? 'in_progress' : 'pending';
    return `步骤 ${stepId}: ${status} (${progress}%)`;
}
//# sourceMappingURL=progressTracker.js.map