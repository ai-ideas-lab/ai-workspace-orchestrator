"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const statusHelper_1 = require("../statusHelper");
describe("statusHelper", () => {
    describe("checkWorkflowStatus", () => {
        it("should return a status string", () => {
            const result = (0, statusHelper_1.checkWorkflowStatus)();
            expect(typeof result).toBe("string");
            expect(result).toMatch(/工作流状态:/);
        });
        it("should not throw error when called", () => {
            expect(() => (0, statusHelper_1.checkWorkflowStatus)()).not.toThrow();
        });
    });
    describe("getProgressIndicator", () => {
        it("should return a progress string with phase and percentage", () => {
            const result = (0, statusHelper_1.getProgressIndicator)();
            expect(typeof result).toBe("string");
            expect(result).toMatch(/🚀 .*阶段 \(\d+%\)/);
        });
        it("should not throw error when called", () => {
            expect(() => (0, statusHelper_1.getProgressIndicator)()).not.toThrow();
        });
    });
});
//# sourceMappingURL=statusHelper.test.js.map