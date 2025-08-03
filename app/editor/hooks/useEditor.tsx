import { useState, useCallback } from "react";
import { Node, Edge } from "@xyflow/react";
import { integrationRegistry } from "../../../lib/integrations/registry";
import { parseExpression } from "../../../lib/expression";

// ============================================
// TYPE DEFINITIONS
// ============================================

interface WorkflowContext {
  variables: Record<string, unknown>;
  nodeOutputs: Record<string, unknown>;
  executionId: string;
  userId?: string;
}

interface ExecutionState {
  currentNode: string | null;
  completedNodes: Set<string>;
  context: WorkflowContext;
  status: "idle" | "running" | "completed" | "failed";
}

interface ExecutionStep {
  node_id: string;
  status: string;
  completed_at?: string;
  result?: {
    success: boolean;
    data?: Record<string, unknown>;
    metadata?: {
      nodeType: string;
      subtype: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
}

interface WorkflowDefinition {
  id: string;
  name: string;
  nodes: Node[];
  edges: Edge[];
  createdAt: string;
  updatedAt: string;
}

// ============================================
// EXPRESSION PARSER
// ============================================

// Using shared parseExpression from lib/expression.ts

// ============================================
// USE EDITOR HOOK
// ============================================

export const useEditor = (currentWorkflowId: string | null = null) => {
  const registry = integrationRegistry;
  const [executionState, setExecutionState] = useState<ExecutionState>({
    currentNode: null,
    completedNodes: new Set(),
    context: {
      variables: {},
      nodeOutputs: {},
      executionId: "",
    },
    status: "idle",
  });
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastLoadedExecutionId, setLastLoadedExecutionId] = useState<
    string | null
  >(null);

  // Function to restore execution state from database
  const restoreLatestExecution = useCallback(async (workflowId: string) => {
    try {
      // Get the most recent execution for this workflow
      const response = await fetch(
        `/api/execute?workflowId=${workflowId}&latest=true`
      );
      if (!response.ok) return null;

      const execution = await response.json();
      if (!execution || execution.status === "pending") return null;

      // Get detailed execution status with steps
      const statusResponse = await fetch(
        `/api/execute?executionId=${execution.id}`
      );
      if (!statusResponse.ok) return null;

      const executionDetails = await statusResponse.json();

      console.log("🔄 Restoring execution state:", executionDetails);

      // Restore execution state
      const restoredContext: WorkflowContext = {
        variables: {},
        nodeOutputs: {},
        executionId: execution.id,
      };

      // Process each step to rebuild context
      if (executionDetails.steps) {
        executionDetails.steps.forEach((step: ExecutionStep) => {
          if (step.status === "completed" && step.result) {
            // Add to node outputs
            restoredContext.nodeOutputs[step.node_id] = step.result;

            // Handle variables from set_variable steps
            if (
              step.result?.metadata?.subtype === "set_variable" &&
              step.result.data
            ) {
              const data = step.result.data as {
                variableName: string;
                value: unknown;
              };
              restoredContext.variables[data.variableName] = data.value;
            }
          }
        });
      }

      // Update execution state
      setExecutionState({
        currentNode: null,
        completedNodes: new Set(
          executionDetails.steps
            ?.filter((s: ExecutionStep) => s.status === "completed")
            ?.map((s: ExecutionStep) => s.node_id) || []
        ),
        context: restoredContext,
        status:
          executionDetails.status === "completed"
            ? "completed"
            : executionDetails.status === "failed"
            ? "failed"
            : "idle",
      });

      setLastLoadedExecutionId(execution.id);

      return { execution, steps: executionDetails.steps };
    } catch (error) {
      console.error("Failed to restore execution state:", error);
      return null;
    }
  }, []);

  // Function to restore node visual states
  const restoreNodeStates = useCallback(
    (
      nodes: Node[],
      steps: ExecutionStep[],
      onNodeStatusChange: (
        nodeId: string,
        status: "idle" | "running" | "success" | "error",
        lastRun?: string,
        executionResult?: Record<string, unknown>
      ) => void
    ) => {
      steps?.forEach((step: ExecutionStep) => {
        if (step.result) {
          onNodeStatusChange(
            step.node_id,
            step.status === "completed" ? "success" : "error",
            step.completed_at
              ? new Date(step.completed_at).toLocaleTimeString()
              : undefined,
            step.result
          );
        }
      });
    },
    []
  );

  // Enhanced loadWorkflow to restore execution state
  const loadWorkflow = useCallback(async (): Promise<
    | (WorkflowDefinition & {
        restoredExecution?: {
          execution: unknown;
          steps: ExecutionStep[];
        } | null;
      })
    | null
  > => {
    try {
      const response = await fetch("/api/automations");
      if (!response.ok) throw new Error("Failed to load automations");

      const workflows = await response.json();
      if (workflows.length > 0) {
        const workflow = workflows[0];
        // setCurrentWorkflowId(workflow.id); // This line is removed as per the edit hint

        const result = {
          id: workflow.id,
          name: workflow.name,
          nodes: workflow.nodes,
          edges: workflow.edges,
          createdAt: workflow.createdAt || new Date().toISOString(),
          updatedAt: workflow.updatedAt || new Date().toISOString(),
        };

        // Try to restore the latest execution state
        const restoredExecution = await restoreLatestExecution(workflow.id);

        return {
          ...result,
          restoredExecution,
        };
      }
      return null;
    } catch (error) {
      console.error("Load failed:", error);
      return null;
    }
  }, [restoreLatestExecution]);

  // Save workflow to database
  const saveWorkflow = useCallback(
    async (
      nodes: Node[],
      edges: Edge[],
      name: string = "Untitled Workflow"
    ) => {
      try {
        const method = currentWorkflowId ? "PUT" : "POST";
        const body = currentWorkflowId
          ? JSON.stringify({ id: currentWorkflowId, name, nodes, edges })
          : JSON.stringify({ name, nodes, edges });

        const response = await fetch("/api/automations", {
          method,
          headers: { "Content-Type": "application/json" },
          body,
        });

        if (!response.ok) throw new Error("Failed to save workflow");

        const workflow = await response.json();

        // Update the URL to reflect the new automation ID if this is a new workflow
        if (!currentWorkflowId) {
          window.history.replaceState({}, "", `/editor?id=${workflow.id}`);
        }

        console.log("Workflow saved:", workflow);
        return { success: true, id: workflow.id };
      } catch (error) {
        console.error("Save failed:", error);
        throw error;
      }
    },
    [currentWorkflowId]
  );

  // Execute workflow in background
  const executeWorkflow = useCallback(
    async (
      nodes: Node[],
      edges: Edge[],
      onNodeStatusChange: (
        nodeId: string,
        status: "idle" | "running" | "success" | "error",
        lastRun?: string,
        executionResult?: Record<string, unknown>
      ) => void
    ) => {
      if (isExecuting || !currentWorkflowId) return;

      // Clear any previously restored state
      setLastLoadedExecutionId(null);

      // Reset execution state to fresh
      setExecutionState({
        currentNode: null,
        completedNodes: new Set(),
        context: {
          variables: {},
          nodeOutputs: {},
          executionId: "",
        },
        status: "idle",
      });

      setIsExecuting(true);

      try {
        // Start background execution
        const response = await fetch(`/api/execute`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ workflowId: currentWorkflowId }),
        });

        if (!response.ok) throw new Error("Failed to start execution");

        const { executionId } = await response.json();

        setExecutionState((prev) => ({
          ...prev,
          status: "running",
          context: { ...prev.context, executionId },
        }));

        // Poll for execution status
        const pollInterval = setInterval(async () => {
          try {
            const statusResponse = await fetch(
              `/api/execute?executionId=${executionId}`
            );
            const status = await statusResponse.json();

            if (status.status === "completed" || status.status === "failed") {
              clearInterval(pollInterval);
              setExecutionState((prev) => ({
                ...prev,
                status: status.status === "completed" ? "completed" : "failed",
              }));
              setIsExecuting(false);

              // Update node statuses based on execution steps
              if (status.steps) {
                status.steps.forEach((step: ExecutionStep) => {
                  onNodeStatusChange(
                    step.node_id,
                    step.status === "completed" ? "success" : "error",
                    step.completed_at
                      ? new Date(step.completed_at).toLocaleTimeString()
                      : undefined,
                    step.result
                  );

                  if (step.status === "completed" && step.result) {
                    setExecutionState((prev) => ({
                      ...prev,
                      context: {
                        ...prev.context,
                        nodeOutputs: {
                          ...prev.context.nodeOutputs,
                          [step.node_id]: step.result,
                        },
                        variables:
                          step.result?.metadata?.subtype === "set_variable" &&
                          step.result.data
                            ? {
                                ...prev.context.variables,
                                [(
                                  step.result.data as {
                                    variableName: string;
                                    value: unknown;
                                  }
                                ).variableName]: (
                                  step.result.data as {
                                    variableName: string;
                                    value: unknown;
                                  }
                                ).value,
                              }
                            : prev.context.variables,
                      },
                    }));
                  }
                });
              }
            }
          } catch (error) {
            console.error("Polling error:", error);
            clearInterval(pollInterval);
            setIsExecuting(false);
          }
        }, 2000); // Poll every 2 seconds
      } catch (error) {
        console.error("Execution failed:", error);
        setIsExecuting(false);
        setExecutionState((prev) => ({ ...prev, status: "failed" }));
      }
    },
    [isExecuting, currentWorkflowId]
  );

  return {
    // State
    executionState,
    isExecuting,
    registry,
    lastLoadedExecutionId,

    // Actions
    saveWorkflow,
    loadWorkflow,
    executeWorkflow,
    restoreLatestExecution,
    restoreNodeStates,

    // Utilities
    parseExpression,
  };
};
