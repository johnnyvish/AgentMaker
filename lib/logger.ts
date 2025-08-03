// lib/logger.ts
import { pool } from "./db";

export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";
export type LogContext =
  | "workflow"
  | "execution"
  | "integration"
  | "api"
  | "system"
  | "auth"
  | "database";

interface LogEntry {
  level: LogLevel;
  message: string;
  context: LogContext;
  metadata?: Record<string, unknown>;
  error?: Error;
  userId?: string;
  workflowId?: string;
  executionId?: string;
  nodeId?: string;
  integrationId?: string;
  requestId?: string;
  timestamp?: Date;
}

interface DatabaseLogEntry extends LogEntry {
  id: string;
  timestamp: Date;
  stack_trace?: string;
  user_agent?: string;
  ip_address?: string;
}

class Logger {
  private static instance: Logger;
  private isEnabled = true;
  private logToConsole = true;
  private logToDatabase = true;

  private constructor() {
    this.initializeDatabase();
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private async initializeDatabase() {
    try {
      const createLogsTable = `
        CREATE TABLE IF NOT EXISTS system_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          level VARCHAR(10) NOT NULL,
          message TEXT NOT NULL,
          context VARCHAR(20) NOT NULL,
          metadata JSONB DEFAULT '{}',
          stack_trace TEXT,
          user_id VARCHAR(255),
          workflow_id UUID,
          execution_id UUID,
          node_id VARCHAR(255),
          integration_id VARCHAR(255),
          request_id VARCHAR(255),
          user_agent TEXT,
          ip_address INET,
          timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
        CREATE INDEX IF NOT EXISTS idx_system_logs_context ON system_logs(context);
        CREATE INDEX IF NOT EXISTS idx_system_logs_timestamp ON system_logs(timestamp);
        CREATE INDEX IF NOT EXISTS idx_system_logs_workflow_id ON system_logs(workflow_id);
        CREATE INDEX IF NOT EXISTS idx_system_logs_execution_id ON system_logs(execution_id);
        CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id);
      `;

      await pool.query(createLogsTable);
    } catch (error) {
      console.error("Failed to initialize logs database:", error);
    }
  }

  private getLogColor(level: LogLevel): string {
    switch (level) {
      case "debug":
        return "\x1b[36m"; // Cyan
      case "info":
        return "\x1b[32m"; // Green
      case "warn":
        return "\x1b[33m"; // Yellow
      case "error":
        return "\x1b[31m"; // Red
      case "fatal":
        return "\x1b[35m"; // Magenta
      default:
        return "\x1b[0m"; // Reset
    }
  }

  private formatConsoleLog(entry: LogEntry): string {
    const color = this.getLogColor(entry.level);
    const reset = "\x1b[0m";
    const timestamp = new Date().toISOString();

    let logLine = `${color}[${timestamp}] ${entry.level.toUpperCase()} [${
      entry.context
    }]${reset} ${entry.message}`;

    if (entry.workflowId) logLine += ` (workflow: ${entry.workflowId})`;
    if (entry.executionId) logLine += ` (execution: ${entry.executionId})`;
    if (entry.nodeId) logLine += ` (node: ${entry.nodeId})`;

    return logLine;
  }

  private async saveToDatabase(entry: LogEntry): Promise<void> {
    if (!this.logToDatabase) return;

    try {
      const query = `
        INSERT INTO system_logs (
          level, message, context, metadata, stack_trace, 
          user_id, workflow_id, execution_id, node_id, 
          integration_id, request_id, timestamp
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `;

      const values = [
        entry.level,
        entry.message,
        entry.context,
        JSON.stringify(entry.metadata || {}),
        entry.error?.stack || null,
        entry.userId || null,
        entry.workflowId || null,
        entry.executionId || null,
        entry.nodeId || null,
        entry.integrationId || null,
        entry.requestId || null,
        entry.timestamp || new Date(),
      ];

      await pool.query(query, values);
    } catch (error) {
      // Don't log to database if database logging fails (infinite loop prevention)
      if (this.logToConsole) {
        console.error("Failed to save log to database:", error);
      }
    }
  }

  private async log(entry: LogEntry): Promise<void> {
    if (!this.isEnabled) return;

    // Console logging
    if (this.logToConsole) {
      const formattedLog = this.formatConsoleLog(entry);

      switch (entry.level) {
        case "debug":
          console.debug(formattedLog);
          break;
        case "info":
          console.info(formattedLog);
          break;
        case "warn":
          console.warn(formattedLog);
          if (entry.metadata) console.warn("Metadata:", entry.metadata);
          break;
        case "error":
        case "fatal":
          console.error(formattedLog);
          if (entry.error) console.error("Error:", entry.error);
          if (entry.metadata) console.error("Metadata:", entry.metadata);
          break;
      }
    }

    // Database logging (async, don't block)
    this.saveToDatabase(entry).catch(() => {
      // Silently fail database logging to prevent infinite loops
    });
  }

  // Public logging methods
  debug(
    message: string,
    context: LogContext = "system",
    metadata?: Record<string, unknown>,
    options?: Partial<LogEntry>
  ): void {
    this.log({ level: "debug", message, context, metadata, ...options });
  }

  info(
    message: string,
    context: LogContext = "system",
    metadata?: Record<string, unknown>,
    options?: Partial<LogEntry>
  ): void {
    this.log({ level: "info", message, context, metadata, ...options });
  }

  warn(
    message: string,
    context: LogContext = "system",
    metadata?: Record<string, unknown>,
    options?: Partial<LogEntry>
  ): void {
    this.log({ level: "warn", message, context, metadata, ...options });
  }

  error(
    message: string,
    error?: Error,
    context: LogContext = "system",
    metadata?: Record<string, unknown>,
    options?: Partial<LogEntry>
  ): void {
    this.log({ level: "error", message, context, metadata, error, ...options });
  }

  fatal(
    message: string,
    error?: Error,
    context: LogContext = "system",
    metadata?: Record<string, unknown>,
    options?: Partial<LogEntry>
  ): void {
    this.log({ level: "fatal", message, context, metadata, error, ...options });
  }

  // Workflow-specific logging methods
  workflowInfo(
    message: string,
    workflowId: string,
    metadata?: Record<string, unknown>
  ): void {
    this.info(message, "workflow", metadata, { workflowId });
  }

  workflowError(
    message: string,
    workflowId: string,
    error?: Error,
    metadata?: Record<string, unknown>
  ): void {
    this.error(message, error, "workflow", metadata, { workflowId });
  }

  // Execution-specific logging methods
  executionInfo(
    message: string,
    executionId: string,
    workflowId?: string,
    metadata?: Record<string, unknown>
  ): void {
    this.info(message, "execution", metadata, { executionId, workflowId });
  }

  executionError(
    message: string,
    executionId: string,
    error?: Error,
    workflowId?: string,
    metadata?: Record<string, unknown>
  ): void {
    this.error(message, error, "execution", metadata, {
      executionId,
      workflowId,
    });
  }

  // Node-specific logging methods
  nodeInfo(
    message: string,
    nodeId: string,
    executionId?: string,
    workflowId?: string,
    metadata?: Record<string, unknown>
  ): void {
    this.info(message, "execution", metadata, {
      nodeId,
      executionId,
      workflowId,
    });
  }

  nodeError(
    message: string,
    nodeId: string,
    error?: Error,
    executionId?: string,
    workflowId?: string,
    metadata?: Record<string, unknown>
  ): void {
    this.error(message, error, "execution", metadata, {
      nodeId,
      executionId,
      workflowId,
    });
  }

  // Integration-specific logging methods
  integrationInfo(
    message: string,
    integrationId: string,
    metadata?: Record<string, unknown>
  ): void {
    this.info(message, "integration", metadata, { integrationId });
  }

  integrationError(
    message: string,
    integrationId: string,
    error?: Error,
    metadata?: Record<string, unknown>
  ): void {
    this.error(message, error, "integration", metadata, { integrationId });
  }

  // API-specific logging methods
  apiInfo(
    message: string,
    requestId?: string,
    userId?: string,
    metadata?: Record<string, unknown>
  ): void {
    this.info(message, "api", metadata, { requestId, userId });
  }

  apiError(
    message: string,
    error?: Error,
    requestId?: string,
    userId?: string,
    metadata?: Record<string, unknown>
  ): void {
    this.error(message, error, "api", metadata, { requestId, userId });
  }

  // Database retrieval methods
  async getLogs(
    options: {
      level?: LogLevel;
      context?: LogContext;
      workflowId?: string;
      executionId?: string;
      nodeId?: string;
      userId?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<DatabaseLogEntry[]> {
    try {
      let query = "SELECT * FROM system_logs WHERE 1=1";
      const queryParams: unknown[] = [];
      let paramCount = 0;

      if (options.level) {
        queryParams.push(options.level);
        query += ` AND level = $${++paramCount}`;
      }

      if (options.context) {
        queryParams.push(options.context);
        query += ` AND context = $${++paramCount}`;
      }

      if (options.workflowId) {
        queryParams.push(options.workflowId);
        query += ` AND workflow_id = $${++paramCount}`;
      }

      if (options.executionId) {
        queryParams.push(options.executionId);
        query += ` AND execution_id = $${++paramCount}`;
      }

      if (options.nodeId) {
        queryParams.push(options.nodeId);
        query += ` AND node_id = $${++paramCount}`;
      }

      if (options.userId) {
        queryParams.push(options.userId);
        query += ` AND user_id = $${++paramCount}`;
      }

      if (options.startDate) {
        queryParams.push(options.startDate);
        query += ` AND timestamp >= $${++paramCount}`;
      }

      if (options.endDate) {
        queryParams.push(options.endDate);
        query += ` AND timestamp <= $${++paramCount}`;
      }

      query += " ORDER BY timestamp DESC";

      if (options.limit) {
        queryParams.push(options.limit);
        query += ` LIMIT $${++paramCount}`;
      }

      if (options.offset) {
        queryParams.push(options.offset);
        query += ` OFFSET $${++paramCount}`;
      }

      const result = await pool.query(query, queryParams);
      return result.rows;
    } catch (error) {
      console.error("Failed to retrieve logs:", error);
      return [];
    }
  }

  async getLogStats(): Promise<{
    total: number;
    byLevel: Record<LogLevel, number>;
    byContext: Record<LogContext, number>;
    last24Hours: number;
  }> {
    try {
      const [totalResult, levelResult, contextResult, recentResult] =
        await Promise.all([
          pool.query("SELECT COUNT(*) as count FROM system_logs"),
          pool.query(
            "SELECT level, COUNT(*) as count FROM system_logs GROUP BY level"
          ),
          pool.query(
            "SELECT context, COUNT(*) as count FROM system_logs GROUP BY context"
          ),
          pool.query(
            "SELECT COUNT(*) as count FROM system_logs WHERE timestamp >= NOW() - INTERVAL '24 hours'"
          ),
        ]);

      const byLevel = {} as Record<LogLevel, number>;
      levelResult.rows.forEach((row) => {
        byLevel[row.level as LogLevel] = parseInt(row.count);
      });

      const byContext = {} as Record<LogContext, number>;
      contextResult.rows.forEach((row) => {
        byContext[row.context as LogContext] = parseInt(row.count);
      });

      return {
        total: parseInt(totalResult.rows[0].count),
        byLevel,
        byContext,
        last24Hours: parseInt(recentResult.rows[0].count),
      };
    } catch (error) {
      console.error("Failed to get log stats:", error);
      return {
        total: 0,
        byLevel: {} as Record<LogLevel, number>,
        byContext: {} as Record<LogContext, number>,
        last24Hours: 0,
      };
    }
  }

  // Configuration methods
  enableConsoleLogging(): void {
    this.logToConsole = true;
  }

  disableConsoleLogging(): void {
    this.logToConsole = false;
  }

  enableDatabaseLogging(): void {
    this.logToDatabase = true;
  }

  disableDatabaseLogging(): void {
    this.logToDatabase = false;
  }

  enable(): void {
    this.isEnabled = true;
  }

  disable(): void {
    this.isEnabled = false;
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Export convenience functions for easier importing
export const log = {
  debug: (
    message: string,
    context: LogContext = "system",
    metadata?: Record<string, unknown>,
    options?: Partial<LogEntry>
  ) => logger.debug(message, context, metadata, options),

  info: (
    message: string,
    context: LogContext = "system",
    metadata?: Record<string, unknown>,
    options?: Partial<LogEntry>
  ) => logger.info(message, context, metadata, options),

  warn: (
    message: string,
    context: LogContext = "system",
    metadata?: Record<string, unknown>,
    options?: Partial<LogEntry>
  ) => logger.warn(message, context, metadata, options),

  error: (
    message: string,
    error?: Error,
    context: LogContext = "system",
    metadata?: Record<string, unknown>,
    options?: Partial<LogEntry>
  ) => logger.error(message, error, context, metadata, options),

  fatal: (
    message: string,
    error?: Error,
    context: LogContext = "system",
    metadata?: Record<string, unknown>,
    options?: Partial<LogEntry>
  ) => logger.fatal(message, error, context, metadata, options),

  // Workflow shortcuts
  workflow: {
    info: (
      message: string,
      workflowId: string,
      metadata?: Record<string, unknown>
    ) => logger.workflowInfo(message, workflowId, metadata),
    error: (
      message: string,
      workflowId: string,
      error?: Error,
      metadata?: Record<string, unknown>
    ) => logger.workflowError(message, workflowId, error, metadata),
  },

  // Execution shortcuts
  execution: {
    info: (
      message: string,
      executionId: string,
      workflowId?: string,
      metadata?: Record<string, unknown>
    ) => logger.executionInfo(message, executionId, workflowId, metadata),
    error: (
      message: string,
      executionId: string,
      error?: Error,
      workflowId?: string,
      metadata?: Record<string, unknown>
    ) =>
      logger.executionError(message, executionId, error, workflowId, metadata),
  },

  // Node shortcuts
  node: {
    info: (
      message: string,
      nodeId: string,
      executionId?: string,
      workflowId?: string,
      metadata?: Record<string, unknown>
    ) => logger.nodeInfo(message, nodeId, executionId, workflowId, metadata),
    error: (
      message: string,
      nodeId: string,
      error?: Error,
      executionId?: string,
      workflowId?: string,
      metadata?: Record<string, unknown>
    ) =>
      logger.nodeError(
        message,
        nodeId,
        error,
        executionId,
        workflowId,
        metadata
      ),
  },

  // Integration shortcuts
  integration: {
    info: (
      message: string,
      integrationId: string,
      metadata?: Record<string, unknown>
    ) => logger.integrationInfo(message, integrationId, metadata),
    error: (
      message: string,
      integrationId: string,
      error?: Error,
      metadata?: Record<string, unknown>
    ) => logger.integrationError(message, integrationId, error, metadata),
  },

  // API shortcuts
  api: {
    info: (
      message: string,
      requestId?: string,
      userId?: string,
      metadata?: Record<string, unknown>
    ) => logger.apiInfo(message, requestId, userId, metadata),
    error: (
      message: string,
      error?: Error,
      requestId?: string,
      userId?: string,
      metadata?: Record<string, unknown>
    ) => logger.apiError(message, error, requestId, userId, metadata),
  },
};

// Export default logger instance
export default logger;
