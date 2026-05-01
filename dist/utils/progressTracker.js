"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackStepProgress = trackStepProgress;
const STEP_STATUSES = {
    COMPLETED: "completed",
    IN_PROGRESS: "in_progress",
    PENDING: "pending"
};
function trackStepProgress(stepId, progress) {
    const status = progress >= 100 ? STEP_STATUSES.COMPLETED :
        progress >= 50 ? STEP_STATUSES.IN_PROGRESS :
            STEP_STATUSES.PENDING;
    return `步骤 ${stepId}: ${status} (${progress}%)`;
}
//# sourceMappingURL=progressTracker.js.map