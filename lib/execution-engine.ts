import {
  getExecutionWithWorkflow,
  updateExecutionToRunning,
  updateExecutionToCompleted,
  updateExecutionToFailed,
  createExecutionStep,
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
}

export class ExecutionEngine {
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

      // Get execution order (topological sort)
      const executionOrder = this.getExecutionOrder(nodes, edges);

      // Execute nodes in order
      for (const nodeId of executionOrder) {
        const node = nodes.find((n) => n.id === nodeId);
        if (!node) {
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

  private async executeNode(
    node: WorkflowNode,
    context: WorkflowContext,
    executionId: string
  ) {
    const nodeId = node.id;

    // Create execution step record
    const stepId = await createExecutionStep(executionId, nodeId);

    try {
      // Execute the node
      const result = await this.simulateNodeExecution(node, context);

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
