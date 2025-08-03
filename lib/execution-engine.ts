// lib/execution-engine.ts
import { pool } from "./db";
import { log } from "./logger";
import { integrationRegistry, type WorkflowContext } from "./integrations";

interface WorkflowNode {
  id: string;
  type: string;
  data: {
    label: string;
    subtype?: string;
    config?: Record<string, unknown>;
  };
}

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
}

export class ExecutionEngine {
  async executeWorkflow(executionId: string) {
    log.execution.info("Starting workflow execution", executionId);

    try {
      // Get execution and workflow data
      const executionQuery = `
        SELECT we.*, w.nodes, w.edges, w.id as workflow_id, w.name as workflow_name
        FROM workflow_executions we 
        JOIN workflows w ON we.workflow_id = w.id 
        WHERE we.id = $1
      `;
      const result = await pool.query(executionQuery, [executionId]);
      if (result.rows.length === 0) {
        const error = new Error("Execution not found");
        log.execution.error(
          "Execution not found in database",
          executionId,
          error
        );
        throw error;
      }

      const execution = result.rows[0];
      const nodes: WorkflowNode[] = execution.nodes;
      const edges: WorkflowEdge[] = execution.edges;
      const workflowId = execution.workflow_id;
      const workflowName = execution.workflow_name;

      log.workflow.info(`Executing workflow: ${workflowName}`, workflowId, {
        executionId,
        nodeCount: nodes.length,
        edgeCount: edges.length,
      });

      // Update status to running
      await pool.query(
        "UPDATE workflow_executions SET status = $1, started_at = NOW() WHERE id = $2",
        ["running", executionId]
      );

      const context: WorkflowContext = {
        variables: {},
        nodeOutputs: {},
        executionId,
      };

      // Get execution order (topological sort)
      const executionOrder = this.getExecutionOrder(nodes, edges);
      log.execution.info(
        "Determined execution order",
        executionId,
        workflowId,
        {
          order: executionOrder,
          totalNodes: nodes.length,
        }
      );

      // Execute nodes in order
      for (const nodeId of executionOrder) {
        const node = nodes.find((n) => n.id === nodeId);
        if (!node) {
          log.node.error(
            "Node not found in workflow",
            nodeId,
            undefined,
            executionId,
            workflowId
          );
          continue;
        }

        log.node.info(
          `Starting node execution: ${node.data.label}`,
          nodeId,
          executionId,
          workflowId,
          {
            nodeType: node.type,
            integration: node.data.subtype,
          }
        );

        await this.executeNode(node, context, executionId, workflowId);
      }

      // Mark as completed
      await pool.query(
        "UPDATE workflow_executions SET status = $1, completed_at = NOW() WHERE id = $2",
        ["completed", executionId]
      );

      log.execution.info(
        "Workflow execution completed successfully",
        executionId,
        workflowId,
        {
          totalNodesExecuted: executionOrder.length,
          finalContext: {
            variableCount: Object.keys(context.variables).length,
            nodeOutputCount: Object.keys(context.nodeOutputs).length,
          },
        }
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      log.execution.error(
        "Workflow execution failed",
        executionId,
        error as Error,
        undefined,
        {
          errorType: error?.constructor.name,
          failurePoint: "workflow_execution",
        }
      );

      // Mark as failed
      await pool.query(
        "UPDATE workflow_executions SET status = $1, completed_at = NOW(), error_message = $2 WHERE id = $3",
        ["failed", errorMessage, executionId]
      );
      throw error;
    }
  }

  private async executeNode(
    node: WorkflowNode,
    context: WorkflowContext,
    executionId: string,
    workflowId?: string
  ) {
    const nodeId = node.id;

    // Create execution step record
    const stepResult = await pool.query(
      "INSERT INTO execution_steps (execution_id, node_id, status, started_at) VALUES ($1, $2, $3, NOW()) RETURNING *",
      [executionId, nodeId, "running"]
    );
    const stepId = stepResult.rows[0].id;

    log.node.info(`Node execution started`, nodeId, executionId, workflowId, {
      stepId,
      nodeLabel: node.data.label,
      integration: node.data.subtype,
      config: node.data.config,
    });

    try {
      // Execute the node
      const result = await this.simulateNodeExecution(
        node,
        context,
        workflowId
      );

      // Store result in context
      context.nodeOutputs[nodeId] = result;

      // Update step as completed
      await pool.query(
        "UPDATE execution_steps SET status = $1, completed_at = NOW(), result = $2 WHERE id = $3",
        ["completed", JSON.stringify(result), stepId]
      );

      log.node.info(
        `Node execution completed successfully`,
        nodeId,
        executionId,
        workflowId,
        {
          stepId,
          success: result.success,
          hasData: "data" in result && !!result.data,
          resultKeys:
            "data" in result && result.data ? Object.keys(result.data) : [],
        }
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      log.node.error(
        `Node execution failed: ${errorMessage}`,
        nodeId,
        error as Error,
        executionId,
        workflowId,
        {
          stepId,
          nodeLabel: node.data.label,
          integration: node.data.subtype,
          errorType: error?.constructor.name,
        }
      );

      // Update step as failed
      await pool.query(
        "UPDATE execution_steps SET status = $1, completed_at = NOW(), error_message = $2 WHERE id = $3",
        ["failed", errorMessage, stepId]
      );
      throw error;
    }
  }

  private async simulateNodeExecution(
    node: WorkflowNode,
    context: WorkflowContext,
    workflowId?: string
  ) {
    const config = node.data.config || {};
    const integrationId = node.data.subtype;

    if (!integrationId) {
      const error = new Error("No integration subtype specified for node");
      log.integration.error("Missing integration subtype", "unknown", error, {
        nodeId: node.id,
        nodeLabel: node.data.label,
        workflowId,
      });
      return {
        success: false,
        error: "No integration subtype specified for node",
        metadata: { nodeType: "unknown" },
      };
    }

    log.integration.info(
      `Executing integration: ${integrationId}`,
      integrationId,
      {
        nodeId: node.id,
        config: Object.keys(config),
        workflowId,
        executionId: context.executionId,
      }
    );

    try {
      // Use the integration registry to execute the node
      const result = await integrationRegistry.executeIntegration(
        integrationId,
        config,
        context
      );

      if (result.success) {
        log.integration.info(
          `Integration executed successfully: ${integrationId}`,
          integrationId,
          {
            nodeId: node.id,
            hasData: !!result.data,
            workflowId,
            executionId: context.executionId,
          }
        );
      } else {
        log.integration.error(
          `Integration execution failed: ${result.error || "Unknown error"}`,
          integrationId,
          undefined,
          {
            nodeId: node.id,
            error: result.error,
            workflowId,
            executionId: context.executionId,
          }
        );
      }

      return result;
    } catch (error) {
      log.integration.error(
        `Integration threw exception: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        integrationId,
        error as Error,
        {
          nodeId: node.id,
          workflowId,
          executionId: context.executionId,
        }
      );
      throw error;
    }
  }

  private getExecutionOrder(
    nodes: WorkflowNode[],
    edges: WorkflowEdge[]
  ): string[] {
    log.debug("Computing execution order", "execution", {
      nodeCount: nodes.length,
      edgeCount: edges.length,
    });

    const adjacencyList: Record<string, string[]> = {};
    const inDegree: Record<string, number> = {};

    // Initialize
    nodes.forEach((node) => {
      adjacencyList[node.id] = [];
      inDegree[node.id] = 0;
    });

    // Build graph
    edges.forEach((edge) => {
      adjacencyList[edge.source].push(edge.target);
      inDegree[edge.target]++;
    });

    // Topological sort
    const queue: string[] = [];
    const result: string[] = [];

    Object.keys(inDegree).forEach((nodeId) => {
      if (inDegree[nodeId] === 0) {
        queue.push(nodeId);
      }
    });

    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      result.push(nodeId);

      adjacencyList[nodeId].forEach((neighbor) => {
        inDegree[neighbor]--;
        if (inDegree[neighbor] === 0) {
          queue.push(neighbor);
        }
      });
    }

    if (result.length !== nodes.length) {
      log.warn("Topological sort detected cycle in workflow", "execution", {
        expectedNodes: nodes.length,
        sortedNodes: result.length,
        missingNodes: nodes
          .filter((n) => !result.includes(n.id))
          .map((n) => n.id),
      });
    }

    return result;
  }
}

// Enhanced queue processor with better logging
export class QueueProcessor {
  private isProcessing = false;
  private engine = new ExecutionEngine();
  private processingCount = 0;

  async start() {
    if (this.isProcessing) {
      log.warn("Queue processor start requested but already running", "system");
      return;
    }

    this.isProcessing = true;
    log.info("Queue processor started", "system");

    while (this.isProcessing) {
      try {
        await this.processNextExecution();
        await new Promise((resolve) => setTimeout(resolve, 5000)); // Check every 5 seconds
      } catch (error) {
        log.error("Queue processing error", error as Error, "system", {
          processingCount: this.processingCount,
          isProcessing: this.isProcessing,
        });
        await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait longer on error
      }
    }
  }

  stop() {
    this.isProcessing = false;
    log.info("Queue processor stopped", "system", {
      totalProcessed: this.processingCount,
    });
  }

  private async processNextExecution() {
    const result = await pool.query(
      "SELECT id FROM workflow_executions WHERE status = $1 ORDER BY created_at ASC LIMIT 1",
      ["pending"]
    );

    if (result.rows.length > 0) {
      const executionId = result.rows[0].id;
      this.processingCount++;

      log.info(`Processing execution ${this.processingCount}`, "system", {
        executionId,
        queuePosition: 1, // Since we're taking the first one
      });

      try {
        await this.engine.executeWorkflow(executionId);
        log.info("Execution completed by queue processor", "system", {
          executionId,
          totalProcessed: this.processingCount,
        });
      } catch (error) {
        log.error(
          "Queue processor execution failed",
          error as Error,
          "system",
          {
            executionId,
            totalProcessed: this.processingCount,
          }
        );
      }
    }
  }
}
