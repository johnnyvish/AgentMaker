import { NextRequest, NextResponse } from "next/server";
import {
  getAllAutomations,
  createAutomation,
  updateAutomation,
  deleteAutomation,
} from "@/lib/db";

export async function GET() {
  try {
    const automations = await getAllAutomations();
    return NextResponse.json(automations);
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to fetch automations" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, nodes, edges } = await request.json();

    const automation = await createAutomation(name, nodes, edges);
    return NextResponse.json(automation);
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to save automation" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, name, nodes, edges } = await request.json();

    const automation = await updateAutomation(id, name, nodes, edges);
    return NextResponse.json(automation);
  } catch (error) {
    console.error("Database error:", error);
    if (error instanceof Error && error.message === "Automation not found") {
      return NextResponse.json(
        { error: "Automation not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update automation" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Automation ID is required" },
        { status: 400 }
      );
    }

    await deleteAutomation(id);
    return NextResponse.json({ message: "Automation deleted successfully" });
  } catch (error) {
    console.error("Database error:", error);
    if (error instanceof Error && error.message === "Automation not found") {
      return NextResponse.json(
        { error: "Automation not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Failed to delete automation" },
      { status: 500 }
    );
  }
}
