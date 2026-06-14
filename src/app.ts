import cors from "cors";
import express, { ErrorRequestHandler, RequestHandler } from "express";
import helmet from "helmet";
import { randomUUID } from "node:crypto";
import { createWorkflowRouter } from "./routes/workflows.js";
import { EventBus } from "./services/event-bus.js";
import { WorkflowExecutor } from "./services/workflow-executor.js";
import { WorkflowScheduler } from "./services/workflow-scheduler.js";
import { WorkflowStore } from "./services/workflow-store.js";

export interface AppServices {
  eventBus: EventBus;
  executor: WorkflowExecutor;
  scheduler: WorkflowScheduler;
  store: WorkflowStore;
}

export function createApp(services?: Partial<AppServices>) {
  const eventBus = services?.eventBus ?? EventBus.getInstance();
  const executor = services?.executor ?? new WorkflowExecutor(undefined, eventBus);
  const scheduler = services?.scheduler ?? new WorkflowScheduler(executor, eventBus);
  const store = services?.store ?? new WorkflowStore();
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors({ origin: process.env["FRONTEND_URL"] ?? false }));
  app.use(express.json({ limit: "1mb" }));

  const requestId: RequestHandler = (request, response, next) => {
    const id = request.header("x-request-id") ?? randomUUID();
    response.setHeader("x-request-id", id);
    response.locals["requestId"] = id;
    next();
  };
  app.use(requestId);

  app.get("/health", (_request, response) => {
    response.json({
      success: true,
      status: "ok",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    });
  });

  app.get("/system", (_request, response) => {
    const memory = process.memoryUsage();
    response.json({
      success: true,
      data: {
        node: process.version,
        platform: process.platform,
        uptimeSeconds: Math.floor(process.uptime()),
        memoryBytes: { rss: memory.rss, heapUsed: memory.heapUsed },
        scheduler: scheduler.getStats(),
      },
    });
  });

  app.use("/api/workflows", createWorkflowRouter(store, executor, scheduler));

  app.use((_request, response) => {
    response.status(404).json({
      success: false,
      error: { code: "NOT_FOUND", message: "Route not found" },
    });
  });

  const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
    const message = error instanceof Error ? error.message : "Internal server error";
    response.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message },
    });
  };
  app.use(errorHandler);

  return { app, services: { eventBus, executor, scheduler, store } };
}
