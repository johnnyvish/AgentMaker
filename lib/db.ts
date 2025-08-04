import { Pool } from "pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Test the connection
pool.on("connect", () => {
  console.log("✅ Connected to PostgreSQL database");
});

pool.on("error", (err) => {
  console.error("❌ PostgreSQL connection error:", err);
});

// SQL table creation script
const createTablesSQL = `
CREATE TABLE IF NOT EXISTS automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  nodes JSONB NOT NULL,
  edges JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS automation_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID REFERENCES automations(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending',
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  context JSONB DEFAULT '{}',
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS execution_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID REFERENCES automation_executions(id) ON DELETE CASCADE,
  node_id VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  result JSONB,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scheduled_automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID REFERENCES automations(id) ON DELETE CASCADE,
  cron_expression VARCHAR(100) NOT NULL,
  timezone VARCHAR(50) DEFAULT 'UTC',
  last_run TIMESTAMP,
  next_run TIMESTAMP NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_automation_executions_automation_id ON automation_executions(automation_id);
CREATE INDEX IF NOT EXISTS idx_automation_executions_status ON automation_executions(status);
CREATE INDEX IF NOT EXISTS idx_execution_steps_execution_id ON execution_steps(execution_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_automations_next_run ON scheduled_automations(next_run, active);
`;

/**
 * Initialize database schema
 * Creates all necessary tables and indexes if they don't exist
 */
export async function initializeDatabase() {
  try {
    await pool.query(createTablesSQL);
    console.log("✅ Database tables created/verified");
    return true;
  } catch (error) {
    console.error("❌ Failed to initialize database:", error);
    throw error;
  }
}

// ============================================
// AUTOMATION DATABASE OPERATIONS
// ============================================

export interface Automation {
  id: string;
  name: string;
  nodes: Record<string, unknown>[];
  edges: Record<string, unknown>[];
  status: string;
  created_at: string;
  updated_at: string;
}

/**
 * Get all automations ordered by most recently updated
 */
export async function getAllAutomations(): Promise<Automation[]> {
  try {
    const result = await pool.query(
      "SELECT * FROM automations ORDER BY updated_at DESC"
    );
    return result.rows;
  } catch (error) {
    console.error("Failed to fetch automations:", error);
    throw new Error("Failed to fetch automations");
  }
}

/**
 * Create a new automation
 */
export async function createAutomation(
  name: string,
  nodes: Record<string, unknown>[],
  edges: Record<string, unknown>[]
): Promise<Automation> {
  try {
    const result = await pool.query(
      "INSERT INTO automations (name, nodes, edges) VALUES ($1, $2, $3) RETURNING *",
      [name, JSON.stringify(nodes), JSON.stringify(edges)]
    );
    return result.rows[0];
  } catch (error) {
    console.error("Failed to create automation:", error);
    throw new Error("Failed to create automation");
  }
}

/**
 * Update an existing automation
 */
export async function updateAutomation(
  id: string,
  name: string,
  nodes: Record<string, unknown>[],
  edges: Record<string, unknown>[]
): Promise<Automation> {
  try {
    const result = await pool.query(
      "UPDATE automations SET name = $1, nodes = $2, edges = $3, updated_at = NOW() WHERE id = $4 RETURNING *",
      [name, JSON.stringify(nodes), JSON.stringify(edges), id]
    );

    if (result.rows.length === 0) {
      throw new Error("Automation not found");
    }

    return result.rows[0];
  } catch (error) {
    console.error("Failed to update automation:", error);
    throw error;
  }
}

/**
 * Update automation status
 */
export async function updateAutomationStatus(
  id: string,
  status: string
): Promise<Automation> {
  try {
    const result = await pool.query(
      "UPDATE automations SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
      [status, id]
    );

    if (result.rows.length === 0) {
      throw new Error("Automation not found");
    }

    return result.rows[0];
  } catch (error) {
    console.error("Failed to update automation status:", error);
    throw error;
  }
}

/**
 * Delete an automation
 */
export async function deleteAutomation(id: string): Promise<void> {
  try {
    const result = await pool.query(
      "DELETE FROM automations WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      throw new Error("Automation not found");
    }
  } catch (error) {
    console.error("Failed to delete automation:", error);
    throw error;
  }
}

// ============================================
// EXECUTION DATABASE OPERATIONS
// ============================================

export interface ExecutionStep {
  id: string | null;
  node_id: string;
  status: string;
  result: string | number | boolean | object | null;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
}

export interface Execution {
  id: string;
  automation_id: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  context: Record<string, unknown>;
  error_message: string | null;
  created_at: string;
  steps?: ExecutionStep[];
}

/**
 * Create a new execution record
 */
export async function createExecution(
  automationId: string
): Promise<Execution> {
  try {
    const result = await pool.query(
      "INSERT INTO automation_executions (automation_id, status) VALUES ($1, $2) RETURNING *",
      [automationId, "pending"]
    );
    return result.rows[0];
  } catch (error) {
    console.error("Failed to create execution:", error);
    throw new Error("Failed to create execution");
  }
}

/**
 * Get execution with steps by execution ID
 */
