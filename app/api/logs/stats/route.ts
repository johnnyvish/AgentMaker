import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const stats = await logger.getLogStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Failed to fetch log stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch log stats" },
      { status: 500 }
    );
  }
}
