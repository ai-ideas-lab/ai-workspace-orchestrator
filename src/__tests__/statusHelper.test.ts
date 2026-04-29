import { checkWorkflowStatus, getProgressIndicator } from "../statusHelper";

describe("statusHelper", () => {
  describe("checkWorkflowStatus", () => {
    it("should return a status string", () => {
      const result = checkWorkflowStatus();
      expect(typeof result).toBe("string");
      expect(result).toMatch(/工作流状态:/);
    });

    it("should not throw error when called", () => {
      expect(() => checkWorkflowStatus()).not.toThrow();
    });
  });

  describe("getProgressIndicator", () => {
    it("should return a progress string with phase and percentage", () => {
      const result = getProgressIndicator();
      expect(typeof result).toBe("string");
      expect(result).toMatch(/🚀 .*阶段 \(\d+%\)/);
    });

    it("should not throw error when called", () => {
      expect(() => getProgressIndicator()).not.toThrow();
    });
  });
});
