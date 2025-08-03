import { NextResponse } from "next/server";
import { startBackgroundProcesses } from "@/lib/startup";
import { pool } from "@/lib/db";

const createTablesSQL = `
CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  nodes JSONB NOT NULL,
  edges JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending',
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  context JSONB DEFAULT '{}',
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS execution_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID REFERENCES workflow_executions(id) ON DELETE CASCADE,
  node_id VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  result JSONB,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scheduled_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
  cron_expression VARCHAR(100) NOT NULL,
  timezone VARCHAR(50) DEFAULT 'UTC',
  last_run TIMESTAMP,
  next_run TIMESTAMP NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_execution_steps_execution_id ON execution_steps(execution_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_workflows_next_run ON scheduled_workflows(next_run, active);
`;

export async function POST() {
  try {
    // First, ensure tables exist
    await pool.query(createTablesSQL);
    console.log("Database tables created/verified");

    // Then start background processes
    startBackgroundProcesses();

    return NextResponse.json({
      status: "Database initialized and background processes started",
    });
  } catch (error) {
    console.error("Failed to initialize:", error);
    return NextResponse.json(
      {
        error: "Failed to initialize database and background processes",
      },
      { status: 500 }
    );
  }
}
