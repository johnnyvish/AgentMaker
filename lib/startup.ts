import { QueueProcessor } from "./execution-engine";

let queueProcessor: QueueProcessor | null = null;

export function startBackgroundProcesses() {
  if (queueProcessor) return; // Already started

  queueProcessor = new QueueProcessor();
  queueProcessor.start();

  // Graceful shutdown
  process.on("SIGINT", () => {
    console.log("Shutting down background processes...");
    queueProcessor?.stop();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    console.log("Shutting down background processes...");
    queueProcessor?.stop();
    process.exit(0);
  });
}
