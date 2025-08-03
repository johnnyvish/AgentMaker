import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
  try {
    const result = await pool.query(
      "SELECT * FROM workflows ORDER BY updated_at DESC"
    );
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to fetch workflows" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, nodes, edges } = await request.json();

    const result = await pool.query(
      "INSERT INTO workflows (name, nodes, edges) VALUES ($1, $2, $3) RETURNING *",
      [name, JSON.stringify(nodes), JSON.stringify(edges)]
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to save workflow" },
      { status: 500 }
    );
  }
}
