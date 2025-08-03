import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await pool.query(
      `SELECT id, status, started_at, completed_at, created_at 
       FROM workflow_executions 
       WHERE workflow_id = $1 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(null);
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to fetch latest execution" },
      { status: 500 }
    );
  }
} 