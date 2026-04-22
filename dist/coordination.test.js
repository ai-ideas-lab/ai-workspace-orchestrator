"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const coordination_1 = require("./coordination");
describe("coordinateTask", () => {
    const mockTask = { id: "task-123", type: "ai", weight: 10, required: true };
    const mockAgents = [
        { id: "agent-1", type: "ai", capacity: 8 },
        { id: "agent-2", type: "api", capacity: 10 }
    ];
    it("should successfully coordinate a task with suitable agents", () => {
        const result = (0, coordination_1.coordinateTask)(mockTask, mockAgents);
        expect(result.taskId).toBe("task-123");
        expect(result.status).toBe("scheduled");
        expect(result.assignedAgents).toHaveLength(1);
        expect(result.assignedAgents[0].id).toBe("agent-1");
        expect(result.priority).toBeGreaterThan(0);
        expect(result.estimatedCompletion).toBeInstanceOf(Date);
    });
    it("should handle task coordination with different task types", () => {
        const dataTask = { id: "data-task", type: "data", weight: 8, required: true };
        const dataAgents = [{ id: "agent-data", type: "data", capacity: 5 }];
        const result = (0, coordination_1.coordinateTask)(dataTask, dataAgents);
        expect(result.status).toBe("scheduled");
        expect(result.assignedAgents[0].type).toBe("data");
    });
    it("should return failed status when no suitable agents available", () => {
        const apiTask = { id: "api-task", type: "api", weight: 5, required: true };
        const noApiAgents = [{ id: "agent-1", type: "ai", capacity: 10 }];
        const result = (0, coordination_1.coordinateTask)(apiTask, noApiAgents);
        expect(result.status).toBe("failed");
        expect(result.assignedAgents).toHaveLength(0);
        expect(result.estimatedCompletion).toBeNull();
    });
});
//# sourceMappingURL=coordination.test.js.map