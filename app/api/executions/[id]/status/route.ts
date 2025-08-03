import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

interface ExecutionStep {
  id: string | null;
  node_id: string;
  status: string;
  result: string | number | boolean | object | null;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get execution with steps
    const executionQuery = `
      SELECT 
        we.*,
        json_agg(
          json_build_object(
            'id', es.id,
            'node_id', es.node_id,
            'status', es.status,
            'result', es.result,
            'started_at', es.started_at,
            'completed_at', es.completed_at,
            'error_message', es.error_message
          ) ORDER BY es.created_at
        ) as steps
      FROM workflow_executions we
      LEFT JOIN execution_steps es ON we.id = es.execution_id
      WHERE we.id = $1
      GROUP BY we.id
    `;

    const result = await pool.query(executionQuery, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Execution not found" },
        { status: 404 }
      );
    }

    const execution = result.rows[0];

    // 🔧 FINALLY: Add better error handling in your API endpoint
    // In /api/executions/[id]/status/route.ts, add some debugging:
    console.log("🔍 Raw execution steps from DB:", result.rows[0]);

    // Filter out null steps AND log what we're actually returning
    const validSteps = execution.steps.filter(
      (step: ExecutionStep) => step.id !== null
    );
    console.log(
      "🔍 Valid steps being returned:",
      validSteps.map((s: ExecutionStep) => ({
        node_id: s.node_id,
        status: s.status,
        hasResult: !!s.result,
        resultKeys: s.result ? Object.keys(s.result) : [],
      }))
    );

    return NextResponse.json({
      id: execution.id,
      status: execution.status,
      started_at: execution.started_at,
      completed_at: execution.completed_at,
      error_message: execution.error_message,
      steps: validSteps,
    });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to get execution status" },
      { status: 500 }
    );
  }
}
