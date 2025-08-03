import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function DELETE() {
  try {
    await pool.query("DELETE FROM system_logs");
    return NextResponse.json({ message: "All logs cleared successfully" });
  } catch (error) {
    console.error("Failed to clear logs:", error);
    return NextResponse.json(
      { error: "Failed to clear logs" },
      { status: 500 }
    );
  }
}
