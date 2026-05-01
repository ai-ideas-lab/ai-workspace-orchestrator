"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatExecutionTime = formatExecutionTime;
exports.formatDuration = formatDuration;
const constants_1 = require("./constants");
function formatExecutionTime(ms) {
    try {
        if (typeof ms !== 'number' || isNaN(ms)) {
            throw new Error('Invalid input: ms must be a valid number');
        }
        return `${(ms / constants_1.TIME_CONSTANTS.MILLISECONDS_PER_SECOND).toFixed(2)}s`;
    }
    catch (error) {
        console.error('Error in formatExecutionTime:', error);
        return '0.00s';
    }
}
function formatDuration(ms) {
    try {
        if (typeof ms !== 'number' || isNaN(ms) || ms < 0) {
            throw new Error('Invalid input: ms must be a non-negative number');
        }
        const minutes = Math.floor(ms / constants_1.TIME_CONSTANTS.MILLISECONDS_PER_MINUTE);
        const seconds = Math.floor((ms % constants_1.TIME_CONSTANTS.MILLISECONDS_PER_MINUTE) / constants_1.TIME_CONSTANTS.MILLISECONDS_PER_SECOND);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    catch (error) {
        console.error('Error in formatDuration:', error);
        return '00:00';
    }
}
//# sourceMappingURL=timeUtils.js.map