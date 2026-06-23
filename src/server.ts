import { createServer } from "node:http";
import { createApp } from "./app.js";

const port = Number(process.env["PORT"] ?? 3000);
const { app, services } = createApp();
const server = createServer(app);

server.listen(port, () => {
  console.log(`AI Workspace Orchestrator listening on http://127.0.0.1:${port}`);
});

function shutdown(signal: string): void {
  console.log(`Received ${signal}, shutting down`);
  services.scheduler.shutdown();
  services.eventBus.clearAll();
  server.close((error) => {
    process.exitCode = error ? 1 : 0;
  });
}

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));
