import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { name, nodes, edges } = await request.json();

    const result = await pool.query(
      "UPDATE workflows SET name = $1, nodes = $2, edges = $3, updated_at = NOW() WHERE id = $4 RETURNING *",
      [name, JSON.stringify(nodes), JSON.stringify(edges), id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to update workflow" },
      { status: 500 }
    );
  }
}
