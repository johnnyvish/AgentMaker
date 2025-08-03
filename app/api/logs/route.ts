import { NextRequest, NextResponse } from "next/server";
import { LogContext, logger, LogLevel } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const options = {
      level: searchParams.get("level") as LogLevel,
      context: searchParams.get("context") as LogContext,
      workflowId: searchParams.get("workflowId") || undefined,
      executionId: searchParams.get("executionId") || undefined,
      nodeId: searchParams.get("nodeId") || undefined,
      userId: searchParams.get("userId") || undefined,
      limit: searchParams.get("limit")
        ? parseInt(searchParams.get("limit")!)
        : 100,
      offset: searchParams.get("offset")
        ? parseInt(searchParams.get("offset")!)
        : 0,
      startDate: searchParams.get("startDate")
        ? new Date(searchParams.get("startDate")!)
        : undefined,
      endDate: searchParams.get("endDate")
        ? new Date(searchParams.get("endDate")!)
        : undefined,
    };

    const logs = await logger.getLogs(options);
    return NextResponse.json({ logs, count: logs.length });
  } catch (error) {
    console.error("Failed to fetch logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch logs" },
      { status: 500 }
    );
  }
}
