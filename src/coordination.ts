import { coordinateTask } from "../coordination";

describe("coordinateTask", () => {
  test("should coordinate task successfully", () => {
    const task = { id: "task-1", type: "ai", weight: 5, required: true };
    const agents = [{ id: "agent-1", type: "ai", capacity: 10 }];
    
    const result = coordinateTask(task, agents);
    
    expect(result.taskId).toBe("task-1");
    expect(result.status).toBe("scheduled");
    expect(result.assignedAgents).toHaveLength(1);
    expect(result.priority).toBeGreaterThan(0);
  });
});
// 孔明重构完成 - 2026-04-24
