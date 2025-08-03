import { NextResponse } from "next/server";
import { initializeDatabase } from "@/lib/db";
import { QueueProcessor } from "@/lib/execution-engine";

export async function POST() {
  try {
    // Initialize database schema
    await initializeDatabase();

    // Then start background processes
    startBackgroundProcesses();

    return NextResponse.json({
      status: "Database initialized and background processes started",
    });
  } catch (error) {
    console.error("Failed to initialize:", error);
    return NextResponse.json(
      {
        error: "Failed to initialize database and background processes",
      },
      { status: 500 }
    );
  }
}

let queueProcessor: QueueProcessor | null = null;

function startBackgroundProcesses() {
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
