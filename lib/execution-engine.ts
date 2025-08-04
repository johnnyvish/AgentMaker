import {
  getExecutionWithWorkflow,
  updateExecutionToRunning,
  updateExecutionToCompleted,
  updateExecutionToFailed,
  createExecutionStep,
  updateExecutionStepToRunning,
  updateExecutionStepToCompleted,
  updateExecutionStepToFailed,
  getNextPendingExecution,
} from "./db";
import { integrationRegistry } from "./integrations/registry";
import type { WorkflowContext } from "./integrations/types";

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
  sourceHandle?: string; // Add this to identify which output handle (true/false)
}

export class ExecutionEngine {
  private branchDecisions: Map<string, boolean> = new Map(); // Track branch decisions

  async executeWorkflow(executionId: string) {
    try {
      // Get execution and workflow data
      const execution = await getExecutionWithWorkflow(executionId);
      if (!execution) {
        const error = new Error("Execution not found");
        throw error;
      }

      const nodes: WorkflowNode[] =
        execution.nodes as unknown as WorkflowNode[];
      const edges: WorkflowEdge[] =
        execution.edges as unknown as WorkflowEdge[];

      // Update status to running
      await updateExecutionToRunning(executionId);

      const context: WorkflowContext = {
        variables: {},
        nodeOutputs: {},
        executionId,
      };

      // Reset branch decisions for each execution
      this.branchDecisions.clear();

      // Get execution order (topological sort)
      const executionOrder = this.getExecutionOrder(nodes, edges);

      // Execute nodes in order with conditional path support
      for (const nodeId of executionOrder) {
        const node = nodes.find((n) => n.id === nodeId);
        if (!node) {
          continue;
        }

        // Check if this node should be skipped based on branch conditions
        if (this.shouldSkipNode(nodeId, nodes, edges)) {
          console.log(`Skipping node ${nodeId} due to branch condition`);
          continue;
        }

        await this.executeNode(node, context, executionId);
      }

      // Mark as completed
      await updateExecutionToCompleted(executionId);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      // Mark as failed
      await updateExecutionToFailed(executionId, errorMessage);
      throw error;
    }
  }

  private shouldSkipNode(
    nodeId: string,
    nodes: WorkflowNode[],
    edges: WorkflowEdge[]
  ): boolean {
    // Find all edges leading to this node
    const incomingEdges = edges.filter((e) => e.target === nodeId);

    for (const edge of incomingEdges) {
      const sourceNode = nodes.find((n) => n.id === edge.source);
      if (!sourceNode) continue;

      // Check if source is a branch node
      if (sourceNode.data.subtype === "branch_condition") {
        const branchResult = this.branchDecisions.get(sourceNode.id);
        if (branchResult === undefined) continue; // Branch not yet executed

        // Check if this edge matches the branch result
        const isTrue =
          edge.sourceHandle === "true" || edge.id.includes("-true-");
        const isFalse =
          edge.sourceHandle === "false" || edge.id.includes("-false-");

        if ((isTrue && !branchResult) || (isFalse && branchResult)) {
          return true; // Skip this node
        }
      }
    }

    return false;
  }

  private async executeNode(
    node: WorkflowNode,
    context: WorkflowContext,
    executionId: string
  ) {
    const nodeId = node.id;

    // Create execution step record
    const stepId = await createExecutionStep(executionId, nodeId);

    // Set to running BEFORE execution
    await updateExecutionStepToRunning(stepId);

    try {
      // Execute the node
      const result = await this.simulateNodeExecution(node, context);

      // Store branch decisions
      if (
        node.data.subtype === "branch_condition" &&
        "data" in result &&
        result.data
      ) {
        const branchData = result.data as Record<string, unknown>;
        if (branchData.result !== undefined) {
          this.branchDecisions.set(node.id, branchData.result as boolean);
        }
      }

      // Store result in context
      context.nodeOutputs[nodeId] = result;

      // Update step as completed
      await updateExecutionStepToCompleted(stepId, result);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      // Update step as failed
      await updateExecutionStepToFailed(stepId, errorMessage);
      throw error;
    }
  }

  private async simulateNodeExecution(
    node: WorkflowNode,
    context: WorkflowContext
  ) {
    const config = node.data.config || {};
    const integrationId = node.data.subtype;

    if (!integrationId) {
      return {
        success: false,
        error: "No integration subtype specified for node",
        metadata: { nodeType: "unknown" },
      };
    }

    try {
      // Use the integration registry to execute the node
      const result = await integrationRegistry.executeIntegration(
        integrationId,
        config,
        context
      );

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        metadata: { nodeType: integrationId },
      };
    }
  }

  private getExecutionOrder(
    nodes: WorkflowNode[],
    edges: WorkflowEdge[]
  ): string[] {
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
      throw new Error("Workflow contains cycles");
    }

    return result;
  }
}

export class QueueProcessor {
  private isProcessing = false;
  private engine = new ExecutionEngine();
  private processingCount = 0;

  async start() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.isProcessing) {
      try {
        await this.processNextExecution();
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second
      } catch (error) {
        console.error("Queue processing error:", error);
        await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds on error
      }
    }
  }

  stop() {
    this.isProcessing = false;
  }

  private async processNextExecution() {
    const executionId = await getNextPendingExecution();

    if (executionId) {
      this.processingCount++;
      await this.engine.executeWorkflow(executionId);
      this.processingCount--;
    }
  }
}
