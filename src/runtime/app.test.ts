import request from "supertest";
import { createApp } from "../app";

const validWorkflow = {
  name: "release",
  description: "Build and publish",
  steps: [
    {
      id: "build",
      name: "Build",
      taskType: "build",
      payload: { target: "production" },
      dependsOn: [],
    },
    {
      id: "publish",
      name: "Publish",
      taskType: "publish",
      payload: {},
      dependsOn: ["build"],
    },
  ],
};

describe("runtime API", () => {
  const instances: ReturnType<typeof createApp>[] = [];

  afterEach(() => {
    for (const instance of instances) {
      instance.services.scheduler.shutdown();
      instance.services.eventBus.clearAll();
    }
    instances.length = 0;
  });

  function setup(): ReturnType<typeof createApp> {
    const instance = createApp();
    instances.push(instance);
    return instance;
  }

  it("reports health and propagates request IDs", async () => {
    const { app } = setup();
    const response = await request(app).get("/health").set("x-request-id", "test-request");

    expect(response.status).toBe(200);
    expect(response.headers["x-request-id"]).toBe("test-request");
    expect(response.body).toMatchObject({ success: true, status: "ok" });
  });

  it("creates, reads, updates, clones and deletes workflows", async () => {
    const { app } = setup();
    const created = await request(app).post("/api/workflows").send(validWorkflow);

    expect(created.status).toBe(201);
    const id = created.body.data.id as string;

    expect((await request(app).get(`/api/workflows/${id}`)).status).toBe(200);
    const updated = await request(app)
      .put(`/api/workflows/${id}`)
      .send({ name: "release-v2", status: "ACTIVE" });
    expect(updated.body.data).toMatchObject({ name: "release-v2", status: "ACTIVE" });

    const cloned = await request(app)
      .post(`/api/workflows/${id}/clone`)
      .send({ name: "release-copy" });
    expect(cloned.status).toBe(201);
    expect(cloned.body.data).toMatchObject({ name: "release-copy", status: "DRAFT" });

    expect((await request(app).delete(`/api/workflows/${id}`)).status).toBe(204);
    expect((await request(app).get(`/api/workflows/${id}`)).status).toBe(404);
  });

  it("rejects cyclic workflows", async () => {
    const { app } = setup();
    const response = await request(app)
      .post("/api/workflows")
      .send({
        name: "cycle",
        steps: [
          { id: "a", name: "A", taskType: "task", payload: {}, dependsOn: ["b"] },
          { id: "b", name: "B", taskType: "task", payload: {}, dependsOn: ["a"] },
        ],
      });

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe("INVALID_WORKFLOW");
  });

  it("rejects malformed workflow steps and duplicate IDs", async () => {
    const { app } = setup();
    const malformed = await request(app)
      .post("/api/workflows")
      .send({ name: "invalid", steps: [{ id: "a" }] });
    expect(malformed.status).toBe(400);

    const duplicated = await request(app)
      .post("/api/workflows")
      .send({
        name: "duplicates",
        steps: [
          { id: "a", name: "A", taskType: "task", payload: {}, dependsOn: [] },
          { id: "a", name: "A2", taskType: "task", payload: {}, dependsOn: [] },
        ],
      });
    expect(duplicated.status).toBe(422);
  });

  it("executes stored workflows", async () => {
    const { app } = setup();
    const created = await request(app).post("/api/workflows").send(validWorkflow);
    const response = await request(app).post(`/api/workflows/${created.body.data.id}/execute`);

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe("COMPLETED");
    expect(response.body.data.steps).toHaveLength(2);
  });

  it("schedules and cancels a stored workflow", async () => {
    const { app } = setup();
    const created = await request(app).post("/api/workflows").send(validWorkflow);
    const workflowId = created.body.data.id as string;
    const scheduled = await request(app)
      .post(`/api/workflows/${workflowId}/schedule`)
      .send({ type: "once", delayMs: 60_000 });

    expect(scheduled.status).toBe(201);
    expect((await request(app).get(`/api/workflows/${workflowId}/schedule`)).status).toBe(200);
    expect((await request(app).delete(`/api/workflows/${workflowId}/schedule`)).status).toBe(204);
  });

  it("rejects invalid schedules", async () => {
    const { app } = setup();
    const created = await request(app).post("/api/workflows").send(validWorkflow);
    const workflowId = created.body.data.id as string;

    expect(
      (
        await request(app)
          .post(`/api/workflows/${workflowId}/schedule`)
          .send({ type: "recurring" })
      ).status,
    ).toBe(400);
    expect(
      (
        await request(app)
          .post(`/api/workflows/${workflowId}/schedule`)
          .send({ type: "once", delayMs: -1 })
      ).status,
    ).toBe(400);
  });

  it("returns structured 404 responses", async () => {
    const { app } = setup();
    const response = await request(app).get("/missing");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      error: { code: "NOT_FOUND", message: "Route not found" },
    });
  });
});
