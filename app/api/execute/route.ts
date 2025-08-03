import { NextRequest, NextResponse } from "next/server";
import {
  createExecution,
  getExecutionWithSteps,
  getLatestExecution,
} from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { workflowId } = await request.json();

    if (!workflowId) {
      return NextResponse.json(
        { error: "Automation ID is required" },
        { status: 400 }
      );
    }

    // Create execution record
    const execution = await createExecution(workflowId);

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const executionId = searchParams.get("executionId");
    const workflowId = searchParams.get("workflowId");
    const latest = searchParams.get("latest");

    if (executionId) {
      // Get specific execution status
      const execution = await getExecutionWithSteps(executionId);

      if (!execution) {
        return NextResponse.json(
          { error: "Execution not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        id: execution.id,
        status: execution.status,
        started_at: execution.started_at,
        completed_at: execution.completed_at,
        error_message: execution.error_message,
        steps: execution.steps,
      });
    } else if (workflowId && latest) {
      // Get latest execution for an automation
      const execution = await getLatestExecution(workflowId);

      if (!execution) {
        return NextResponse.json(null);
      }

      return NextResponse.json(execution);
    } else {
      return NextResponse.json(
        {
          error:
            "Either executionId or workflowId with latest=true is required",
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to get execution status" },
      { status: 500 }
    );
  }
}
