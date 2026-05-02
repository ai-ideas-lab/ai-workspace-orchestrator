"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateTaskPriority = calculateTaskPriority;
exports.needsImmediateAttention = needsImmediateAttention;
function calculateTaskPriority(taskName, isUrgent, importance) {
    if (isUrgent && importance >= 7)
        return '紧急高优';
    if (isUrgent)
        return '紧急';
    if (importance >= 8)
        return '高优';
    if (importance >= 5)
        return '中优';
    return '普通';
}
function needsImmediateAttention(taskName, isUrgent, importance) {
    if (importance < 1 || importance > 10) {
        throw new TypeError('importance must be between 1 and 10');
    }
    return isUrgent || importance >= 8;
}
//# sourceMappingURL=taskPriority.js.map