import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Create execution record
    const executionResult = await pool.query(
      "INSERT INTO workflow_executions (workflow_id, status) VALUES ($1, $2) RETURNING *",
      [id, "pending"]
    );

    const execution = executionResult.rows[0];

    // Queue the execution (we'll implement the queue next)
    // For now, just return the execution ID

    return NextResponse.json({
      executionId: execution.id,
      status: "queued",
    });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to start execution" },
      { status: 500 }
    );
  }
}
