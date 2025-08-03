import { useState, useCallback } from "react";
import { Node, Edge } from "@xyflow/react";
import { integrationRegistry } from "../lib/integrations";

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
// EXPRESSION PARSER (Enhanced)
// ============================================

const parseExpression = (
  expression: string,
  context: WorkflowContext
): unknown => {
  if (!expression || typeof expression !== "string") return expression;

  return expression.replace(/\{\{([^}]+)\}\}/g, (match, expr) => {
    try {
      const trimmed = expr.trim();

      if (trimmed.startsWith("$node.")) {
        const parts = trimmed.split(".");
        if (parts.length >= 3) {
          const nodeId = parts[1];
          const path = parts.slice(2).join(".");
          const nodeOutput = context.nodeOutputs[nodeId];

          if (nodeOutput) {
            const value = getNestedValue(nodeOutput, path);
            return value !== undefined ? String(value) : "";
          }
        }
      }

      if (trimmed.startsWith("$vars.")) {
        const varName = trimmed.substring(6);
        const value = context.variables[varName];
        return value !== undefined ? String(value) : "";
      }

      return match;
    } catch (error) {
      console.error("Expression parse error:", error);
      return match;
    }
  });
};

const getNestedValue = (obj: unknown, path: string): unknown => {
  return path.split(".").reduce((current, key) => {
    if (current && typeof current === "object" && key in current) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
};

// ============================================
// USE EDITOR HOOK
// ============================================

export const useEditor = () => {
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
  const [currentWorkflowId, setCurrentWorkflowId] = useState<string | null>(
    null
  );
  const [lastLoadedExecutionId, setLastLoadedExecutionId] = useState<
    string | null
  >(null);

  // NEW: Function to restore execution state from database
  const restoreLatestExecution = useCallback(async (workflowId: string) => {
    try {
      // Get the most recent execution for this workflow
      const response = await fetch(
        `/api/workflows/${workflowId}/executions/latest`
      );
      if (!response.ok) return null;

      const execution = await response.json();
      if (!execution || execution.status === "pending") return null;

      // Get detailed execution status with steps
      const statusResponse = await fetch(
        `/api/executions/${execution.id}/status`
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

  // NEW: Function to restore node visual states
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

  // MODIFIED: Enhanced loadWorkflow to restore execution state
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
      const response = await fetch("/api/workflows");
      if (!response.ok) throw new Error("Failed to load workflows");

      const workflows = await response.json();
      if (workflows.length > 0) {
        const workflow = workflows[0];
        setCurrentWorkflowId(workflow.id);

        const result = {
          id: workflow.id,
          name: workflow.name,
          nodes: workflow.nodes,
          edges: workflow.edges,
          createdAt: workflow.createdAt || new Date().toISOString(),
          updatedAt: workflow.updatedAt || new Date().toISOString(),
        };

        // 🔧 NEW: Try to restore the latest execution state
        const restoredExecution = await restoreLatestExecution(workflow.id);

        return {
          ...result,
          restoredExecution, // Include this so the component can use it
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
        const url = currentWorkflowId
          ? `/api/workflows/${currentWorkflowId}`
          : "/api/workflows";

        const response = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, nodes, edges }),
        });

        if (!response.ok) throw new Error("Failed to save workflow");

        const workflow = await response.json();
        setCurrentWorkflowId(workflow.id);

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
        const response = await fetch(
          `/api/workflows/${currentWorkflowId}/execute`,
          {
            method: "POST",
          }
        );

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
              `/api/executions/${executionId}/status`
            );
            const status = await statusResponse.json();

            // 🔧 ALTERNATIVE: Debug what's actually in the execution results
            // Add this temporarily to see what data you're actually getting:
            console.log("🔍 DEBUG: Execution status response:", status);
            if (status.steps) {
              status.steps.forEach((step: ExecutionStep) => {
                console.log(`🔍 Step ${step.node_id}:`, {
                  status: step.status,
                  result: step.result,
                  resultKeys: step.result ? Object.keys(step.result) : [],
                  resultData: step.result?.data,
                  resultDataKeys: step.result?.data
                    ? Object.keys(step.result.data)
                    : [],
                });
              });
            }

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
                  // Update node state (this part you already have)
                  onNodeStatusChange(
                    step.node_id,
                    step.status === "completed" ? "success" : "error",
                    step.completed_at
                      ? new Date(step.completed_at).toLocaleTimeString()
                      : undefined,
                    step.result
                  );

                  // 🔧 FIX: ALSO update the execution state context
                  if (step.status === "completed" && step.result) {
                    setExecutionState((prev) => ({
                      ...prev,
                      context: {
                        ...prev.context,
                        nodeOutputs: {
                          ...prev.context.nodeOutputs,
                          [step.node_id]: step.result, // Add this line!
                        },
                        // Handle set_variable specifically
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