export async function getExecutionWithSteps(
  executionId: string
): Promise<Execution | null> {
  try {
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
      FROM automation_executions we
      LEFT JOIN execution_steps es ON we.id = es.execution_id
      WHERE we.id = $1
      GROUP BY we.id
    `;

    const result = await pool.query(executionQuery, [executionId]);

    if (result.rows.length === 0) {
      return null;
    }

    const execution = result.rows[0];

    // Filter out null steps
    const validSteps = execution.steps.filter(
      (step: ExecutionStep) => step.id !== null
    );

    return {
      ...execution,
      steps: validSteps,
    };
  } catch (error) {
    console.error("Failed to get execution with steps:", error);
    throw new Error("Failed to get execution");
  }
}

/**
 * Get latest execution for an automation
 */
export async function getLatestExecution(
  automationId: string
): Promise<Execution | null> {
  try {
    const result = await pool.query(
      `SELECT id, status, started_at, completed_at, created_at 
       FROM automation_executions 
       WHERE automation_id = $1 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [automationId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    console.error("Failed to get latest execution:", error);
    throw new Error("Failed to get latest execution");
  }
}

export { pool };

// ============================================
// EXECUTION ENGINE DATABASE OPERATIONS
// ============================================

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  created_at: string;
  nodes: Record<string, unknown>[];
  edges: Record<string, unknown>[];
  workflow_name: string;
}

/**
 * Get execution with workflow data by execution ID
 */
export async function getExecutionWithWorkflow(
  executionId: string
): Promise<WorkflowExecution | null> {
  try {
    const executionQuery = `
      SELECT we.*, w.nodes, w.edges, w.id as workflow_id, w.name as workflow_name
      FROM automation_executions we 
      JOIN automations w ON we.automation_id = w.id 
      WHERE we.id = $1
    `;
    const result = await pool.query(executionQuery, [executionId]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    console.error("Failed to get execution with workflow:", error);
    throw new Error("Failed to get execution with workflow");
  }
}

/**
 * Update execution status to running
 */
export async function updateExecutionToRunning(
  executionId: string
): Promise<void> {
  try {
    await pool.query(
      "UPDATE automation_executions SET status = $1, started_at = NOW() WHERE id = $2",
      ["running", executionId]
    );
  } catch (error) {
    console.error("Failed to update execution to running:", error);
    throw new Error("Failed to update execution status");
  }
}

/**
 * Update execution status to completed
 */
export async function updateExecutionToCompleted(
  executionId: string
): Promise<void> {
  try {
    await pool.query(
      "UPDATE automation_executions SET status = $1, completed_at = NOW() WHERE id = $2",
      ["completed", executionId]
    );
  } catch (error) {
    console.error("Failed to update execution to completed:", error);
    throw new Error("Failed to update execution status");
  }
}

/**
 * Update execution status to failed
 */
export async function updateExecutionToFailed(
  executionId: string,
  errorMessage: string
): Promise<void> {
  try {
    await pool.query(
      "UPDATE automation_executions SET status = $1, completed_at = NOW(), error_message = $2 WHERE id = $3",
      ["failed", errorMessage, executionId]
    );
  } catch (error) {
    console.error("Failed to update execution to failed:", error);
    throw new Error("Failed to update execution status");
  }
}

/**
 * Create execution step record
 */
export async function createExecutionStep(
  executionId: string,
  nodeId: string
): Promise<string> {
  try {
    const stepResult = await pool.query(
      "INSERT INTO execution_steps (execution_id, node_id, status) VALUES ($1, $2, $3) RETURNING *",
      [executionId, nodeId, "pending"]
    );
    return stepResult.rows[0].id;
  } catch (error) {
    console.error("Failed to create execution step:", error);
    throw new Error("Failed to create execution step");
  }
}

/**
 * Update execution step to running
 */
export async function updateExecutionStepToRunning(
  stepId: string
): Promise<void> {
  try {
    await pool.query(
      "UPDATE execution_steps SET status = $1, started_at = NOW() WHERE id = $2",
      ["running", stepId]
    );
  } catch (error) {
    console.error("Failed to update execution step to running:", error);
    throw new Error("Failed to update execution step");
  }
}

/**
 * Update execution step to completed
 */
export async function updateExecutionStepToCompleted(
  stepId: string,
  result: unknown
): Promise<void> {
  try {
    await pool.query(
      "UPDATE execution_steps SET status = $1, completed_at = NOW(), result = $2 WHERE id = $3",
      ["completed", JSON.stringify(result), stepId]
    );
  } catch (error) {
    console.error("Failed to update execution step to completed:", error);
    throw new Error("Failed to update execution step");
  }
}

/**
 * Update execution step to failed
 */
export async function updateExecutionStepToFailed(
  stepId: string,
  errorMessage: string
): Promise<void> {
  try {
    await pool.query(
      "UPDATE execution_steps SET status = $1, completed_at = NOW(), error_message = $2 WHERE id = $3",
      ["failed", errorMessage, stepId]
    );
  } catch (error) {
    console.error("Failed to update execution step to failed:", error);
    throw new Error("Failed to update execution step");
  }
}

/**
 * Get next pending execution for processing
 */
export async function getNextPendingExecution(): Promise<string | null> {
  try {
    const result = await pool.query(
      "SELECT id FROM automation_executions WHERE status = 'pending' ORDER BY created_at ASC LIMIT 1"
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0].id;
  } catch (error) {
    console.error("Failed to get next pending execution:", error);
    throw new Error("Failed to get next pending execution");
  }
}
