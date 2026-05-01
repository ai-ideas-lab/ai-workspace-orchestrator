"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isEmptyOrWhitespace = isEmptyOrWhitespace;
exports.generateRandomId = generateRandomId;
exports.testFunction = testFunction;
const constants_1 = require("./constants");
function isEmptyOrWhitespace(text) {
    return !text || text.trim().length === 0;
}
function generateRandomId(length = 8) {
    try {
        if (length < constants_1.VALIDATION_CONSTANTS.MIN_ID_LENGTH || length > constants_1.VALIDATION_CONSTANTS.MAX_ID_LENGTH) {
            throw new RangeError(`ID length must be between ${constants_1.VALIDATION_CONSTANTS.MIN_ID_LENGTH} and ${constants_1.VALIDATION_CONSTANTS.MAX_ID_LENGTH}`);
        }
        const chars = constants_1.RANDOM_CHARSET.ALPHANUMERIC;
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
    catch (error) {
        console.error('Error in generateRandomId:', error);
        return Math.random().toString(36).substring(2, 10);
    }
}
function testFunction() { return "test"; }
//# sourceMappingURL=stringHelper.js.map